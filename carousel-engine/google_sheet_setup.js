/**
 * PEBAI SYSTEMS - SISTEMA RADAR DE CONTENIDO Y CARRUSELES
 * Script para Google Apps Script (Extensiones > Apps Script)
 * 
 * Funcionalidades:
 * 1. Inicializacion y diseno automatico de la hoja con diseno profesional.
 * 2. Creacion automatica de pestana mensual (ej. 'Octubre 2026', 'Noviembre 2026').
 * 3. Menu desplegable para TIPO y ESTADO (PENDIENTE, PUBLICAR, DESCARTAR, RD, PUBLICADO).
 * 4. Formato condicional de colores automatico para cada estado.
 * 5. Webhook HTTP POST para recibir ideas desde GitHub Actions.
 * 6. Consulta de ideas aprobadas y actualizacion de estado.
 */

var COLUMNS = [
  "ID",
  "FECHA PROPUESTA",
  "TIPO",
  "GANCHO PORTADA (SLIDE 1)",
  "ESTRUCTURA Y DESARROLLO (SLIDES 2-4)",
  "FORMATO VISUAL",
  "FUENTE / LINK",
  "ESTADO",
  "FECHA PUBLICACION",
  "HORA PUBLICACION",
  "LIKES IG (48H)",
  "VIEWS IG (48H)",
  "COMMENTS IG (48H)",
  "NOTAS / AJUSTES"
];

var COLUMN_WIDTHS = [
  130, // A: ID
  115, // B: Fecha Propuesta
  95,  // C: Tipo
  320, // D: Gancho Portada
  380, // E: Desarrollo
  160, // F: Formato Visual
  210, // G: Fuente / Link
  125, // H: Estado
  125, // I: Fecha Publicacion
  105, // J: Hora Publicacion
  90,  // K: Likes IG
  90,  // L: Views IG
  95,  // M: Comments IG
  220  // N: Notas
];

var MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function getMonthName(date) {
  var d = date || new Date();
  return MONTH_NAMES[d.getMonth()] + " " + d.getFullYear();
}

/**
 * Ejecuta esta funcion desde el editor de Apps Script si quieres
 * formatear e inicializar la hoja del mes actual de inmediato.
 */
function inicializarHoja() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = getMonthName(new Date());
  var sheet = getOrCreateMonthSheet(ss, sheetName);
  
  // Limpiar Hoja 1 por defecto si esta vacia
  var defaultSheet = ss.getSheetByName("Hoja 1");
  if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() <= 1) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch (e) {
      // Ignorar si no permite borrar
    }
  }
  
  Logger.log("Hoja configurada con exito: " + sheetName);
}

function getOrCreateMonthSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName, 0);
    aplicarEstiloBase(sheet);
  }
  return sheet;
}

