import json
import os
import psycopg2  # noqa

SCHEMA = "t_p90995829_dmaxi_site_replica"

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
        "Content-Type": "application/json",
    }

def resp(status, data):
    return {"statusCode": status, "headers": cors_headers(), "body": json.dumps(data, ensure_ascii=False)}

def get_admin(cur, token):
    if not token:
        return None
    cur.execute(
        f"SELECT u.id FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token = %s AND s.expires_at > NOW() AND u.role = 'admin' AND u.is_active = true",
        (token,)
    )
    row = cur.fetchone()
    return row[0] if row else None

def handler(event: dict, context) -> dict:
    """Настройки сайта: чтение и сохранение контента всех страниц"""
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
        # GET ?action=all — все настройки (публичный, для рендера страниц)
        if method == "GET" and action == "all":
            cur.execute(
                f"SELECT section, key, value FROM {SCHEMA}.site_settings ORDER BY section, key"
            )
            result = {}
            for section, key, value in cur.fetchall():
                if section not in result:
                    result[section] = {}
                result[section][key] = value
            return resp(200, {"settings": result})

        # GET ?action=section&s=general — настройки одного раздела (публичный)
        if method == "GET" and action == "section":
            section = params.get("s", "")
            if not section:
                return resp(400, {"error": "Укажите параметр s"})
            cur.execute(
                f"SELECT key, value FROM {SCHEMA}.site_settings WHERE section = %s ORDER BY key",
                (section,)
            )
            result = {row[0]: row[1] for row in cur.fetchall()}
            return resp(200, {"settings": result})

        # GET ?action=admin_all — все настройки с метаданными (только для admin)
        if method == "GET" and action == "admin_all":
            admin_id = get_admin(cur, token)
            if not admin_id:
                return resp(403, {"error": "Только для администраторов"})
            cur.execute(
                f"SELECT id, section, key, value, label, type, updated_at "
                f"FROM {SCHEMA}.site_settings ORDER BY section, id"
            )
            sections = {}
            for row in cur.fetchall():
                sid, section, key, value, label, stype, updated_at = row
                if section not in sections:
                    sections[section] = []
                sections[section].append({
                    "id": sid, "key": key, "value": value,
                    "label": label, "type": stype, "updated_at": str(updated_at)
                })
            return resp(200, {"sections": sections})

        # POST ?action=save — сохранение одного или нескольких ключей (только admin)
        if method == "POST" and action == "save":
            admin_id = get_admin(cur, token)
            if not admin_id:
                return resp(403, {"error": "Только для администраторов"})
            updates = body.get("updates", [])  # [{section, key, value}]
            if not updates:
                return resp(400, {"error": "Передайте массив updates"})
            saved = 0
            for item in updates:
                section = item.get("section", "")
                key     = item.get("key", "")
                value   = item.get("value", "")
                if not section or not key:
                    continue
                cur.execute(
                    f"UPDATE {SCHEMA}.site_settings SET value = %s, updated_at = NOW() "
                    f"WHERE section = %s AND key = %s",
                    (value, section, key)
                )
                if cur.rowcount == 0:
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.site_settings (section, key, value, label, type) "
                        f"VALUES (%s, %s, %s, %s, 'text') ON CONFLICT (section, key) DO UPDATE SET value = %s, updated_at = NOW()",
                        (section, key, value, key, value)
                    )
                saved += 1
            db.commit()
            return resp(200, {"ok": True, "saved": saved})

        return resp(404, {"error": "Not found"})

    finally:
        cur.close()
        db.close()