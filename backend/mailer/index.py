import json
import os
import smtplib
import ssl
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
        f"SELECT u.id FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token = %s AND s.expires_at > NOW() AND u.role = 'admin'",
        (token,)
    )
    row = cur.fetchone()
    return row[0] if row else None

def send_email(to_addr: str, subject: str, html_body: str):
    """Отправка через Яндекс SMTP. Порт 465 = SSL, 587 = STARTTLS."""
    host     = os.environ.get("SMTP_HOST", "smtp.yandex.ru")
    port     = int(os.environ.get("SMTP_PORT", "465"))
    user     = os.environ.get("SMTP_USER", "")
    password = os.environ.get("SMTP_PASSWORD", "")

    if not user or not password:
        return False, "SMTP не настроен: заполните SMTP_USER и SMTP_PASSWORD"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"DD MAXI <{user}>"
    msg["To"]      = to_addr
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        context = ssl.create_default_context()
        if port == 465:
            # Яндекс: SSL с первого байта
            with smtplib.SMTP_SSL(host, port, context=context, timeout=20) as smtp:
                smtp.login(user, password)
                smtp.sendmail(user, to_addr, msg.as_string())
        else:
            # 587: сначала plain, потом STARTTLS
            with smtplib.SMTP(host, port, timeout=20) as smtp:
                smtp.ehlo()
                smtp.starttls(context=context)
                smtp.ehlo()
                smtp.login(user, password)
                smtp.sendmail(user, to_addr, msg.as_string())
        return True, "ok"
    except smtplib.SMTPAuthenticationError as e:
        return False, f"Ошибка авторизации SMTP: {e.smtp_error.decode() if hasattr(e, 'smtp_error') else str(e)}"
    except smtplib.SMTPException as e:
        return False, f"SMTP ошибка: {str(e)}"
    except Exception as e:
        return False, f"Ошибка отправки: {str(e)}"

def make_html(title: str, body_html: str) -> str:
    year = datetime.now().year
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#0f0f0f;color:#f0f0f0;margin:0;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#1a1a1a;border:1px solid #333;border-radius:4px;overflow:hidden">
  <div style="background:#cc1a1a;padding:24px 32px;text-align:center">
    <img src="https://cdn.poehali.dev/files/6b9ce420-e913-421d-9994-f0c56fba7ca1.png"
         alt="DD MAXI" style="height:80px;background:#fff;padding:6px;border-radius:4px"/>
  </div>
  <div style="padding:32px">
    <h2 style="color:#f0f0f0;margin-top:0;font-size:22px;border-bottom:2px solid #cc1a1a;padding-bottom:12px">{title}</h2>
    {body_html}
  </div>
  <div style="background:#111;padding:16px 32px;text-align:center;font-size:11px;color:#666;border-top:1px solid #222">
    DD MAXI StroyRemService — Автосервис &copy; {year}<br>
    <span style="color:#444">Это письмо отправлено автоматически, не отвечайте на него</span>
  </div>
