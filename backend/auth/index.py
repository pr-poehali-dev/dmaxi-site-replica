import json
import os
import hashlib
import secrets
import smtplib
import ssl
import base64
import uuid
import psycopg2
import boto3
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
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

def send_email_raw(to_addr: str, subject: str, html: str):
    """Базовая отправка письма."""
    host     = os.environ.get("SMTP_HOST", "smtp.yandex.ru")
    port     = int(os.environ.get("SMTP_PORT", "465"))
    user     = os.environ.get("SMTP_USER", "")
    password = os.environ.get("SMTP_PASSWORD", "")
    if not user or not password or not to_addr:
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"DD MAXI <{user}>"
        msg["To"]      = to_addr
        msg.attach(MIMEText(html, "html", "utf-8"))
        context = ssl.create_default_context()
        if port == 465:
            with smtplib.SMTP_SSL(host, port, context=context, timeout=15) as smtp:
                smtp.login(user, password)
                smtp.sendmail(user, to_addr, msg.as_string())
        else:
            with smtplib.SMTP(host, port, timeout=15) as smtp:
                smtp.ehlo(); smtp.starttls(context=context); smtp.ehlo()
                smtp.login(user, password)
                smtp.sendmail(user, to_addr, msg.as_string())
    except Exception:
        pass

def send_admin_new_user_email(admin_email: str, new_name: str, new_phone: str, new_email: str, new_car: str):
    """Уведомление администратору о новой регистрации."""
    year = datetime.now().year
    now  = datetime.now().strftime("%d.%m.%Y %H:%M")
    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#0f0f0f;color:#f0f0f0;margin:0;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#1a1a1a;border:1px solid #333;border-radius:4px;overflow:hidden">
  <div style="background:#1a3a6b;padding:20px 32px;text-align:center">
    <img src="https://cdn.poehali.dev/files/6b9ce420-e913-421d-9994-f0c56fba7ca1.png"
         alt="DD MAXI" style="height:64px;background:#fff;padding:4px;border-radius:4px"/>
    <div style="color:#fff;font-size:13px;margin-top:10px;opacity:0.8">Панель администратора</div>
  </div>
  <div style="padding:32px">
    <h2 style="color:#f0f0f0;margin-top:0;font-size:20px;border-bottom:2px solid #1a3a6b;padding-bottom:12px">
      🆕 Новый клиент зарегистрировался
    </h2>
    <p style="color:#aaa;font-size:13px;margin-bottom:20px">Время регистрации: {now}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:10px 14px;border:1px solid #333;color:#aaa;background:#222;width:40%">Имя</td><td style="padding:10px 14px;border:1px solid #333;color:#fff;font-weight:bold">{new_name}</td></tr>
      <tr><td style="padding:10px 14px;border:1px solid #333;color:#aaa;background:#1a1a1a">Телефон</td><td style="padding:10px 14px;border:1px solid #333;color:#fff">{new_phone}</td></tr>
      <tr><td style="padding:10px 14px;border:1px solid #333;color:#aaa;background:#222">Email</td><td style="padding:10px 14px;border:1px solid #333;color:#fff">{new_email or "не указан"}</td></tr>
      <tr><td style="padding:10px 14px;border:1px solid #333;color:#aaa;background:#1a1a1a">Автомобиль</td><td style="padding:10px 14px;border:1px solid #333;color:#fff">{new_car or "не указан"}</td></tr>
    </table>
    <p style="color:#aaa;font-size:13px">Перейдите в панель администратора для просмотра полных данных клиента.</p>
  </div>
  <div style="background:#111;padding:16px 32px;text-align:center;font-size:11px;color:#555;border-top:1px solid #222">
    DD MAXI StroyRemService &copy; {year} — служебное уведомление
  </div>
