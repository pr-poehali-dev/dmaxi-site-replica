import json
import os
import hashlib
import psycopg2
from datetime import datetime

SCHEMA = "t_p90995829_dmaxi_site_replica"

LEVEL_LABELS   = {"bronze": "Бронза", "silver": "Серебро", "gold": "Золото", "platinum": "Платинум"}
LEVEL_DISCOUNT = {"bronze": 3, "silver": 5, "gold": 10, "platinum": 15}

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
        "Content-Type": "application/json",
    }

def get_admin_user(cur, token):
    if not token:
        return None
    cur.execute(
        f"SELECT u.id, u.role FROM {SCHEMA}.sessions s "
        f"JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token = %s AND s.expires_at > NOW() AND u.is_active = true",
        (token,)
    )
    row = cur.fetchone()
    if not row or row[1] != "admin":
        return None
    return row[0]

def get_any_user(cur, token):
    if not token:
        return None
    cur.execute(
        f"SELECT u.id, u.name, u.role FROM {SCHEMA}.sessions s "
        f"JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token = %s AND s.expires_at > NOW() AND u.is_active = true",
        (token,)
    )
    return cur.fetchone()

def log_scan(cur, admin_id, user_id, action, amount=None, description=None, result=None):
    try:
        cur.execute(
            f"INSERT INTO {SCHEMA}.qr_scan_history (admin_id, user_id, action, amount, description, result) "
            f"VALUES (%s, %s, %s, %s, %s, %s)",
            (admin_id, user_id, action, amount, description, result)
        )
    except Exception:
        pass

def ensure_wallet(cur, user_id):
    cur.execute(f"SELECT id, balance FROM {SCHEMA}.wallets WHERE user_id = %s", (user_id,))
    row = cur.fetchone()
    if row:
        return row[0], float(row[1])
    cur.execute(f"INSERT INTO {SCHEMA}.wallets (user_id, balance) VALUES (%s, 0) RETURNING id, balance", (user_id,))
    row = cur.fetchone()
    return row[0], float(row[1])

