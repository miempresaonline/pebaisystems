# Guía Maestra de GetLayers MCP: Protocolo de Integración y Buenas Prácticas

Basado en la documentación oficial de **GetLayers** (`https://www.getlayers.ai/mcp` y `https://storage.getlayers.ai/skill/getlayers/SKILL.md`), este documento establece las reglas no negociables, los flujos de trabajo y los comandos para conectar y utilizar el servidor MCP de GetLayers con el máximo nivel de acabado en PEBAI Systems.

---

## 1. Conexión del Servidor MCP y Plugins

### A. Para Claude Code CLI
Ejecutar ambos comandos de manera independiente:
```bash
/plugin marketplace add textura-agency/getlayers-plugin
/plugin install getlayers@getlayers
```

### B. Para Antigravity / Cursor / Claude Desktop / Windsurf
Añadir a `mcp_config.json` (o `.agents/mcp_config.json`):
```json
{
  "mcpServers": {
    "getlayers": {
      "url": "https://mcp.getlayers.ai/mcp"
    }
  }
}
```

---

## 2. La Regla de Oro (Paso 0): Llamar Siempre a `getlayers_start` Primero

Antes de discutir maquetas, seleccionar activos o escribir una sola línea de HTML/CSS:
* **Invocar `getlayers_start`:** Devuelve las 5 capacidades activas, la guía, el vocabulario técnico y la información del entorno.
* **Presentar las capacidades al usuario con lenguaje natural**, sin vomitar nombres técnicos de herramientas, seleccionando el modo que mejor encaje con su petición.

---

## 3. Los 5 Modos Operativos de GetLayers

| Modo | Objetivo | Flujo Operativo Recomendado |
| :--- | :--- | :--- |
| **1. Sitio web completo desde cero** | Crear una web inmersiva de principio a fin. | Elegir entre: (a) Buscar y seleccionar plantilla, (b) Extender/re-skinear plantilla cambiando secciones (`recomposeOptions`), o (c) Componer desde cero sección por sección con `getlayers_compositions`. |
| **2. Escena 3D a medida** | Diseñar una escena 3D interactiva única. | Usar `getlayers_scene_lab`. Sintetizar a partir de referencias visuales y descripciones del brief; nunca copiarla idéntica. |
| **3. Extraer un activo concreto** | Incorporar un componente específico (bento, carrusel, pricing, FAQ). | `getlayers_search` o `getlayers_browse` $\rightarrow$ `getlayers_materialize`. |
| **4. Fondos de vídeo cinemáticos** | Añadir atmósfera visual de alto standing. | Buscar en el catálogo de fondos $\rightarrow$ descargar el vídeo 4K y el poster 2K al proyecto $\rightarrow$ montar `<video>` full-bleed mudo en bucle. |
| **5. Añadir 3D y movimiento a proyecto existente** | Elevar una web ya creada (como las landings de PEBAI). | **Leer el código y los estilos del repositorio PRIMERO**, proponer dónde encaja el movimiento o escena, y materializar los activos respetando la paleta existente. |

---

## 4. Reglas No Negociables (Dónde Fallan la Mayoría de IAs)

1. **Nunca usar filtrado estricto por tags:** La selección de activos no es coincidencia de etiquetas. Buscar con el lenguaje natural del brief y juzgar el encaje leyendo descripciones y sensaciones (*vibes*). Una etiqueta discordante nunca descarta un buen componente.
2. **Las composiciones son el esqueleto bajo todo (`getlayers_compositions`):**
   * Una página profesional es: **Composiciones (esqueleto) + Estilo unificado + Activos**.
   * Si se construye una sección única, invocar `getlayers_compositions` por su rol (`hero`, `features`, `bento`, `pricing`, `faq`, `loader`).
   * **PROHIBIDO TERMINANTEMENTE** caer en la pila genérica centrada (el error nº1 de los modelos de lenguaje).
3. **Fijar UN solo estilo (`styleId`) desde el inicio:** Pasar el `styleId` a cada llamada de `getlayers_materialize` para que las escenas y secciones vengan pre-tintadas y compartan la misma identidad visual.
4. **Tintar escenas 3D mediante CONFIG, NUNCA tocando el Shader:** `materialize` entrega un mapa `tint`; aplicarlo a la variable `CONFIG` de la escena. Editar el código GLSL del shader genera artefactos visuales rotos.
5. **Re-vestir con paletas y fuentes oficiales:**
   * Usar `getlayers_palettes` y `getlayers_fonts` para resolver las 4 funciones de la paleta y los tipos de letra sin inventar códigos hexadecimales o URLs de Google Fonts.
   * Mantener: **UNA paleta por superficie, UN sistema tipográfico por web**. Las serifs de alto contraste quedan reservadas exclusivamente a titulares (nunca párrafos).
6. **Coreografía de Revelación (Reveal Choreography por defecto):**
   * Toda web inmersiva sigue la secuencia: **Loader interactivo $\rightarrow$ Gate $\rightarrow$ Contenido escalonado $\rightarrow$ Revelación de la escena 3D**.
7. **Descarga obligatoria de medios pesados en local:**
   * Los vídeos de fondo y modelos 3D (`.glb`, `.mp4`) nunca se enlazan en caliente (*hotlink*) desde `storage.getlayers.ai` en producción (tienen marca de agua o caducidad).
   * Se descargan a la carpeta local (ej: `dist/brand/` o `public/`) y se enlazan localmente.
8. **Mantenimiento de estado en `getlayers.json`:**
   * Registrar las elecciones de plantilla, paleta y componentes en `getlayers.json` para que el proyecto no pierda consistencia a lo largo de sucesivas iteraciones.