</div>
</body></html>"""

def handler(event: dict, context) -> dict:
    """Mailer: отправка email — приветствие, рассылка, уведомления"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    method  = event.get("httpMethod", "POST")
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
        # GET ping — проверка SMTP без отправки письма
        if method == "GET" and action == "ping":
            host     = os.environ.get("SMTP_HOST", "smtp.yandex.ru")
            port     = int(os.environ.get("SMTP_PORT", "465"))
            user     = os.environ.get("SMTP_USER", "")
            password = os.environ.get("SMTP_PASSWORD", "")
            if not user or not password:
                return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": False, "error": "Секреты не заполнены", "host": host, "port": port, "user": user or "(пусто)"})}
            try:
                context = ssl.create_default_context()
                if port == 465:
                    with smtplib.SMTP_SSL(host, port, context=context, timeout=10) as smtp:
                        smtp.login(user, password)
                else:
                    with smtplib.SMTP(host, port, timeout=10) as smtp:
                        smtp.ehlo(); smtp.starttls(context=context); smtp.ehlo()
                        smtp.login(user, password)
                return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True, "message": f"SMTP подключение успешно: {host}:{port} как {user}"})}
            except Exception as e:
                return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": False, "error": str(e), "host": host, "port": port, "user": user})}

        # GET test — тестовая отправка на указанный email
        if method == "GET" and action == "test":
            to = params.get("to", "")
            if not to:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Укажите ?to=email"})}
            html = make_html(
                "Тест SMTP — DD MAXI",
                "<p style='color:#ccc;line-height:1.8'>Это тестовое письмо. Если вы его получили — email-рассылка работает корректно!</p>"
                "<p style='color:#999;font-size:13px'>Сервер: " + os.environ.get("SMTP_HOST","?") + ":" + os.environ.get("SMTP_PORT","?") + "</p>"
            )
            ok, err = send_email(to, "Тест: DD MAXI почта работает", html)
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": ok, "to": to, "error": err if not ok else None})}

        # POST welcome — приветствие после регистрации
        if method == "POST" and action == "welcome":
            name  = body.get("name", "")
            email = body.get("email", "")
            if not email:
                return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True, "skipped": "no_email"})}
            html = make_html(
                f"Добро пожаловать в клуб DD MAXI, {name}!",
                f"""
                <p style='color:#ccc;line-height:1.8'>Здравствуйте, <strong style='color:#fff'>{name}</strong>!</p>
                <p style='color:#ccc;line-height:1.8'>Ваша клубная карта DD MAXI успешно создана. Скидки и бонусы активны с первого посещения.</p>
                <table style='width:100%;border-collapse:collapse;margin:20px 0'>
                  <tr><td style='padding:10px;border:1px solid #333;color:#ccc;background:#222'>Скидка с первого визита</td><td style='padding:10px;border:1px solid #333;color:#cc1a1a;font-weight:bold'>3%</td></tr>
                  <tr><td style='padding:10px;border:1px solid #333;color:#ccc;background:#1a1a1a'>Бонусные баллы</td><td style='padding:10px;border:1px solid #333;color:#cc1a1a;font-weight:bold'>1 балл = 1 ₽</td></tr>
                  <tr><td style='padding:10px;border:1px solid #333;color:#ccc;background:#222'>История обслуживаний</td><td style='padding:10px;border:1px solid #333;color:#cc1a1a;font-weight:bold'>Онлайн</td></tr>
                  <tr><td style='padding:10px;border:1px solid #333;color:#ccc;background:#1a1a1a'>Уведомления о готовности авто</td><td style='padding:10px;border:1px solid #333;color:#cc1a1a;font-weight:bold'>По SMS и Email</td></tr>
                </table>
                <p style='color:#ccc;line-height:1.8'>Войдите в личный кабинет, чтобы следить за бонусами и историей обслуживания.</p>
                """
            )
            ok, err = send_email(email, "Добро пожаловать в DD MAXI!", html)
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": ok, "error": err if not ok else None})}

        # POST send — уведомление одному пользователю (только админ)
        if method == "POST" and action == "send":
            admin_id = get_admin_id(cur, token)
            if not admin_id:
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Только для администраторов"})}
            user_id = body.get("user_id")
            subject = body.get("subject", "Сообщение от DD MAXI")
            message = body.get("message", "")
            ntype   = body.get("type", "info")
            if not user_id or not message:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "user_id и message обязательны"})}
            cur.execute(f"SELECT name, email FROM {SCHEMA}.users WHERE id = %s", (user_id,))
            u = cur.fetchone()
            if not u:
                return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Пользователь не найден"})}
            uname, uemail = u[0], u[1]
            cur.execute(f"INSERT INTO {SCHEMA}.notifications (user_id, title, body, type) VALUES (%s, %s, %s, %s)", (user_id, subject, message, ntype))
            db.commit()
            email_sent = False
            email_error = ""
            if uemail:
                html = make_html(subject, f"<p style='color:#ccc;line-height:1.8'>{message.replace(chr(10),'<br>')}</p>")
                email_sent, email_error = send_email(uemail, subject, html)
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True, "notification_saved": True, "email_sent": email_sent, "email_error": email_error if not email_sent else None})}

        # POST broadcast — рассылка всем клиентам (только админ)
        if method == "POST" and action == "broadcast":
            admin_id = get_admin_id(cur, token)
            if not admin_id:
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Только для администраторов"})}
            subject     = body.get("subject", "Новости DD MAXI")
            message     = body.get("message", "")
            role_filter = body.get("role", "user")
            if not message:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "message обязателен"})}
            cur.execute(f"SELECT id, name, email FROM {SCHEMA}.users WHERE role = %s AND is_active = true", (role_filter,))
            users = cur.fetchall()
            sent_count = fail_count = 0
            for uid, uname, uemail in users:
                cur.execute(f"INSERT INTO {SCHEMA}.notifications (user_id, title, body, type) VALUES (%s, %s, %s, 'broadcast')", (uid, subject, message))
                if uemail:
                    personal = message.replace("{name}", uname)
                    html = make_html(subject, f"<p style='color:#ccc;line-height:1.8'>{personal.replace(chr(10),'<br>')}</p>")
                    ok, _ = send_email(uemail, subject, html)
                    if ok: sent_count += 1
                    else:  fail_count += 1
            db.commit()
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True, "total_users": len(users), "emails_sent": sent_count, "emails_failed": fail_count})}

        return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        db.close()
