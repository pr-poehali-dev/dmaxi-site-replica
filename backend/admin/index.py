import json
import os
import hashlib
import psycopg2
from datetime import datetime

def hash_password(password: str) -> str:
    salt = os.environ.get("SECRET_KEY", "ddmaxi_salt_2024")
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

SCHEMA = "t_p90995829_dmaxi_site_replica"

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
        "Content-Type": "application/json",
    }

def check_admin(cur, token):
    if not token:
        return None
    cur.execute(f"SELECT u.id, u.role FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id WHERE s.token = %s AND s.expires_at > NOW() AND u.role = 'admin'", (token,))
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    """Admin panel: manage users, visits, stats"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])
    params = event.get("queryStringParameters") or {}

    db = get_db()
    cur = db.cursor()

    try:
        admin = check_admin(cur, token)
        if not admin:
            return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Доступ запрещён. Только для администраторов"})}

        action = params.get("action", "")

        # GET /stats
        if method == "GET" and ("/stats" in path or action == "stats"):
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users WHERE role = 'user'")
            total_users = cur.fetchone()[0]
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users WHERE role = 'user' AND created_at > NOW() - INTERVAL '30 days'")
            new_users = cur.fetchone()[0]
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.visits")
            total_visits = cur.fetchone()[0]
            cur.execute(f"SELECT COALESCE(SUM(cost), 0) FROM {SCHEMA}.visits WHERE visit_date >= DATE_TRUNC('month', CURRENT_DATE)")
            month_revenue = float(cur.fetchone()[0])
            cur.execute(f"SELECT COALESCE(SUM(bonus_points), 0) FROM {SCHEMA}.users WHERE role = 'user'")
            total_bonus = cur.fetchone()[0]
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users WHERE is_active = false")
            blocked = cur.fetchone()[0]

            return {
                "statusCode": 200,
                "headers": cors_headers(),
                "body": json.dumps({
                    "total_users": total_users,
                    "new_users_month": new_users,
                    "total_visits": total_visits,
                    "month_revenue": month_revenue,
                    "total_bonus_issued": total_bonus,
                    "blocked_users": blocked
                })
            }

        # GET /users
        if method == "GET" and ("/users" in path and "/visits" not in path or action == "users"):
            search = params.get("search", "")
            role_filter = params.get("role", "")
            limit = int(params.get("limit", 50))
            offset = int(params.get("offset", 0))

            query = f"SELECT id, name, phone, email, role, car_model, bonus_points, club_level, is_active, created_at, last_login FROM {SCHEMA}.users WHERE 1=1"
            vals = []
            if search:
                query += " AND (name ILIKE %s OR phone ILIKE %s)"
                vals += [f"%{search}%", f"%{search}%"]
            if role_filter:
                query += " AND role = %s"
                vals.append(role_filter)
            query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
            vals += [limit, offset]

            cur.execute(query, vals)
            rows = cur.fetchall()
            users = []
            for r in rows:
                users.append({
                    "id": r[0], "name": r[1], "phone": r[2], "email": r[3],
                    "role": r[4], "car_model": r[5], "bonus_points": r[6],
                    "club_level": r[7], "is_active": r[8],
                    "created_at": str(r[9]), "last_login": str(r[10]) if r[10] else None
                })

            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users WHERE 1=1" + (" AND (name ILIKE %s OR phone ILIKE %s)" if search else ""), [f"%{search}%", f"%{search}%"] if search else [])
            total = cur.fetchone()[0]

            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"users": users, "total": total})}

        # PUT /users/{id}
        if method == "PUT" and ("/users/" in path or action == "user"):
            user_id = int(params.get("id", 0)) or int(path.strip("/").split("/")[-1] if "/users/" in path else 0)

            updates = []
            vals = []
            for field in ["name", "phone", "email", "car_model", "car_year", "car_vin", "role", "club_level"]:
                if field in body:
                    updates.append(f"{field} = %s")
                    vals.append(body[field])
            if "bonus_points" in body:
                updates.append("bonus_points = %s")
                vals.append(int(body["bonus_points"]))
            if "is_active" in body:
                updates.append("is_active = %s")
                vals.append(bool(body["is_active"]))

            if updates:
                vals.append(user_id)
                cur.execute(f"UPDATE {SCHEMA}.users SET {', '.join(updates)} WHERE id = %s", vals)
                db.commit()

            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True})}

        # GET /users/{id}/visits
        if method == "GET" and "/users/" in path and "/visits" in path:
            parts = path.strip("/").split("/")
            user_id = int(parts[-2])
            cur.execute(
                f"SELECT id, visit_number, service, car, cost, bonus_earned, status, visit_date, notes FROM {SCHEMA}.visits WHERE user_id = %s ORDER BY visit_date DESC",
                (user_id,)
            )
            rows = cur.fetchall()
            visits = [{"id": r[0], "visit_number": r[1], "service": r[2], "car": r[3], "cost": float(r[4]), "bonus_earned": r[5], "status": r[6], "visit_date": str(r[7]), "notes": r[8]} for r in rows]
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"visits": visits})}

        # GET /visits
        if method == "GET" and (path.endswith("/visits") or action == "visits"):
            limit = int(params.get("limit", 50))
            offset = int(params.get("offset", 0))
            status_filter = params.get("status", "")

            query = f"SELECT v.id, v.visit_number, v.service, v.car, v.cost, v.bonus_earned, v.status, v.visit_date, u.name, u.phone FROM {SCHEMA}.visits v JOIN {SCHEMA}.users u ON u.id = v.user_id WHERE 1=1"
            vals = []
            if status_filter:
                query += " AND v.status = %s"
                vals.append(status_filter)
            query += " ORDER BY v.visit_date DESC LIMIT %s OFFSET %s"
            vals += [limit, offset]

            cur.execute(query, vals)
            rows = cur.fetchall()
            visits = [{"id": r[0], "visit_number": r[1], "service": r[2], "car": r[3], "cost": float(r[4]), "bonus_earned": r[5], "status": r[6], "visit_date": str(r[7]), "user_name": r[8], "user_phone": r[9]} for r in rows]

            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"visits": visits})}

        # POST /visits
        if method == "POST" and ("/visits" in path or action == "visits"):
            user_id = body.get("user_id")
            service = body.get("service", "").strip()
            cost = float(body.get("cost", 0))
            car = body.get("car", "")
            status = body.get("status", "completed")
            notes = body.get("notes", "")
            visit_date = body.get("visit_date", str(datetime.now().date()))

            if not user_id or not service:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "user_id и service обязательны"})}

            bonus = int(cost * 0.01)
            visit_num = f"V-{datetime.now().strftime('%Y%m%d%H%M%S')}"

            cur.execute(
                f"INSERT INTO {SCHEMA}.visits (user_id, visit_number, service, car, cost, bonus_earned, status, notes, visit_date) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (user_id, visit_num, service, car, cost, bonus, status, notes, visit_date)
            )
            visit_id = cur.fetchone()[0]

            if status == "completed":
                cur.execute(f"UPDATE {SCHEMA}.users SET bonus_points = bonus_points + %s WHERE id = %s", (bonus, user_id))

            db.commit()
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True, "id": visit_id, "visit_number": visit_num})}

        # PUT /visits/{id}
        if method == "PUT" and "/visits/" in path:
            parts = path.strip("/").split("/")
            visit_id = int(parts[-1])
            updates = []
            vals = []
            for field in ["service", "car", "status", "notes"]:
                if field in body:
                    updates.append(f"{field} = %s")
                    vals.append(body[field])
            if "cost" in body:
                updates.append("cost = %s")
                vals.append(float(body["cost"]))
            if updates:
                vals.append(visit_id)
                cur.execute(f"UPDATE {SCHEMA}.visits SET {', '.join(updates)} WHERE id = %s", vals)
                db.commit()
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True})}

        # POST create_user — регистрация нового пользователя от имени администратора
        if method == "POST" and action == "create_user":
            name          = body.get("name", "").strip()
            phone         = body.get("phone", "").strip()
            email         = body.get("email", "").strip()
            password      = body.get("password", "").strip()
            car_model     = body.get("car_model", "").strip()
            car_year      = body.get("car_year", "").strip()
            car_vin       = body.get("car_vin", "").strip()
            full_name_sts = body.get("full_name_sts", "").strip()
            car_plate     = body.get("car_plate", "").strip()
            car_sts       = body.get("car_sts", "").strip()
            role          = body.get("role", "user")
            club_level    = body.get("club_level", "bronze")
            bonus_points  = int(body.get("bonus_points", 0))
            send_welcome  = body.get("send_welcome", True)

            if not name or not phone:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Имя и телефон обязательны"})}

            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE phone = %s", (phone,))
            if cur.fetchone():
                return {"statusCode": 409, "headers": cors_headers(), "body": json.dumps({"error": "Пользователь с таким номером уже существует"})}

            if not password:
                # Генерируем временный пароль из последних 4 цифр телефона
                password = phone[-4:] + "ddm"
            pwd_hash = hash_password(password)

            cur.execute(
                f"INSERT INTO {SCHEMA}.users (name, phone, email, password_hash, car_model, car_year, car_vin, full_name_sts, car_plate, car_sts, role, club_level, bonus_points) "
                f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (name, phone, email or None, pwd_hash, car_model or None, car_year or None, car_vin or None,
                 full_name_sts or None, car_plate or None, car_sts or None, role, club_level, bonus_points)
            )
            new_id = cur.fetchone()[0]

            # Уведомление в кабинет
            cur.execute(
                f"INSERT INTO {SCHEMA}.notifications (user_id, title, body, type) VALUES (%s, %s, %s, 'welcome')",
                (new_id, "Добро пожаловать в DD MAXI!", f"Здравствуйте, {name}! Ваша учётная запись создана администратором. Скидки и бонусы активны с первого посещения.")
            )
            db.commit()

            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({
                "ok": True, "id": new_id,
                "temp_password": password,
                "message": f"Пользователь {name} создан с ID {new_id}"
            })}

        # GET user_detail — полная карточка пользователя для администратора
        if method == "GET" and action == "user_detail":
            user_id = int(params.get("id", 0))
            if not user_id:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Укажите id"})}
            cur.execute(
                f"SELECT id, name, phone, email, role, car_model, car_year, car_vin, bonus_points, club_level, "
                f"is_active, created_at, last_login, full_name_sts, car_plate, car_sts, sts_edit_count "
                f"FROM {SCHEMA}.users WHERE id = %s",
                (user_id,)
            )
            u = cur.fetchone()
            if not u:
                return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Не найден"})}

            cur.execute(f"SELECT id, visit_number, service, car, cost, bonus_earned, status, visit_date FROM {SCHEMA}.visits WHERE user_id = %s ORDER BY visit_date DESC LIMIT 20", (user_id,))
            visits = [{"id": r[0], "visit_number": r[1], "service": r[2], "car": r[3], "cost": float(r[4]), "bonus_earned": r[5], "status": r[6], "visit_date": str(r[7])} for r in cur.fetchall()]

            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({
                "id": u[0], "name": u[1], "phone": u[2], "email": u[3], "role": u[4],
                "car_model": u[5], "car_year": u[6], "car_vin": u[7], "bonus_points": u[8],
                "club_level": u[9], "is_active": u[10], "created_at": str(u[11]),
                "last_login": str(u[12]) if u[12] else None,
                "full_name_sts": u[13], "car_plate": u[14], "car_sts": u[15], "sts_edit_count": u[16],
                "visits": visits
            })}

        # PUT user_full — полное редактирование пользователя (без ограничений СТС)
        if method == "PUT" and action == "user_full":
            user_id = int(params.get("id", 0))
            if not user_id:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Укажите id"})}

            allowed = ["name", "phone", "email", "car_model", "car_year", "car_vin",
                       "full_name_sts", "car_plate", "car_sts", "role", "club_level"]
            updates, vals = [], []
            for field in allowed:
                if field in body:
                    updates.append(f"{field} = %s")
                    vals.append(body[field] or None)
            if "bonus_points" in body:
                updates.append("bonus_points = %s"); vals.append(int(body["bonus_points"]))
            if "is_active" in body:
                updates.append("is_active = %s"); vals.append(bool(body["is_active"]))
            if "new_password" in body and body["new_password"]:
                updates.append("password_hash = %s"); vals.append(hash_password(body["new_password"]))
            if "sts_edit_count" in body:
                updates.append("sts_edit_count = %s"); vals.append(int(body["sts_edit_count"]))

            if updates:
                vals.append(user_id)
                cur.execute(f"UPDATE {SCHEMA}.users SET {', '.join(updates)} WHERE id = %s", vals)
                db.commit()

            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True})}

        return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        db.close()