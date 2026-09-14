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
    .setFontColor("#38bdf8")
    .setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 36);

  // Set Phone column (Column 6, F) and Lead ID (Column 1, A) to Plain Text format (@)
  sheet.getRange(1, 1, sheet.getMaxRows(), 1).setNumberFormat("@");
  sheet.getRange(1, 6, sheet.getMaxRows(), 1).setNumberFormat("@");
}

// 1.1 Helper: Remove All Blank Rows & Fix Spaces / Row Heights (1-Click Clean)
function cleanAndCompactSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Leads") || ss.getActiveSheet();
  var lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    // 1. Format row height to clean, compact 28px for all rows
    sheet.setRowHeightsForced(2, lastRow - 1, 28);

    // 2. Set text wrapping to CLIP so long messages don't stretch row height
    sheet.getRange(2, 1, lastRow - 1, 26)
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP)
      .setVerticalAlignment("middle")
      .setFontSize(10);

    // 3. Ensure Phone & Lead ID are plain text (no #ERROR!)
    sheet.getRange(2, 1, lastRow - 1, 1).setNumberFormat("@");
    sheet.getRange(2, 6, lastRow - 1, 1).setNumberFormat("@");

    // 4. Delete completely empty rows between data
    for (var r = lastRow; r >= 2; r--) {
      var leadIdVal = sheet.getRange(r, 1).getValue();
      var bizNameVal = sheet.getRange(r, 2).getValue();
      if (!leadIdVal && !bizNameVal) {
        sheet.deleteRow(r);
      }
    }
  }
}

// Helper: Safely insert row as raw text to prevent Google Sheets #ERROR! formula parse and compact it
function appendSafeRow(sheet, rowData) {
  var lastRow = sheet.getLastRow() + 1;
  sheet.getRange(lastRow, 6).setNumberFormat("@");
  sheet.getRange(lastRow, 1, 1, rowData.length).setValues([rowData]);
  sheet.setRowHeight(lastRow, 28);
  sheet.getRange(lastRow, 1, 1, rowData.length)
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP)
    .setVerticalAlignment("middle")
    .setFontSize(10);
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
      appendSafeRow(sheet, contents.lead);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Lead added" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (contents.action === "syncAll" && contents.leads) {
      // Clear old rows below header to avoid blank gaps
      if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, 26).clearContent();
      }

      if (contents.leads.length > 0) {
        sheet.getRange(2, 6, contents.leads.length, 1).setNumberFormat("@");
        sheet.getRange(2, 1, contents.leads.length, contents.leads[0].length).setValues(contents.leads);
        sheet.setRowHeightsForced(2, contents.leads.length, 28);
        sheet.getRange(2, 1, contents.leads.length, contents.leads[0].length)
          .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP)
          .setVerticalAlignment("middle")
          .setFontSize(10);
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
