# LinkedIn: página de empresa

- Alta: https://www.linkedin.com/company/setup/new/ (menú "Para negocios" → "Crear una página de empresa").
- Coste: gratis.
- Requisitos (🟡 guías de terceros, LinkedIn no los publica juntos): perfil personal con nombre real y el puesto actual en "Experiencia"; email del dominio de la empresa añadido y confirmado en la cuenta (Gmail, Yahoo y similares no sirven; un dominio solo puede crear una página); perfil personal con cierta antigüedad y algunos contactos. **No pide CIF.**
- Por qué es la primera: la AIO del prompt 3 cita linkedin.com y, al no encontrar a PEBAI, la confunde con Pegasystems, Pibisi y Pebi Technologies. 🟡 Según Everything PR, el 59 % de las citas de LinkedIn en Perplexity son páginas de empresa. Es el `sameAs` que falta en el JSON-LD (plan GEO, Fase 2).

## Cómo darse de alta

1. Daniel o Adrián: en su perfil personal, añadir `equipo@pebaisystems.es` en Ajustes → Iniciar sesión y seguridad → Direcciones de email, y confirmarlo.
2. Ir a la URL de alta, elegir "Empresa" y rellenar los campos de abajo. Marcar la casilla de representante autorizado.
3. Subir logo y portada; rellenar "Acerca de", especialidades y botón.
4. Añadir al otro fundador como superadministrador (Herramientas de administración → Administradores).
5. Los dos fundadores editan su puesto actual en "Experiencia" y eligen la página de PEBAI Systems en el desplegable de empresa, para que salga el logo y la relación quede conectada.
6. Pasar la URL de la página (`https://www.linkedin.com/company/…`) al `sameAs` de `Organization` en el JSON-LD y a `llms.txt`/`llms-full.txt`.

## Campos

| Campo | Valor (copiar y pegar) | Límite |
|---|---|---|
| Nombre | `PEBAI Systems` | — |
| URL pública | `linkedin.com/company/pebai-systems` (si está ocupada: `pebaisystems`) | — |
| Sitio web | `https://pebaisystems.es` | — |
| Sector | `Servicios y consultoría de TI` (IT Services and IT Consulting). Alternativa: `Servicios de consultoría empresarial` | lista cerrada |
| Tamaño de la empresa | `2-10 empleados` | lista cerrada |
| Tipo de empresa | `Empresa privada` 🔵 (cambiar si el alta jurídica dice otra cosa) | lista cerrada |
| Año de fundación | dejar vacío: `[PENDIENTE: dato del equipo]` | opcional |
| Ubicación | 🔵 dejar vacía hasta que haya dirección; si obliga, solo país `España` y la ciudad que decida el equipo, sin calle | opcional |
| Teléfono | `+34 624 84 27 99` | opcional |
| Logo | cuadrado, mín. 300 × 300 px, de `assets/brand/pebai-systems/foto-de-perfil/` (Oscuro Firma) | — |
| Portada | 1128 × 191 px, de `assets/brand/pebai-systems/banners/` | — |

### Eslogan (118 / 120 caracteres)
```
Consultoría de procesos e IA para empresas en España: chatbots, agentes de voz, software a medida y visibilidad en IA.
```

### Acerca de (descripción larga canónica; ≈ 1.950 / 2.000 caracteres)
```
PEBAI Systems es una consultoría de procesos e Inteligencia Artificial para empresas de cualquier sector en España. Primero entendemos la operativa; después, construimos. Si algo se resuelve sin Inteligencia Artificial, lo decimos claro.

Trabajamos en los tres puntos donde un negocio pierde más dinero:
• Clientes: sistemas que responden, cualifican y agendan presupuestos en tiempo real, las 24 horas, por WhatsApp, teléfono y web.
• Operativa: eliminamos tareas manuales repetitivas como partes de trabajo, pedidos, presupuestos y facturas.
• Sistemas: conectamos la Inteligencia Artificial a los programas y al CRM que la empresa ya usa (ERP, CRM, Holded), sin licencias nuevas ni cambiar lo que ya funciona.

Servicios:
• Software operativo a medida
• Chatbots con IA conectados a los documentos de la empresa
• Agentes de voz que atienden llamadas y agendan citas, también fuera de horario
• Visibilidad en buscadores de IA (GEO): que ChatGPT, Gemini o Perplexity recomienden a la empresa
• Formación práctica a equipos

Cómo trabajamos:
1. Consultoría inicial de 25 minutos en pantalla compartida, con mapa técnico de optimización, estimación de ahorro y esquema de procesos. Es gratuita solo para cinco empresas seleccionadas cada mes; cuando se completan las plazas, pasa a ser de pago.
2. Desarrollo e integración: dejamos el sistema funcionando de principio a fin, conectado a los programas de la empresa. Los proyectos de implantación parten de 1.500 €.
3. Acompañamiento continuo como departamento de Inteligencia Artificial de la empresa, con soporte y mejora continua.

Trabajamos con empresas con equipo (a partir de 3-5 empleados): construcción y reformas, instalaciones, clínicas, talleres, distribución, inmobiliarias y servicios profesionales, entre otras.

Equipo: Daniel Peñuela Ruiz (ingeniería de procesos y sistemas) y Adrián Ballesteros Moscardó (dirección de proyectos y consultoría), cofundadores.

Web: https://pebaisystems.es
```

### Especialidades (hasta 20; una por línea)
```
Consultoría de Inteligencia Artificial
Automatización de procesos
Chatbots con IA
Agentes de voz
Agentes de IA
Software a medida
Integración con CRM y ERP
Automatización de WhatsApp
Visibilidad en buscadores de IA
GEO (Generative Engine Optimization)
Formación en Inteligencia Artificial
Transformación digital de pymes
Ingeniería de procesos
```

### Botón personalizado
- Tipo: `Visitar sitio web` (o `Más información`).
- URL: `https://pebaisystems.es/li` (enlace corto de `docs/enlaces-y-utm.md`: lleva al vídeo con el origen LinkedIn ya puesto).

## Después del alta
- Primera publicación: presentación de la empresa con el vídeo de la home (sin cifras ni clientes).
- Perfiles personales de los fundadores: titular coherente, por ejemplo `Cofundador de PEBAI Systems · Ingeniería de procesos y sistemas` (Daniel) y `Cofundador de PEBAI Systems · Dirección de proyectos y consultoría` (Adrián). 🔵 Que cada uno lo ajuste a su gusto.
- Plan GEO: 2 publicaciones/semana por fundador (Fase 4).

Fuentes: [Usecarly, guía 2026](https://www.usecarly.com/blog/how-to-create-a-company-page-on-linkedin/) · [Connective, requisitos](https://wiki.connective.com.au/en/articles/749-requirements-for-adding-company-pages-on-linkedin) · [ClearView Social, límites de caracteres](https://clearviewsocial.com/blog/guide-linkedin-character-counts-limits/) · [Everything PR, índice de fuentes de Perplexity 2026](https://everything-pr.com/perplexity-citation-source-index-2026) · medición `docs/geo/mediciones/2026-10-21.md`.
