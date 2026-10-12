# social-media-engine/notifier.py
# Módulo de alertas por correo electrónico hacia equipo@pebaisystems.es

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header

SMTP_HOST = "smtp.hostinger.com"
SMTP_PORT = 465
SMTP_USER = "equipo@pebaisystems.es"
SMTP_PASS = r"^HC6mkxS36wtyM^K"
ALERT_RECIPIENT = "equipo@pebaisystems.es"

def send_email_alert(subject, html_content, text_content=None):
    """
    Envía una alerta directa vía SMTP seguro a equipo@pebaisystems.es con codificación UTF-8
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = Header(subject, "utf-8")
    msg["From"] = Header(f"PEBAI Systems Bot <{SMTP_USER}>", "utf-8")
    msg["To"] = Header(ALERT_RECIPIENT, "utf-8")

    if text_content:
        part1 = MIMEText(text_content, "plain", "utf-8")
        msg.attach(part1)

    part2 = MIMEText(html_content, "html", "utf-8")
    msg.attach(part2)

    context = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context, timeout=12) as server:
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, [ALERT_RECIPIENT], msg.as_bytes())
        print(f"[Notifier] Alerta enviada con éxito a {ALERT_RECIPIENT}: {subject}")
        return True
    except Exception as e:
        print(f"[Notifier] Error enviando alerta por correo: {e}")
        return False

def notify_complex_doubt(platform, username, comment_text, post_url=None):
    """
    Alerta cuando un usuario hace una pregunta fuera de guion / duda compleja.
    EL BOT NO RESPONDE AUTOMÁTICAMENTE: Notifica al equipo humano.
    """
    subject = f"[PEBAI {platform.upper()}] Duda compleja de @{username} (Requiere intervencion humana)"
    
    html = f"""
    <div style="font-family: Arial, sans-serif; background-color: #090a10; color: #efede7; padding: 25px; border-radius: 8px;">
      <h2 style="color: #b7ff3c; margin-top: 0;">Intervención Humana Requerida</h2>
      <p style="font-size: 15px; color: #8e90a2;">
        El bot ha detectado un comentario con una <strong>duda compleja o pregunta directa</strong>. 
        Siguiendo las directrices, <strong>el bot NO ha respondido</strong> para que el equipo de PEBAI atienda el caso personalmente.
      </p>
      
      <div style="background-color: #121420; border-left: 4px solid #6a5cff; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #8e90a2; font-size: 13px;">PLATAFORMA: <strong>{platform.upper()}</strong></p>
        <p style="margin: 5px 0; color: #8e90a2; font-size: 13px;">USUARIO: <strong>@{username}</strong></p>
        {f'<p style="margin: 5px 0; color: #8e90a2; font-size: 13px;">POST: <a href="{post_url}" style="color: #b7ff3c;">{post_url}</a></p>' if post_url else ''}
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 10px 0;">
        <p style="margin: 0; font-size: 16px; color: #ffffff;"><em>"{comment_text}"</em></p>
      </div>
      
      <p style="font-size: 13px; color: #8e90a2;">
        Acción requerida: Entrar en la cuenta de {platform.upper()} y contestar directamente al usuario con una respuesta personalizada.
      </p>
    </div>
    """
    return send_email_alert(subject, html, text_content=f"Duda de @{username} en {platform}: {comment_text}")

def notify_session_expired(platform):
    """
    Alerta crítica si una sesión en una red social ha caducado o requiere renovación.
    """
    subject = f"[ALERTA CRITICA] Sesion de {platform.upper()} caducada en PEBAI Bot"
    html = f"""
    <div style="font-family: Arial, sans-serif; background-color: #090a10; color: #efede7; padding: 25px; border-radius: 8px;">
      <h2 style="color: #ff4757; margin-top: 0;">Sesión Desconectada</h2>
      <p style="font-size: 15px; color: #8e90a2;">
        El motor autónomo ha detectado que la sesión de <strong>{platform.upper()}</strong> no es válida o ha caducado.
      </p>
      <p style="font-size: 14px; color: #ffffff;">
        El bot ha pausado automáticamente las acciones en {platform.upper()} para proteger la cuenta.
      </p>
      <p style="font-size: 13px; color: #8e90a2;">
        Solución: Ejecutar de nuevo el acceso directo en el escritorio para renovar las cookies.
      </p>
    </div>
    """
    return send_email_alert(subject, html, text_content=f"Sesion de {platform} caducada.")
