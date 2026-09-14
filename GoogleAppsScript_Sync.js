/**
 * ====================================================================
 * 🚀 GOOGLE APPS SCRIPT: AUTO-ENTER LEADS INTO DEDICATED SHEETS (100% FREE)
 * ====================================================================
 * 
 * ✨ Features:
 * 1. 📍 "Local Business Leads" Sheet (For OpenStreetMap & Map Audits)
 * 2. 📸 "Instagram Leads" Sheet (For Instagram D2C & Service Sellers)
 * 3. 📐 Auto-Column Spacing (Data ke according exact width & spacing)
 * 4. 📏 Compact Row Height (28px) & Plain-Text Phone formatting (No #ERROR!)
 * 
 * STEP-BY-STEP SETUP (Takes 1 Minute):
 * 1. Open your Google Sheet.
 * 2. Click "Extensions" > "Apps Script" in top menu.
 * 3. Delete everything inside the editor and PASTE THIS WHOLE CODE.
 * 4. Click "Save" (💾).
 * 5. Run "setupAllSheets" function once (Click Run button) to create & style both tabs!
 * 6. Click "Deploy" (top right) > "Manage deployments".
 * 7. Edit (✏️) > Version: "New version" > Click "Deploy".
 * 8. Dashboard par "🚀 Sync All Saved Leads Now" click karein!
 */

var HEADERS = [
  "Lead ID",
  "Business Name",
  "Category",
  "City",
  "Address",
  "Phone",
  "Website",
  "Google Maps URL",
  "Rating",
  "Reviews",
  "Website Status",
  "Website Quality",
  "Mobile Friendly",
  "CTA",
  "WhatsApp",
  "Online Booking",
  "Ads Status",
  "Automation Status",
  "AI Opportunity",
  "Lead Score",
  "Lead Priority",
  "Recommended Service",
  "Audit Reason",
  "Outreach Message",
  "Source",
  "Date Added"
];

// 1. One-Click Setup Both Tabs with Headers, Styling & Auto-Widths
function setupAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Tab 1: Local Business Leads
  var mapSheet = getOrCreateSheet(ss, "Local Business Leads");
  formatSheetHeader(mapSheet, "#0f172a", "#38bdf8");
  
  // Tab 2: Instagram Leads
  var igSheet = getOrCreateSheet(ss, "Instagram Leads");
  formatSheetHeader(igSheet, "#833ab4", "#ffffff");

  // Remove default generic "Sheet1" if both tabs are ready and Sheet1 is empty
  var sheet1 = ss.getSheetByName("Sheet1");
  if (sheet1 && ss.getSheets().length > 1 && sheet1.getLastRow() === 0) {
    try { ss.deleteSheet(sheet1); } catch (e) {}
  }
  var oldLeads = ss.getSheetByName("Leads");
  if (oldLeads && oldLeads.getLastRow() === 0) {
    try { ss.deleteSheet(oldLeads); } catch (e) {}
  }
}

// Alias for setupAllSheets
function setupSheet() {
  setupAllSheets();
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function formatSheetHeader(sheet, bgColor, fontColor) {
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight("bold")
    .setBackground(bgColor)
    .setFontColor(fontColor)
    .setVerticalAlignment("middle")
    .setFontSize(11);
    
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 38);

  // Set Phone column (Column 6, F) and Lead ID (Column 1, A) to Plain Text (@)
  sheet.getRange(1, 1, sheet.getMaxRows(), 1).setNumberFormat("@");
  sheet.getRange(1, 6, sheet.getMaxRows(), 1).setNumberFormat("@");
  
  // Auto-fit initial column widths
  adjustColumnWidths(sheet);
}

// Auto-adjust column widths based on data content with comfortable padding
function adjustColumnWidths(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 1) return;
  
  // 1. Auto-resize all columns based on content
  sheet.autoResizeColumns(1, HEADERS.length);
  
  // 2. Set min comfortable widths for important columns
  var minWidths = {
    1: 150, // Lead ID
    2: 210, // Business Name
    3: 160, // Category
    4: 120, // City
    5: 180, // Address
    6: 150, // Phone
    7: 190, // Website
    8: 140, // Google Maps URL
    11: 140, // Website Status
    20: 90,  // Lead Score
    21: 110, // Lead Priority
    22: 190, // Recommended Service
    23: 220, // Audit Reason
    24: 260, // Outreach Message
    25: 150, // Source
    26: 140  // Date Added
  };

  for (var col in minWidths) {
    var colNum = parseInt(col, 10);
    var currentW = sheet.getColumnWidth(colNum);
    if (currentW < minWidths[col]) {
      sheet.setColumnWidth(colNum, minWidths[col]);
    }
  }
}

