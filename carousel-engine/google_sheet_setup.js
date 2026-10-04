/**
 * PEBAI SYSTEMS - SISTEMA RADAR DE CONTENIDO Y CARRUSELES
 * Script para Google Apps Script (Extensiones > Apps Script)
 * 
 * Funcionalidades:
 * 1. Inicializacion y diseno automatico de la hoja con diseno profesional.
 * 2. Creacion automatica de pestana mensual (ej. 'Octubre 2026', 'Noviembre 2026').
 * 3. Menu desplegable para TIPO y ESTADO (PENDIENTE, PUBLICAR, DESCARTAR, RD, LISTO, PUBLICADO).
 * 4. Formato condicional de colores automatico para cada estado.
 * 5. Columnas de entrega directa al movil: ENLACE SLIDES y COPY PIE DE FOTO.
 * 6. Webhook HTTP POST/GET para sincronizar ideas y adjuntar entregables.
 */

var SPREADSHEET_ID = "110nBsx3YGGohHHMzjDNzAKL_Nj87gt_CYjWREqnbHjM";

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
  "ENLACE SLIDES (DESCARGA MOVIL)",
  "COPY / PIE DE FOTO",
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
  170, // F: Formato Visual (Dark Tech, Miro, ROI, etc.)
  210, // G: Fuente / Link
  135, // H: Estado
  125, // I: Fecha Publicacion
  105, // J: Hora Publicacion
  220, // K: ENLACE SLIDES (DESCARGA MOVIL)
  360, // L: COPY / PIE DE FOTO
  90,  // M: Likes IG
  90,  // N: Views IG
  95,  // O: Comments IG
  220  // P: Notas
];

var MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function getSpreadsheet() {
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getMonthName(date) {
  var d = date || new Date();
  return MONTH_NAMES[d.getMonth()] + " " + d.getFullYear();
}

function inicializarHoja() {
  var ss = getSpreadsheet();
  var sheetName = getMonthName(new Date());
  var sheet = getOrCreateMonthSheet(ss, sheetName);
  
  var defaultSheet = ss.getSheetByName("Hoja 1");
  if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() <= 1) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch (e) {}
  }
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
  
  var headerRange = sheet.getRange(1, 1, 1, COLUMNS.length);
  headerRange.setValues([COLUMNS]);
  
  headerRange
    .setBackground("#1A2530")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontFamily("Google Sans")
    .setFontSize(10)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  
  sheet.setRowHeight(1, 38);
  
  for (var i = 0; i < COLUMN_WIDTHS.length; i++) {
    sheet.setColumnWidth(i + 1, COLUMN_WIDTHS[i]);
  }
  
  var ruleTipo = SpreadsheetApp.newDataValidation()
    .requireValueInList(["VIRAL", "B2B", "MIXTO"], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange("C2:C500").setDataValidation(ruleTipo);
  
  var ruleEstado = SpreadsheetApp.newDataValidation()
    .requireValueInList(["PENDIENTE", "PUBLICAR", "DESCARTAR", "RD", "LISTO", "PUBLICADO"], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange("H2:H500").setDataValidation(ruleEstado);
  
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
  sheet.getRange("K2:K500").setFontFamily("Google Sans").setFontSize(9).setHorizontalAlignment("center");
  sheet.getRange("L2:L500").setFontFamily("Google Sans").setFontSize(9).setWrap(true);
  sheet.getRange("M2:O500").setFontFamily("Google Sans Mono").setFontSize(9).setHorizontalAlignment("right");
  sheet.getRange("P2:P500").setFontFamily("Google Sans").setFontSize(9).setWrap(true);
  
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
    
  var ruleListo = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("LISTO")
    .setBackground("#CFF4FC")
    .setFontColor("#055160")
    .setRanges([range])
    .build();

  var rulePublicado = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("PUBLICADO")
    .setBackground("#C3E6CB")
    .setFontColor("#1E7E34")
    .setRanges([range])
    .build();
    
  sheet.setConditionalFormatRules([rulePendiente, rulePublicar, ruleDescartar, ruleRD, ruleListo, rulePublicado]);
}

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    var ss = getSpreadsheet();
    
    // Entrega del carrusel renderizado a la fila del Google Sheet
    if (data.action === "deliver_carousel") {
      var sheet = ss.getSheetByName(data.month || getMonthName(new Date()));
      if (!sheet) return jsonResponse({ status: "error", message: "Hoja no encontrada" });
      
      var lastRow = sheet.getLastRow();
      var idCol = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var r = 0; r < idCol.length; r++) {
        if (idCol[r][0] === data.id) {
          var rowIndex = r + 2;
          if (data.link_slides) {
            sheet.getRange(rowIndex, 11).setValue(data.link_slides); // Col K: ENLACE SLIDES
          }
          if (data.copy_text) {
            sheet.getRange(rowIndex, 12).setValue(data.copy_text);   // Col L: COPY PIE DE FOTO
          }
          if (data.estado) {
            sheet.getRange(rowIndex, 8).setValue(data.estado);       // Col H: ESTADO
          }
          return jsonResponse({ status: "success", delivered_id: data.id, row: rowIndex });
        }
      }
      return jsonResponse({ status: "not_found" });
    }
    
    // Insercion de ideas del radar
    var sheetName = data.month || getMonthName(new Date());
    var sheet = getOrCreateMonthSheet(ss, sheetName);
    var ideas = data.ideas || [];
    
    if (ideas.length === 0) {
      return jsonResponse({ status: "ok", message: "Sin ideas", count: 0 });
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
        item.enlace_slides || "",
        item.copy || "",
        "", "", "",
        item.notas || ""
      ]);
    }
    
    var lastRow = sheet.getLastRow();
    var targetRange = sheet.getRange(lastRow + 1, 1, rowsToAdd.length, COLUMNS.length);
    targetRange.setValues(rowsToAdd);
    
    for (var r = 0; r < rowsToAdd.length; r++) {
      sheet.setRowHeight(lastRow + 1 + r, 48);
    }
    
    return jsonResponse({ status: "success", sheet: sheetName, count: rowsToAdd.length });
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "status";
  var ss = getSpreadsheet();
  
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
      var estado = String(row[7]).trim();
      var hora = String(row[9]).trim();
      
      if (estado === "PUBLICAR") {
        if (hora === "") {
          blocked.push({ id: row[0], motivo: "Estado PUBLICAR pero sin HORA" });
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
            enlace_slides: row[10],
            copy: row[11],
            notas: row[15]
          });
        }
      }
    }
    return jsonResponse({ status: "ok", sheet: sheetName, approved: approved, blocked_without_time: blocked });
  }
  return jsonResponse({ status: "active", service: "PEBAI Radar Hub" });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
