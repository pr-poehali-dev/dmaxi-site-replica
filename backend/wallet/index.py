import json
import os
import uuid
import base64
import csv
import io
import smtplib
import ssl
import psycopg2
import urllib.request
import urllib.error
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SCHEMA = "t_p90995829_dmaxi_site_replica"
ADMIN_EMAIL = "ddmaxi-srs@yandex.ru"

def send_admin_email(subject: str, html_body: str):
    """Отправка уведомления на почту администратора."""
    host     = os.environ.get("SMTP_HOST", "smtp.yandex.ru")
    port     = int(os.environ.get("SMTP_PORT", "465"))
    user     = os.environ.get("SMTP_USER", "")
    password = os.environ.get("SMTP_PASSWORD", "")
    if not user or not password:
        return
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"DD MAXI <{user}>"
    msg["To"]      = ADMIN_EMAIL
    msg.attach(MIMEText(html_body, "html", "utf-8"))
    try:
        context = ssl.create_default_context()
        if port == 465:
            with smtplib.SMTP_SSL(host, port, context=context, timeout=15) as smtp:
                smtp.login(user, password)
                smtp.sendmail(user, ADMIN_EMAIL, msg.as_string())
        else:
            with smtplib.SMTP(host, port, timeout=15) as smtp:
                smtp.ehlo(); smtp.starttls(context=context); smtp.ehlo()
                smtp.login(user, password)
                smtp.sendmail(user, ADMIN_EMAIL, msg.as_string())
    except Exception:
        pass  # не блокируем основной флоу
MIN_TOPUP = 100    # минимальная сумма пополнения
MAX_TOPUP = 500000 # максимальная сумма пополнения

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

def ensure_wallet(cur, user_id):
    """Создаёт кошелёк если не существует, возвращает (wallet_id, balance)."""
    cur.execute(f"SELECT id, balance FROM {SCHEMA}.wallets WHERE user_id = %s", (user_id,))
    row = cur.fetchone()
    if row:
        return row[0], float(row[1])
    cur.execute(f"INSERT INTO {SCHEMA}.wallets (user_id, balance) VALUES (%s, 0) RETURNING id, balance", (user_id,))
    row = cur.fetchone()
    return row[0], float(row[1])

def add_transaction(cur, wallet_id, user_id, txn_type, amount, new_balance, description, ref_id=None):
    cur.execute(
        f"INSERT INTO {SCHEMA}.wallet_transactions "
        f"(wallet_id, user_id, type, amount, balance_after, description, ref_id) "
        f"VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
        (wallet_id, user_id, txn_type, amount, new_balance, description, ref_id)
    )
    return cur.fetchone()[0]

RECEIPT_TYPE_LABELS = {
    "topup":           "Пополнение кошелька",
    "spend":           "Оплата с кошелька",
    "shop_wallet":     "Покупка в магазине (кошелёк)",
    "shop_card":       "Покупка в магазине (карта)",
    "service_card":    "Оплата услуги (карта)",
    "service_wallet":  "Оплата услуги (кошелёк)",
    "goods_card":      "Заказ автотовара (карта)",
    "goods_wallet":    "Заказ автотовара (кошелёк)",
    "admin_adjust":    "Корректировка администратором",
}

def add_receipt(cur, user_id, rtype, amount, description, ref_id=None, metadata=None):
    """Создаёт чек и возвращает его id и номер."""
    now = datetime.now()
    receipt_number = f"DD-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
    cur.execute(
        f"INSERT INTO {SCHEMA}.receipts "
        f"(user_id, type, amount, description, ref_id, receipt_number, status, metadata) "
        f"VALUES (%s, %s, %s, %s, %s, %s, 'paid', %s) RETURNING id",
        (user_id, rtype, abs(amount), description, ref_id, receipt_number,
         json.dumps(metadata) if metadata else None)
    )
    row = cur.fetchone()
    return row[0], receipt_number

def yookassa_request(method: str, path: str, body: dict = None):
    """Запрос к API ЮКасса."""
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
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        raise RuntimeError(f"ЮКасса {e.code}: {err_body}")

