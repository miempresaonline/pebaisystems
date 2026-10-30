# Coherencia NAP de los perfiles `sameAs` (27/10/2026)

Referencia: Organization de la portada (nombre `PEBAI Systems`, web `https://pebaisystems.es/`, teléfono `+34 624 84 27 99`) y descripción de `perfiles/google-business-profile.md`. Comprobado con WebFetch desde la nube; las redes que bloquean a los robots no se pueden ver (no se evita el bloqueo).

| Perfil | Nombre | Web | Teléfono | Descripción | Veredicto | Quién cambia |
|---|---|---|---|---|---|---|
| LinkedIn (company/pebai-systems) | PEBAI Systems ✔ | pebaisystems.es ✔ | no visible sin sesión | «consultoría de procesos e IA para empresas en España…», 25 min, 5 empresas al mes ✔ | Cuadra. Ubicación pública: Valencia 46192 | Nadie |
| Facebook (id 61595234630397) | «PEBAI Systems \| Valencia» ✘ | no visible | no visible | no visible | Nombre con ciudad: no coincide con Google (la ficha prohíbe palabras o ciudad en el nombre) | Daniel: dejar el nombre en `PEBAI Systems` y la ciudad en la ubicación |
| YouTube (@pebaisystems) | PEBAI Systems ✔ | no visible | no visible | empieza «IA y automatización para negocios: menos tareas repetitivas, más clientes atendidos.» ✔ (tema) | Nombre cuadra; web y teléfono no se ven desde la nube | Daniel: comprobar en «Información» que pone la web |
| Instagram (@pebaisystems) | — | — | — | — | No verificable: Instagram devuelve 429 a los robots | Daniel (1 min): nombre `PEBAI Systems`, web `https://pebaisystems.es`, bio con la misma descripción |
| TikTok (@pebaisystems) | — | — | — | — | No verificable: TikTok devuelve 403 | Daniel (1 min): igual que Instagram |
| X (@pebaisystems) | — | — | — | — | No verificable: X devuelve 403 | Daniel (1 min): igual que Instagram |

## Conclusiones
- Lo único que no cuadra con certeza es el **nombre de Facebook** (`| Valencia`). Es también un punto abierto en `embudo-y-voz.md` (ubicación: la web y el pie ya dicen València, la ficha oculta la dirección).
- Citas en Localo: LinkedIn ya estaba registrada.
- Las tres redes que bloquean a los robots quedan como comprobación de Daniel; no hay otra forma desde la nube.

## Revisión 29/10/2026 (Local)
- **Foto de El Amparo en la ficha:** estaba programada en Metricool (red `gmb`, tipo `photo`) para hoy 29/10 a las 11:00. Daniel sacó a El Amparo de los directorios el 28/10 y no hay su respuesta sobre la ficha, así que la he pasado a **borrador** (reversible, post 2639695153274374130). Si Daniel confirma que sí, se vuelve a programar.
- **LinkedIn 5/11 17:00 (El Amparo):** es de Redes, ya tiene su encargo; sigue programado hasta que ellos lo cambien (se lo señalo en `novedades.md`).
- **Fichas nuevas en revisión:** agentes.ai (sitemap sin `pebai`), TechBehemoths (publicada, pero WebFetch devuelve 403 a robots; no verificable desde la nube), GoodFirms, DesignRush y mejores-agencias.com: sin resultado público en WebSearch. Se vuelve a mirar el próximo turno.
- **Dirección en TechBehemoths:** el formulario exige calle y código postal (probado 28/10); se mantiene la de antes hasta que Daniel decida. No se inventa otra.

## Perfiles públicos sin calle (29/10/2026)
| Perfil | Resultado |
|---|---|
| Trustpilot (pebaisystems.es) | Nombre `PEBAI Systems`, teléfono `+34 624 84 27 99`, web y email correctos; ubicación solo «València, Spain», sin calle. Cuadra |
| Sortlist, Crunchbase | WebFetch devuelve 403 a robots: no verificable desde la nube. Daniel (1 min en Chrome): comprobar que no muestran calle |
| GoodFirms | Sin ficha pública (bloqueada hasta tener clientes para entrevista, `perfiles/goodfirms.md`); no hay dirección que quitar |
| TechBehemoths | Muestra la sede que exige el formulario (Plaça de l'Ajuntament); pendiente de decisión (arriba) |
| agentes.ai, DesignRush | Sin ficha pública aún |

## Revisión 30/10/2026 · páginas nuevas (Local)
Referencia: ficha de Google (`PEBAI Systems`, `+34 624 84 27 99`, `https://pebaisystems.es`, base en Valencia, calle oculta). Comprobado sobre `website-pebai/dist/` en `main` [V].

| Página | Nombre visible | Teléfono | Ciudad | Web | JSON-LD | Veredicto |
|---|---|---|---|---|---|---|
| `/quienes-somos/` | PEBAI Systems | `tel:+34624842799` (pie) | València (texto y pie) | sí | `AboutPage`, 2 `Person`; sin `Organization` propia, enlaza al `#organization` de la portada | Cuadra |
| `/casos-de-exito/` | PEBAI Systems | `tel:+34624842799` (pie) | València (pie) | sí | `CollectionPage` + `ItemList`; sin `Organization` propia | Cuadra |
| Pie de `/agentes-ia/` (y guías con el pie nuevo) | PEBAI Systems | `tel:+34624842799` | València | sí | `WebPage`, `Article`, `FAQPage` | Cuadra |

No cuadra (para Técnico, es JSON-LD de la portada):
- La portada declara un segundo nodo `#service` con nombre **«PEBAI Systems | Consultoría de procesos e Inteligencia Artificial»**. Es el nombre con palabras clave que Google prohíbe en la ficha y que Bing copió. Propuesta: poner `name` = `PEBAI Systems` y dejar el texto largo en `alternateName` o `description`.
- `Organization` de la portada: `address` solo con `addressCountry: ES`, sin `addressLocality`. Propuesta: añadir `addressLocality: València` (sin calle), para que coincida con las páginas y la ficha.
- Pequeño matiz de grafía: la web usa «València» y la ficha/directorios «Valencia»; Google la trata igual, no se cambia.
