# Artículo de LinkedIn · diciembre 2026

Título: ¿Puedo conectar la Inteligencia Artificial con el programa de gestión que ya uso?

Estado: BORRADOR COMPLETO (4/11/2026, Redes). Sale de `borradores/automatizacion-de-procesos-integracion-erp-crm.md` (fuentes leídas el 30/10 y el 3/11). Lo publica Daniel (Metricool no publica artículos). Antes de publicar, comprobar que `/automatizacion-de-procesos/integracion-erp-crm/` da 200 (sale el 6/11). Tema distinto de octubre (ChatGPT) y noviembre (elegir consultora).

---

¿Puedo conectar la Inteligencia Artificial con el programa de gestión que ya uso? Casi siempre sí, sin cambiar de programa. Si tu programa tiene una API oficial, la IA puede leer clientes, productos y documentos y dejar borradores para que una persona los apruebe. Si no la tiene, se conecta por ficheros o por su base de datos, con más mantenimiento.

Esa es la respuesta corta. La larga depende de tres cosas que conviene mirar antes de hablar con nadie.

## 1. Qué versión y qué plan tienes

La misma marca puede tener API en la nube y no en la instalación del ordenador, o solo en un plan concreto. Por ejemplo, según su documentación, el acceso a datos por API de Odoo solo está disponible en los planes Custom, no en One App Free ni en Standard. Holded ofrece una API oficial con clave desde Ajustes, avisos automáticos (webhooks) y, desde junio de 2026, un servidor MCP para conectar asistentes de IA. TeamSystem Delsol tiene una API para sus soluciones en la nube, con inscripción previa. De otros programas, como a3ERP o Sage, no hemos podido comprobar documentación pública del fabricante, así que no afirmamos nada: se confirma con tu versión y tu contrato.

Antes de contratar nada, averigua qué versión usas y qué plan tienes. Es la pregunta que más cambia el presupuesto.

## 2. Qué puede leer y qué puede escribir

Leer es fácil y seguro. Escribir se hace con cuidado.

- **Leer:** fichas de clientes, catálogo, presupuestos, pedidos, estado de las facturas, oportunidades del CRM.
- **Escribir, siempre en borrador:** un presupuesto o un pedido para aprobar, un contacto nuevo que llegó por WhatsApp, una factura de proveedor leída de un PDF y pendiente de revisar.
- **No tocar sin una persona:** precios, stock y contabilidad.

La regla es sencilla: la IA prepara y una persona confirma. Un pedido mal leído en borrador se corrige en un minuto. Uno enviado al cliente o contabilizado, no. Las facturas las emite siempre tu programa de facturación, que es el que tiene que cumplir VeriFactu.

## 3. Cómo se da el acceso

Una integración bien hecha no usa la clave del gerente.

- Un usuario o una clave solo para la integración, con los permisos justos (si solo debe leer pedidos y crear borradores, que no pueda borrar ni contabilizar).
- Generada en tu cuenta y a nombre de tu empresa, para que la guardes tú y puedas revocarla.
- Con caducidad cuando el programa lo permite. Odoo, por ejemplo, obliga a ponerles duración.
- Con un registro de lo que ha leído y escrito, para revisar cualquier error.
- Si quien conecta trata datos personales de tus clientes, con un contrato de encargado del tratamiento (art. 28 del RGPD).

## ¿Y si mi programa no tiene API?

Hay salida, con más mantenimiento:

1. **Ficheros.** Si el programa exporta e importa Excel, CSV o XML, se automatiza ese intercambio cada cierto tiempo. Es lo más seguro sin API.
2. **Su base de datos.** En programas instalados se puede consultar. Para leer funciona bien; para escribir hay que tener cuidado, porque el programa puede no enterarse de un cambio hecho por fuera. Se hace con copia de seguridad y probando antes.
3. **Una aplicación intermedia** que haga lo que al programa le falta y se conecte a él para lo demás.
4. **Cambiar de programa**, solo si no deja sacar ni meter datos de ninguna forma o ya no sirve para lo básico.

En Suministros Industriales Santacruz la aplicación que usaban tenía veinte o treinta años. Hicimos una nueva, la conectamos a sus herramientas y migramos su base de datos para no perder el histórico.

## El detalle que casi nadie pregunta: el mantenimiento

Una integración no se hace una vez y se olvida. Los programas cambian sus API, sus planes y sus límites. Odoo ha anunciado la retirada de sus API antiguas (XML-RPC y JSON-RPC) en su versión en la nube para el invierno de 2027 y en Odoo 22 para el otoño de 2028; lo conectado con ellas habrá que pasarlo a la nueva. Un cambio de plan puede quitar el acceso por API. Un campo renombrado puede hacer que un pedido llegue incompleto.

Antes de empezar, que quede por escrito quién vigila la integración, cómo te enteras si deja de funcionar (un aviso cuando falla, no cuando un cliente se queja) y qué incluye el mantenimiento.

## Cuándo no compensa conectar

- Si la tarea ocurre pocas veces al mes: copiarla a mano sale más barato.
- Si vas a cambiar de programa en unos meses.
- Si los datos están desordenados (clientes duplicados, productos sin código): primero se ordenan, después se conecta.

Si quieres ver con alguien qué conviene conectar primero en tu empresa, la consultoría de PEBAI Systems es una videollamada de 25 minutos, gratuita para cinco empresas al mes; después, de pago. Te llevas por escrito qué hacer primero, también si la respuesta es no tocar nada todavía.

La guía completa, programa por programa y con la fecha de cada fuente: https://pebaisystems.es/automatizacion-de-procesos/integracion-erp-crm/?utm_source=linkedin&utm_medium=articulo

https://pebaisystems.es/li/empresa

---

# Publicar el artículo (2 minutos, solo Daniel)

Metricool no publica artículos de LinkedIn (solo `post` y `poll`).

1. Entra en LinkedIn y abre la página de PEBAI Systems como administrador.
2. Pulsa «Escribir artículo».
3. Título: `¿Puedo conectar la Inteligencia Artificial con el programa de gestión que ya uso?`
4. Pega el texto desde el primer párrafo (debajo de la primera línea `---`) hasta el enlace final, con los subtítulos H2.
5. Portada: cualquiera de `docs/geo/borradores/imagenes/d-*.png`.
6. Publica un lunes o miércoles de diciembre a las 10:30, y antes comprueba que https://pebaisystems.es/automatizacion-de-procesos/integracion-erp-crm/ abre.
