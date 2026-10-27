# PEBAI Systems — Repositorio de la empresa

Monorepo con todos los sistemas de PEBAI Systems (pebaisystems.es).
**El repositorio es público**: aquí solo vive código y material de marca. Credenciales, datos de clientes y sesiones se quedan en local (ver [Seguridad](#seguridad)).

## Mapa de proyectos

| Carpeta | Qué es | Dónde corre |
|---|---|---|
| `website-pebai/` | Web corporativa + landings SEO/GEO. `dist/` **es** la web publicada | Hostinger (`public_html`) vía SFTP |
| `website-pebai/seo-engine/` | Generación masiva de landings, sitemap e IndexNow (manual) | Local → sube a Hostinger |
| `carousel-engine/` | Motor de carruseles (radar diario + render con Playwright) | GitHub Actions (manual) + local |
| `agente-whatsapp/` | Agente de captación por WhatsApp (Node + Baileys). Lo controla el panel; ver `docs/agente-whatsapp.md` | Hostinger 24/7 (PM2) vía `deploy/desplegar_agente_whatsapp.py` |
| `prospeccion/` | Motor de prospección gratuito: Google Maps (gosom) + buscador + rastreo de webs → empresas activas con móvil, email y fijo. Ver `docs/prospeccion.md` | Local (luego GitHub Actions) |
| `deploy/` | Utilidades de servidor (p. ej. `apagar_bots_y_geo.py`) | Local |
| `docs/` | Sistema de contenido, automatización Instagram, esquema Miro | — |
| `ideas/` | Modelos de negocio y benchmarks | — |
| `assets/` | Marca (logos, kit), equipo y piezas sociales | — |
| `.agents/skills/` | Skills de los agentes (copy, SEO, carruseles, ventas…) | — |

Sin publicación automática de GEO desde el 14/10/2026. El único bot activo es el agente de WhatsApp (desde el 15/10/2026, a petición del equipo).

Carpetas **locales que nunca se suben**: `privado/` (accesos a servidores), `documentos/` (contratos y presupuestos), `scratch/` (pruebas, capturas, vídeos), `assets/clients/`.

## Despliegue en Hostinger

Todas las credenciales se leen de `.env` en la raíz (plantilla: `.env.example`).

```bash
# Solo lo que cambió en uno o varios commits (recomendado)
python website-pebai/scripts/deploy_changed.py <commit>

# Web completa (sube website-pebai/dist)
python website-pebai/scripts/deploy.py
```

## Seguridad

- **Nunca** escribir claves, contraseñas o tokens en el código: usar `.env` (raíz o del proyecto) o `C:/programacion/APIs/`.
- Antes de cada commit revisar `git status` y no usar `git add -f` sobre nada ignorado.
- Si una clave llega a GitHub por error: **rotarla primero**, limpiar después.
