# Agente de WhatsApp (Captación)

Escribe cada día, solo, el primer mensaje a empresas nuevas desde el WhatsApp de Daniel. Funciona sin ningún ordenador encendido: corre 24/7 en el servidor de Hostinger y lo controla el panel.

## Cómo funciona

```
panel.pebaisystems.es ── Captación › Prospectos  (subes la lista: CSV o pegada)
        │                Automático › Agentes    (estado, cupo, horario, plantillas, pausa)
        ▼
api/agente.php  ◄──── HTTPS + token ────  agente-whatsapp/ (Node + Baileys, PM2 en Hostinger)
(SQLite privada)                                   │  vinculado como "dispositivo" del WhatsApp de Daniel
                                                   ▼
                                               WhatsApp
```

- **El bot no decide nada.** Pregunta al panel a quién escribir, con qué texto y cuándo (`siguiente`), y devuelve el resultado. Cupo, horario, bajas y plantillas se cambian en el panel sin tocar el servidor.
- **Solo envía el primer mensaje.** Las respuestas llegan al móvil sin marcar como leídas y las contesta Daniel. El agente las registra en el panel (Respondió) y, si alguien pide la baja, la aplica sola.
- **Como una persona:** no aparece "en línea" al conectarse; antes de cada envío abre el chat, sale "escribiendo…" el tiempo que tardaría alguien en teclear el texto, con pausas; luego envía y se desconecta. Entre envíos hay pausas al azar (mínimo 4 min) repartidas por el horario.
- **Cupo y horario por defecto:** 30 al día, de lunes a viernes, de 08:30 a 13:00 y de 17:00 a 20:00. Sin festivos nacionales.
- **Mensajes distintos:** varias plantillas con variantes `{a|b}`, el nombre y la empresa. No hay dos mensajes iguales.
- **Si se cae:** PM2 lo reinicia; un cron de hPanel cada 10 min lo levanta si el servidor se reinicia (comando: lo imprime `deploy/desplegar_agente_whatsapp.py`). Si lleva 30 min sin dar señales o WhatsApp lo desvincula, llega un email a equipo@.

## Reglas legales (no se tocan)

Escribir en frío por WhatsApp en España roza la LSSI (art. 21), el RGPD y la Ley General de Telecomunicaciones. Para quedarnos en el lado bueno:

1. **Solo empresas** con el número **publicado por ellas como contacto comercial** (ficha de Google, su web). Nada de particulares ni de listas compradas. El panel obliga a indicar de dónde sale cada lista (`origen_dato`).
2. **El primer mensaje se identifica** (Daniel, PEBAI Systems) y **ofrece no volver a escribir**. El panel no deja guardar una plantilla que no cumpla las dos cosas.
3. **Un solo mensaje sin respuesta.** No hay secuencias automáticas de seguimiento.
4. **Las bajas son para siempre** (tabla `bajas`): sobreviven a borrar o reimportar prospectos. Si alguien responde "no me interesa", "baja", "no me escribas"… pasa a baja solo.
5. **Nunca se escribe a quien ya está en el embudo** (solicitudes del formulario).
6. **Sin enlaces en el primer mensaje.** Suben el riesgo de bloqueo y bajan la respuesta. El vídeo (VSL `/consultoria-gratuita/`) se manda cuando el lead contesta.

Antes de subir mucho el volumen conviene que lo revise un abogado. La API no oficial va contra las condiciones de WhatsApp (no contra la ley): el riesgo es que bloqueen el número. Para reducirlo, el cupo se sube poco a poco (de 10 en 10 por semana) y el texto varía.

## Puesta en marcha

1. En el `.env` de la raíz: `AGENT_TOKEN` (cadena aleatoria larga) y `WA_NUMERO_AGENTE` (34XXXXXXXXX). En `website-pebai/private/config.php`: `'agent_token' => '<el mismo token>'`.
2. Subir el panel y la API: `python website-pebai/scripts/deploy_changed.py <commit> --private`.
3. Arrancar el agente: `python deploy/desplegar_agente_whatsapp.py`.
4. Abrir el panel → **Agentes**: sale un código de 8 letras. En el móvil: WhatsApp → Dispositivos vinculados → Vincular un dispositivo → **Vincular con el número de teléfono** → escribir el código. Es solo una vez.
5. Subir la primera lista en **Prospectos**. Empieza a escribir en el siguiente tramo de horario.

Estado y logs: `python deploy/desplegar_agente_whatsapp.py --estado`. Parar: `--parar` (o el botón **Pausar** del panel).

## Agentes del futuro

La página **Agentes** está organizada por departamentos: Captación (WhatsApp; email, próximamente) y Redes (carruseles automáticos, próximamente). Cada agente nuevo se añade igual: un proceso que habla con el panel por `api/agente.php`, con latido, registro de lo que hace y botón de pausa.