function aplicarEstiloBase(sheet) {
  sheet.clear();
  sheet.setFrozenRows(1);
  
  // Escribir cabeceras
  var headerRange = sheet.getRange(1, 1, 1, COLUMNS.length);
  headerRange.setValues([COLUMNS]);
  
  // Estilo visual cabecera: Slate Navy moderno
  headerRange
    .setBackground("#1A2530")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontFamily("Google Sans")
    .setFontSize(10)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  
  sheet.setRowHeight(1, 38);
  
  // Ajustar anchos de columna
  for (var i = 0; i < COLUMN_WIDTHS.length; i++) {
    sheet.setColumnWidth(i + 1, COLUMN_WIDTHS[i]);
  }
  
  // Reglas de validacion de datos (Desplegables)
  var ruleTipo = SpreadsheetApp.newDataValidation()
    .requireValueInList(["VIRAL", "B2B", "MIXTO"], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange("C2:C500").setDataValidation(ruleTipo);
  
  var ruleEstado = SpreadsheetApp.newDataValidation()
    .requireValueInList(["PENDIENTE", "PUBLICAR", "DESCARTAR", "RD", "PUBLICADO"], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange("H2:H500").setDataValidation(ruleEstado);
  
  // Formato de texto y alineaciones para datos
  sheet.getRange("A2:A500").setFontFamily("Google Sans Mono").setFontSize(9).setHorizontalAlignment("center");
  sheet.getRange("B2:B500").setFontFamily("Google Sans").setFontSize(9).setHorizontalAlignment("center");
  sheet.getRange("C2:C500").setFontFamily("Google Sans").setFontSize(9).setHorizontalAlignment("center").setFontWeight("bold");
  sheet.getRange("D2:D500").setFontFamily("Google Sans").setFontSize(10).setWrap(true).setFontWeight("bold");
  sheet.getRange("E2:E500").setFontFamily("Google Sans").setFontSize(9).setWrap(true);
  sheet.getRange("F2:F500").setFontFamily("Google Sans").setFontSize(9).setHorizontalAlignment("center");
  sheet.getRange("G2:G500").setFontFamily("Google Sans").setFontSize(9);
  sheet.getRange("H2:H500").setFontFamily("Google Sans").setFontSize(10).setHorizontalAlignment("center").setFontWeight("bold");
  sheet.getRange("I2:I500").setFontFamily("Google Sans").setFontSize(9).setHorizontalAlignment("center");
  sheet.getRange("J2:J500").setFontFamily("Google Sans Mono").setFontSize(9).setHorizontalAlignment("center");
  sheet.getRange("K2:M500").setFontFamily("Google Sans Mono").setFontSize(9).setHorizontalAlignment("right");
  sheet.getRange("N2:N500").setFontFamily("Google Sans").setFontSize(9).setWrap(true);
  
  // Formato Condicional para Columna H (ESTADO)
  configurarColoresCondicionales(sheet);
}

function configurarColoresCondicionales(sheet) {
  var range = sheet.getRange("H2:H500");
  
  var rulePendiente = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("PENDIENTE")
    .setBackground("#FFF3CD")
    .setFontColor("#856404")
    .setRanges([range])
    .build();
    
  var rulePublicar = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("PUBLICAR")
    .setBackground("#D4EDDA")
    .setFontColor("#155724")
    .setRanges([range])
    .build();
    
  var ruleDescartar = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("DESCARTAR")
    .setBackground("#E2E3E5")
    .setFontColor("#6C757D")
    .setRanges([range])
    .build();
    
  var ruleRD = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("RD")
    .setBackground("#CCE5FF")
    .setFontColor("#004085")
    .setRanges([range])
    .build();
    
  var rulePublicado = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("PUBLICADO")
    .setBackground("#C3E6CB")
    .setFontColor("#1E7E34")
    .setRanges([range])
    .build();
    
  sheet.setConditionalFormatRules([rulePendiente, rulePublicar, ruleDescartar, ruleRD, rulePublicado]);
}

/**
 * Webhook para recibir las ideas desde GitHub Actions o actualizar estado
 */
function doPost(e) {
  try {
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Accion para marcar una fila como PUBLICADO
    if (data.action === "mark_published") {
      var sheet = ss.getSheetByName(data.month || getMonthName(new Date()));
      if (!sheet) return jsonResponse({ status: "error", message: "Hoja no encontrada" });
      
      var lastRow = sheet.getLastRow();
      var idCol = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var r = 0; r < idCol.length; r++) {
        if (idCol[r][0] === data.id) {
          sheet.getRange(r + 2, 8).setValue("PUBLICADO");
          return jsonResponse({ status: "success", updated_id: data.id });
        }
      }
      return jsonResponse({ status: "not_found" });
    }
    
    // Insercion de ideas del radar
    var sheetName = data.month || getMonthName(new Date());
    var sheet = getOrCreateMonthSheet(ss, sheetName);
    
    var ideas = data.ideas || [];
    if (ideas.length === 0) {
      return jsonResponse({
        status: "ok",
        message: "No se recibieron ideas nuevas",
        count: 0
      });
    }
    
    var rowsToAdd = [];
    for (var i = 0; i < ideas.length; i++) {
      var item = ideas[i];
      rowsToAdd.push([
        item.id || "",
        item.fecha || Utilities.formatDate(new Date(), "GMT+2", "dd/MM/yyyy"),
        item.tipo || "MIXTO",
        item.gancho || "",
        item.desarrollo || "",
        item.formato || "",
        item.fuente || "",
        item.estado || "PENDIENTE",
        item.fecha_publicacion || "",
        item.hora_publicacion || "",
        "", // Likes IG
        "", // Views IG
        "", // Comments IG
        item.notas || ""
      ]);
    }
    
    var lastRow = sheet.getLastRow();
    var targetRange = sheet.getRange(lastRow + 1, 1, rowsToAdd.length, COLUMNS.length);
    targetRange.setValues(rowsToAdd);
    
    for (var r = 0; r < rowsToAdd.length; r++) {
      sheet.setRowHeight(lastRow + 1 + r, 48);
    }
    
    return jsonResponse({
      status: "success",
      sheet: sheetName,
      count: rowsToAdd.length
    });
    
  } catch (err) {
    return jsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

/**
 * Consulta de estado y extraccion de ideas aprobadas
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "status";
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === "get_approved") {
    var sheetName = (e.parameter && e.parameter.month) ? e.parameter.month : getMonthName(new Date());
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return jsonResponse({ status: "not_found", sheet: sheetName, approved: [] });
    
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return jsonResponse({ status: "ok", sheet: sheetName, approved: [] });
    
    var data = sheet.getRange(2, 1, lastRow - 1, COLUMNS.length).getValues();
    var approved = [];
    var blocked = [];
    
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var estado = String(row[7]).trim(); // Col H: Estado
      var hora = String(row[9]).trim();   // Col J: Hora Publicacion
      
      if (estado === "PUBLICAR") {
        // Regla estricta: Si tiene PUBLICAR pero la hora esta vacia, NO se publica
        if (hora === "") {
          blocked.push({
            id: row[0],
            motivo: "Estado es PUBLICAR pero el campo HORA esta vacio"
          });
        } else {
          approved.push({
            id: row[0],
            fecha_propuesta: row[1],
            tipo: row[2],
            gancho: row[3],
            desarrollo: row[4],
            formato: row[5],
            fuente: row[6],
            estado: estado,
            fecha_publicacion: row[8],
            hora_publicacion: hora,
            notas: row[13]
          });
        }
      }
    }
    
    return jsonResponse({
      status: "ok",
      sheet: sheetName,
      approved: approved,
      blocked_without_time: blocked
    });
  }
  
  return jsonResponse({
    status: "active",
    service: "PEBAI Systems Radar Google Sheet Webhook",
    timestamp: new Date().toISOString()
  });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
