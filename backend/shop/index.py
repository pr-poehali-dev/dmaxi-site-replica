import json
import os
import uuid
import base64
import urllib.request
import urllib.error
import urllib.parse
import psycopg2
from datetime import datetime

SCHEMA       = "t_p90995829_dmaxi_site_replica"
PRODUCTS_URL = "https://functions.poehali.dev/4d2b5055-dabb-4c6e-aa52-48d8657f7596"

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
        "Content-Type": "application/json",
    }

def resp(status, data, headers=None):
    h = cors_headers()
    if headers:
        h.update(headers)
    return {"statusCode": status, "headers": h, "body": json.dumps(data, ensure_ascii=False)}

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

def add_receipt(cur, user_id, rtype, amount, description, ref_id=None, metadata=None):
    now = datetime.now()
    receipt_number = f"DD-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
    cur.execute(
        f"INSERT INTO {SCHEMA}.receipts "
        f"(user_id, type, amount, description, ref_id, receipt_number, status, metadata) "
        f"VALUES (%s, %s, %s, %s, %s, %s, 'paid', %s) RETURNING id",
        (user_id, rtype, abs(amount), description, ref_id, receipt_number,
         json.dumps(metadata) if metadata else None)
    )
    return cur.fetchone()[0], receipt_number

def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode("utf-8"))

def yookassa_request(method: str, path: str, body: dict = None) -> dict:
    shop_id    = os.environ.get("YOOKASSA_SHOP_ID", "")
    secret_key = os.environ.get("YOOKASSA_SECRET_KEY", "")
    if not shop_id or not secret_key:
        raise ValueError("YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY не заданы")
    credentials = base64.b64encode(f"{shop_id}:{secret_key}".encode()).decode()
    url = f"https://api.yookassa.ru/v3{path}"
    headers = {
        "Authorization": f"Basic {credentials}",
        "Content-Type": "application/json",
        "Idempotence-Key": str(uuid.uuid4()),
    }
    data = json.dumps(body).encode("utf-8") if body else None
    req  = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        raise RuntimeError(f"ЮКасса {e.code}: {err_body}")

