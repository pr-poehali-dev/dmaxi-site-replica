import json
import os
import psycopg2
from datetime import datetime

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

        return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        db.close()