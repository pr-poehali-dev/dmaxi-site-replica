import json
import os
import smtplib
import psycopg2
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
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

def get_admin_id(cur, token):
    if not token:
        return None
    cur.execute(
        f"SELECT u.id, u.role FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token = %s AND s.expires_at > NOW() AND u.role = 'admin'",
        (token,)
    )
    row = cur.fetchone()
    return row[0] if row else None

def send_email(to_addr: str, subject: str, html_body: str):
    host = os.environ.get("SMTP_HOST", "")
    port = int(os.environ.get("SMTP_PORT", "587"))
    user = os.environ.get("SMTP_USER", "")
    password = os.environ.get("SMTP_PASSWORD", "")

    if not host or not user or not password:
        return False, "SMTP не настроен"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"DD MAXI <{user}>"
    msg["To"] = to_addr
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP(host, port, timeout=15) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.login(user, password)
            smtp.sendmail(user, to_addr, msg.as_string())
        return True, "ok"
    except Exception as e:
        return False, str(e)

def make_html(title: str, body_html: str) -> str:
    return f"""
    <html><body style="font-family:Arial,sans-serif;background:#0f0f0f;color:#f0f0f0;margin:0;padding:20px">
    <div style="max-width:600px;margin:0 auto;background:#1a1a1a;border:1px solid #333;border-radius:4px;overflow:hidden">
      <div style="background:#cc1a1a;padding:24px 32px;text-align:center">
        <img src="https://cdn.poehali.dev/files/6b9ce420-e913-421d-9994-f0c56fba7ca1.png"
             alt="DD MAXI" style="height:72px;background:#fff;padding:4px;border-radius:4px"/>
      </div>
      <div style="padding:32px">
        <h2 style="color:#f0f0f0;margin-top:0;font-size:20px">{title}</h2>
        {body_html}
      </div>
      <div style="background:#111;padding:16px 32px;text-align:center;font-size:11px;color:#666">
        DD MAXI StroyRemService &mdash; Автосервис &copy; {datetime.now().year}
      </div>
    </div>
    </body></html>"""

def handler(event: dict, context) -> dict:
    """Mailer: отправка email пользователям и массовые рассылки"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    method = event.get("httpMethod", "POST")
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
        # POST send — отправка одному пользователю (только админ)
        if method == "POST" and action == "send":
            admin_id = get_admin_id(cur, token)
            if not admin_id:
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Только для администраторов"})}

            user_id = body.get("user_id")
            subject = body.get("subject", "Сообщение от DD MAXI")
            message = body.get("message", "")
            ntype = body.get("type", "info")

            if not user_id or not message:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "user_id и message обязательны"})}

            # Получаем email пользователя
            cur.execute(f"SELECT name, email FROM {SCHEMA}.users WHERE id = %s", (user_id,))
            u = cur.fetchone()
            if not u:
                return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Пользователь не найден"})}

            name, email = u[0], u[1]

            # Сохраняем уведомление в БД
            cur.execute(
                f"INSERT INTO {SCHEMA}.notifications (user_id, title, body, type) VALUES (%s, %s, %s, %s)",
                (user_id, subject, message, ntype)
            )
            db.commit()

            email_sent = False
            email_error = ""
            if email:
                body_html = f"<p style='color:#ccc;line-height:1.6'>{message.replace(chr(10), '<br>')}</p>"
                ok, err = send_email(email, subject, make_html(subject, body_html))
                email_sent = ok
                email_error = err

            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({
                "ok": True, "notification_saved": True,
                "email_sent": email_sent, "email_error": email_error if not email_sent else None
            })}

        # POST broadcast — рассылка всем или по роли (только админ)
        if method == "POST" and action == "broadcast":
            admin_id = get_admin_id(cur, token)
            if not admin_id:
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Только для администраторов"})}

            subject = body.get("subject", "Новости DD MAXI")
            message = body.get("message", "")
            role_filter = body.get("role", "user")

            if not message:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "message обязателен"})}

            cur.execute(f"SELECT id, name, email FROM {SCHEMA}.users WHERE role = %s AND is_active = true", (role_filter,))
            users = cur.fetchall()

            sent_count = 0
            fail_count = 0
            for u in users:
                uid, uname, uemail = u[0], u[1], u[2]
                cur.execute(
                    f"INSERT INTO {SCHEMA}.notifications (user_id, title, body, type) VALUES (%s, %s, %s, 'broadcast')",
                    (uid, subject, message)
                )
                if uemail:
                    personal_msg = message.replace("{name}", uname)
                    body_html = f"<p style='color:#ccc;line-height:1.6'>{personal_msg.replace(chr(10), '<br>')}</p>"
                    ok, _ = send_email(uemail, subject, make_html(subject, body_html))
                    if ok:
                        sent_count += 1
                    else:
                        fail_count += 1

            db.commit()
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({
                "ok": True, "total_users": len(users),
                "emails_sent": sent_count, "emails_failed": fail_count
            })}

        # POST welcome — приветственное письмо после регистрации
        if method == "POST" and action == "welcome":
            name = body.get("name", "")
            email = body.get("email", "")
            if not email:
                return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True, "skipped": "no_email"})}

            html = make_html(
                f"Добро пожаловать в клуб DD MAXI, {name}!",
                f"""
                <p style='color:#ccc;line-height:1.6'>Ваша клубная карта успешно создана.</p>
                <p style='color:#ccc;line-height:1.6'>Теперь вам доступны:</p>
                <ul style='color:#ccc'>
                  <li>Скидки от 3% с первого посещения</li>
                  <li>Начисление бонусных баллов (1 балл = 1 ₽)</li>
                  <li>История всех обслуживаний</li>
                  <li>Уведомления о готовности автомобиля</li>
                </ul>
                <p style='color:#ccc'>Войдите в личный кабинет для просмотра деталей.</p>
                """
            )
            ok, err = send_email(email, "Добро пожаловать в DD MAXI!", html)
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": ok, "error": err if not ok else None})}

        return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        db.close()
