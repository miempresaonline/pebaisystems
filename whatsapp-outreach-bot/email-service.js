import tls from 'tls';

const SMTP_CONFIG = {
  host: 'smtp.hostinger.com',
  port: 465,
  user: 'equipo@pebaisystems.es',
  pass: '^HC6mkxS36wtyM^K',
  from: 'PEBAI Systems <equipo@pebaisystems.es>',
  to: 'equipo@pebaisystems.es',
  apiEndpoint: 'https://pebaisystems.es/api/send_alert.php',
  apiToken: (process.env.PEBAI_ALERT_TOKEN || '')
};

/**
 * Envío mediante endpoint seguro PHP de pebaisystems.es (primera vía ultra rápida)
 */
async function sendViaHttpApi(subject, htmlMessage) {
  const response = await fetch(SMTP_CONFIG.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Alert-Token': SMTP_CONFIG.apiToken
    },
    body: JSON.stringify({
      token: SMTP_CONFIG.apiToken,
      to: SMTP_CONFIG.to,
      subject,
      message: htmlMessage
    }),
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} en send_alert.php`);
  }

  const data = await response.json();
  if (data.status !== 'ok') {
    throw new Error(data.message || 'Error en respuesta de send_alert.php');
  }
  return true;
}

/**
 * Envío mediante socket TLS directo a smtp.hostinger.com:465 (vía de respaldo puro sin dependencias)
 */
function sendViaDirectSmtp(subject, htmlMessage) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(SMTP_CONFIG.port, SMTP_CONFIG.host, { timeout: 10000 }, () => {
      let step = 0;
      let buffer = '';

      const sendCmd = (cmd) => {
        socket.write(cmd + '\r\n');
      };

      socket.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\r\n');
        buffer = lines.pop(); // Mantener último fragmento incompleto

        for (const line of lines) {
          if (!line) continue;
          const code = line.substring(0, 3);
          const isFinal = line.charAt(3) === ' ';

          if (!isFinal) continue;

          if (step === 0 && code === '220') {
            step = 1;
            sendCmd('EHLO pebaisystems.es');
          } else if (step === 1 && code === '250') {
            step = 2;
            sendCmd('AUTH LOGIN');
          } else if (step === 2 && code === '334') {
            step = 3;
            sendCmd(Buffer.from(SMTP_CONFIG.user).toString('base64'));
          } else if (step === 3 && code === '334') {
            step = 4;
            sendCmd(Buffer.from(SMTP_CONFIG.pass).toString('base64'));
          } else if (step === 4 && code === '235') {
            step = 5;
            sendCmd(`MAIL FROM:<${SMTP_CONFIG.user}>`);
          } else if (step === 5 && code === '250') {
            step = 6;
            sendCmd(`RCPT TO:<${SMTP_CONFIG.to}>`);
          } else if (step === 6 && code === '250') {
            step = 7;
            sendCmd('DATA');
          } else if (step === 7 && code === '354') {
            step = 8;
            const b64Subject = Buffer.from(subject).toString('base64');
            const emailData = [
              `From: ${SMTP_CONFIG.from}`,
              `To: ${SMTP_CONFIG.to}`,
              `Subject: =?UTF-8?B?${b64Subject}?=`,
              'MIME-Version: 1.0',
              'Content-Type: text/html; charset=UTF-8',
              `Date: ${new Date().toUTCString()}`,
              '',
              htmlMessage,
              '.'
            ].join('\r\n');
            socket.write(emailData + '\r\n');
          } else if (step === 8 && code === '250') {
            step = 9;
            sendCmd('QUIT');
            socket.end();
            resolve(true);
            return;
          } else if (code.startsWith('4') || code.startsWith('5')) {
            socket.destroy();
            reject(new Error(`SMTP Error [${code}]: ${line}`));
            return;
          }
        }
      });
    });

    socket.on('error', (err) => reject(err));
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('SMTP connection timeout'));
    });
  });
}

/**
 * Notifica a equipo@pebaisystems.es inmediatamente cuando una conversación se deriva a un humano.
 */
export async function sendHumanTransferAlert({ phone, empresa, sector, ciudad, reason, conversationHistory }) {
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  const companyName = empresa || 'Empresa no identificada';
  const isLeadQualified = /formulario|diagn[oó]stico|interesado/i.test(reason || '');
  const subject = isLeadQualified
    ? `🎯 [FORMULARIO COMPLETADO / LEAD CALIFICADO] +${cleanPhone} (${companyName}) — PEBAI WhatsApp`
    : `🚨 [TRANSFER A HUMANO] +${cleanPhone} (${companyName}) — PEBAI WhatsApp`;

  // Formatear historial
  const historyHtml = (conversationHistory || []).map((msg) => {
    const isUser = msg.role === 'user';
    const sender = isUser ? '👤 Prospecto' : '🤖 Daniel (IA)';
    const bgColor = isUser ? '#1e293b' : '#0f172a';
    const textColor = isUser ? '#f8fafc' : '#94a3b8';
    const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';
    
    return `
      <div style="background: ${bgColor}; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid ${isUser ? '#3b82f6' : '#64748b'};">
        <div style="font-size: 11px; color: ${textColor}; font-weight: 600; margin-bottom: 4px;">${sender} ${timeStr ? `(${timeStr})` : ''}</div>
        <div style="font-size: 14px; color: #f1f5f9; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(msg.content)}</div>
      </div>
    `;
  }).join('');

  const waLink = `https://wa.me/${cleanPhone}`;
  const nowStr = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });

  const headerGradient = isLeadQualified 
    ? 'linear-gradient(135deg, #064e3b 0%, #047857 100%)' 
    : 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)';
  const headerSubtitle = isLeadQualified
    ? 'El cliente ha avanzado en el embudo. El bot se ha pausado para que Daniel o el equipo cierren la consultoría de 10 min.'
    : 'El bot ha pausado la auto-respuesta para este chat. Requiere atención de Daniel o comercial.';
  const headerTitle = isLeadQualified
    ? '🎯 Lead Calificado · Formulario de Diagnóstico'
    : '🚨 Intervención Humana Requerida';

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 24px; margin: 0;">
  <div style="max-width: 650px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    
    <!-- Encabezado -->
    <div style="background: ${headerGradient}; padding: 20px 24px; border-bottom: 1px solid #1f2937;">
      <div style="color: #a5b4fc; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;">PEBAI SYSTEMS · ATENCIÓN COMERCIAL</div>
      <h2 style="color: #ffffff; margin: 6px 0 0 0; font-size: 20px;">${headerTitle}</h2>
      <div style="color: #c7d2fe; font-size: 13px; margin-top: 4px;">${headerSubtitle}</div>
    </div>

    <!-- Detalles del Lead -->
    <div style="padding: 24px;">
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px; width: 140px;">Empresa:</td>
          <td style="padding: 6px 0; color: #f8fafc; font-size: 14px; font-weight: 600;">${escapeHtml(companyName)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Teléfono:</td>
          <td style="padding: 6px 0; color: #38bdf8; font-size: 14px; font-weight: 600;">+${cleanPhone}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Sector / Ciudad:</td>
          <td style="padding: 6px 0; color: #f8fafc; font-size: 13px;">${escapeHtml(sector || 'General')} · ${escapeHtml(ciudad || 'España')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Motivo derivación:</td>
          <td style="padding: 6px 0; color: #f87171; font-size: 13px; font-weight: 600;">${escapeHtml(reason || 'Consulta fuera de KB o petición explícita')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Fecha y hora:</td>
          <td style="padding: 6px 0; color: #cbd5e1; font-size: 12px;">${nowStr} (Madrid)</td>
        </tr>
      </table>

      <!-- Botón de acción directa a WhatsApp -->
      <div style="margin: 20px 0 24px 0; text-align: center;">
        <a href="${waLink}" style="display: inline-block; background-color: #22c55e; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(34,197,94,0.3);">
          👉 Abrir Chat en WhatsApp Web / Móvil (+${cleanPhone})
        </a>
      </div>

      <!-- Historial de Conversación -->
      <div style="border-top: 1px solid #1f2937; padding-top: 18px;">
        <div style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px;">
          Historial de la conversación:
        </div>
        ${historyHtml || '<div style="color: #64748b; font-size: 13px;">(Sin mensajes previos registrados)</div>'}
      </div>

    </div>

    <!-- Pie -->
    <div style="background-color: #0b0f19; padding: 14px 24px; border-top: 1px solid #1f2937; font-size: 11px; color: #64748b; text-align: center;">
      PEBAI Systems — Motor Autónomo de WhatsApp · Notificación automática a equipo@pebaisystems.es
    </div>

  </div>
</body>
</html>
  `;

  // Intento 1: HTTP API interna en pebaisystems.es
  try {
    await sendViaHttpApi(subject, html);
    console.log(`📧 [ALERTA EMAIL ENVIADA]: Notificación de derivación enviada a equipo@pebaisystems.es para lead +${cleanPhone}`);
    return true;
  } catch (errApi) {
    console.warn(`⚠️ [ALERTA EMAIL]: Falló vía HTTP API (${errApi.message}), intentando SMTP TLS directo...`);
  }

  // Intento 2: SMTP TLS directo
  try {
    await sendViaDirectSmtp(subject, html);
    console.log(`📧 [ALERTA EMAIL ENVIADA VIA SMTP DIRECTO]: Notificación enviada a equipo@pebaisystems.es para lead +${cleanPhone}`);
    return true;
  } catch (errSmtp) {
    console.error(`❌ [ALERTA EMAIL CRÍTICO]: No se pudo enviar el email de alerta:`, errSmtp.message);
    return false;
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
