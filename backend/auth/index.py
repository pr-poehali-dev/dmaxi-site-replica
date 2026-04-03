import json
import os
import hashlib
import secrets
import psycopg2
from datetime import datetime, timedelta

SCHEMA = "t_p90995829_dmaxi_site_replica"
STS_EDIT_LIMIT = 2

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def hash_password(password: str) -> str:
    salt = os.environ.get("SECRET_KEY", "ddmaxi_salt_2024")
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

def create_token() -> str:
    return secrets.token_hex(32)

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
        "Content-Type": "application/json",
    }

def get_user_id_from_token(cur, token):
    if not token:
        return None
    cur.execute(f"SELECT user_id FROM {SCHEMA}.sessions WHERE token = %s AND expires_at > NOW()", (token,))
    row = cur.fetchone()
    return row[0] if row else None

def push_notification(cur, user_id, title, body, ntype="info"):
    cur.execute(
        f"INSERT INTO {SCHEMA}.notifications (user_id, title, body, type) VALUES (%s, %s, %s, %s)",
        (user_id, title, body, ntype)
    )

def handler(event: dict, context) -> dict:
    """Auth: register, login, logout, profile, notifications"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    db = get_db()
    cur = db.cursor()

    try:
        # POST register
        if method == "POST" and ("/register" in path or action == "register"):
            name = body.get("name", "").strip()
            phone = body.get("phone", "").strip()
            email = body.get("email", "").strip()
            password = body.get("password", "")
            car_model = body.get("car_model", "").strip()
            full_name_sts = body.get("full_name_sts", "").strip()
            car_plate = body.get("car_plate", "").strip()
            car_year = body.get("car_year", "").strip()
            car_vin = body.get("car_vin", "").strip()
            car_sts = body.get("car_sts", "").strip()

            if not name or not phone or not password:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Имя, телефон и пароль обязательны"})}
            if len(password) < 6:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Пароль минимум 6 символов"})}

            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE phone = %s", (phone,))
            if cur.fetchone():
                return {"statusCode": 409, "headers": cors_headers(), "body": json.dumps({"error": "Пользователь с таким номером уже существует"})}

            pwd_hash = hash_password(password)
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (name, phone, email, password_hash, car_model, car_year, car_vin, full_name_sts, car_plate, car_sts, role) "
                f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'user') RETURNING id, name, phone, role, bonus_points, club_level",
                (name, phone, email or None, pwd_hash, car_model, car_year, car_vin, full_name_sts, car_plate, car_sts)
            )
            user_row = cur.fetchone()
            user_id = user_row[0]

            # Приветственное уведомление
            push_notification(cur, user_id,
                "Добро пожаловать в DD MAXI!",
                f"Здравствуйте, {name}! Ваша клубная карта успешно создана. Скидки и бонусы активны с первого посещения.",
                "welcome"
            )

            token_val = create_token()
            expires = datetime.now() + timedelta(days=30)
            cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token, expires_at) VALUES (%s, %s, %s)", (user_id, token_val, expires))
            cur.execute(f"UPDATE {SCHEMA}.users SET last_login = NOW() WHERE id = %s", (user_id,))
            db.commit()

            return {
                "statusCode": 200,
                "headers": cors_headers(),
                "body": json.dumps({
                    "token": token_val,
                    "user": {"id": user_row[0], "name": user_row[1], "phone": user_row[2], "role": user_row[3], "bonus_points": user_row[4], "club_level": user_row[5]}
                })
            }

        # POST login
        if method == "POST" and ("/login" in path or action == "login"):
            phone = body.get("phone", "").strip()
            password = body.get("password", "")
            if not phone or not password:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Телефон и пароль обязательны"})}

            pwd_hash = hash_password(password)
            cur.execute(
                f"SELECT id, name, phone, role, bonus_points, club_level, car_model, car_year, car_vin, email, is_active FROM {SCHEMA}.users WHERE phone = %s AND password_hash = %s",
                (phone, pwd_hash)
            )
            u = cur.fetchone()
            if not u:
                return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Неверный номер телефона или пароль"})}
            if not u[10]:
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Аккаунт заблокирован"})}

            token_val = create_token()
            expires = datetime.now() + timedelta(days=30)
            cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token, expires_at) VALUES (%s, %s, %s)", (u[0], token_val, expires))
            cur.execute(f"UPDATE {SCHEMA}.users SET last_login = NOW() WHERE id = %s", (u[0],))
            db.commit()

            return {
                "statusCode": 200,
                "headers": cors_headers(),
                "body": json.dumps({
                    "token": token_val,
                    "user": {
                        "id": u[0], "name": u[1], "phone": u[2], "role": u[3],
                        "bonus_points": u[4], "club_level": u[5], "car_model": u[6],
                        "car_year": u[7], "car_vin": u[8], "email": u[9]
                    }
                })
            }

        # POST logout
        if method == "POST" and ("/logout" in path or action == "logout"):
            if token:
                cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE token = %s", (token,))
                db.commit()
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True})}

        # GET profile
        if method == "GET" and ("/profile" in path or action == "profile"):
            if not token:
                return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Не авторизован"})}
            user_id = get_user_id_from_token(cur, token)
            if not user_id:
                return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Сессия истекла"})}

            cur.execute(
                f"SELECT id, name, phone, role, bonus_points, club_level, car_model, car_year, car_vin, email, is_active, created_at, full_name_sts, car_plate, car_sts, sts_edit_count FROM {SCHEMA}.users WHERE id = %s",
                (user_id,)
            )
            u = cur.fetchone()
            if not u:
                return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Пользователь не найден"})}

            return {
                "statusCode": 200,
                "headers": cors_headers(),
                "body": json.dumps({
                    "id": u[0], "name": u[1], "phone": u[2], "role": u[3],
                    "bonus_points": u[4], "club_level": u[5], "car_model": u[6],
                    "car_year": u[7], "car_vin": u[8], "email": u[9],
                    "is_active": u[10], "created_at": str(u[11]),
                    "full_name_sts": u[12], "car_plate": u[13], "car_sts": u[14],
                    "sts_edit_count": u[15], "sts_edit_limit": STS_EDIT_LIMIT
                })
            }

        # PUT profile
        if method == "PUT" and ("/profile" in path or action == "profile"):
            if not token:
                return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Не авторизован"})}
            user_id = get_user_id_from_token(cur, token)
            if not user_id:
                return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Сессия истекла"})}

            # Получаем текущие данные пользователя
            cur.execute(f"SELECT sts_edit_count FROM {SCHEMA}.users WHERE id = %s", (user_id,))
            cur_data = cur.fetchone()
            current_sts_count = cur_data[0] if cur_data else 0

            updates = []
            vals = []

            # Обычные поля — без лимита
            for field in ["name", "email", "new_password"]:
                pass
            if body.get("name"):
                updates.append("name = %s"); vals.append(body["name"])
            if body.get("email") is not None:
                updates.append("email = %s"); vals.append(body["email"] or None)
            if body.get("new_password") and len(body["new_password"]) >= 6:
                updates.append("password_hash = %s"); vals.append(hash_password(body["new_password"]))

            # Поля автомобиля без лимита
            for field in ["car_model", "car_year", "car_vin"]:
                if body.get(field) is not None:
                    updates.append(f"{field} = %s"); vals.append(body[field] or None)

            # Поля СТС — с лимитом
            sts_fields = ["full_name_sts", "car_plate", "car_sts"]
            wants_sts_change = any(body.get(f) is not None for f in sts_fields)

            if wants_sts_change:
                if current_sts_count >= STS_EDIT_LIMIT:
                    return {
                        "statusCode": 403,
                        "headers": cors_headers(),
                        "body": json.dumps({
                            "error": f"Данные по СТС можно изменить максимум {STS_EDIT_LIMIT} раза. Для дальнейших изменений обратитесь в поддержку.",
                            "sts_limit_reached": True
                        })
                    }
                for field in sts_fields:
                    if body.get(field) is not None:
                        updates.append(f"{field} = %s"); vals.append(body[field] or None)
                updates.append("sts_edit_count = sts_edit_count + 1")

            if updates:
                vals.append(user_id)
                cur.execute(f"UPDATE {SCHEMA}.users SET {', '.join(updates)} WHERE id = %s", vals)
                db.commit()

            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True})}

        # GET notifications
        if method == "GET" and action == "notifications":
            if not token:
                return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Не авторизован"})}
            user_id = get_user_id_from_token(cur, token)
            if not user_id:
                return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Сессия истекла"})}

            cur.execute(
                f"SELECT id, title, body, type, is_read, created_at FROM {SCHEMA}.notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 50",
                (user_id,)
            )
            rows = cur.fetchall()
            notes = [{"id": r[0], "title": r[1], "body": r[2], "type": r[3], "is_read": r[4], "created_at": str(r[5])} for r in rows]
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.notifications WHERE user_id = %s AND is_read = false", (user_id,))
            unread = cur.fetchone()[0]

            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"notifications": notes, "unread": unread})}

        # PUT notifications/read
        if method == "PUT" and action == "notifications_read":
            if not token:
                return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Не авторизован"})}
            user_id = get_user_id_from_token(cur, token)
            if not user_id:
                return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Сессия истекла"})}

            note_id = body.get("id")
            if note_id:
                cur.execute(f"UPDATE {SCHEMA}.notifications SET is_read = true WHERE id = %s AND user_id = %s", (note_id, user_id))
            else:
                cur.execute(f"UPDATE {SCHEMA}.notifications SET is_read = true WHERE user_id = %s", (user_id,))
            db.commit()
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True})}

        return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        db.close()
