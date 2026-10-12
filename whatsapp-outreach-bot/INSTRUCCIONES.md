# 📱 Manual Operativo: Bot de Prospección WhatsApp (PAI Systems)

Sistema autónomo de primer contacto comercial por WhatsApp para prospección en frío, inspirado en la arquitectura de **Fran García Cars** (`@whiskeysockets/baileys`), diseñado con protección anti-baneo y variación de textos con IA.

---

## 🚀 Puesta en Marcha Rápida

### 1. Probar en Modo Simulación (Sin enviar mensajes)
```bash
npm run dry-run
```
Lee los prospectos, comprueba la franja horaria y muestra los mensajes personalizados que generaría la IA sin conectar WhatsApp.

### 2. Iniciar el Bot Real
```bash
npm start
```
1. Verás el **Código QR** dibujado en la consola de PowerShell.
2. O también puedes abrir en tu navegador: **`http://localhost:3000/qr`** para verlo en grande.
3. En tu teléfono móvil, ve a: **WhatsApp > Ajustes > Dispositivos vinculados > Vincular dispositivo** y escanea el código.
4. Una vez escaneado, la sesión queda guardada de forma permanente en la carpeta `session/`. Ya no necesitarás volver a escanearlo.

---

## 📊 Configuración de Google Sheets

El sistema ya viene preparado para conectarse a Google Sheets usando la cuenta de servicio de Google que tienes en tu equipo:
`fotos-drive@dani-developer.iam.gserviceaccount.com`

### Pasos para conectar tu hoja:
1. Entra en Google Drive y crea una nueva **Hoja de cálculo**.
2. En la primera fila (fila 1), escribe los encabezados exactos:
   | Empresa | Telefono | Contacto | Sector | Notas | Estado | Fecha Envio | Mensaje Enviado |
   | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
3. Pulsa el botón verde **Compartir** (arriba a la derecha).
4. Pega el correo de la cuenta de servicio:
   `fotos-drive@dani-developer.iam.gserviceaccount.com`
   y asegúrate de darle permiso de **Editor**.
5. Copia el identificador de la URL de tu hoja:
   `https://docs.google.com/spreadsheets/d/`**`1a2b3c4d5e...`**`/edit`
6. Abre el archivo `.env` en esta carpeta y pega el ID:
   ```env
   GOOGLE_SHEETS_SPREADSHEET_ID=1a2b3c4d5e...
   GOOGLE_SHEETS_TAB_NAME=Leads
   ```

*(Nota: Si dejas `GOOGLE_SHEETS_SPREADSHEET_ID=` vacío, el bot leerá y actualizará automáticamente el archivo local `leads.csv`).*

---

## 🛡️ Reglas Anti-Baneo Incorporadas

| Parámetro | Configuración | Justificación |
| :--- | :--- | :--- |
| **Cadencia** | 8 a 15 minutos aleatorios | Emula la velocidad de una persona real que busca una empresa, lee sobre ella y escribe. |
| **Presencia** | `composing` (6 - 14 seg.) | Muestra el estado *"Escribiendo..."* en el WhatsApp del destinatario antes de que entre el mensaje. |
| **Variación IA** | Modelo Gemini / Groq | Ningún mensaje es idéntico a otro. Evita la detección de huella de spam de Meta. |
| **Franjas horarias** | L-J: `08:30 - 14:00` y `16:00 - 19:30`<br>Viernes: `08:30 - 14:00` (tardes libre) | Solo contacta en horario laboral español. No molesta en mediodías ni noches. |
| **Fin de semana** | Pausado (Sábados y Domingos sin prospección) | Evita quejas de destinatarios fuera de su jornada de trabajo. |
| **Volumen diario** | 25 a 40 mensajes al día | Límite seguro para cuentas consolidadas en prospección fría. |
| **Comportamiento** | El bot NO contesta | El bot solo abre la conversación. Cuando un cliente te responda, tú tomas el control directo desde tu móvil o WhatsApp Web. |

---

## ⚙️ Ajustes en `.env`

Puedes modificar cualquier valor en el archivo `.env`:
* `MAX_DAILY_MESSAGES`: Límite de mensajes por día (por defecto `35`).
* `MIN_DELAY_MINUTES`: Minutos mínimos de espera entre mensajes (por defecto `8`).
* `MAX_DELAY_MINUTES`: Minutos máximos de espera entre mensajes (por defecto `15`).
* `SCHEDULE_MORNING_START_HOUR`: Hora de inicio mañana (`8:30`).
* `SCHEDULE_AFTERNOON_END_HOUR`: Hora de fin tarde (`19:30`).