def handler(event: dict, context) -> dict:
    """Магазин: товары, покупка с кошелька, покупка картой через ЮКасса, вебхук, история заказов"""
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

    # ── Публичные эндпоинты ────────────────────────────────────────────

    if method == "GET" and action == "products":
        try:
            search   = params.get("q", "")
            category = params.get("category", "")
            url = PRODUCTS_URL
            if search:
                url += f"?action=search&q={urllib.parse.quote(search)}"
            data = fetch_json(url)
            products = data.get("products", [])
            if category and not search:
                products = [p for p in products if p.get("category") == category]
            return resp(200, {"products": products})
        except Exception as e:
            return resp(502, {"error": f"Ошибка загрузки товаров: {str(e)}"})

    if method == "GET" and action == "product":
        try:
            data = fetch_json(f"{PRODUCTS_URL}?action=product&id={params.get('id','')}")
            return resp(200, data)
        except Exception as e:
            return resp(502, {"error": str(e)})

    # ── Вебхук ЮКасса (без авторизации) ────────────────────────────────
    if method == "POST" and action == "webhook":
        db  = get_db()
        cur = db.cursor()
        try:
            event_type = body.get("type", "")
            obj        = body.get("object", {})
            yk_id      = obj.get("id", "")
            status     = obj.get("status", "")

            if event_type == "notification" and status == "succeeded" and yk_id:
                cur.execute(
                    f"SELECT id, user_id, product_id, product_title, product_price, status "
                    f"FROM {SCHEMA}.shop_orders WHERE yookassa_payment_id = %s",
                    (yk_id,)
                )
                order = cur.fetchone()
                if order and order[5] == "pending_card":
                    order_id, user_id, product_id, product_title, product_price = order[0], order[1], order[2], order[3], float(order[4])

                    cur.execute(
                        f"UPDATE {SCHEMA}.shop_orders SET status = 'paid', updated_at = NOW() WHERE id = %s",
                        (order_id,)
                    )
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.notifications (user_id, title, body, type) VALUES (%s, %s, %s, 'info')",
                        (user_id, f"Оплата прошла: {product_title}",
                         f"Покупка «{product_title}» за {product_price:,.0f} ₽ успешно оплачена картой. Заказ #{order_id}")
                    )
                    db.commit()
            return resp(200, {"ok": True})
        finally:
            cur.close()
            db.close()

    # ── Авторизованные эндпоинты ─────────────────────────────────────────

    db  = get_db()
    cur = db.cursor()

    try:
        user = get_user_from_token(cur, token)
        if not user:
            return resp(401, {"error": "Необходима авторизация"})
        user_id, user_name, user_email, user_role = user

        # POST ?action=buy — покупка с кошелька
        if method == "POST" and action == "buy":
            product_id = body.get("product_id")
            if not product_id:
                return resp(400, {"error": "Укажите product_id"})

            try:
                prod_data = fetch_json(f"{PRODUCTS_URL}?action=product&id={product_id}")
                product   = prod_data.get("product")
                if not product or not product.get("is_active"):
                    return resp(404, {"error": "Товар не найден"})
            except Exception:
                return resp(502, {"error": "Не удалось получить информацию о товаре"})

            price = float(product["price"])
            title = product["title"]

            cur.execute(f"SELECT id, balance FROM {SCHEMA}.wallets WHERE user_id = %s", (user_id,))
            wallet = cur.fetchone()
            if not wallet:
                return resp(400, {"error": "Кошелёк не найден. Пополните баланс в личном кабинете"})

            wallet_id, balance = wallet[0], float(wallet[1])
            if balance < price:
                return resp(402, {
                    "error": f"Недостаточно средств. На кошельке {balance:,.0f} ₽, нужно ещё {(price-balance):,.0f} ₽",
                    "balance": balance, "price": price, "shortage": price - balance
                })

            new_balance = balance - price
            cur.execute(
                f"UPDATE {SCHEMA}.wallets SET balance = %s, updated_at = NOW() WHERE id = %s",
                (new_balance, wallet_id)
            )
            cur.execute(
                f"INSERT INTO {SCHEMA}.wallet_transactions "
                f"(wallet_id, user_id, type, amount, balance_after, description) "
                f"VALUES (%s, %s, 'spend', %s, %s, %s) RETURNING id",
                (wallet_id, user_id, -price, new_balance, f"Покупка в магазине: {title}")
            )
            txn_id = cur.fetchone()[0]

            cur.execute(
                f"INSERT INTO {SCHEMA}.shop_orders "
                f"(user_id, product_id, product_title, product_price, status, payment_type, wallet_txn_id) "
                f"VALUES (%s, %s, %s, %s, 'paid', 'wallet', %s) RETURNING id",
                (user_id, product_id, title, price, txn_id)
            )
            order_id = cur.fetchone()[0]

            _, receipt_num = add_receipt(cur, user_id, "shop_wallet", price,
                                          f"Покупка в магазине DD MAXI: {title}", str(order_id),
                                          {"product_id": product_id, "order_id": order_id, "balance_after": new_balance})
            cur.execute(
                f"INSERT INTO {SCHEMA}.notifications (user_id, title, body, type) VALUES (%s, %s, %s, 'info')",
                (user_id, f"Покупка оформлена: {title}",
                 f"Вы купили «{title}» за {price:,.0f} ₽. Остаток на кошельке: {new_balance:,.0f} ₽. Заказ #{order_id}")
            )
            db.commit()

            return resp(200, {
                "ok": True, "order_id": order_id, "product": title,
                "price": price, "balance_after": new_balance,
                "receipt_number": receipt_num,
                "message": f"Покупка успешна! Списано {price:,.0f} ₽, остаток {new_balance:,.0f} ₽"
            })

        # POST ?action=buy_card — покупка картой через ЮКасса
        if method == "POST" and action == "buy_card":
            product_id = body.get("product_id")
            return_url = body.get("return_url", "https://ddmaxi.ru")
            if not product_id:
                return resp(400, {"error": "Укажите product_id"})

            try:
                prod_data = fetch_json(f"{PRODUCTS_URL}?action=product&id={product_id}")
                product   = prod_data.get("product")
                if not product or not product.get("is_active"):
                    return resp(404, {"error": "Товар не найден"})
            except Exception:
                return resp(502, {"error": "Не удалось получить информацию о товаре"})

            price = float(product["price"])
            title = product["title"]

            # Создаём заказ в статусе pending_card
            cur.execute(
                f"INSERT INTO {SCHEMA}.shop_orders "
                f"(user_id, product_id, product_title, product_price, status, payment_type) "
                f"VALUES (%s, %s, %s, %s, 'pending_card', 'card') RETURNING id",
                (user_id, product_id, title, price)
            )
            order_id = cur.fetchone()[0]
            db.commit()

            # Создаём платёж в ЮКасса
            try:
                payment = yookassa_request("POST", "/payments", {
                    "amount": {"value": f"{price:.2f}", "currency": "RUB"},
                    "confirmation": {"type": "redirect", "return_url": return_url},
                    "capture": True,
                    "description": f"Покупка в DD MAXI: {title} (#{order_id})",
                    "metadata": {"shop_order_id": str(order_id), "user_id": str(user_id)},
                    "receipt": {
                        "customer": {
                            "full_name": user_name,
                            **({"email": user_email} if user_email else {"phone": "79000000000"}),
                        },
                        "items": [{
                            "description": title[:128],
                            "quantity": "1.00",
                            "amount": {"value": f"{price:.2f}", "currency": "RUB"},
                            "vat_code": 1,
                            "payment_mode": "full_payment",
                            "payment_subject": "service",
                        }]
                    }
                })

                yk_id       = payment.get("id")
                confirm_url = payment.get("confirmation", {}).get("confirmation_url", "")

                cur.execute(
                    f"UPDATE {SCHEMA}.shop_orders "
                    f"SET yookassa_payment_id = %s, confirmation_url = %s, updated_at = NOW() WHERE id = %s",
                    (yk_id, confirm_url, order_id)
                )
                db.commit()

                return resp(200, {
                    "ok": True,
                    "order_id": order_id,
                    "payment_id": yk_id,
                    "confirmation_url": confirm_url,
                    "price": price,
                    "product": title,
                })
            except Exception as e:
                # Откатываем заказ если ЮКасса недоступна
                cur.execute(f"DELETE FROM {SCHEMA}.shop_orders WHERE id = %s", (order_id,))
                db.commit()
                return resp(502, {"error": f"Ошибка платёжной системы: {str(e)}"})

        # GET ?action=check_payment&order_id=X — проверить статус оплаты картой
        if method == "GET" and action == "check_payment":
            order_id = int(params.get("order_id", 0))
            cur.execute(
                f"SELECT status, yookassa_payment_id, product_title, product_price "
                f"FROM {SCHEMA}.shop_orders WHERE id = %s AND user_id = %s",
                (order_id, user_id)
            )
            order = cur.fetchone()
            if not order:
                return resp(404, {"error": "Заказ не найден"})
            status, yk_id, title, price = order[0], order[1], order[2], float(order[3])

            # Если ещё pending — спрашиваем ЮКасса напрямую
            if status == "pending_card" and yk_id:
                try:
                    payment = yookassa_request("GET", f"/payments/{yk_id}")
                    yk_status = payment.get("status", "")
                    if yk_status == "succeeded":
                        cur.execute(
                            f"UPDATE {SCHEMA}.shop_orders SET status='paid', updated_at=NOW() WHERE id=%s",
                            (order_id,)
                        )
                        # Чек только если ещё не создан
                        cur.execute(
                            f"SELECT id FROM {SCHEMA}.receipts WHERE ref_id = %s",
                            (str(order_id),)
                        )
                        if not cur.fetchone():
                            add_receipt(cur, user_id, "shop_card", price,
                                        f"Покупка в магазине DD MAXI: {title}", str(order_id),
                                        {"product_id": None, "order_id": order_id, "payment_id": yk_id})
                        cur.execute(
                            f"INSERT INTO {SCHEMA}.notifications (user_id, title, body, type) VALUES (%s,%s,%s,'info')",
                            (user_id, f"Оплата прошла: {title}",
                             f"Покупка «{title}» за {price:,.0f} ₽ оплачена. Заказ #{order_id}")
                        )
                        db.commit()
                        status = "paid"
                    elif yk_status in ("canceled", "cancelled"):
                        cur.execute(
                            f"UPDATE {SCHEMA}.shop_orders SET status='cancelled', updated_at=NOW() WHERE id=%s",
                            (order_id,)
                        )
                        db.commit()
                        status = "cancelled"
                except Exception:
                    pass

            return resp(200, {
                "order_id": order_id, "status": status,
                "product_title": title, "product_price": price
            })

        # GET ?action=my_orders
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
            return resp(200, {"orders": orders})

        # GET ?action=all_orders — все заказы (admin)
        if method == "GET" and action == "all_orders":
            if user_role != "admin":
                return resp(403, {"error": "Только для администраторов"})
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

            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.shop_orders")
            total = cur.fetchone()[0]
            cur.execute(f"SELECT COALESCE(SUM(product_price),0) FROM {SCHEMA}.shop_orders WHERE status='paid'")
            total_revenue = float(cur.fetchone()[0])

            return resp(200, {"orders": orders, "total": total, "total_revenue": total_revenue})

        # PUT ?action=update_order&id=X — обновить статус (admin)
        if method == "PUT" and action == "update_order":
            if user_role != "admin":
                return resp(403, {"error": "Только для администраторов"})
            order_id  = int(params.get("id", 0))
            new_status = body.get("status", "")
            notes      = body.get("notes", "")
            if not order_id or not new_status:
                return resp(400, {"error": "Укажите id и status"})
            cur.execute(
                f"UPDATE {SCHEMA}.shop_orders SET status=%s, notes=%s, updated_at=NOW() WHERE id=%s",
                (new_status, notes or None, order_id)
            )
            db.commit()
            return resp(200, {"ok": True})

        return resp(404, {"error": "Not found"})

    finally:
        cur.close()
        db.close()