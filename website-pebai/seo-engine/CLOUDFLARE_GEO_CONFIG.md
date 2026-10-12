# Guía Técnica: Edge Caching y Reglas de Cloudflare para PEBAI Systems

Este documento detalla la configuración exacta para **Cloudflare** y servidores web orientada a conseguir **PageSpeed 98-100**, indexación preferente en motores generativos (**GEO**) y entrega desde el Edge en menos de 50 ms.

---

## 1. Reglas WAF / Firewall: Bypass Prioritario para Bots de IA (GEO)

Para que **ChatGPT Search, Perplexity, Claude y Gemini** citen a `pebaisystems.es` como fuente de referencia autorizada, sus bots deben poder rastrear la web sin bloqueos por Bot Fight Mode o desafíos de JavaScript.

### 1.1. Expresión de Regla en Cloudflare WAF (Security → WAF → Custom Rules)
Crea una regla con nombre **`Allow_AI_Bots_GEO`**:

```
(http.user_agent contains "GPTBot") or 
(http.user_agent contains "OAI-SearchBot") or 
(http.user_agent contains "ChatGPT-User") or 
(http.user_agent contains "PerplexityBot") or 
(http.user_agent contains "ClaudeBot") or 
(http.user_agent contains "anthropic-ai") or 
(http.user_agent contains "Google-Extended") or 
(http.user_agent contains "Googlebot") or 
(http.user_agent contains "Bingbot") or 
(http.user_agent contains "Applebot-Extended") or 
(cf.client.bot)
```

- **Action:** `Skip`
- **WAF components to skip:**
  - [x] All remaining custom rules
  - [x] Rate limiting rules
  - [x] Managed rules (Cloudflare Managed Ruleset)
  - [x] Super Bot Fight Mode / Bot Management

---

## 2. Configuración de Edge Caching (Caching → Cache Rules)

Almacenar el HTML estático directamente en los centros de datos perimetrales de Cloudflare más cercanos al usuario (Madrid, Barcelona, París, etc.):

### 2.1. Regla de Caché: `Cache_Full_HTML_Pages`
- **When incoming requests match:**
  - Field: `Hostname` equals `pebaisystems.es`
  - AND `URI Path` does not start with `/wp-admin`
  - AND `URI Path` does not start with `/api/`
  - AND `URI Path` does not contain `preview=true`
- **Cache eligibility:** `Eligible for cache`
- **Edge TTL:** `Respect origin (or Override: 1 month)`
- **Browser TTL:** `Respect origin (or Override: 1 month)`
- **Serve stale content while revalidating:** `Enabled`

### 2.2. Cabecera Originaria aplicada en `.htaccess`
```apache
<FilesMatch "\.(html|htm)$">
    Header set Cache-Control "public, must-revalidate, proxy-revalidate, max-age=2592000, stale-while-revalidate=86400"
</FilesMatch>
```

---

## 3. Optimización de Red y Protocolo (Speed → Optimization)

- **HTTP/3 (with QUIC):** Habilitado.
- **0-RTT Connection Resumption:** Habilitado.
- **Early Hints (103):** Habilitado (precarga de fuentes `Manrope-latin-variable.woff2` y CSS crítico).
- **Auto Minify:** Desactivar HTML/JS minify en Cloudflare si ya se usa la distribución minificada de PEBAI para evitar colisiones de sintaxis.
- **Brotli:** Habilitado.

---

## 4. Redirección Oficial a WhatsApp (+34 624 84 27 99)

Ruta de redirección instantánea 302 hacia:
`https://wa.me/34624842799?text=Hola%2C%20vengo%20de%20la%20web%20y%20me%20gustar%C3%ADa%20solicitar%20una%20consultor%C3%ADa%20sobre%20IA%20para%20mi%20empresa.`

Configurada en:
1. Servidor Apache/LiteSpeed: `dist/.htaccess`
2. WordPress: `mu-plugins/pebai-redirects.php`
3. Opcional como Cloudflare Redirect Rule:
   - Match: `(http.request.uri.path in {"/contacto" "/contacto/" "/contact" "/contact/"})`
   - URL Redirect: Dynamic / Static hacia WhatsApp.
