# Casos reales (datos de Daniel, 22/10/2026)

Para montar `/casos/` (página madre) y una página por caso. Imágenes ya difuminadas en `website-pebai/dist/casos/img/` (los originales no se suben: están en `assets/clients/casos/`, solo en local).

Reglas para estas páginas:
- Solo lo que está aquí. **No inventar cifras, plazos ni frases del cliente.** Si falta un dato, se escribe sin él.
- Nombres de empresa: autorizados por Daniel. **Nombres de las personas de contacto: no**, hasta que el cliente dé permiso y una frase suya real.
- Sin precios. Sin «auditoría», «hoja de ruta» ni el resto de palabras prohibidas (`embudo-y-voz.md`).
- JSON-LD por página: WebPage + BreadcrumbList + Article (autor #daniel) con `about` la organización del cliente; en `/casos/`, ItemList de los casos.
- Enlazar cada caso con su servicio: apps y software a medida → `/automatizacion-de-procesos/` (cuando exista) o la portada; chatbot de WhatsApp → `/agentes-ia/`.

## 1. Fran García Cars (fran-garcia-cars)
- Sector: importación y revisión de vehículos (revisiones técnicas de coches para clientes).
- Problema: hacían las revisiones a mano y mandaban las fotos por WhatsApp, desordenadas. Había líos con los clientes y se perdía mucho tiempo.
- Qué hicimos:
  1. **App de gestión de revisiones**: todo el flujo en una aplicación (expedientes, fotos, revisores, aprobación técnica, licitaciones y pujas). El cliente ve su revisión con un diseño cuidado, no un carrusel de fotos sueltas. Hay lecturas automáticas con IA en parte del proceso. Se le siguen añadiendo funciones.
  2. **Asistente de IA para WhatsApp con panel**: responde las preguntas frecuentes con toda la información de la empresa (afinado hasta que contesta como un responsable), agenda citas y deriva a una persona cuando la consulta no está documentada. El equipo gestiona las conversaciones desde un panel.
- Resultado (panel de la app, año 2026, captura del 22/10/2026): 168 expedientes en curso, 400 unidades aprobadas, 98 % de tasa de aprobación (400 aptas / 9 descartadas), 659 usuarios registrados en la app, 18 licitaciones adjudicadas, 62.370 fotos registradas en el periodo, tiempo medio de peritaje 29,3 h. Según Daniel, hoy la app es una de sus principales herramientas de trabajo y la usan a diario.
- Imágenes: `casos/img/fran-garcia-app.webp`, `casos/img/fran-garcia-whatsapp.webp`.

## 2. Construcciones Gargom (gargom)
- Sector: construcción.
- Problema: usaban un programa antiguo que les limitaba.
- Qué hicimos: **aplicación a medida** para gestionar sus obras: presupuestos, certificaciones, gastos por tipo, pagos, personal y proveedores, y la rentabilidad de cada obra, todo centralizado y hecho a su manera.
- Resultado: más organización y toda la información de la empresa en un solo sitio. Sin cifras (las del panel son confidenciales).
- Imagen: `casos/img/gargom-app.webp`. Logo: el de su web (buscar «Construcciones Gargom»).

## 3. Suministros Industriales Santacruz (santacruz)
- Sector: suministros industriales, con sedes en España, Francia, Países Bajos y Bélgica.
- Problema: una aplicación de 20-30 años, débil en seguridad (la llegaron a atacar) y sin las funciones que necesitaban.
- Qué hicimos: **aplicación nueva, segura y a medida**, en 4 idiomas, con control de almacén y pedidos por sede. Nos conectamos a sus herramientas y migramos la base de datos de la aplicación antigua.
- Resultado: la están empezando a usar; ya tiene cargado el histórico de 2026 de la antigua (343 pedidos en las 4 sedes, 97,4 % enviados a técnico). No dar facturación.
- Imagen: `casos/img/santacruz-app.webp`.

## 4. Residencia El Amparo (el-amparo)
- Sector: residencia de mayores (Fundación El Amparo).
- Problema: una web muy antigua y un WordPress que parte del equipo no sabía usar.
- Qué hicimos: web nueva y un **portal de gestión a medida** para que el equipo publique subvenciones y noticias y reciba en un solo sitio las candidaturas de empleo y las solicitudes y visitas de familias.
- Resultado: recién entregado (octubre de 2026). Ya tiene publicadas 16 subvenciones oficiales (2020-2026). El cliente ha quedado contento y vendrán más trabajos. Decir que es reciente; no dar cifras de uso.
- Imagen: `casos/img/el-amparo-panel.webp` (las partes sin datos todavía van difuminadas).

## Próximos (cuando estén): app de fútbol, otro chatbot de WhatsApp, empresa de coworking.