def handler(event: dict, context) -> dict:
    """Клубные карты DD MAXI: QR-info, сканирование, оплата, скидка, список, присвоение"""
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
        # ── GET card_info — публичная информация по QR-токену ──────────────
        if method == "GET" and action == "card_info":
            qr_token = params.get("token", "")
            if not qr_token:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Токен не указан"})}

            cur.execute(
                f"SELECT id, name, phone, club_level, bonus_points, club_card_number, car_model, created_at "
                f"FROM {SCHEMA}.users WHERE qr_token = %s AND is_active = true",
                (qr_token,)
            )
            u = cur.fetchone()
            if not u:
                return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Карта не найдена"})}

            wallet_id, balance = ensure_wallet(cur, u[0])
            db.commit()

            return {
                "statusCode": 200,
                "headers": cors_headers(),
                "body": json.dumps({
                    "id": u[0], "name": u[1], "phone": u[2],
                    "club_level": u[3], "club_level_label": LEVEL_LABELS.get(u[3], u[3]),
                    "bonus_points": u[4], "club_card_number": u[5],
                    "car_model": u[6], "member_since": str(u[7])[:10],
                    "wallet_balance": balance,
                    "discount_percent": LEVEL_DISCOUNT.get(u[3], 0)
                })
            }

        # ── GET scan_history — история сканирований (только admin) ──────────
        if method == "GET" and action == "scan_history":
            admin_id = get_admin_user(cur, token)
            if not admin_id:
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Только для администраторов"})}

            limit  = int(params.get("limit", 50))
            offset = int(params.get("offset", 0))

            cur.execute(
                f"SELECT h.id, h.action, h.amount, h.description, h.result, h.created_at, "
                f"u.name, u.phone, u.club_card_number, u.club_level "
                f"FROM {SCHEMA}.qr_scan_history h "
                f"JOIN {SCHEMA}.users u ON u.id = h.user_id "
                f"ORDER BY h.created_at DESC LIMIT %s OFFSET %s",
                (limit, offset)
            )
            rows = cur.fetchall()
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.qr_scan_history")
            total = cur.fetchone()[0]

            ACTION_LABELS = {
                "scan": "Сканирование", "wallet_pay": "Оплата кошельком",
                "apply_discount": "Скидка", "confirm_visit": "Визит подтверждён"
            }
            history = [{
                "id": r[0], "action": r[1], "action_label": ACTION_LABELS.get(r[1], r[1]),
                "amount": float(r[2]) if r[2] else None,
                "description": r[3], "result": r[4],
                "created_at": str(r[5]),
                "user_name": r[6], "user_phone": r[7],
                "club_card_number": r[8], "club_level": r[9]
            } for r in rows]

            return {"statusCode": 200, "headers": cors_headers(),
                    "body": json.dumps({"history": history, "total": total})}

        # ── POST scan_qr — администратор сканирует QR, получает данные клиента ──
        # Возвращает полные данные + готовые действия (оплата, скидка)
        if method == "POST" and action == "scan_qr":
            admin_id = get_admin_user(cur, token)
            if not admin_id:
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Только для администраторов"})}

            qr_token = body.get("qr_token", "")
            if not qr_token:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "QR-токен не передан"})}

            cur.execute(
                f"SELECT id, name, phone, club_level, bonus_points, club_card_number, car_model, created_at "
                f"FROM {SCHEMA}.users WHERE qr_token = %s AND is_active = true",
                (qr_token,)
            )
            u = cur.fetchone()
            if not u:
                return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Карта не найдена или недействительна"})}

            wallet_id, balance = ensure_wallet(cur, u[0])
            log_scan(cur, admin_id, u[0], "scan", None, f"Сканирование карты {u[5]}", "ok")
            db.commit()

            return {
                "statusCode": 200,
                "headers": cors_headers(),
                "body": json.dumps({
                    "id": u[0], "name": u[1], "phone": u[2],
                    "club_level": u[3], "club_level_label": LEVEL_LABELS.get(u[3], u[3]),
                    "bonus_points": u[4], "club_card_number": u[5],
                    "car_model": u[6], "member_since": str(u[7])[:10],
                    "wallet_balance": balance,
                    "discount_percent": LEVEL_DISCOUNT.get(u[3], 0)
                })
            }

        # ── POST wallet_pay — оплата с кошелька клиента по QR (только admin) ──
        if method == "POST" and action == "wallet_pay":
            admin_id = get_admin_user(cur, token)
            if not admin_id:
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Только для администраторов"})}

            qr_token    = body.get("qr_token", "")
            amount      = float(body.get("amount", 0))
            description = body.get("description", "Оплата в DD MAXI")

            if not qr_token or amount <= 0:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Укажите qr_token и сумму"})}

            cur.execute(
                f"SELECT id, name, bonus_points, club_level FROM {SCHEMA}.users WHERE qr_token = %s AND is_active = true",
                (qr_token,)
            )
            u = cur.fetchone()
            if not u:
                return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Карта не найдена"})}

            user_id, user_name = u[0], u[1]
            wallet_id, balance = ensure_wallet(cur, user_id)

            if balance < amount:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({
                    "error": f"Недостаточно средств. Баланс: {balance:,.0f} ₽, требуется: {amount:,.0f} ₽"
                })}

            new_balance = balance - amount
            cur.execute(f"UPDATE {SCHEMA}.wallets SET balance=%s, updated_at=NOW() WHERE id=%s", (new_balance, wallet_id))
            cur.execute(
                f"INSERT INTO {SCHEMA}.wallet_transactions "
                f"(wallet_id, user_id, type, amount, balance_after, description) VALUES (%s,%s,'spend',%s,%s,%s)",
                (wallet_id, user_id, amount, new_balance, description)
            )
            cur.execute(
                f"INSERT INTO {SCHEMA}.notifications (user_id, title, body, type) VALUES (%s,%s,%s,'info')",
                (user_id, "Оплата с кошелька",
                 f"С вашего кошелька списано {amount:,.0f} ₽. Остаток: {new_balance:,.0f} ₽. {description}")
            )
            log_scan(cur, admin_id, user_id, "wallet_pay", amount, description,
                     f"Оплачено {amount:,.0f} ₽, остаток {new_balance:,.0f} ₽")
            db.commit()

            return {
                "statusCode": 200,
                "headers": cors_headers(),
                "body": json.dumps({
                    "ok": True, "paid": amount,
                    "new_balance": new_balance, "user_name": user_name
                })
            }

        # ── POST apply_discount — применить клубную скидку (только admin) ──
        # Возвращает сумму к оплате с учётом скидки, ничего не списывает
        if method == "POST" and action == "apply_discount":
            admin_id = get_admin_user(cur, token)
            if not admin_id:
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Только для администраторов"})}

            qr_token = body.get("qr_token", "")
            amount   = float(body.get("amount", 0))

            if not qr_token or amount <= 0:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Укажите qr_token и сумму"})}

            cur.execute(
                f"SELECT id, name, club_level, bonus_points FROM {SCHEMA}.users "
                f"WHERE qr_token = %s AND is_active = true",
                (qr_token,)
            )
            u = cur.fetchone()
            if not u:
                return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Карта не найдена"})}

            discount_pct  = LEVEL_DISCOUNT.get(u[2], 0)
            discount_amt  = round(amount * discount_pct / 100, 2)
            final_amount  = round(amount - discount_amt, 2)
            bonus_earned  = int(final_amount * 0.01)   # 1% бонусов от итоговой суммы

            return {
                "statusCode": 200,
                "headers": cors_headers(),
                "body": json.dumps({
                    "user_id": u[0], "user_name": u[1],
                    "club_level": u[2], "club_level_label": LEVEL_LABELS.get(u[2]),
                    "discount_percent": discount_pct, "discount_amount": discount_amt,
                    "original_amount": amount, "final_amount": final_amount,
                    "bonus_earned": bonus_earned, "current_bonus": u[3]
                })
            }

        # ── POST confirm_visit — подтвердить визит и начислить бонусы (только admin) ──
        if method == "POST" and action == "confirm_visit":
            admin_id = get_admin_user(cur, token)
            if not admin_id:
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Только для администраторов"})}

            qr_token    = body.get("qr_token", "")
            amount      = float(body.get("amount", 0))
            service     = body.get("service", "Услуга автосервиса")
            pay_method  = body.get("pay_method", "cash")  # cash | wallet

            if not qr_token or amount <= 0:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Укажите qr_token и сумму"})}

            cur.execute(
                f"SELECT id, name, club_level, bonus_points FROM {SCHEMA}.users "
                f"WHERE qr_token = %s AND is_active = true",
                (qr_token,)
            )
            u = cur.fetchone()
            if not u:
                return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Карта не найдена"})}

            user_id, user_name = u[0], u[1]
            discount_pct  = LEVEL_DISCOUNT.get(u[2], 0)
            discount_amt  = round(amount * discount_pct / 100, 2)
            final_amount  = round(amount - discount_amt, 2)
            bonus_earned  = int(final_amount * 0.01)

            # Если оплата с кошелька — списываем
            new_balance = None
            if pay_method == "wallet":
                wallet_id, balance = ensure_wallet(cur, user_id)
                if balance < final_amount:
                    return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({
                        "error": f"Недостаточно средств в кошельке. Баланс: {balance:,.0f} ₽"
                    })}
                new_balance = balance - final_amount
                cur.execute(f"UPDATE {SCHEMA}.wallets SET balance=%s, updated_at=NOW() WHERE id=%s", (new_balance, wallet_id))
                cur.execute(
                    f"INSERT INTO {SCHEMA}.wallet_transactions "
                    f"(wallet_id, user_id, type, amount, balance_after, description) VALUES (%s,%s,'service_wallet',%s,%s,%s)",
                    (wallet_id, user_id, final_amount, new_balance, f"Оплата услуги: {service}")
                )

            # Начисляем бонусы
            new_bonus = u[3] + bonus_earned
            cur.execute(f"UPDATE {SCHEMA}.users SET bonus_points=%s WHERE id=%s", (new_bonus, user_id))

            # Обновляем клубный уровень
            new_level = u[2]
            if new_bonus >= 5000:
                new_level = "gold"
            elif new_bonus >= 2000:
                new_level = "silver"
            if new_level != u[2]:
                cur.execute(f"UPDATE {SCHEMA}.users SET club_level=%s WHERE id=%s", (new_level, user_id))

            # Создаём визит
            visit_number = f"V-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            cur.execute(
                f"INSERT INTO {SCHEMA}.visits (user_id, visit_number, service, cost, bonus_earned, status, visit_date) "
                f"VALUES (%s,%s,%s,%s,%s,'completed',NOW()) RETURNING id",
                (user_id, visit_number, service, final_amount, bonus_earned)
            )

            # Уведомление пользователю
            pay_label = "кошельком" if pay_method == "wallet" else "наличными/картой"
            notif_body = (
                f"Визит #{visit_number} — {service}. "
                f"Сумма: {final_amount:,.0f} ₽ (скидка {discount_pct}%). "
                f"Оплачено {pay_label}. "
                f"Начислено бонусов: {bonus_earned}."
            )
            if new_balance is not None:
                notif_body += f" Остаток кошелька: {new_balance:,.0f} ₽."
            cur.execute(
                f"INSERT INTO {SCHEMA}.notifications (user_id, title, body, type) VALUES (%s,%s,%s,'success')",
                (user_id, "Визит подтверждён", notif_body)
            )
            log_scan(cur, admin_id, user_id, "confirm_visit", final_amount,
                     f"{service} (скидка {discount_pct}%, оплата: {pay_label})",
                     f"Визит #{visit_number}, бонусов начислено: {bonus_earned}")
            db.commit()

            return {
                "statusCode": 200,
                "headers": cors_headers(),
                "body": json.dumps({
                    "ok": True, "visit_number": visit_number,
                    "user_name": user_name, "service": service,
                    "original_amount": amount, "discount_amount": discount_amt,
                    "final_amount": final_amount, "pay_method": pay_method,
                    "bonus_earned": bonus_earned, "new_bonus_total": new_bonus,
                    "new_wallet_balance": new_balance
                })
            }

        # ── GET users — список пользователей с картами (только admin) ──
        if method == "GET" and action == "users":
            admin_id = get_admin_user(cur, token)
            if not admin_id:
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Доступ запрещён"})}

            search = params.get("search", "")
            limit  = int(params.get("limit", 50))
            offset = int(params.get("offset", 0))

            where = "WHERE u.role = 'user' AND u.is_active = true"
            vals  = []
            if search:
                where += " AND (u.name ILIKE %s OR u.phone ILIKE %s OR u.club_card_number ILIKE %s)"
                vals  += [f"%{search}%", f"%{search}%", f"%{search}%"]

            cur.execute(
                f"SELECT u.id, u.name, u.phone, u.email, u.club_level, u.bonus_points, "
                f"u.club_card_number, u.qr_token, u.car_model, u.created_at "
                f"FROM {SCHEMA}.users u {where} "
                f"ORDER BY u.created_at DESC LIMIT %s OFFSET %s",
                vals + [limit, offset]
            )
            rows = cur.fetchall()

            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users u {where}", vals)
            total = cur.fetchone()[0]

            users = []
            for r in rows:
                users.append({
                    "id": r[0], "name": r[1], "phone": r[2], "email": r[3],
                    "club_level": r[4], "bonus_points": r[5],
                    "club_card_number": r[6], "qr_token": r[7],
                    "car_model": r[8], "created_at": str(r[9])
                })

            return {"statusCode": 200, "headers": cors_headers(),
                    "body": json.dumps({"users": users, "total": total})}

        # ── POST assign_all — присвоить карты всем без карты (только admin) ──
        if method == "POST" and action == "assign_all":
            admin_id = get_admin_user(cur, token)
            if not admin_id:
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Доступ запрещён"})}

            cur.execute(
                f"SELECT id, phone, created_at FROM {SCHEMA}.users "
                f"WHERE club_card_number IS NULL OR qr_token IS NULL"
            )
            rows  = cur.fetchall()
            count = 0
            for r in rows:
                uid, phone, created_at = r
                card_num = f"DD-{uid:06d}"
                qr_tok   = hashlib.sha256(f"{uid}{phone}{created_at}".encode()).hexdigest()
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET club_card_number=%s, qr_token=%s WHERE id=%s",
                    (card_num, qr_tok, uid)
                )
                count += 1
            db.commit()

            return {"statusCode": 200, "headers": cors_headers(),
                    "body": json.dumps({"ok": True, "assigned": count})}

        return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        db.close()