def handler(event: dict, context) -> dict:
    """Кошелёк пользователя: баланс, пополнение через ЮКасса, история транзакций"""
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

    db  = get_db()
    cur = db.cursor()

    try:
        # ── Единый вебхук ЮКасса (не требует авторизации) ───────────────
        # POST ?action=webhook — ЮКасса шлёт сюда все уведомления
        # Роутинг по metadata.type: topup → кошелёк, shop → shop_orders, service/goods → просто уведомление
        if method == "POST" and action == "webhook":
            event_type = body.get("type", "")
            obj        = body.get("object", {})
            yk_id      = obj.get("id", "")
            yk_status  = obj.get("status", "")
            metadata   = obj.get("metadata", {})
            pay_type   = metadata.get("type", "")  # topup | shop | service | goods | "" (неизвестный)

            if event_type == "notification" and yk_id:

                # ── Покупка в магазине картой ────────────────────────────
                if pay_type == "shop":
                    shop_order_id = metadata.get("shop_order_id")
                    user_id_meta  = metadata.get("user_id")
                    if shop_order_id and yk_status == "succeeded":
                        cur.execute(
                            f"SELECT id, user_id, product_title, product_price, status "
                            f"FROM {SCHEMA}.shop_orders WHERE yookassa_payment_id = %s",
                            (yk_id,)
                        )
                        sorder = cur.fetchone()
                        if sorder and sorder[4] == "pending_card":
                            sorder_id, suser_id, stitle, sprice = sorder[0], sorder[1], sorder[2], float(sorder[3])
                            cur.execute(
                                f"UPDATE {SCHEMA}.shop_orders SET status='paid', updated_at=NOW() WHERE id=%s",
                                (sorder_id,)
                            )
                            cur.execute(
                                f"INSERT INTO {SCHEMA}.notifications (user_id, title, body, type) VALUES (%s,%s,%s,'info')",
                                (suser_id, f"Оплата прошла: {stitle}",
                                 f"Покупка «{stitle}» за {sprice:,.0f} ₽ оплачена картой. Заказ #{sorder_id}")
                            )
                            db.commit()
                            # Email администратору
                            cur.execute(f"SELECT name, phone FROM {SCHEMA}.users WHERE id = %s", (suser_id,))
                            urow = cur.fetchone()
                            uname_s = urow[0] if urow else f"ID {suser_id}"
                            uphone_s = urow[1] if urow else "—"
                            send_admin_email(
                                f"Покупка в магазине {sprice:,.0f} ₽ — {uname_s}",
                                f"""<p>Клиент <b>{uname_s}</b> ({uphone_s}) купил товар картой:</p>
                                <p><b>{stitle}</b> — <b style='color:#cc1a1a'>{sprice:,.0f} ₽</b></p>
                                <p>Заказ #{sorder_id}</p>"""
                            )

                    elif shop_order_id and yk_status in ("canceled", "cancelled"):
                        cur.execute(
                            f"UPDATE {SCHEMA}.shop_orders SET status='cancelled', updated_at=NOW() "
                            f"WHERE yookassa_payment_id=%s AND status='pending_card'",
                            (yk_id,)
                        )
                        db.commit()

                # ── Оплата услуги / автотовара картой ───────────────────
                elif pay_type in ("service", "goods"):
                    service_order_id = metadata.get("service_order_id")
                    user_id_meta     = metadata.get("user_id")
                    amount_val       = float(obj.get("amount", {}).get("value", 0))
                    if service_order_id and user_id_meta and yk_status == "succeeded":
                        cur.execute(
                            f"UPDATE {SCHEMA}.payment_orders SET status='succeeded', updated_at=NOW() WHERE id=%s",
                            (int(service_order_id),)
                        )
                        label = "Товар заказан" if pay_type == "goods" else "Услуга оплачена"
                        cur.execute(
                            f"INSERT INTO {SCHEMA}.notifications (user_id, title, body, type) VALUES (%s,%s,%s,'info')",
                            (int(user_id_meta), "Оплата прошла успешно",
                             f"{label} на сумму {amount_val:,.0f} ₽. Спасибо!")
                        )
                        db.commit()
                        # Email администратору
                        cur.execute(f"SELECT name, phone FROM {SCHEMA}.users WHERE id = %s", (int(user_id_meta),))
                        urow = cur.fetchone()
                        uname_sv = urow[0] if urow else f"ID {user_id_meta}"
                        uphone_sv = urow[1] if urow else "—"
                        pay_label = "Автотовар" if pay_type == "goods" else "Услуга"
                        send_admin_email(
                            f"{pay_label} оплачен(а) {amount_val:,.0f} ₽ — {uname_sv}",
                            f"""<p>Клиент <b>{uname_sv}</b> ({uphone_sv}) оплатил(а) {pay_label.lower()} картой:</p>
                            <p>Сумма: <b style='color:#cc1a1a'>{amount_val:,.0f} ₽</b><br>Заказ #{service_order_id}</p>"""
                        )

                # ── Пополнение кошелька ─────────────────────────────────
                elif pay_type == "topup" or pay_type == "":
                    if yk_status == "succeeded":
                        cur.execute(
                            f"SELECT id, user_id, amount, status FROM {SCHEMA}.payment_orders WHERE yookassa_id = %s",
                            (yk_id,)
                        )
                        order = cur.fetchone()
                        if order and order[3] == "pending":
                            order_id, user_id, amount = order[0], order[1], float(order[2])
                            cur.execute(
                                f"UPDATE {SCHEMA}.payment_orders SET status='succeeded', updated_at=NOW() WHERE id=%s",
                                (order_id,)
                            )
                            wallet_id, old_balance = ensure_wallet(cur, user_id)
                            new_balance = old_balance + amount
                            cur.execute(
                                f"UPDATE {SCHEMA}.wallets SET balance=%s, updated_at=NOW() WHERE id=%s",
                                (new_balance, wallet_id)
                            )
                            add_transaction(cur, wallet_id, user_id, "topup", amount, new_balance,
                                            "Пополнение через ЮКасса", yk_id)
                            add_receipt(cur, user_id, "topup", amount,
                                        "Пополнение кошелька DD MAXI через ЮКасса", yk_id,
                                        {"payment_id": yk_id, "balance_after": new_balance})
                            cur.execute(
                                f"INSERT INTO {SCHEMA}.notifications (user_id, title, body, type) VALUES (%s,%s,%s,'info')",
                                (user_id, "Кошелёк пополнен",
                                 f"На ваш кошелёк зачислено {amount:,.0f} ₽. Текущий баланс: {new_balance:,.0f} ₽")
                            )
                            db.commit()
                            # Email администратору
                            cur.execute(f"SELECT name, phone FROM {SCHEMA}.users WHERE id = %s", (user_id,))
                            urow = cur.fetchone()
                            uname_t = urow[0] if urow else f"ID {user_id}"
                            uphone_t = urow[1] if urow else "—"
                            send_admin_email(
                                f"Пополнение кошелька {amount:,.0f} ₽ — {uname_t}",
                                f"""<p>Клиент <b>{uname_t}</b> ({uphone_t}) пополнил кошелёк на <b style='color:#cc1a1a'>{amount:,.0f} ₽</b>.</p>
                                <p>Текущий баланс: {new_balance:,.0f} ₽<br>Payment ID: {yk_id}</p>"""
                            )

            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True})}

        # ── Все остальные экшны требуют авторизации ──────────────────────
        user = get_user_from_token(cur, token)
        if not user:
            return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Не авторизован"})}
        user_id, user_name, user_email, user_role = user

        # GET ?action=balance — баланс и краткая история
        if method == "GET" and action == "balance":
            wallet_id, balance = ensure_wallet(cur, user_id)
            db.commit()  # фиксируем создание кошелька если было
            cur.execute(
                f"SELECT type, amount, balance_after, description, ref_id, created_at "
                f"FROM {SCHEMA}.wallet_transactions WHERE user_id = %s "
                f"ORDER BY created_at DESC LIMIT 20",
                (user_id,)
            )
            txns = []
            for r in cur.fetchall():
                txns.append({
                    "type": r[0], "amount": float(r[1]),
                    "balance_after": float(r[2]), "description": r[3],
                    "ref_id": r[4], "created_at": str(r[5])
                })
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({
                "balance": balance, "wallet_id": wallet_id, "transactions": txns
            })}

        # POST ?action=create_payment — создать платёж ЮКасса для пополнения
        if method == "POST" and action == "create_payment":
            amount      = float(body.get("amount", 0))
            return_url  = body.get("return_url", "https://ddmaxi.ru")

            if amount < MIN_TOPUP:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": f"Минимальная сумма пополнения: {MIN_TOPUP} ₽"})}
            if amount > MAX_TOPUP:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": f"Максимальная сумма: {MAX_TOPUP} ₽"})}

            # Создаём заказ в БД
            cur.execute(
                f"INSERT INTO {SCHEMA}.payment_orders (user_id, amount, status) VALUES (%s, %s, 'pending') RETURNING id",
                (user_id, amount)
            )
            order_id = cur.fetchone()[0]
            db.commit()

            # Создаём платёж в ЮКасса
            try:
                payment = yookassa_request("POST", "/payments", {
                    "amount": {"value": f"{amount:.2f}", "currency": "RUB"},
                    "confirmation": {"type": "redirect", "return_url": return_url},
                    "capture": True,
                    "description": f"Пополнение кошелька DD MAXI — {user_name} (#{user_id})",
                    "metadata": {"order_id": str(order_id), "user_id": str(user_id)},
                    "receipt": {
                        "customer": {
                            "full_name": user_name,
                            **({"email": user_email} if user_email else {"phone": "79000000000"}),
                        },
                        "items": [{
                            "description": "Пополнение кошелька DD MAXI",
                            "quantity": "1.00",
                            "amount": {"value": f"{amount:.2f}", "currency": "RUB"},
                            "vat_code": 1,
                            "payment_mode": "full_payment",
                            "payment_subject": "service",
                        }]
                    }
                })

                yk_id      = payment.get("id")
                confirm    = payment.get("confirmation", {})
                confirm_url = confirm.get("confirmation_url", "")

                cur.execute(
                    f"UPDATE {SCHEMA}.payment_orders SET yookassa_id = %s, confirmation_url = %s, updated_at = NOW() WHERE id = %s",
                    (yk_id, confirm_url, order_id)
                )
                db.commit()

                return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({
                    "ok": True, "order_id": order_id, "payment_id": yk_id,
                    "confirmation_url": confirm_url, "amount": amount
                })}

            except Exception as e:
                # Помечаем заказ как failed чтобы не путался
                cur.execute(f"UPDATE {SCHEMA}.payment_orders SET status = 'canceled' WHERE id = %s", (order_id,))
                db.commit()
                return {"statusCode": 502, "headers": cors_headers(), "body": json.dumps({
                    "error": f"Ошибка создания платежа: {str(e)}"
                })}

        # GET ?action=check_payment&order_id=X — проверить статус платежа
        if method == "GET" and action == "check_payment":
            order_id = int(params.get("order_id", 0))
            if not order_id:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Укажите order_id"})}

            cur.execute(
                f"SELECT id, yookassa_id, amount, status FROM {SCHEMA}.payment_orders "
                f"WHERE id = %s AND user_id = %s",
                (order_id, user_id)
            )
            order = cur.fetchone()
            if not order:
                return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Заказ не найден"})}

            oid, yk_id, amount, status = order

            # Если ещё pending — запрашиваем актуальный статус у ЮКасса
            if status == "pending" and yk_id:
                try:
                    payment = yookassa_request("GET", f"/payments/{yk_id}")
                    yk_status = payment.get("status", "")

                    if yk_status == "succeeded":
                        amount_val = float(payment.get("amount", {}).get("value", amount))
                        cur.execute(
                            f"UPDATE {SCHEMA}.payment_orders SET status = 'succeeded', updated_at = NOW() WHERE id = %s",
                            (oid,)
                        )
                        # Проверяем не было ли уже зачислено через вебхук
                        cur.execute(
                            f"SELECT id FROM {SCHEMA}.wallet_transactions WHERE ref_id = %s",
                            (yk_id,)
                        )
                        if not cur.fetchone():
                            wallet_id, old_balance = ensure_wallet(cur, user_id)
                            new_balance = old_balance + amount_val
                            cur.execute(
                                f"UPDATE {SCHEMA}.wallets SET balance = %s, updated_at = NOW() WHERE id = %s",
                                (new_balance, wallet_id)
                            )
                            add_transaction(cur, wallet_id, user_id, "topup", amount_val, new_balance,
                                            "Пополнение через ЮКасса", yk_id)
                            add_receipt(cur, user_id, "topup", amount_val,
                                        "Пополнение кошелька DD MAXI через ЮКасса", yk_id,
                                        {"payment_id": yk_id, "balance_after": new_balance})
                            cur.execute(
                                f"INSERT INTO {SCHEMA}.notifications (user_id, title, body, type) VALUES (%s, %s, %s, 'info')",
                                (user_id, "Кошелёк пополнен",
                                 f"На ваш кошелёк зачислено {amount_val:,.0f} ₽. Текущий баланс: {new_balance:,.0f} ₽")
                            )
                        status = "succeeded"

                    elif yk_status == "canceled":
                        cur.execute(
                            f"UPDATE {SCHEMA}.payment_orders SET status = 'canceled', updated_at = NOW() WHERE id = %s",
                            (oid,)
                        )
                        status = "canceled"

                    db.commit()
                except Exception:
                    pass

            # Свежий баланс
            cur.execute(f"SELECT balance FROM {SCHEMA}.wallets WHERE user_id = %s", (user_id,))
            row = cur.fetchone()
            balance = float(row[0]) if row else 0.0

            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({
                "order_id": oid, "status": status, "amount": float(amount), "balance": balance
            })}

        # POST ?action=spend — списание с кошелька пользователя (самостоятельная оплата)
        if method == "POST" and action == "spend":
            amount      = float(body.get("amount", 0))
            description = body.get("description", "Оплата услуги").strip()

            if amount <= 0:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Укажите сумму больше 0"})}

            wallet_id, old_balance = ensure_wallet(cur, user_id)
            if old_balance < amount:
                shortage = amount - old_balance
                return {"statusCode": 402, "headers": cors_headers(), "body": json.dumps({
                    "error": f"Недостаточно средств. На кошельке {old_balance:,.0f} ₽, не хватает {shortage:,.0f} ₽",
                    "balance": old_balance, "shortage": shortage
                })}

            new_balance = old_balance - amount
            cur.execute(
                f"UPDATE {SCHEMA}.wallets SET balance = %s, updated_at = NOW() WHERE id = %s",
                (new_balance, wallet_id)
            )
            txn_id = add_transaction(cur, wallet_id, user_id, "spend", -amount, new_balance, description)
            _, receipt_num = add_receipt(cur, user_id, "spend", amount, description,
                                         str(txn_id), {"balance_after": new_balance})
            cur.execute(
                f"INSERT INTO {SCHEMA}.notifications (user_id, title, body, type) VALUES (%s, %s, %s, 'info')",
                (user_id, "Оплата с кошелька",
                 f"Списано {amount:,.0f} ₽. {description}. Остаток: {new_balance:,.0f} ₽")
            )
            db.commit()

            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({
                "ok": True, "txn_id": txn_id, "receipt_number": receipt_num,
                "amount": amount, "balance_after": new_balance,
                "message": f"Списано {amount:,.0f} ₽. Остаток: {new_balance:,.0f} ₽"
            })}

        # POST ?action=create_service_payment — оплата услуги/товара картой через ЮКасса (без зачисления на кошелёк)
        if method == "POST" and action == "create_service_payment":
            amount      = float(body.get("amount", 0))
            description = body.get("description", "Оплата услуги DD MAXI")
            return_url  = body.get("return_url", "https://ddmaxi.ru")

            if amount <= 0:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Укажите сумму больше 0"})}
            if amount > MAX_TOPUP:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": f"Максимальная сумма: {MAX_TOPUP} ₽"})}

            # Создаём запись с типом service_payment
            cur.execute(
                f"INSERT INTO {SCHEMA}.payment_orders (user_id, amount, status, description) "
                f"VALUES (%s, %s, 'pending', %s) RETURNING id",
                (user_id, amount, description)
            )
            order_id = cur.fetchone()[0]
            db.commit()

            try:
                payment = yookassa_request("POST", "/payments", {
                    "amount": {"value": f"{amount:.2f}", "currency": "RUB"},
                    "confirmation": {"type": "redirect", "return_url": return_url},
                    "capture": True,
                    "description": f"{description[:128]} — {user_name}",
                    "metadata": {"service_order_id": str(order_id), "user_id": str(user_id), "type": "service"},
                    "receipt": {
                        "customer": {
                            "full_name": user_name,
                            **({"email": user_email} if user_email else {"phone": "79000000000"}),
                        },
                        "items": [{
                            "description": description[:128],
                            "quantity": "1.00",
                            "amount": {"value": f"{amount:.2f}", "currency": "RUB"},
                            "vat_code": 1,
                            "payment_mode": "full_payment",
                            "payment_subject": "service",
                        }]
                    }
                })

                yk_id       = payment.get("id")
                confirm_url = payment.get("confirmation", {}).get("confirmation_url", "")

                cur.execute(
                    f"UPDATE {SCHEMA}.payment_orders SET yookassa_id = %s, confirmation_url = %s, updated_at = NOW() WHERE id = %s",
                    (yk_id, confirm_url, order_id)
                )
                db.commit()

                return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({
                    "ok": True, "order_id": order_id, "payment_id": yk_id,
                    "confirmation_url": confirm_url, "amount": amount
                })}

            except Exception as e:
                cur.execute(f"UPDATE {SCHEMA}.payment_orders SET status = 'canceled' WHERE id = %s", (order_id,))
                db.commit()
                return {"statusCode": 502, "headers": cors_headers(), "body": json.dumps({
                    "error": f"Ошибка создания платежа: {str(e)}"
                })}

        # GET ?action=history — полная история транзакций
        if method == "GET" and action == "history":
            limit  = min(int(params.get("limit", 50)), 200)
            offset = int(params.get("offset", 0))
            cur.execute(
                f"SELECT type, amount, balance_after, description, ref_id, created_at "
                f"FROM {SCHEMA}.wallet_transactions WHERE user_id = %s "
                f"ORDER BY created_at DESC LIMIT %s OFFSET %s",
                (user_id, limit, offset)
            )
            txns = []
            for r in cur.fetchall():
                txns.append({
                    "type": r[0], "amount": float(r[1]),
                    "balance_after": float(r[2]), "description": r[3],
                    "ref_id": r[4], "created_at": str(r[5])
                })
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.wallet_transactions WHERE user_id = %s", (user_id,))
            total = cur.fetchone()[0]
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"transactions": txns, "total": total})}

        # ── Только для администратора ─────────────────────────────────────

        # GET ?action=admin_wallets — список всех кошельков
        if method == "GET" and action == "admin_wallets":
            if user_role != "admin":
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Только для администраторов"})}
            search = params.get("search", "")
            query = (
                f"SELECT w.id, w.user_id, u.name, u.phone, u.email, w.balance, w.updated_at "
                f"FROM {SCHEMA}.wallets w JOIN {SCHEMA}.users u ON u.id = w.user_id WHERE 1=1"
            )
            vals = []
            if search:
                query += " AND (u.name ILIKE %s OR u.phone ILIKE %s)"
                vals += [f"%{search}%", f"%{search}%"]
            query += " ORDER BY w.balance DESC LIMIT 100"
            cur.execute(query, vals)
            wallets = []
            for r in cur.fetchall():
                wallets.append({"wallet_id": r[0], "user_id": r[1], "name": r[2], "phone": r[3], "email": r[4], "balance": float(r[5]), "updated_at": str(r[6])})
            cur.execute(f"SELECT COALESCE(SUM(balance),0) FROM {SCHEMA}.wallets")
            total_balance = float(cur.fetchone()[0])
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"wallets": wallets, "total_balance": total_balance})}

        # POST ?action=admin_adjust — ручная корректировка баланса
        if method == "POST" and action == "admin_adjust":
            if user_role != "admin":
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Только для администраторов"})}
            target_uid  = int(body.get("user_id", 0))
            adjust_type = body.get("type", "admin_adjust")   # admin_adjust | refund | spend
            amount      = float(body.get("amount", 0))
            description = body.get("description", "Корректировка администратором").strip()
            direction   = body.get("direction", "credit")    # credit | debit

            if not target_uid or amount <= 0:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Укажите user_id и amount > 0"})}

            wallet_id, old_balance = ensure_wallet(cur, target_uid)
            if direction == "debit":
                if old_balance < amount:
                    return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Недостаточно средств на кошельке"})}
                new_balance = old_balance - amount
                txn_amount  = -amount
            else:
                new_balance = old_balance + amount
                txn_amount  = amount

            cur.execute(
                f"UPDATE {SCHEMA}.wallets SET balance = %s, updated_at = NOW() WHERE id = %s",
                (new_balance, wallet_id)
            )
            txn_id = add_transaction(cur, wallet_id, target_uid, adjust_type, txn_amount, new_balance, description, f"admin:{user_id}")

            # Чек для пользователя
            receipt_desc = description or ("Зачисление администратором" if direction == "credit" else "Списание администратором")
            add_receipt(cur, target_uid, "admin_adjust", amount, receipt_desc,
                        f"admin:{user_id}:{txn_id}",
                        {"direction": direction, "admin_id": user_id, "balance_after": new_balance})

            # Уведомление пользователю
            if direction == "credit":
                notif_body = f"Администратор зачислил {amount:,.0f} ₽ на ваш кошелёк. Баланс: {new_balance:,.0f} ₽"
            else:
                notif_body = f"Со счёта списано {amount:,.0f} ₽. Баланс: {new_balance:,.0f} ₽"
            cur.execute(
                f"INSERT INTO {SCHEMA}.notifications (user_id, title, body, type) VALUES (%s, %s, %s, 'info')",
                (target_uid, "Изменение баланса кошелька", notif_body)
            )
            db.commit()
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({
                "ok": True, "new_balance": new_balance, "old_balance": old_balance
            })}

        # GET ?action=receipts — список чеков текущего пользователя
        if method == "GET" and action == "receipts":
            limit  = min(int(params.get("limit", 50)), 200)
            offset = int(params.get("offset", 0))
            cur.execute(
                f"SELECT id, type, amount, description, ref_id, receipt_number, status, metadata, created_at "
                f"FROM {SCHEMA}.receipts WHERE user_id = %s "
                f"ORDER BY created_at DESC LIMIT %s OFFSET %s",
                (user_id, limit, offset)
            )
            receipts = []
            for r in cur.fetchall():
                receipts.append({
                    "id": r[0], "type": r[1], "type_label": RECEIPT_TYPE_LABELS.get(r[1], r[1]),
                    "amount": float(r[2]), "description": r[3], "ref_id": r[4],
                    "receipt_number": r[5], "status": r[6],
                    "metadata": r[7] if r[7] else {},
                    "created_at": str(r[8])
                })
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.receipts WHERE user_id = %s", (user_id,))
            total = cur.fetchone()[0]
            return {"statusCode": 200, "headers": cors_headers(),
                    "body": json.dumps({"receipts": receipts, "total": total})}

        # GET ?action=receipt_detail&id=X — детальный чек (HTML для печати)
        if method == "GET" and action == "receipt_detail":
            receipt_id = int(params.get("id", 0))
            cur.execute(
                f"SELECT r.id, r.type, r.amount, r.description, r.ref_id, r.receipt_number, "
                f"r.status, r.metadata, r.created_at, u.name, u.phone, u.email "
                f"FROM {SCHEMA}.receipts r JOIN {SCHEMA}.users u ON u.id = r.user_id "
                f"WHERE r.id = %s AND (r.user_id = %s OR %s = 'admin')",
                (receipt_id, user_id, user_role)
            )
            r = cur.fetchone()
            if not r:
                return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Чек не найден"})}
            receipt = {
                "id": r[0], "type": r[1], "type_label": RECEIPT_TYPE_LABELS.get(r[1], r[1]),
                "amount": float(r[2]), "description": r[3], "ref_id": r[4],
                "receipt_number": r[5], "status": r[6],
                "metadata": r[7] if r[7] else {},
                "created_at": str(r[8]),
                "user_name": r[9], "user_phone": r[10], "user_email": r[11]
            }
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"receipt": receipt})}

        # GET ?action=receipts_export — выгрузка CSV (Excel) транзакций
        if method == "GET" and action == "receipts_export":
            date_from = params.get("date_from", "")
            date_to   = params.get("date_to", "")
            # Для admin — можно выгрузить всех
            if user_role == "admin" and params.get("all") == "1":
                query = (
                    f"SELECT r.receipt_number, u.name, u.phone, r.type, r.amount, "
                    f"r.description, r.ref_id, r.status, r.created_at "
                    f"FROM {SCHEMA}.receipts r JOIN {SCHEMA}.users u ON u.id = r.user_id WHERE 1=1"
                )
                vals = []
            else:
                query = (
                    f"SELECT r.receipt_number, u.name, u.phone, r.type, r.amount, "
                    f"r.description, r.ref_id, r.status, r.created_at "
                    f"FROM {SCHEMA}.receipts r JOIN {SCHEMA}.users u ON u.id = r.user_id "
                    f"WHERE r.user_id = %s"
                )
                vals = [user_id]
            if date_from:
                query += " AND r.created_at >= %s"
                vals.append(date_from)
            if date_to:
                query += " AND r.created_at <= %s"
                vals.append(date_to + " 23:59:59")
            query += " ORDER BY r.created_at DESC LIMIT 10000"
            cur.execute(query, vals)
            rows = cur.fetchall()

            output = io.StringIO()
            writer = csv.writer(output, delimiter=";")
            writer.writerow(["Номер чека", "Клиент", "Телефон", "Тип операции",
                             "Сумма (руб)", "Описание", "Ref ID", "Статус", "Дата"])
            for row in rows:
                writer.writerow([
                    row[0], row[1], row[2],
                    RECEIPT_TYPE_LABELS.get(row[3], row[3]),
                    f"{float(row[4]):.2f}", row[5], row[6] or "", row[7],
                    str(row[8])[:19]
                ])
            csv_data = output.getvalue()
            csv_b64  = base64.b64encode(csv_data.encode("utf-8-sig")).decode()

            return {
                "statusCode": 200,
                "headers": {
                    **cors_headers(),
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": 'attachment; filename="receipts.csv"',
                },
                "body": csv_b64,
                "isBase64Encoded": True,
            }

        # GET ?action=admin_receipts — все чеки всех пользователей (только admin)
        if method == "GET" and action == "admin_receipts":
            if user_role != "admin":
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Только для администраторов"})}
            search = params.get("search", "")
            rtype  = params.get("type", "")
            limit  = min(int(params.get("limit", 50)), 200)
            offset = int(params.get("offset", 0))
            query = (
                f"SELECT r.id, r.type, r.amount, r.description, r.ref_id, r.receipt_number, "
                f"r.status, r.metadata, r.created_at, u.name, u.phone "
                f"FROM {SCHEMA}.receipts r JOIN {SCHEMA}.users u ON u.id = r.user_id WHERE 1=1"
            )
            vals = []
            if search:
                query += " AND (u.name ILIKE %s OR u.phone ILIKE %s OR r.receipt_number ILIKE %s)"
                vals += [f"%{search}%", f"%{search}%", f"%{search}%"]
            if rtype:
                query += " AND r.type = %s"
                vals.append(rtype)
            query += " ORDER BY r.created_at DESC LIMIT %s OFFSET %s"
            vals += [limit, offset]
            cur.execute(query, vals)
            receipts = []
            for r in cur.fetchall():
                receipts.append({
                    "id": r[0], "type": r[1], "type_label": RECEIPT_TYPE_LABELS.get(r[1], r[1]),
                    "amount": float(r[2]), "description": r[3], "ref_id": r[4],
                    "receipt_number": r[5], "status": r[6],
                    "metadata": r[7] if r[7] else {},
                    "created_at": str(r[8]),
                    "user_name": r[9], "user_phone": r[10]
                })
            cquery = f"SELECT COUNT(*) FROM {SCHEMA}.receipts r JOIN {SCHEMA}.users u ON u.id = r.user_id WHERE 1=1"
            cvals = []
            if search:
                cquery += " AND (u.name ILIKE %s OR u.phone ILIKE %s OR r.receipt_number ILIKE %s)"
                cvals += [f"%{search}%", f"%{search}%", f"%{search}%"]
            if rtype:
                cquery += " AND r.type = %s"
                cvals.append(rtype)
            cur.execute(cquery, cvals)
            total = cur.fetchone()[0]
            return {"statusCode": 200, "headers": cors_headers(),
                    "body": json.dumps({"receipts": receipts, "total": total})}

        return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        db.close()