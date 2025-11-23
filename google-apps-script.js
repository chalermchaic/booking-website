function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Bookings');
  
  // ถ้ายังไม่มี Sheet 'Bookings' ให้สร้างใหม่
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Bookings');
    // สร้าง Header
    sheet.appendRow(['Timestamp', 'Name', 'Phone', 'Email', 'Service', 'Date', 'Time', 'Notes', 'Price', 'Duration']);
  }
  
  var data = JSON.parse(e.postData.contents);
  
  sheet.appendRow([
    new Date(),
    data.name,
    data.phone,
    data.email,
    data.serviceName,
    data.date,
    data.time,
    data.notes,
    data.price,
    data.duration
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({status: "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput("Google Apps Script is running correctly.");
}
