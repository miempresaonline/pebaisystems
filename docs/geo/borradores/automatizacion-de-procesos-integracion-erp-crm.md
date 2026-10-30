# Borrador · /automatizacion-de-procesos/integracion-erp-crm/

Estado: **texto completo el 30/10/2026 (Contenido, turno de las 10:00), sin maquetar.** Encargo del Jefe del 29/10 tarde (`pilares.md`, subpilar 2 de automatización). La FAQ de integración de la madre se queda corta y enlazará aquí. Cola: después de presupuestos (lun 2/11) y de cómo elegir consultora; decide el Jefe el día.

## Ficha

- **URL:** `https://pebaisystems.es/automatizacion-de-procesos/integracion-erp-crm/`
- **Title (≤ 60):** `Conectar la IA con tu ERP o CRM: Holded, Odoo, A3 | PEBAI` (57)
- **Meta description (≤ 155):** `Qué puede leer y escribir la IA en el programa de gestión que ya usáis, qué ofrece cada programa a 30/10/2026 y qué hacer si no tiene API.` (139)
- **H1:** `¿Se puede conectar la Inteligencia Artificial al programa de gestión que ya usamos?`
- **Autor:** Daniel Peñuela Ruiz (`#daniel`). CTA `/consultoria-gratuita/?cta=pilar_automatizacion-integracion`.
- **Palabras (pilares.md):** intención «conectar lo que ya tengo». Conversacionales: «¿hay que cambiar de programa para usar IA?», «¿se puede conectar ChatGPT a Holded?», «mi programa no tiene API».
- **301 al publicar:** de `pilares.md` §5, cambiar el destino de `integracion-ia-a3erp-asesorias-espana` y `agente-ia-sap-business-one-espana` (hoy 301 a `/automatizacion-de-procesos/`) a esta página. Encargo a Técnico el día que salga.

### Anticanibalización (comprobado el 30/10: sitemap, `dist/`, borradores)
- No existe la URL ni carpeta. La madre `/automatizacion-de-procesos/` tiene el H2 «Conectar los programas que ya usáis» (tres formas, de la más estable a la que más mantenimiento pide), la FAQ «¿Hay que cambiar de programa?» y la línea «Próximamente» de esta guía (`index.html:588`). **La madre se queda con el resumen**; aquí, programa por programa, qué se lee y se escribe, permisos, qué hacer sin API y qué pasa cuando el programa cambia. Al publicar: cambiar el «Próximamente» por el enlace y añadir al final del H2 de la madre «Programa por programa: [conectar la IA con tu ERP o CRM](…)».
- `/ia-para-empresas/#programas` («¿Hay que cambiar de programas?»): respuesta corta; enlazará aquí.
- `/agentes-ia/whatsapp/#conectar` (agente con CRM, tienda o agenda): canal de atención. Aquí, el programa de gestión. Se enlaza, no se repite.
- `/automatizacion-de-procesos/presupuestos/` (2/11): el flujo del presupuesto; aquí solo el paso de escribirlo en el programa.

### Fuentes verificadas (30/10/2026)

