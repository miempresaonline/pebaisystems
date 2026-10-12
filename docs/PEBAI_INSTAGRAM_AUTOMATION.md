# PEBAI Flow — conexión de Instagram

Este sistema sustituye la automatización de comentarios de ManyChat sin cuota
mensual. Solo se activa cuando Meta valida el webhook y se añade una
configuración privada al servidor.

## Qué hace

- Detecta `CONSULTORÍA` y `CONSULTORIA` en comentarios o DMs.
- Envía la solicitud privada con atribución `origen=instagram`.
- Registra el resultado técnico del envío en `api/instagram-events.log`.
- Deja `RESPUESTA`, `GEO` y `FORMACIÓN` apagadas hasta que sus recursos estén
  publicados.

## Preparación en Meta

1. Vincular la cuenta profesional de Instagram a una página de Facebook.
2. Crear una app en Meta for Developers y añadir Instagram Messaging/Webhooks.
3. Añadir esta URL de devolución de llamada:

   `https://pebaisystems.es/api/instagram-webhook.php`

4. Elegir un token de verificación largo y copiarlo en `verify_token`.
5. Suscribirse a eventos de comentarios y mensajes de Instagram.
6. Crear en el servidor `api/instagram-config.php` a partir de la plantilla,
   pegar los datos de Meta y activar primero solo `consultoria`.

## Prueba segura

Mantener `enabled => false` durante la validación. El webhook acepta los
eventos y los registra como `dry_run`, sin enviar mensajes. Tras confirmar el
evento de prueba, cambiarlo a `true` y probar con una cuenta ajena al equipo.