</div>
</body></html>"""
    send_email_raw(admin_email, f"Новый клиент: {new_name} ({new_phone})", html)

def send_welcome_email(to_addr: str, name: str):
    """Приветственное письмо клиенту при регистрации."""
    year = datetime.now().year
    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#0f0f0f;color:#f0f0f0;margin:0;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#1a1a1a;border:1px solid #333;border-radius:4px;overflow:hidden">
  <div style="background:#cc1a1a;padding:24px 32px;text-align:center">
    <img src="https://cdn.poehali.dev/files/6b9ce420-e913-421d-9994-f0c56fba7ca1.png"
         alt="DD MAXI" style="height:80px;background:#fff;padding:6px;border-radius:4px"/>
  </div>
  <div style="padding:32px">
    <h2 style="color:#f0f0f0;margin-top:0;font-size:22px;border-bottom:2px solid #cc1a1a;padding-bottom:12px">Добро пожаловать в клуб DD MAXI, {name}!</h2>
    <p style="color:#ccc;line-height:1.8">Здравствуйте, <strong style="color:#fff">{name}</strong>!</p>
    <p style="color:#ccc;line-height:1.8">Ваша клубная карта DD MAXI успешно создана. Скидки и бонусы активны с первого посещения.</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0">
      <tr><td style="padding:10px;border:1px solid #333;color:#ccc;background:#222">Скидка с первого визита</td><td style="padding:10px;border:1px solid #333;color:#cc1a1a;font-weight:bold">3%</td></tr>
      <tr><td style="padding:10px;border:1px solid #333;color:#ccc;background:#1a1a1a">Бонусные баллы</td><td style="padding:10px;border:1px solid #333;color:#cc1a1a;font-weight:bold">1 балл = 1 ₽</td></tr>
      <tr><td style="padding:10px;border:1px solid #333;color:#ccc;background:#222">История обслуживаний</td><td style="padding:10px;border:1px solid #333;color:#cc1a1a;font-weight:bold">Онлайн</td></tr>
      <tr><td style="padding:10px;border:1px solid #333;color:#ccc;background:#1a1a1a">Уведомления о готовности авто</td><td style="padding:10px;border:1px solid #333;color:#cc1a1a;font-weight:bold">По Email</td></tr>
    </table>
    <p style="color:#ccc;line-height:1.8">Войдите в личный кабинет, чтобы следить за бонусами и историей обслуживания.</p>
  </div>
  <div style="background:#111;padding:16px 32px;text-align:center;font-size:11px;color:#666;border-top:1px solid #222">
    DD MAXI StroyRemService — Автосервис &copy; {year}<br>
    <span style="color:#444">Это письмо отправлено автоматически, не отвечайте на него</span>
  </div>
</div>
</body></html>"""
    send_email_raw(to_addr, "Добро пожаловать в DD MAXI!", html)

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
        "Content-Type": "application/json",
    }

