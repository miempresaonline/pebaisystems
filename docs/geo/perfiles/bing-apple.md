# Bing Places y Apple Business Connect: textos listos para pegar (27/10/2026)

Resumen de `bing-places.md` y `apple-business-connect.md` con los datos coherentes con Google, la web y LinkedIn. Daniel solo crea la cuenta y pega. Nada de esto se ha enviado ni dado de alta.

## Datos comunes (idénticos en todas partes)
| Campo | Valor |
|---|---|
| Nombre | `PEBAI Systems` |
| Web | `https://pebaisystems.es` |
| Teléfono | `+34 624 84 27 99` |
| Email | `equipo@pebaisystems.es` |
| Descripción corta (≤ 200) | `Consultoría de procesos e Inteligencia Artificial para empresas de cualquier sector en España. Agentes de WhatsApp, automatización y software a medida.` |
| Zona | Toda España, en remoto (negocio de área de servicio, sin dirección pública) |
| Horario | el que Daniel confirme; sin él, no rellenar |

## Descripción larga (Bing Places, ≤ 750 caracteres)
```
PEBAI Systems es una consultoría de procesos e Inteligencia Artificial para empresas de cualquier sector en España. Primero entendemos cómo trabajáis; después construimos. Implantamos agentes de IA que atienden a los clientes por WhatsApp, teléfono y web, automatizamos tareas manuales como pedidos, presupuestos o facturas y conectamos todo a los programas que la empresa ya usa. También desarrollamos aplicaciones a medida, trabajamos que ChatGPT, Gemini y Perplexity entiendan y recomienden la empresa, y formamos a los equipos. Si algo se resuelve sin Inteligencia Artificial, lo decimos claro. La consultoría inicial dura 25 minutos y es gratuita para cinco empresas al mes; después, de pago.
```

## Bing Places (5 minutos)
1. https://www.bing.com/forbusiness con la cuenta Microsoft del equipo (la de Bing Webmaster Tools).
2. «Importar desde Google» y elegir la ficha de PEBAI Systems; así conserva nombre, teléfono y web.
3. Comprobar que los datos de arriba coinciden y pegar la descripción larga si no la trae.
4. Categoría: la más parecida a `Consultor de gestión empresarial` y `Empresa de software`.
5. Verificar con lo que ofrezca Bing y apuntar la URL de la ficha para registrarla (`geo_datos.py localo-cita bing.com <url>`).

## Apple Business Connect
- **Ficha en Apple Maps: no.** Apple no admite negocios de área de servicio sin local abierto al público, y PEBAI no tiene dirección pública. No intentarlo.
- **Marca sin local (logo y nombre en las apps de Apple):** posible. Pasos: business.apple.com, Apple ID del equipo, elegir «Marca», pegar los datos comunes y subir el logo cuadrado (`assets/brand/pebai-systems/foto-de-perfil/`). Apple puede pedir razón social y NIF: ese dato lo tiene Daniel.
- **Logo en Mail: bloqueado hoy.** Comprobado el 27/10/2026 en el DNS de `pebaisystems.es`: DMARC está en `v=DMARC1; p=none` (sin política) y Apple exige `quarantine` o `reject`. SPF existe (`include:_spf.mail.hostinger.com`). Antes de pedirlo hay que subir DMARC en hPanel (Daniel: DNS, registro TXT `_dmarc`) tras comprobar que todo el correo sale firmado con DKIM. Hasta entonces no se pide.

## Qué queda para Daniel
Crear las cuentas (Bing con importación desde Google y, si quiere, Apple Marca), pegar y verificar. Prioridad: Bing primero (alimenta a Copilot y a la búsqueda de ChatGPT); Apple, baja.
