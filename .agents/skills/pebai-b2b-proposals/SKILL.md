---
name: pebai-b2b-proposals
description: >-
  Estándar maestro, arquitectura editorial y protocolo de generación de presupuestos
  y propuestas técnico-económicas de alta conversión B2B para PEBAI Systems (pebaisystems.es).
  Maquetación en formato A4 con identidad de marca oficial, sin burocracia de firmas
  y compilación automatizada a PDF vía Microsoft Edge Headless.
---

# PEBAI B2B Proposals Engine — Estándar Oficial de Presupuestos

*Protocolo maestro para la redacción, diseño y compilación de propuestas técnico-económicas de alta conversión para PEBAI Systems.*

---

## 1. REGLA FUNDAMENTAL DE CIERRE COMERCIAL: CERO FIRMAS

> [!IMPORTANT]
> **PROHIBICIÓN TAJANTE DE BLOQUES DE FIRMA:**
> Queda terminantemente prohibido incluir apartados de "Aceptación y Firmas", líneas para rubricar, sellos o formalismos burocráticos. 
> 
> **Razón de Negocio:**
> En PEBAI Systems vendemos agilidad, tecnología e impacto directo en resultados. Los bloques tradicionales de firma añaden fricción psicológica, demoran la decisión en comités y burocratizan una venta que debe cerrarse por validación directa o transferencia/pago.
> 
> Cada propuesta concluye de forma limpia en la **Inversión Económica**, las **Garantías Operativas (0% Riesgo)** y la **Puesta en Marcha Inmediata**.

---

## 2. ESTRUCTURA MAESTRA DE CADA PROPUESTA (FORMATO EJECUTIVO)

Cada documento debe estructurarse obligatoriamente bajo los siguientes bloques (ajustando la extensión entre 3 y 6 páginas según el tamaño y complejidad del proyecto):

1. **Portada Corporativa de Alto Impacto (Dark Ink):**
   - Fondo `#12121A` con resplandor radial violeta (`rgba(106,92,255,.45)`).
   - Logotipo oficial PEBAI Systems con isotipo en alta resolución.
   - Kicker superior: `PROPUESTA TÉCNICO-COMERCIAL` con señal luminosa verde lima (`#B7FF3C`).
   - Titular principal de gran formato (`40pt`) con acento tipográfico en lima.
   - Subtítulo ejecutivo resumiendo la solución y el cliente.
   - Grid de 4 metadatos técnicos en el pie: Cliente, Plazo de ejecución, Inversión Setup y Versión/Fecha.

2. **01 · Diagnóstico de Situación & Fricción Operativa (Puntos de Bloqueo y Fugas):**
   - Radiografía sin rodeos de la situación actual del cliente.
   - El coste real de la inacción: cuántas horas, dinero o riesgos de facturación/seguridad le supone seguir con el sistema heredado.
   - Caja de advertencia (`.box.warn`).

3. **02 · Arquitectura del Sistema & Solución Técnica:**
   - Desglose técnico conciso y riguroso (cero humo de IA, cero tecnicismos vacíos).
   - Estructuración en capas (ej. Frontend público vs. Panel operativo privado; o Desacople de servidor, PWA y Base de datos).
   - Cajas de confirmación técnica (`.box.ok`, `.card.dark`, `.card.violet`).

4. **03 · Plan de Ejecución & Fases (Cronograma Ágil):**
   - Cronograma claro expresado en días hábiles o semanas.
   - Pasos o hitos sin dilaciones.
   - Compromiso explícito de *Zero Downtime* (cero interrupción en la actividad diaria del cliente).

5. **04 · Propuesta Económica & Condiciones:**
   - Tabla clara con cabecera oscura (`#12121A`) y filas contrastadas.
   - Desglose de Setup / Implantación y claridad absoluta sobre cuotas recurrentes (si es 0 € / mes, destacarlo como ventaja competitiva de propiedad del cliente).
   - Importe cerrado y transparente.

6. **05 · Garantías Clave & Puesta en Marcha Inmediata (*SIN FIRMAS*):**
   - Garantías de no-riesgo operativo y retorno de inversión tangible (horas ahorradas, protección de facturación, autonomía).
   - Caja de activación (`.box.ok`): *"Puesta en marcha inmediata: Aprobada la propuesta, el despliegue técnico comienza en menos de 24 horas..."*.

---

## 3. SISTEMA VISUAL Y ESPECIFICACIONES TÉCNICAS (CSS / HTML)

* **Tipografía Oficial:** Manrope variable compilada localmente (`./Manrope.woff2`), números tabulares en tablas económicas (`font-variant-numeric: tabular-nums`).
* **Paleta Cromática Oficial:**
  - Tinta Principal: Dark Ink (`#12121A`)
  - Fondo Mineral Cálido: `#EFEDE7`
  - Superficies y Tarjetas: `#E6E3DD` y `#F6F5F1`
  - Líneas divisorias: `#C7C4BE`
  - Acento Primario (Tecnología): `#493AC4` / `#6A5CFF`
  - Acento Secundario (Señal Activa): `#B7FF3C`
  - Textos Muted: `#575661` y `#A9A8B6`

### Reglas de Maquetación A4 Estricta

```css
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Manrope', sans-serif;
  color: #12121A;
  background: #EFEDE7;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.page {
  width: 210mm;
  height: 297mm;
  padding: 17mm 18mm 15mm;
  page-break-after: always;
  position: relative;
  overflow: hidden;
  background: #EFEDE7;
  display: flex;
  flex-direction: column;
}
.page:last-child { page-break-after: auto; }
.footer {
  position: absolute;
  bottom: 8mm;
  left: 18mm;
  right: 18mm;
  font-size: 7.5pt;
  color: #575661;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #C7C4BE;
  padding-top: 2.5mm;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}
```

---

## 4. PROTOCOLO DE COMPILACIÓN HEADLESS A PDF

Para exportar el documento maquetado a un PDF de calidad editorial sin cabeceras parásitas del navegador:

1. Guardar el archivo HTML y sus recursos (`pebai-logo.png`, `Manrope.woff2`) en la carpeta del cliente: `documentos/presupuestos/[cliente]/presupuesto_[cliente].html`.
2. Ejecutar la compilación mediante Microsoft Edge headless en PowerShell:

```powershell
$htmlPath = "c:\programacion\emprendimiento\PAI Systems\documentos\presupuestos\[cliente]\presupuesto_[cliente].html"
$pdfPath = "c:\programacion\emprendimiento\PAI Systems\documentos\presupuestos\[cliente]\Propuesta_PEBAI_[cliente].pdf"
$url = "file:///" + ($htmlPath.Replace("\", "/")).Replace(" ", "%20")
$argString = "--headless=new --disable-gpu --no-pdf-header-footer `"--print-to-pdf=$pdfPath`" `"$url`""
Start-Process -FilePath "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" -ArgumentList $argString -Wait -NoNewWindow
```

3. Verificar con `view_file` que el conteo de páginas coincide exactamente con los `<section class="page">` definidos y que el diseño está libre de desbordamientos.
