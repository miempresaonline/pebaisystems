# 📖 Manual Operativo: Sistema Comercial Tri-Canal PAI Systems

Este manual describe el funcionamiento, puesta en marcha y mantenimiento del motor comercial automatizado para PAI Systems / PEBAI Systems.

---

## 1. Organización del CRM por Nichos

Para mantener los registros organizados y por debajo de los límites, la base se estructura en tablas segmentadas por nicho:

### Tablas Físicas:
- **`Clínicas (Físico)`** (~223 leads: odontología, estética)
- **`Abogados y Asesorías (Físico)`** (~213 leads)
- **`Inmobiliarias (Físico)`** (~213 leads)
- **`Reformas (Físico)`** (~201 leads)

### Tablas Online:
- **`Energía Solar (Online)`** (~151 leads)
- **`Piscinas (Online)`** (~105 leads)
- **`Casas Modulares (Online)`** (~98 leads)
- **`Importación Vehículos (Online)`** (~28 leads)

### Tabla Central de Cierres:
- **`🤝 Reuniones & Cierre`**: Donde entran todas las consultorías agendadas por la IA o por Adrián.

---

## 2. El Flujo de Adrián (Cero Fricción Operativa)

> [!IMPORTANT]
> **Adrián solo trabaja los leads que le corresponden en su vista. Cuando no le interesa un lead, el sistema se lo entrega a la IA de inmediato.**

### Vistas en cada tabla de nicho:
- **`Vista Adrián`**: Filtrada con `Encargado = '👤 Adrián Ballesteros'`.
- **`Vista IA`**: Filtrada con `Encargado = '🤖 Inteligencia Artificial'`.

### Traspaso a la IA:
1. Si Adrián no quiere llamar a un contacto, cambia el **Encargado** a:
   👉 **`🤖 Inteligencia Artificial`**
   *(o selecciona `Próxima acción = '🤖 Llamar con IA'`)*.
2. El lead **desaparece de inmediato de la vista de Adrián** y pasa a la cola de la IA.

---

## 3. Objetivo de la IA y Agendamiento Automático

1. **Objetivo 100% enfocado**:
   La IA no lee ganchos sugeridos; su único objetivo es conseguir una **videollamada de 15-20 minutos de consultoría gratuita sin compromiso** con Adrián.
2. **Si el cliente acepta la consultoría (`🟢 Interesado`)**:
   - La IA le pregunta día y hora preferida.
   - El sistema **crea automáticamente la cita en `🤝 Reuniones & Cierre`**:
     - `Cliente / Reunión`: `Consultoría IA - Empresa (Contacto)`
     - `Estado`: `🗓️ 1. Videollamada Agendada`
     - `Responsable de cierre`: `👤 Adrián Ballesteros`
     - `Notas y Diagnóstico`: Transcripción y necesidades del cliente
   - Se dispara una alerta urgente por WhatsApp a Adrián para que tenga la reunión lista en su agenda.
3. **Si no quiere videollamada pero pide información**:
   - La IA le pide permiso para mandarle un WhatsApp de 1 minuto.
   - Si acepta, se envía la plantilla de PAI Systems y se actualiza a `💬 WhatsApp Enviado`.
4. **Si no responde**:
   - Se suma incrementalmente el intento: `🟡 No contesta 1` ➔ `🟠 No contesta 2` ➔ `🔴 No contesta 3`.
5. **Si rechaza**:
   - Se marca como `❌No interesado` o `❌ Descartado`.

---

## 4. Ejecución de la Migración a Tablas de Nicho

Para crear las 8 tablas de nicho e importar los 1.232 leads del respaldo:

### Paso 1: Simulación (Dry-Run)
```bash
cd "c:\programacion\emprendimiento\PAI Systems\commercial-engine"
python migrate_niches.py
```
*Muestra cuántos leads irán a cada tabla sin tocar Airtable.*

### Paso 2: Creación Real de Tablas y Carga
```bash
python migrate_niches.py --execute
```
*Crea las 8 tablas en Airtable con todos los campos estandarizados (incluyendo '🤖 Inteligencia Artificial' en Encargado) y sube todos los leads organizados.*

---

## 5. Servidor de Automatización y Webhooks

### Arrancar el Servidor
```bash
python webhook_server.py
```
- Endpoint de Webhook para Retell / Vapi: `POST /webhooks/voice-call-completed`
- Endpoint para despachar llamadas pendientes: `POST /api/dispatch-pending-leads`
- Endpoint para reasignar lead a la IA: `POST /api/reassign-to-ai`
