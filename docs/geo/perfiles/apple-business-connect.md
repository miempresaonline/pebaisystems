# Apple Business Connect

- Alta: https://business.apple.com (antes businessconnect.apple.com).
- Coste: gratis.
- Requisitos y límites:
  - **Ficha de Apple Maps**: 🟡 según guías de terceros y un caso en foros, Apple Maps solo admite negocios con local que los clientes visitan; los negocios de área de servicio con dirección oculta no pueden tener ficha (a un electricista sin local se la quitaron). Apple no lo aclara en su web.
  - **Marca sin local** (desde 2024): cualquier empresa, también sin local o solo online, puede registrar su marca (logo y nombre) para que aparezca en Mail, llamadas y otras apps de Apple.
  - **Logo en Mail (Branded Mail)**: Apple tiene que verificar la empresa; el dominio debe tener DMARC con política `quarantine` o `reject` (no `none`) y todos los correos firmados con DKIM. Hay que comprobarlo en el DNS de `pebaisystems.es` (correo en Hostinger) antes de pedirlo. 🟡 Apple puede pedir documentos de la empresa para verificarla: probablemente bloqueado hasta tener razón social y NIF.
- Evidencia de citas: ninguna en la medición. Apple Maps alimenta a Siri; para B2B pesa poco.
- Prioridad: **baja**. Hacerlo cuando exista la dirección y el alta jurídica.

## Cómo darse de alta (cuando toque)

1. business.apple.com → entrar con un Apple ID del equipo.
2. Elegir "Marca" (sin local) y rellenar los campos de abajo.
3. Verificación de la empresa (documentos que pida Apple).
4. Si se quiere el logo en Mail: comprobar DMARC/DKIM y verificar el dominio.

## Campos

| Campo | Valor |
|---|---|
| Nombre de la marca | `PEBAI Systems` |
| Web | `https://pebaisystems.es` |
| Teléfono | `+34 624 84 27 99` |
| Logo | `assets/brand/pebai-systems/foto-de-perfil/` (cuadrado, fondo sólido) |
| Categoría | `Consultoría` / `Servicios profesionales` (la más parecida) |
| Razón social / NIF | `[PENDIENTE: dato del equipo]` |
| Descripción | La frase canónica: `Consultoría de procesos e Inteligencia Artificial para empresas de cualquier sector en España.` |

Fuentes: [TechCrunch, Apple Business Connect para empresas sin local (oct. 2024)](https://techcrunch.com/2024/10/16/apple-debuts-new-business-tools-for-managing-presence-across-email-calls-and-tap-to-pay) · [heise, ampliación sin ubicación física](https://heise.de/-9984260) · [Wix, Apple Maps y negocios de área de servicio](https://wix.com/seo/learn/resource/get-your-business-on-apple-maps) · [Local Search Forum, caso de un electricista sin local](https://localsearchforum.com/threads/can-i-regain-my-presence-on-apple-maps-as-an-electrical-contractor-without-a-physical-storefront.60286/) · [Apple, requisitos de Branded Mail](https://support.apple.com/en-gb/guide/apple-business-connect/abcb22cbade5/web).