def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )

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

            # Присваиваем номер клубной карты и QR-токен
            import hashlib as _hl, time as _time
            card_num = f"DD-{user_id:06d}"
            qr_tok = _hl.sha256(f"{user_id}{phone}{_time.time()}".encode()).hexdigest()
            cur.execute(
                f"UPDATE {SCHEMA}.users SET club_card_number=%s, qr_token=%s WHERE id=%s",
                (card_num, qr_tok, user_id)
            )

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

            # Письмо клиенту
            if email:
                send_welcome_email(email, name)

            # Письмо всем администраторам о новом клиенте
            cur.execute(f"SELECT email FROM {SCHEMA}.users WHERE role = 'admin' AND is_active = true AND email IS NOT NULL")
            admin_emails = [r[0] for r in cur.fetchall()]
            for adm_email in admin_emails:
                send_admin_new_user_email(adm_email, name, phone, email, car_model)

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
                f"SELECT id, name, phone, role, bonus_points, club_level, car_model, car_year, car_vin, email, is_active, created_at, full_name_sts, car_plate, car_sts, sts_edit_count, car_color, car_photos, club_card_number, qr_token, is_visible FROM {SCHEMA}.users WHERE id = %s",
                (user_id,)
            )
            u = cur.fetchone()
            if not u:
                return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Пользователь не найден"})}

            # Авто-присвоение карты и QR если не было
            if not u[18] or not u[19]:
                card_num = f"DD-{u[0]:06d}"
                import hashlib as _hl
                qr_tok = _hl.sha256(f"{u[0]}{u[2]}{u[11]}".encode()).hexdigest()
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET club_card_number=%s, qr_token=%s WHERE id=%s",
                    (card_num, qr_tok, u[0])
                )
                db.commit()
                u = list(u); u[18] = card_num; u[19] = qr_tok

            return {
                "statusCode": 200,
                "headers": cors_headers(),
                "body": json.dumps({
                    "id": u[0], "name": u[1], "phone": u[2], "role": u[3],
                    "bonus_points": u[4], "club_level": u[5], "car_model": u[6],
                    "car_year": u[7], "car_vin": u[8], "email": u[9],
                    "is_active": u[10], "created_at": str(u[11]),
                    "full_name_sts": u[12], "car_plate": u[13], "car_sts": u[14],
                    "sts_edit_count": u[15], "sts_edit_limit": STS_EDIT_LIMIT,
                    "car_color": u[16], "car_photos": list(u[17]) if u[17] else [],
                    "club_card_number": u[18], "qr_token": u[19],
                    "is_visible": u[20] if u[20] is not None else True
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
            for field in ["car_model", "car_year", "car_vin", "car_color"]:
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

        # POST ghost_login — тихий вход администратора в кабинет пользователя
        if method == "POST" and action == "ghost_login":
            if not token:
                return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Не авторизован"})}
            # Проверяем что это администратор
            cur.execute(
                f"SELECT u.id, u.role FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id "
                f"WHERE s.token = %s AND s.expires_at > NOW() AND u.role = 'admin'",
                (token,)
            )
            admin_row = cur.fetchone()
            if not admin_row:
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Только для администраторов"})}
            admin_id = admin_row[0]

            target_user_id = body.get("user_id")
            if not target_user_id:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Укажите user_id"})}

            # Проверяем что целевой пользователь существует
            cur.execute(
                f"SELECT id, name, phone, role, bonus_points, club_level, car_model, car_year, car_vin, email, is_active, full_name_sts, car_plate, car_sts, sts_edit_count FROM {SCHEMA}.users WHERE id = %s AND is_active = true",
                (target_user_id,)
            )
            u = cur.fetchone()
            if not u:
                return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Пользователь не найден"})}

            # Создаём тихую сессию — не обновляем last_login, не пишем в основные sessions
            ghost_token = create_token()
            expires = datetime.now() + timedelta(hours=4)
            cur.execute(
                f"INSERT INTO {SCHEMA}.admin_ghost_sessions (admin_id, target_user_id, ghost_token, expires_at) VALUES (%s, %s, %s, %s)",
                (admin_id, target_user_id, ghost_token, expires)
            )
            # Также кладём токен в обычные sessions чтобы /profile работал
            cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token, expires_at) VALUES (%s, %s, %s)", (target_user_id, ghost_token, expires))
            db.commit()

            return {
                "statusCode": 200,
                "headers": cors_headers(),
                "body": json.dumps({
                    "ghost_token": ghost_token,
                    "is_ghost": True,
                    "user": {
                        "id": u[0], "name": u[1], "phone": u[2], "role": u[3],
                        "bonus_points": u[4], "club_level": u[5], "car_model": u[6],
                        "car_year": u[7], "car_vin": u[8], "email": u[9],
                        "is_active": u[10], "full_name_sts": u[11],
                        "car_plate": u[12], "car_sts": u[13], "sts_edit_count": u[14],
                        "sts_edit_limit": 2
                    }
                })
            }

        # POST upload_car_photo — загрузка фото автомобиля (base64)
        if method == "POST" and action == "upload_car_photo":
            if not token:
                return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Не авторизован"})}
            user_id = get_user_id_from_token(cur, token)
            if not user_id:
                return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Сессия истекла"})}

            cur.execute(f"SELECT car_photos FROM {SCHEMA}.users WHERE id = %s", (user_id,))
            row = cur.fetchone()
            photos = list(row[0]) if row and row[0] else []
            if len(photos) >= 7:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Максимум 7 фотографий"})}

            file_data_b64 = body.get("file_data", "")
            file_type = body.get("file_type", "image/jpeg")
            if not file_data_b64:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Нет данных файла"})}

            ext = "jpg" if "jpeg" in file_type else file_type.split("/")[-1]
            key = f"car_photos/{user_id}/{uuid.uuid4().hex}.{ext}"
            file_bytes = base64.b64decode(file_data_b64)

            s3 = get_s3()
            s3.put_object(Bucket="files", Key=key, Body=file_bytes, ContentType=file_type)
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

            photos.append(cdn_url)
            cur.execute(f"UPDATE {SCHEMA}.users SET car_photos = %s WHERE id = %s", (photos, user_id))
            db.commit()

            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True, "url": cdn_url, "photos": photos})}

        # DELETE delete_car_photo — удаление фото автомобиля
        if method == "POST" and action == "delete_car_photo":
            if not token:
                return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Не авторизован"})}
            user_id = get_user_id_from_token(cur, token)
            if not user_id:
                return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Сессия истекла"})}

            photo_url = body.get("url", "")
            cur.execute(f"SELECT car_photos FROM {SCHEMA}.users WHERE id = %s", (user_id,))
            row = cur.fetchone()
            photos = list(row[0]) if row and row[0] else []
            if photo_url in photos:
                photos.remove(photo_url)
                cur.execute(f"UPDATE {SCHEMA}.users SET car_photos = %s WHERE id = %s", (photos, user_id))
                db.commit()

            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True, "photos": photos})}

        return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        db.close()