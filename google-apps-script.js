/**
 * Google Apps Script Webhook for Restaurant PWA
 * 
 * INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code, replacing everything.
 * 4. Click Deploy > New Deployment
 * 5. Select type: "Web app"
 * 6. Execute as: "Me"
 * 7. Who has access: "Anyone"
 * 8. Click Deploy, authorize permissions, and copy the "Web app URL"
 */

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    // In Apps Script Web Apps, simple text/plain POSTs come in e.postData.contents
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    if (action === 'ADD_MENU_ITEM') {
      const menuSheet = sheet.getSheetByName('Menu');
      if (!menuSheet) throw new Error("Sheet 'Menu' not found");
      
      const { item } = payload;
      // Columns: id, category_id, name, description, price, image_url, preparation_time, dietary_tags, is_available, is_featured
      menuSheet.appendRow([
        item.id,
        item.category_id,
        item.name,
        item.description || '',
        item.price,
        item.image_url || '',
        item.preparation_time || 0,
        (item.dietary_tags || []).join(','),
        item.is_available ? 'TRUE' : 'FALSE',
        item.is_featured ? 'TRUE' : 'FALSE'
      ]);
      
      return createJsonResponse({ success: true, message: 'Item added' });
    }
    
    if (action === 'DELETE_MENU_ITEM') {
      const menuSheet = sheet.getSheetByName('Menu');
      const data = menuSheet.getDataRange().getValues();
      const idToDelete = payload.id;
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === idToDelete) {
          menuSheet.deleteRow(i + 1); // +1 because array is 0-indexed, sheet is 1-indexed
          return createJsonResponse({ success: true, message: 'Item deleted' });
        }
      }
      throw new Error("Item not found");
    }

    if (action === 'TOGGLE_AVAILABILITY') {
      const menuSheet = sheet.getSheetByName('Menu');
      const data = menuSheet.getDataRange().getValues();
      const idToToggle = payload.id;
      const isAvailable = payload.is_available;
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === idToToggle) {
          // Column 9 (index 8) is is_available
          menuSheet.getRange(i + 1, 9).setValue(isAvailable ? 'TRUE' : 'FALSE');
          return createJsonResponse({ success: true, message: 'Availability toggled' });
        }
      }
      throw new Error("Item not found");
    }

    throw new Error("Unknown action");
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

// Support CORS Preflight
function doOptions(e) {
  return createJsonResponse({ success: true });
}

function createJsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
