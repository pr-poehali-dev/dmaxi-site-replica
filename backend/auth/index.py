import json
import os
import hashlib
import secrets
import psycopg2
from datetime import datetime, timedelta

SCHEMA = "t_p90995829_dmaxi_site_replica"

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

def handler(event: dict, context) -> dict:
    """Auth: register, login, logout, get/update profile"""
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
        # POST /register
        if method == "POST" and ("/register" in path or action == "register"):
            name = body.get("name", "").strip()
            phone = body.get("phone", "").strip()
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
                f"INSERT INTO {SCHEMA}.users (name, phone, password_hash, car_model, car_year, car_vin, full_name_sts, car_plate, car_sts, role) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'user') RETURNING id, name, phone, role, bonus_points, club_level",
                (name, phone, pwd_hash, car_model, car_year, car_vin, full_name_sts, car_plate, car_sts)
            )
            user = cur.fetchone()
            user_id = user[0]

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
                    "user": {"id": user[0], "name": user[1], "phone": user[2], "role": user[3], "bonus_points": user[4], "club_level": user[5]}
                })
            }

        # POST /login
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
            user = cur.fetchone()
            if not user:
                return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Неверный номер телефона или пароль"})}

            if not user[10]:
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Аккаунт заблокирован"})}

            token_val = create_token()
            expires = datetime.now() + timedelta(days=30)
            cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token, expires_at) VALUES (%s, %s, %s)", (user[0], token_val, expires))
            cur.execute(f"UPDATE {SCHEMA}.users SET last_login = NOW() WHERE id = %s", (user[0],))
            db.commit()

            return {
                "statusCode": 200,
                "headers": cors_headers(),
                "body": json.dumps({
                    "token": token_val,
                    "user": {
                        "id": user[0], "name": user[1], "phone": user[2], "role": user[3],
                        "bonus_points": user[4], "club_level": user[5], "car_model": user[6],
                        "car_year": user[7], "car_vin": user[8], "email": user[9]
                    }
                })
            }

        # POST /logout
        if method == "POST" and ("/logout" in path or action == "logout"):
            if token:
                cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE token = %s", (token,))
                db.commit()
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True})}

        # GET /profile
        if method == "GET" and ("/profile" in path or action == "profile"):
            if not token:
                return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Не авторизован"})}

            cur.execute(f"SELECT user_id FROM {SCHEMA}.sessions WHERE token = %s AND expires_at > NOW()", (token,))
            sess = cur.fetchone()
            if not sess:
                return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Сессия истекла"})}

            cur.execute(
                f"SELECT id, name, phone, role, bonus_points, club_level, car_model, car_year, car_vin, email, is_active, created_at FROM {SCHEMA}.users WHERE id = %s",
                (sess[0],)
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
                    "is_active": u[10], "created_at": str(u[11])
                })
            }

        # PUT /profile
        if method == "PUT" and ("/profile" in path or action == "profile"):
            if not token:
                return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Не авторизован"})}

            cur.execute(f"SELECT user_id FROM {SCHEMA}.sessions WHERE token = %s AND expires_at > NOW()", (token,))
            sess = cur.fetchone()
            if not sess:
                return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Сессия истекла"})}

            user_id = sess[0]
            name = body.get("name")
            email = body.get("email")
            car_model = body.get("car_model")
            car_year = body.get("car_year")
            car_vin = body.get("car_vin")
            new_password = body.get("new_password")

            updates = []
            vals = []
            if name:
                updates.append("name = %s"); vals.append(name)
            if email is not None:
                updates.append("email = %s"); vals.append(email)
            if car_model is not None:
                updates.append("car_model = %s"); vals.append(car_model)
            if car_year is not None:
                updates.append("car_year = %s"); vals.append(car_year)
            if car_vin is not None:
                updates.append("car_vin = %s"); vals.append(car_vin)
            if new_password and len(new_password) >= 6:
                updates.append("password_hash = %s"); vals.append(hash_password(new_password))

            if updates:
                vals.append(user_id)
                cur.execute(f"UPDATE {SCHEMA}.users SET {', '.join(updates)} WHERE id = %s", vals)
                db.commit()

            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True})}

        return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        db.close()