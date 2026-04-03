import json
import os
import urllib.request
import urllib.error
import urllib.parse
import psycopg2
from datetime import datetime

SCHEMA       = "t_p90995829_dmaxi_site_replica"
PRODUCTS_URL = "https://functions.poehali.dev/4d2b5055-dabb-4c6e-aa52-48d8657f7596"
YK_URL       = "https://functions.poehali.dev/d08c7aac-f64d-4b7b-b949-f503280104b7"

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
        "Content-Type": "application/json",
    }

def get_user_from_token(cur, token):
    if not token:
        return None
    cur.execute(
        f"SELECT u.id, u.name, u.email, u.role FROM {SCHEMA}.sessions s "
        f"JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token = %s AND s.expires_at > NOW() AND u.is_active = true",
        (token,)
    )
    return cur.fetchone()

def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))

def handler(event: dict, context) -> dict:
    """Магазин: список товаров, карточка товара, покупка через кошелёк, история заказов"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    method  = event.get("httpMethod", "GET")
    headers = event.get("headers") or {}
    token   = headers.get("X-Auth-Token") or headers.get("x-auth-token")
    params  = event.get("queryStringParameters") or {}
    action  = params.get("action", "")
    body    = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    # ── Публичные эндпоинты (без авторизации) ──────────────────────────

    # GET ?action=products — список товаров (прокси к внешнему API)
    if method == "GET" and action == "products":
        try:
            search   = params.get("q", "")
            category = params.get("category", "")
            url = PRODUCTS_URL
            if search:
                url += f"?action=search&q={urllib.parse.quote(search)}"
            data = fetch_json(url)
            products = data.get("products", [])
            # Фильтр по категории на нашей стороне
            if category and not search:
                products = [p for p in products if p.get("category") == category]
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"products": products})}
        except Exception as e:
            return {"statusCode": 502, "headers": cors_headers(), "body": json.dumps({"error": f"Ошибка загрузки товаров: {str(e)}"})}

    # GET ?action=product&id=X — карточка товара
    if method == "GET" and action == "product":
        product_id = params.get("id", "")
        try:
            data = fetch_json(f"{PRODUCTS_URL}?action=product&id={product_id}")
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps(data)}
        except Exception as e:
            return {"statusCode": 502, "headers": cors_headers(), "body": json.dumps({"error": str(e)})}

    # ── Авторизованные эндпоинты ─────────────────────────────────────────

    db  = get_db()
    cur = db.cursor()

    try:
        user = get_user_from_token(cur, token)
        if not user:
            return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Необходима авторизация"})}
        user_id, user_name, user_email, user_role = user

        # POST ?action=buy — купить товар с кошелька
        if method == "POST" and action == "buy":
            product_id = body.get("product_id")
            if not product_id:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Укажите product_id"})}

            # Загружаем товар
            try:
                prod_data = fetch_json(f"{PRODUCTS_URL}?action=product&id={product_id}")
                product   = prod_data.get("product")
                if not product or not product.get("is_active"):
                    return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Товар не найден"})}
            except Exception:
                return {"statusCode": 502, "headers": cors_headers(), "body": json.dumps({"error": "Не удалось получить информацию о товаре"})}

            price = float(product["price"])
            title = product["title"]

            # Проверяем баланс кошелька
            cur.execute(f"SELECT id, balance FROM {SCHEMA}.wallets WHERE user_id = %s", (user_id,))
            wallet = cur.fetchone()
            if not wallet:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Кошелёк не найден. Пополните баланс в личном кабинете"})}

            wallet_id, balance = wallet[0], float(wallet[1])
            if balance < price:
                shortage = price - balance
                return {"statusCode": 402, "headers": cors_headers(), "body": json.dumps({
                    "error": f"Недостаточно средств. На кошельке {balance:,.0f} ₽, нужно ещё {shortage:,.0f} ₽",
                    "balance": balance, "price": price, "shortage": shortage
                })}

            # Списываем с кошелька
            new_balance = balance - price
            cur.execute(
                f"UPDATE {SCHEMA}.wallets SET balance = %s, updated_at = NOW() WHERE id = %s",
                (new_balance, wallet_id)
            )
            # Транзакция кошелька
            cur.execute(
                f"INSERT INTO {SCHEMA}.wallet_transactions "
                f"(wallet_id, user_id, type, amount, balance_after, description) "
                f"VALUES (%s, %s, 'spend', %s, %s, %s) RETURNING id",
                (wallet_id, user_id, -price, new_balance, f"Покупка в магазине: {title}")
            )
            txn_id = cur.fetchone()[0]

            # Создаём заказ
            cur.execute(
                f"INSERT INTO {SCHEMA}.shop_orders "
                f"(user_id, product_id, product_title, product_price, status, payment_type, wallet_txn_id) "
                f"VALUES (%s, %s, %s, %s, 'paid', 'wallet', %s) RETURNING id",
                (user_id, product_id, title, price, txn_id)
            )
            order_id = cur.fetchone()[0]

            # Уведомление
            cur.execute(
                f"INSERT INTO {SCHEMA}.notifications (user_id, title, body, type) VALUES (%s, %s, %s, 'info')",
                (user_id, f"Покупка оформлена: {title}",
                 f"Вы купили «{title}» за {price:,.0f} ₽. Остаток на кошельке: {new_balance:,.0f} ₽. Заказ #{order_id}")
            )
            db.commit()

            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({
                "ok": True,
                "order_id": order_id,
                "product": title,
                "price": price,
                "balance_after": new_balance,
                "message": f"Покупка успешна! Списано {price:,.0f} ₽, остаток {new_balance:,.0f} ₽"
            })}

        # GET ?action=my_orders — мои заказы
        if method == "GET" and action == "my_orders":
            limit  = min(int(params.get("limit", 20)), 100)
            offset = int(params.get("offset", 0))
            cur.execute(
                f"SELECT id, product_id, product_title, product_price, status, payment_type, created_at "
                f"FROM {SCHEMA}.shop_orders WHERE user_id = %s "
                f"ORDER BY created_at DESC LIMIT %s OFFSET %s",
                (user_id, limit, offset)
            )
            orders = []
            for r in cur.fetchall():
                orders.append({
                    "id": r[0], "product_id": r[1], "product_title": r[2],
                    "product_price": float(r[3]), "status": r[4],
                    "payment_type": r[5], "created_at": str(r[6])
                })
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"orders": orders})}

        # GET ?action=all_orders — все заказы (только admin)
        if method == "GET" and action == "all_orders":
            if user_role != "admin":
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Только для администраторов"})}
            limit  = min(int(params.get("limit", 50)), 200)
            offset = int(params.get("offset", 0))
            search = params.get("search", "")
            status_filter = params.get("status", "")

            query = (
                f"SELECT o.id, o.user_id, u.name, u.phone, o.product_id, o.product_title, "
                f"o.product_price, o.status, o.payment_type, o.created_at "
                f"FROM {SCHEMA}.shop_orders o JOIN {SCHEMA}.users u ON u.id = o.user_id WHERE 1=1"
            )
            vals = []
            if search:
                query += " AND (u.name ILIKE %s OR u.phone ILIKE %s OR o.product_title ILIKE %s)"
                vals += [f"%{search}%", f"%{search}%", f"%{search}%"]
            if status_filter:
                query += " AND o.status = %s"
                vals.append(status_filter)
            query += " ORDER BY o.created_at DESC LIMIT %s OFFSET %s"
            vals += [limit, offset]

            cur.execute(query, vals)
            orders = []
            for r in cur.fetchall():
                orders.append({
                    "id": r[0], "user_id": r[1], "user_name": r[2], "user_phone": r[3],
                    "product_id": r[4], "product_title": r[5],
                    "product_price": float(r[6]), "status": r[7],
                    "payment_type": r[8], "created_at": str(r[9])
                })

            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.shop_orders WHERE 1=1" + (
                " AND (product_title ILIKE %s)" if search else ""
            ), ([f"%{search}%"] if search else []))
            total = cur.fetchone()[0]

            # Суммарная выручка
            cur.execute(f"SELECT COALESCE(SUM(product_price),0) FROM {SCHEMA}.shop_orders WHERE status='paid'")
            total_revenue = float(cur.fetchone()[0])

            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({
                "orders": orders, "total": total, "total_revenue": total_revenue
            })}

        # PUT ?action=update_order&id=X — обновить статус заказа (admin)
        if method == "PUT" and action == "update_order":
            if user_role != "admin":
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Только для администраторов"})}
            order_id = int(params.get("id", 0))
            new_status = body.get("status", "")
            notes = body.get("notes", "")
            if not order_id or not new_status:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Укажите id и status"})}
            cur.execute(
                f"UPDATE {SCHEMA}.shop_orders SET status=%s, notes=%s, updated_at=NOW() WHERE id=%s",
                (new_status, notes or None, order_id)
            )
            db.commit()
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True})}

        return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        db.close()