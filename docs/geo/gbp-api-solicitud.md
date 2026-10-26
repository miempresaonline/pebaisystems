# Solicitud de la API de Google Business Profile

Para que el agente Local pueda cambiar solo categorías, servicios, descripción y horario de la ficha, y responder reseñas.

**Requisito que frena:** Google exige que la ficha esté verificada y activa **desde hace más de 60 días**. La de PEBAI se verificó hacia el 20/10/2026, así que se puede pedir **a partir del 19/12/2026**. Si se pide antes, la rechazan.

## Pasos (los hace Daniel con equipo@pebaisystems.es, dueño de la ficha)
1. Google Cloud Console → proyecto **pebai-geo** → panel del proyecto → tarjeta «Información del proyecto» → copiar el **Número de proyecto**.
2. Abrir el formulario: https://support.google.com/business/contact/api_default
3. Elegir **«Application for Basic API Access»** y rellenar con lo de abajo.
4. Esperar el email de Google (días o semanas). Para saber si está aprobada: en Cloud Console, cuotas de las APIs de Business Profile: 0 = no aprobada, 300 por minuto = aprobada.
5. Cuando esté aprobada, avisar en el chat GEO: se activan las APIs, se conecta la cuenta y se le da el permiso a Local.

## Respuestas para el formulario
| Campo | Respuesta |
|---|---|
| Email de contacto | equipo@pebaisystems.es |
| Nombre de la empresa | PEBAI Systems |
| Web de la empresa | https://pebaisystems.es |
| Número de proyecto de Google Cloud | (el del paso 1) |
| ¿Gestionas tu propio negocio o el de otros? | Mi propio negocio |
| Número de fichas | 1 |
| Uso de la API (en inglés) | `We manage our own Business Profile (PEBAI Systems, a process and AI consultancy in Spain). We will use the API to keep the profile accurate and up to date: categories, services, description, opening hours, posts and photos, and to read and reply to customer reviews. Changes are made by our own internal tool for our single verified location only.` |

## Mientras tanto
La categoría principal la cambia Daniel a mano en la ficha (Editar perfil › Categoría). Recomendación: probar si Google ofrece alguna categoría con «inteligencia artificial»; si no, «Empresa de software» como principal y «Consultora informática» y «Consultor de empresas» como secundarias.
