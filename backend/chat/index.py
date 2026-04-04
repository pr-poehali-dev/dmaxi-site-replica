import json
import os
import base64
import boto3
import psycopg2
from datetime import datetime

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

def get_user(cur, token):
    if not token:
        return None
    cur.execute(
        f"SELECT u.id, u.name, u.role, u.is_visible FROM {SCHEMA}.sessions s "
        f"JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token = %s AND s.expires_at > NOW() AND u.is_active = true",
        (token,)
    )
    return cur.fetchone()

def s3_client():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )

def cdn_url(key: str) -> str:
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

def handler(event: dict, context) -> dict:
    """Chat: сообщения между пользователями с поддержкой файлов"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    method  = event.get("httpMethod", "GET")
    headers = event.get("headers") or {}
    token   = headers.get("X-Auth-Token") or headers.get("x-auth-token")
    params  = event.get("queryStringParameters") or {}
    action  = params.get("action", "")
    body    = {}
    if event.get("body"):
        body = json.loads(event["body"])

    db  = get_db()
    cur = db.cursor()

    try:
        user = get_user(cur, token)
        if not user:
            return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Не авторизован"})}

        user_id, user_name, user_role, user_visible = user[0], user[1], user[2], user[3]

        # GET contacts — список диалогов (исправленный SQL без алиасов в подзапросах)
        if method == "GET" and action == "contacts":
            cur.execute(f"""
                SELECT
                  p.partner_id,
                  u.name   AS partner_name,
                  u.role   AS partner_role,
                  u.is_visible AS partner_visible,
                  (
                    SELECT body FROM {SCHEMA}.messages
                    WHERE (from_user_id = %(uid)s AND to_user_id = p.partner_id)
                       OR (from_user_id = p.partner_id AND to_user_id = %(uid)s)
                    ORDER BY created_at DESC LIMIT 1
                  ) AS last_msg,
                  (
                    SELECT created_at FROM {SCHEMA}.messages
                    WHERE (from_user_id = %(uid)s AND to_user_id = p.partner_id)
                       OR (from_user_id = p.partner_id AND to_user_id = %(uid)s)
                    ORDER BY created_at DESC LIMIT 1
                  ) AS last_at,
                  (
                    SELECT COUNT(*) FROM {SCHEMA}.messages
                    WHERE from_user_id = p.partner_id AND to_user_id = %(uid)s AND is_read = false
                  ) AS unread
                FROM (
                  SELECT DISTINCT
                    CASE WHEN m.from_user_id = %(uid)s THEN m.to_user_id ELSE m.from_user_id END AS partner_id
                  FROM {SCHEMA}.messages m
                  WHERE m.from_user_id = %(uid)s OR m.to_user_id = %(uid)s
                ) p
                JOIN {SCHEMA}.users u ON u.id = p.partner_id
                ORDER BY last_at DESC NULLS LAST
            """, {"uid": user_id})
            rows = cur.fetchall()
            contacts = [{
                "id": r[0], "name": r[1], "role": r[2],
                "is_visible": r[3], "last_message": r[4],
                "last_at": str(r[5]) if r[5] else None, "unread": r[6]
            } for r in rows]
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"contacts": contacts})}

        # GET users — список пользователей для нового диалога
        # admin — видит всех; user — видит только admin + видимых пользователей
        if method == "GET" and action == "users":
            if user_role == "admin":
                cur.execute(
                    f"SELECT id, name, role, is_visible FROM {SCHEMA}.users "
                    f"WHERE id != %s AND is_active = true ORDER BY name",
                    (user_id,)
                )
            else:
                cur.execute(
                    f"SELECT id, name, role, is_visible FROM {SCHEMA}.users "
                    f"WHERE role = 'admin' AND is_active = true ORDER BY name"
                )
            rows = cur.fetchall()
            users = [{"id": r[0], "name": r[1], "role": r[2], "is_visible": r[3]} for r in rows]
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"users": users})}

        # GET messages — история переписки
        if method == "GET" and action == "messages":
            partner_id = int(params.get("with", 0))
            if not partner_id:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Укажите with=user_id"})}

            cur.execute(f"""
                SELECT id, from_user_id, to_user_id, body, file_url, file_type, file_name, is_read, created_at
                FROM {SCHEMA}.messages
                WHERE (from_user_id = %s AND to_user_id = %s) OR (from_user_id = %s AND to_user_id = %s)
                ORDER BY created_at ASC LIMIT 100
            """, (user_id, partner_id, partner_id, user_id))
            rows = cur.fetchall()
            msgs = [{
                "id": r[0], "from": r[1], "to": r[2], "body": r[3],
                "file_url": r[4], "file_type": r[5], "file_name": r[6],
                "is_read": r[7], "created_at": str(r[8]),
                "mine": r[1] == user_id
            } for r in rows]

            cur.execute(
                f"UPDATE {SCHEMA}.messages SET is_read = true "
                f"WHERE from_user_id = %s AND to_user_id = %s AND is_read = false",
                (partner_id, user_id)
            )
            db.commit()
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"messages": msgs})}

        # POST send — отправить сообщение
        if method == "POST" and action == "send":
            to_user_id = body.get("to")
            text       = body.get("body", "").strip()
            file_data  = body.get("file")
            file_name  = body.get("file_name", "")
            file_type  = body.get("file_type", "")

            if not to_user_id:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Укажите to (user_id)"})}
            if not text and not file_data:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Нужен текст или файл"})}

            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE id = %s AND is_active = true", (to_user_id,))
            if not cur.fetchone():
                return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Получатель не найден"})}

            file_url = None
            if file_data:
                ext = file_name.split(".")[-1].lower() if "." in file_name else "bin"
                ts  = datetime.now().strftime("%Y%m%d%H%M%S%f")
                key = f"chat/{user_id}/{ts}.{ext}"
                raw = base64.b64decode(file_data)
                content_types = {
                    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
                    "gif": "image/gif", "webp": "image/webp", "mp4": "video/mp4",
                    "mov": "video/quicktime", "pdf": "application/pdf",
                    "doc": "application/msword",
                    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                }
                ct = content_types.get(ext, "application/octet-stream")
                s3 = s3_client()
                s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=ct)
                file_url = cdn_url(key)

            cur.execute(
                f"INSERT INTO {SCHEMA}.messages (from_user_id, to_user_id, body, file_url, file_type, file_name) "
                f"VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, created_at",
                (user_id, to_user_id, text or None, file_url, file_type or None, file_name or None)
            )
            row = cur.fetchone()
            db.commit()

            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({
                "ok": True, "id": row[0], "created_at": str(row[1]), "file_url": file_url
            })}

        # GET unread — кол-во непрочитанных
        if method == "GET" and action == "unread":
            cur.execute(
                f"SELECT COUNT(*) FROM {SCHEMA}.messages WHERE to_user_id = %s AND is_read = false",
                (user_id,)
            )
            count = cur.fetchone()[0]
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"unread": count})}

        # POST set_visibility — включить/выключить видимость себя для других пользователей
        if method == "POST" and action == "set_visibility":
            visible = body.get("is_visible", True)
            cur.execute(
                f"UPDATE {SCHEMA}.users SET is_visible = %s WHERE id = %s",
                (bool(visible), user_id)
            )
            db.commit()
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({
                "ok": True, "is_visible": bool(visible)
            })}

        # GET my_visibility — текущий статус видимости
        if method == "GET" and action == "my_visibility":
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({
                "is_visible": user_visible
            })}

        return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        db.close()