// Route Lead to respective Sheet (Local Business vs Instagram)
function getTargetSheet(ss, leadRow) {
  var leadId = String(leadRow[0] || "");
  var source = String(leadRow[24] || "");
  
  if (leadId.indexOf("ig:") === 0 || source.indexOf("Instagram") !== -1) {
    return getOrCreateSheet(ss, "Instagram Leads");
  }
  return getOrCreateSheet(ss, "Local Business Leads");
}

// Helper: Safely insert row with plain text & compact formatting
function appendSafeRow(sheet, rowData) {
  var lastRow = sheet.getLastRow() + 1;
  sheet.getRange(lastRow, 6).setNumberFormat("@");
  sheet.getRange(lastRow, 1, 1, rowData.length).setValues([rowData]);
  sheet.setRowHeight(lastRow, 28);
  sheet.getRange(lastRow, 1, 1, rowData.length)
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP)
    .setVerticalAlignment("middle")
    .setFontSize(10);
  adjustColumnWidths(sheet);
}

// 2. HTTP Webhook Listener: Auto appends leads to their respective tabs
function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Ensure both sheets exist
    var mapSheet = getOrCreateSheet(ss, "Local Business Leads");
    var igSheet = getOrCreateSheet(ss, "Instagram Leads");
    
    if (mapSheet.getLastRow() === 0) formatSheetHeader(mapSheet, "#0f172a", "#38bdf8");
    if (igSheet.getLastRow() === 0) formatSheetHeader(igSheet, "#833ab4", "#ffffff");

    // Action A: Add Single Lead
    if (contents.action === "addLead" && contents.lead) {
      var targetSheet = getTargetSheet(ss, contents.lead);
      appendSafeRow(targetSheet, contents.lead);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Lead added to " + targetSheet.getName()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Action B: Sync All Leads (Splits into Local vs Instagram tabs)
    if (contents.action === "syncAll" && contents.leads) {
      var mapLeads = [];
      var igLeads = [];

      for (var i = 0; i < contents.leads.length; i++) {
        var row = contents.leads[i];
        var leadId = String(row[0] || "");
        var source = String(row[24] || "");
        
        if (leadId.indexOf("ig:") === 0 || source.indexOf("Instagram") !== -1) {
          igLeads.push(row);
        } else {
          mapLeads.push(row);
        }
      }

      // Write Local Business Leads
      if (mapSheet.getLastRow() > 1) {
        mapSheet.getRange(2, 1, mapSheet.getLastRow() - 1, HEADERS.length).clearContent();
      }
      if (mapLeads.length > 0) {
        mapSheet.getRange(2, 6, mapLeads.length, 1).setNumberFormat("@");
        mapSheet.getRange(2, 1, mapLeads.length, HEADERS.length).setValues(mapLeads);
        mapSheet.setRowHeightsForced(2, mapLeads.length, 28);
        mapSheet.getRange(2, 1, mapLeads.length, HEADERS.length)
          .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP)
          .setVerticalAlignment("middle")
          .setFontSize(10);
        adjustColumnWidths(mapSheet);
      }

      // Write Instagram Leads
      if (igSheet.getLastRow() > 1) {
        igSheet.getRange(2, 1, igSheet.getLastRow() - 1, HEADERS.length).clearContent();
      }
      if (igLeads.length > 0) {
        igSheet.getRange(2, 6, igLeads.length, 1).setNumberFormat("@");
        igSheet.getRange(2, 1, igLeads.length, HEADERS.length).setValues(igLeads);
        igSheet.setRowHeightsForced(2, igLeads.length, 28);
        igSheet.getRange(2, 1, igLeads.length, HEADERS.length)
          .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP)
          .setVerticalAlignment("middle")
          .setFontSize(10);
        adjustColumnWidths(igSheet);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        localCount: mapLeads.length,
        instagramCount: igLeads.length,
        total: contents.leads.length
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid action" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function (GET)
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    ready: true,
    tabs: ["Local Business Leads", "Instagram Leads"]
  })).setMimeType(ContentService.MimeType.JSON);
}
