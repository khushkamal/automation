/**
 * ====================================================================
 * 🚀 GOOGLE APPS SCRIPT: AUTO-ENTER LEADS INTO GOOGLE SHEET (100% FREE)
 * ====================================================================
 * 
 * STEP-BY-STEP SETUP (Takes 1 Minute):
 * 1. Open your Google Sheet.
 * 2. Click "Extensions" > "Apps Script" in top menu.
 * 3. Delete everything inside the editor and PASTE THIS WHOLE CODE.
 * 4. Click "Save" (💾).
 * 5. Run "setupSheet" function once (Click Run button) to create the 26 columns header!
 * 6. Click "Deploy" (top right) > "New deployment".
 * 7. Select type: "Web app".
 * 8. Set:
 *    - Description: "Lead Sync Webhook"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (IMPORTANT!)
 * 9. Click "Deploy", Authorize access, and COPY the "Web app URL".
 * 10. Paste that Web App URL in your Dashboard ("Google Sheet Auto-Sync" button)!
 */

// 1. One-Click Setup Sheet Headers
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Leads") || ss.insertSheet("Leads");
  
  var headers = [
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
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#0f172a")
    .setFontColor("#38bdf8");
  sheet.setFrozenRows(1);

  // Set Phone column (Column 6) and Lead ID (Column 1) to Plain Text to avoid formula #ERROR!
  sheet.getRange(1, 1, sheet.getMaxRows(), 1).setNumberFormat("@");
  sheet.getRange(1, 6, sheet.getMaxRows(), 1).setNumberFormat("@");
}

// Helper: Sanitize row to prevent Google Sheets from interpreting '+' or '=' as mathematical formulas
function sanitizeRow(row) {
  if (!row || !Array.isArray(row)) return [];
  return row.map(function(val) {
    if (val === null || val === undefined) return "";
    var s = String(val).trim();
    // If starts with '+' or '=', force Google Sheets plain text with leading quote
    if (s.charAt(0) === "+" || s.charAt(0) === "=") {
      return "'" + s;
    }
    return val;
  });
}

// 2. HTTP Webhook Listener: Auto appends leads row-by-row
function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Leads") || ss.insertSheet("Leads");
    
    // If headers don't exist, create them
    if (sheet.getLastRow() === 0) {
      setupSheet();
    }
    
    if (contents.action === "addLead" && contents.lead) {
      var cleanRow = sanitizeRow(contents.lead);
      sheet.appendRow(cleanRow);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Lead added" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (contents.action === "syncAll" && contents.leads) {
      for (var i = 0; i < contents.leads.length; i++) {
        var cleanRow = sanitizeRow(contents.leads[i]);
        sheet.appendRow(cleanRow);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", count: contents.leads.length }))
        .setMimeType(ContentService.MimeType.JSON);
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
  return ContentService.createTextOutput(JSON.stringify({ status: "online", ready: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
