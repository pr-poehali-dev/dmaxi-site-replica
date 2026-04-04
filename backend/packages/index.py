import json
import os
import psycopg2

SCHEMA = "t_p90995829_dmaxi_site_replica"

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
        "Content-Type": "application/json",
    }

def ok(data):
    return {"statusCode": 200, "headers": cors(), "body": json.dumps(data, ensure_ascii=False)}

def err(msg, code=400):
    return {"statusCode": code, "headers": cors(), "body": json.dumps({"error": msg}, ensure_ascii=False)}

def get_user(cur, token):
    if not token:
        return None
    cur.execute(
        f"SELECT u.id, u.role FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    return {"id": row[0], "role": row[1]} if row else None

def row_to_dict(row):
    return {
        "id":          row[0],
        "title":       row[1],
        "description": row[2],
        "items":       row[3].split("\n") if row[3] else [],
        "price":       row[4],
        "duration":    row[5],
        "category":    row[6],
        "is_active":   row[7],
        "sort_order":  row[8],
    }

def handler(event: dict, context) -> dict:
    """Управление комплексами услуг: получение, создание, обновление, удаление."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    token  = (event.get("headers") or {}).get("X-Auth-Token", "")
    action = params.get("action", "list")

    conn = get_db()
    cur  = conn.cursor()

    try:
        # GET /packages?action=list  — список активных (публичный)
        if method == "GET" and action == "list":
            category = params.get("category", "")
            if category:
                cur.execute(
                    f"SELECT id,title,description,items,price,duration,category,is_active,sort_order FROM {SCHEMA}.service_packages WHERE is_active=true AND category=%s ORDER BY sort_order,id",
                    (category,)
                )
            else:
                cur.execute(
                    f"SELECT id,title,description,items,price,duration,category,is_active,sort_order FROM {SCHEMA}.service_packages WHERE is_active=true ORDER BY sort_order,id"
                )
            rows = cur.fetchall()
            return ok({"packages": [row_to_dict(r) for r in rows]})

        # GET /packages?action=all  — все (только для admin)
        if method == "GET" and action == "all":
            user = get_user(cur, token)
            if not user or user["role"] != "admin":
                return err("Forbidden", 403)
            cur.execute(
                f"SELECT id,title,description,items,price,duration,category,is_active,sort_order FROM {SCHEMA}.service_packages ORDER BY sort_order,id"
            )
            rows = cur.fetchall()
            return ok({"packages": [row_to_dict(r) for r in rows]})

        # POST /packages?action=create  — создать (admin)
        if method == "POST" and action == "create":
            user = get_user(cur, token)
            if not user or user["role"] != "admin":
                return err("Forbidden", 403)
            body = json.loads(event.get("body") or "{}")
            title       = (body.get("title") or "").strip()
            description = (body.get("description") or "").strip()
            items_list  = body.get("items") or []
            items_str   = "\n".join(items_list) if isinstance(items_list, list) else str(items_list)
            price       = int(body.get("price") or 0)
            duration    = (body.get("duration") or "").strip()
            category    = (body.get("category") or "").strip()
            sort_order  = int(body.get("sort_order") or 0)
            is_active   = bool(body.get("is_active", True))
            if not title:
                return err("title обязателен")
            cur.execute(
                f"INSERT INTO {SCHEMA}.service_packages (title,description,items,price,duration,category,sort_order,is_active) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                (title, description, items_str, price, duration, category, sort_order, is_active)
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            return ok({"id": new_id, "message": "Комплекс создан"})

        # PUT /packages?action=update&id=X  — обновить (admin)
        if method == "PUT" and action == "update":
            user = get_user(cur, token)
            if not user or user["role"] != "admin":
                return err("Forbidden", 403)
            pkg_id = int(params.get("id") or 0)
            if not pkg_id:
                return err("id обязателен")
            body = json.loads(event.get("body") or "{}")
            fields = []
            values = []
            if "title"       in body: fields.append("title=%s");       values.append(body["title"])
            if "description" in body: fields.append("description=%s"); values.append(body["description"])
            if "items"       in body:
                items_list = body["items"]
                items_str  = "\n".join(items_list) if isinstance(items_list, list) else str(items_list)
                fields.append("items=%s"); values.append(items_str)
            if "price"       in body: fields.append("price=%s");       values.append(int(body["price"]))
            if "duration"    in body: fields.append("duration=%s");    values.append(body["duration"])
            if "category"    in body: fields.append("category=%s");    values.append(body["category"])
            if "sort_order"  in body: fields.append("sort_order=%s");  values.append(int(body["sort_order"]))
            if "is_active"   in body: fields.append("is_active=%s");   values.append(bool(body["is_active"]))
            if not fields:
                return err("Нет полей для обновления")
            values.append(pkg_id)
            cur.execute(f"UPDATE {SCHEMA}.service_packages SET {', '.join(fields)} WHERE id=%s", values)
            conn.commit()
            return ok({"message": "Обновлено"})

        # DELETE /packages?action=delete&id=X  — удалить (admin)
        if method == "DELETE" and action == "delete":
            user = get_user(cur, token)
            if not user or user["role"] != "admin":
                return err("Forbidden", 403)
            pkg_id = int(params.get("id") or 0)
            if not pkg_id:
                return err("id обязателен")
            cur.execute(f"DELETE FROM {SCHEMA}.service_packages WHERE id=%s", (pkg_id,))
            conn.commit()
            return ok({"message": "Удалено"})

        return err("Неизвестное действие")

    finally:
        cur.close()
        conn.close()
