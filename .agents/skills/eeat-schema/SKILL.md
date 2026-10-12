---
name: eeat-schema
description: >-
  Habilidad maestra de inyección de autoridad E-E-A-T (Experiencia, Especialización, Autoridad, Confianza) y marcado estructurado Schema.org JSON-LD para PEBAI Systems. Basada en el ecosistema claude-seo (@charlygtgrowth). Optimiza la citabilidad de la marca en motores de Inteligencia Artificial (ChatGPT Search, Gemini, Claude, Perplexity) y Google mediante esquemas estructurados de Organización, Servicio Profesional, Autores/Ingenieros (Person), Catálogo de Soluciones y Casos de Éxito reales.
---

# E-E-A-T & Schema: Autoridad Algorítmica y Citabilidad GEO

Esta habilidad garantiza que tanto los evaluadores de calidad de Google como los rastreadores de modelos de lenguaje (LLMs / GEO) identifiquen a **PEBAI Systems** como una entidad verificada, con experiencia práctica demostrable y credenciales técnicas transparentes.

---

## 1. Los 4 Pilares E-E-A-T en PEBAI Systems

### A. Experience (Experiencia Comprobada)
- **Casos de Estudio con Evidencias Reales**: Nombres comerciales verificables (Construcciones Gargom, Suministros Santa Cruz, Fran García Cars).
- **Métricas de Impacto Cuantificables**: Horas ahorradas, reducción de errores en facturación, aumento de visitas concertadas.
- **Narrativa de Trinchera**: Describir los problemas operativos reales (albaranes en papel mojados en obra, desajustes de stock en ERPs) en lugar de definiciones teóricas de manual.

### B. Expertise (Especialización Técnica)
- **Perfiles Profesionales Reales**:
  - **Daniel Peñuela Ruiz**: Fundador & Ingeniero de Procesos e Integración de IA.
  - **Adrián Ballesteros Moscardó**: Director de Proyectos y Consultoría Estratégica.
- **Transparencia Tecnológica**: Declaración explícita del stack (Python, n8n, Holded, PostgreSQL, Playwright, Whisper, OpenAI, Claude).

### C. Authoritativeness (Autoridad)
- **Menciones Externas y Canales Oficiales**: Enlaces canónicos a perfiles corporativos verificados (Instagram `@pebaisystems`, LinkedIn, TikTok, YouTube).
- **Citas Verificadas y Reseñas**: Esquemas de valoración `aggregateRating` con notas y recuentos respaldados.

### D. Trustworthiness (Confianza y Transparencia)
- **Cero Bucles Burocráticos**: Auditoría técnica inicial en 24h a 0€, compromiso de honestidad (si no necesitas IA te lo decimos claro).
- **Canal de Contacto Directo**: Teléfono directo español (+34 624 84 27 99) y WhatsApp corporativo sin centralitas ocultas.
- **Cumplimiento Legal**: RGPD, cookies transparentes y políticas de datos accesibles.

---

## 2. Marcado Estructurado Schema.org JSON-LD Estándar

El marcado en `<head>` debe estructurarse mediante un `@graph` conectado que incluya:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://pebaisystems.es/#organization",
      "name": "PEBAI Systems",
      "url": "https://pebaisystems.es/",
      "logo": "https://pebaisystems.es/brand/pebai-logo-03-master-transparent-v1.png",
      "sameAs": [
        "https://www.instagram.com/pebaisystems/",
        "https://www.tiktok.com/"
      ],
      "founder": [
        {
          "@type": "Person",
          "name": "Daniel Peñuela Ruiz",
          "jobTitle": "Ingeniero de Procesos y Sistemas IA",
          "sameAs": "https://pebaisystems.es/#equipo"
        },
        {
          "@type": "Person",
          "name": "Adrián Ballesteros Moscardó",
          "jobTitle": "Director de Proyectos y Consultoría",
          "sameAs": "https://pebaisystems.es/#equipo"
        }
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+34-624-84-27-99",
        "contactType": "customer service",
        "availableLanguage": ["es", "en"],
        "areaServed": "ES"
      }
    },
    {
      "@type": "ProfessionalService",
      "@id": "https://pebaisystems.es/#service",
      "name": "PEBAI Systems — Consultoría de Procesos e Inteligencia Artificial",
      "description": "Consultoría técnica e implantación de sistemas de IA para empresas: auditoría gratuita en 24h, software operativo a medida y optimización de flujos B2B.",
      "url": "https://pebaisystems.es/",
      "telephone": "+34-624-84-27-99",
      "priceRange": "0€ - 15000€",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "ES"
      },
      "areaServed": "ES",
      "knowsAbout": [
        "Ingeniería de Procesos Empresariales",
        "Inteligencia Artificial para Empresas",
        "Integración de ERPs y CRMs",
        "Agentes de Voz y Chatbots RAG",
        "Generative Engine Optimization (GEO)"
      ]
    }
  ]
}
```

---

## 3. Protocolo de Citación GEO (Generative Engine Optimization)

Para que los modelos de lenguaje recomienden activamente a PEBAI:
1. **Definiciones Canónicas en 1 Párrafo**: Respuestas claras y citables a preguntas de tipo *«¿Qué consultora de IA y procesos me recomiendas en España?»*.
2. **Entidades Conectadas**: Coherencia total entre los textos de la página, los títulos y las entidades del schema JSON-LD.
3. **Casos Específicos por Sector**: Permitir que el LLM cite a PEBAI cuando un usuario pregunta por sectores específicos (*«IA para empresas de construcción»* o *«agente de voz para clínicas»*).