| Dato | Fuente | Comprobado |
|---|---|---|
| Holded: API oficial con clave generada en «Ajustes > API», enviada en la cabecera Authorization; webhooks; límites con «tres ventanas deslizantes»; áreas de ventas (facturas, presupuestos, pedidos, albaranes), compras, catálogo, contabilidad (asientos, plan contable), tesorería, CRM (embudos y oportunidades) y más; servidor MCP «lanzado en junio de 2026» para conectar asistentes de IA | Holded, portal de desarrolladores, https://www.holded.com/es/desarrolladores | Leído 30/10 (la URL vieja developers.holded.com hace 301 aquí) |
| Odoo 19: nueva API externa JSON-2 (`/json/2/<modelo>/<método>`, cabecera `Authorization: bearer <clave>`); claves de API con descripción y duración obligatorias; las API XML-RPC y JSON-RPC «are scheduled for removal in Odoo 22 (fall 2028) / Odoo Online 21.1 (winter 2027)» | Odoo, «External JSON-2 API», documentación 19.0, https://www.odoo.com/documentation/19.0/developer/reference/external_api.html | Leído 30/10 |
| Odoo: «Access to data via the external API is only available on Custom Odoo pricing plans»; no en One App Free ni Standard | Odoo, «External API», documentación 18.0, https://www.odoo.com/documentation/18.0/developer/reference/external_api.html (y el mismo aviso en la 19.0) | Leído 30/10 |
| TeamSystem Delsol (Factusol, Contasol, Nominasol, Delsol): «API DELSOL» para acceder a los datos de sus soluciones, «pensada básicamente para empresas desarrolladoras que quieran o necesiten integrar sus aplicaciones con nuestras soluciones NUBE»; requiere inscribirse | Software del Sol, https://www.sdelsol.com/api/ | Leído 30/10 |
| a3ERP: sin API REST o SOAP pública; integración por acceso a la base de datos o SDK del fabricante y un conector instalado donde corre el programa | Conectores de terceros (Chift, https://chift.eu/blog/a3erp-api-integration-how-to-connect-set-up-and-follow-best-practices), **[S]**: la web de Wolters Kluwer da 403 desde nuestra comprobación | No es fuente oficial: en la página, «no hemos encontrado documentación pública del fabricante» |
| Sage (50, 200): developer.sage.com y sage.com/es-es dan 403 desde la nube | Intento del 30/10 | No se afirma nada de su API; mismo criterio que la madre |
| Datos del INE (60,9 % de empresas de 10 o más con internet usa ERP; 33,9 % CRM, 1T 2026) | Ya publicados en la madre (INE, 22/10/2026) | Se enlazan, no se repiten |
| Contrato de encargado (art. 28 RGPD) | PDF del DOUE leído el 30/10 (borrador de cómo elegir consultora) | Se cita en una línea |
| Casos: Santacruz (app nueva conectada a sus herramientas y base de datos migrada de la antigua); Fran García Cars (app de revisiones unida al asistente de WhatsApp) | `casos.md` | Sin cifras |

**Descartado:** precios y planes de Holded u Odoo (cambian y no se ponen precios); comparar programas entre sí («cuál es mejor»): no es el tema; nombres de plataformas de integración de pago como recomendación.

## Texto

**Respuesta corta.** Casi siempre sí, sin cambiar de programa. Si el programa tiene API oficial, como Holded u Odoo en el plan que la incluye, la IA puede leer clientes, productos y documentos y dejar borradores para que una persona los apruebe. Si no la tiene, se conecta por exportaciones o por su base de datos, con más mantenimiento. (57 palabras)

**En cinco puntos:**
- Lo primero es saber qué versión y qué plan tenéis: la misma marca puede tener API en la nube y no en la instalación local, o solo en un plan.
- Leer es fácil y seguro; escribir se hace en borrador o en un estado que una persona aprueba.
- La conexión usa una clave con los permisos justos, a nombre de vuestra empresa, que se puede revocar.
- Si el programa no tiene API, hay alternativas (ficheros, base de datos), pero se rompen más y hay que vigilarlas.
- Los programas cambian: Odoo retirará sus API antiguas en 2027 en la nube y en 2028 en Odoo 22. Quien conecta tiene que decir quién lo adapta.

### H2 · Qué puede leer y escribir la IA en tu programa de gestión {#leer-escribir}

| Área | Lo que suele leer | Lo que puede escribir (en borrador) |
|---|---|---|
| Clientes y contactos | Ficha, historial, condiciones | Contacto nuevo desde un WhatsApp o un correo |
| Catálogo y stock | Productos, precios de tarifa, existencias | Nada sin revisión: precios y stock los toca una persona |
| Ventas | Presupuestos, pedidos, albaranes y facturas emitidas, su estado | Presupuesto o pedido en borrador para aprobar |
| Compras | Facturas de proveedor, pedidos de compra | Factura de proveedor leída de un PDF, pendiente de revisar |
| CRM | Oportunidades y en qué fase están | Oportunidad nueva o una nota en la que ya existe |
| Contabilidad y tesorería | Asientos, cobros y pagos pendientes | Normalmente nada: es terreno de la asesoría |

Una regla sencilla: **la IA prepara, una persona confirma.** Un pedido mal leído en borrador se corrige en un minuto; uno enviado al cliente o contabilizado, no. Las facturas las emite siempre vuestro programa de facturación, que es el que tiene que cumplir VeriFactu ([qué cambia con la factura electrónica](/automatizacion-de-procesos/#factura-electronica)).

### H2 · Programa por programa: qué ofrece cada uno a 30 de octubre de 2026 {#programas}

| Programa | Conexión oficial | Qué hay que mirar |
|---|---|---|
| **Holded** | API oficial con clave (Ajustes > API) y webhooks: avisos cuando ocurre algo, como una factura nueva. Desde junio de 2026, servidor MCP para conectar asistentes de IA | Qué datos emiten aviso y cuáles hay que consultar cada cierto tiempo; los límites de peticiones |
| **Odoo** | API externa (JSON-2 desde Odoo 19), con claves que caducan | Solo en los planes Custom: en One App Free y Standard no hay acceso por API. Las API XML-RPC y JSON-RPC se retiran en Odoo Online 21.1 (invierno de 2027) y en Odoo 22 (otoño de 2028) |
| **Factusol, Contasol y Delsol** (TeamSystem Delsol) | API DELSOL para sus soluciones en la nube, previa inscripción | Si tenéis la versión instalada en el ordenador, no consta API pública: ficheros o base de datos |
| **a3ERP** | No hemos encontrado documentación pública del fabricante | Se conecta por su base de datos o por herramientas del fabricante, con un programa instalado donde corre a3ERP. Se confirma con vuestra versión |
| **Sage 50 y Sage 200** | No hemos podido comprobar documentación pública que valga para todas las versiones | Se confirma en la consultoría, con la versión y el contrato que tenéis |
| **CRM** (HubSpot, Pipedrive y similares) | La mayoría tiene API oficial | Qué plan la incluye y cuántas peticiones permite |

Lo que tiene API hoy puede cambiar mañana: comprobadlo con la versión que tenéis antes de contratar nada.

### H2 · Cómo se conecta sin dar más acceso del necesario {#permisos}

- **Un usuario o una clave solo para la integración**, no la del gerente. Si algo falla o se deja de usar, se revoca sin tocar a nadie.
- **Permisos justos:** si solo tiene que leer pedidos y crear borradores, que no pueda borrar ni contabilizar.
- **A nombre de vuestra empresa:** la clave se genera en vuestra cuenta y la guardáis vosotros. Si la integración la hace alguien de fuera, que conste qué accesos tiene y cómo se le retiran (lo explicamos en [cómo elegir consultora](/ia-para-empresas/como-elegir-consultora/#propiedad), cuando esté publicada).
- **Claves con caducidad** cuando el programa lo permite, como en Odoo, que obliga a ponerles duración.
- **Un registro de lo que hace:** qué ha leído, qué ha escrito y cuándo, para poder revisar un error.
- **Datos personales:** si quien conecta trata datos de vuestros clientes, firma un contrato de encargado del tratamiento (art. 28 del RGPD).

### H2 · Si el programa no tiene API {#sin-api}

Hay salida, con más mantenimiento:

1. **Exportar e importar ficheros.** Si el programa saca y mete ficheros (Excel, CSV, XML), se automatiza ese intercambio cada cierto tiempo. Es lo más seguro sin API.
2. **Leer su base de datos.** Muchos programas instalados guardan los datos en una base que se puede consultar. Para leer funciona bien; para escribir hay que tener cuidado, porque el programa puede no enterarse de un cambio hecho por fuera. Se hace con copia de seguridad y probando antes.
3. **Un programa intermedio.** Cuando el programa se queda corto en lo básico, a veces compensa una aplicación propia que haga lo que falta y se conecte al programa para lo demás.
4. **Cambiar de programa.** Solo si no deja sacar ni meter datos de ninguna forma o ya no sirve para lo básico. Y mejor esperar al nuevo antes de conectar nada.

En **Suministros Industriales Santacruz** la aplicación que usaban tenía veinte o treinta años. Hicimos una nueva, la conectamos a sus herramientas y migramos su base de datos para no perder el histórico ([el caso](/automatizacion-de-procesos/#casos)).

### H2 · Qué pasa cuando el programa se actualiza {#mantenimiento}

Una integración no se hace una vez y ya. Los programas cambian sus API, sus planes y sus límites:
- Odoo ha anunciado la retirada de sus API antiguas en su versión en la nube para el invierno de 2027 y en Odoo 22 para el otoño de 2028; las integraciones hechas con ellas habrá que pasarlas a la nueva.
- Un cambio de plan puede quitar el acceso por API.
- Un campo nuevo o renombrado puede hacer que un pedido llegue incompleto.

Por eso, antes de empezar, que quede claro quién vigila la integración, cómo os enteráis si deja de funcionar (un aviso cuando falla, no cuando un cliente se queja) y qué incluye el mantenimiento. Las partidas que conviene separar en el presupuesto están en [cuánto cuesta implantar IA](/ia-para-empresas/cuanto-cuesta/).

### H2 · Cuándo no conviene conectar {#cuando-no}

- Si la tarea pasa pocas veces al mes: copiarla a mano sale más barato que mantener una integración.
- Si vais a cambiar de programa en unos meses.
- Si los datos del programa están desordenados (clientes duplicados, productos sin código): primero se ordenan, después se conecta.
- Si nadie del equipo va a revisar los borradores que deja la IA.

### FAQ (6, idénticas en el JSON-LD)

1. **¿Hay que cambiar de programa de gestión para usar IA?**
   Casi nunca. Si el programa tiene API oficial, la IA se conecta a él; si no, por exportaciones de ficheros o por su base de datos, con más mantenimiento. Solo conviene cambiar si no deja sacar ni meter datos o ya se queda corto en lo básico.

2. **¿Se puede conectar ChatGPT o Claude a Holded?**
   Sí. Holded tiene API oficial con clave y webhooks, y desde junio de 2026 un servidor MCP para conectar asistentes de IA. Lo importante es dar a la conexión solo los permisos necesarios y que lo que escriba quede en borrador hasta que una persona lo apruebe.

3. **¿Odoo tiene API en todos los planes?**
   No. Según la documentación de Odoo, el acceso a los datos por la API externa solo está disponible en los planes Custom; en One App Free y Standard no. Además, sus API XML-RPC y JSON-RPC se retiran en Odoo Online 21.1 (invierno de 2027) y en Odoo 22 (otoño de 2028).

4. **¿Qué hago si mi programa no tiene API?**
   Se puede automatizar el intercambio de ficheros que el programa exporta e importa, o leer su base de datos si está instalado en vuestro equipo. Para escribir datos por fuera hay que tener más cuidado: copia de seguridad y pruebas antes. Si no deja hacer nada, toca valorar otro programa.

5. **¿Puede la IA crear facturas en mi programa?**
   Puede preparar el borrador o dejar la factura de proveedor leída para revisar. La factura a un cliente la emite vuestro programa de facturación, que es el que tiene que cumplir VeriFactu, y conviene que una persona la confirme antes.

6. **¿Cuánto cuesta conectar la IA al ERP o al CRM?**
   Depende de la empresa: de cuántos programas hay que conectar, de si tienen API oficial y de qué tiene que leer y escribir. Sin API, el mantenimiento pesa más. Se presupuesta después de la consultoría, con vuestros programas y versiones delante.

### Puente final

**H2:** ¿Quieres saber si tu programa de gestión se puede conectar sin cambiarlo?
En la consultoría miramos qué programas usáis, en qué versión y plan, y qué proceso conviene conectar primero. Si con una exportación o una herramienta que ya tenéis basta, te lo decimos claro.
KPIs de siempre (25 minutos · gratuita para 5 empresas al mes; después, de pago · sin compromiso). Botón `Solicitar 1 de las 5 plazas (0 €)` → `/consultoria-gratuita/?cta=pilar_automatizacion-integracion`. «Nos vemos en la sesión.»

### Fuentes (bloque visible, consultadas el 30/10/2026; reverificar al publicar)

1. Holded, portal de desarrolladores. holded.com/es/desarrolladores
2. Odoo, «External JSON-2 API», documentación 19.0. odoo.com
3. Odoo, «External API», documentación 18.0 (planes con acceso). odoo.com
4. Software del Sol (TeamSystem Delsol), API DELSOL. sdelsol.com/api
5. INE, Encuesta de uso de TIC y comercio electrónico en las empresas, 1T 2026 (el enlace de la madre).
6. Reglamento (UE) 2016/679 (RGPD), art. 28 (PDF del DOUE en boe.es).

### Checklist antes de publicar

- [ ] Reverificar Holded, Odoo y Delsol el día de publicar (cambian).
- [ ] Probar otra vez Wolters Kluwer y Sage (dan 403 desde la nube); si se leen, sustituir las filas de a3ERP y Sage por lo que diga el fabricante.
- [ ] Anclas de la madre: `/automatizacion-de-procesos/#factura-electronica` y `#casos` (comprobar el id exacto al maquetar).
- [ ] Enlace a `/ia-para-empresas/como-elegir-consultora/#propiedad` solo si ya está publicada; si no, quitar la frase.
- [ ] Maquetar con el diseño de /automatizacion-de-procesos/; 2 tablas con `scope` y `caption`; 6 FAQ = JSON-LD; 0 prohibidas; móvil a 390 px.
- [ ] Al publicar: 301 de las 2 URLs viejas (Técnico), enlace desde la madre y desde `/ia-para-empresas/#programas`, sitemap y llms.
