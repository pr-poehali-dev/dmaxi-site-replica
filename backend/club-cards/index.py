import json
import os
import hashlib
import psycopg2

SCHEMA = "t_p90995829_dmaxi_site_replica"

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

def handler(event: dict, context) -> dict:
    """Клубные карты: список пользователей с QR, присвоение карт, данные карты по токену"""
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
        # GET ?action=card_info&token=... — публичный эндпоинт для QR-кода
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

            level_labels = {"bronze": "Бронза", "silver": "Серебро", "gold": "Золото", "platinum": "Платинум"}
            return {
                "statusCode": 200,
                "headers": cors_headers(),
                "body": json.dumps({
                    "id": u[0], "name": u[1], "phone": u[2],
                    "club_level": u[3], "club_level_label": level_labels.get(u[3], u[3]),
                    "bonus_points": u[4], "club_card_number": u[5],
                    "car_model": u[6], "member_since": str(u[7])[:10]
                })
            }

        # GET ?action=users — список пользователей с данными карт (только admin)
        if method == "GET" and action == "users":
            admin_id = get_admin_user(cur, token)
            if not admin_id:
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Доступ запрещён"})}

            search = params.get("search", "")
            limit  = int(params.get("limit", 50))
            offset = int(params.get("offset", 0))

            where = f"WHERE u.role = 'user' AND u.is_active = true"
            vals  = []
            if search:
                where += " AND (u.name ILIKE %s OR u.phone ILIKE %s OR u.club_card_number ILIKE %s)"
                vals += [f"%{search}%", f"%{search}%", f"%{search}%"]

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

            return {
                "statusCode": 200,
                "headers": cors_headers(),
                "body": json.dumps({"users": users, "total": total})
            }

        # POST ?action=assign_all — присвоить карты всем без карты (только admin)
        if method == "POST" and action == "assign_all":
            admin_id = get_admin_user(cur, token)
            if not admin_id:
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Доступ запрещён"})}

            cur.execute(
                f"SELECT id, phone, created_at FROM {SCHEMA}.users "
                f"WHERE club_card_number IS NULL OR qr_token IS NULL"
            )
            rows = cur.fetchall()
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

            return {
                "statusCode": 200,
                "headers": cors_headers(),
                "body": json.dumps({"ok": True, "assigned": count})
            }

        return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        db.close()
