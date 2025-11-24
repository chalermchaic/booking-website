// ===== Google Apps Script Code =====
// สร้าง Sheet 2 แท็บ: "Bookings" และ "Services"
// Copy โค้ดนี้ไปวางใน Google Apps Script

var SHEET_ID = 'YOUR_SHEET_ID'; // ใส่ ID ของ Google Sheet
var ADMIN_EMAIL = 'admin@example.com'; // ใส่อีเมลแอดมินที่ต้องการรับแจ้งเตือน
var WEBSITE_URL = 'https://your-website.com'; // ใส่ URL เว็บไซต์ของคุณ (สำหรับ cancel link)

// สร้าง unique token 32 ตัวอักษร
function generateToken() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var token = '';
  for (var i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function doGet(e) {
  var action = e.parameter.action;

  if (action === 'getServices') {
    return getServices();
  }

  // ดึงข้อมูลการจองด้วย token
  if (action === 'getBooking') {
    return getBookingByToken(e.parameter.token);
  }

  return ContentService.createTextOutput(JSON.stringify({error: "Invalid action"}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var action = data.action;

  if (action === 'addBooking') {
    return addBooking(data);
  } else if (action === 'cancelBooking') {
    return cancelBooking(data); // สำหรับ Admin (ใช้ email+date+time)
  } else if (action === 'cancelBookingByToken') {
    return cancelBookingByToken(data.token); // สำหรับลูกค้า (ใช้ token)
  } else if (action === 'addService') {
    return addService(data);
  } else if (action === 'updateService') {
    return updateService(data);
  } else if (action === 'deleteService') {
    return deleteService(data);
  }

  return ContentService.createTextOutput(JSON.stringify({error: "Invalid action"}))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== BOOKING FUNCTIONS =====
function addBooking(data) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Bookings');
  var token = generateToken(); // สร้าง unique token สำหรับการยกเลิก
  var cancelLink = WEBSITE_URL + '?cancel=' + token;

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
    data.duration,
    token // Column K - เก็บ token สำหรับยกเลิก
  ]);

  // ส่ง Email ให้ลูกค้า (พร้อม cancel link)
  try {
    MailApp.sendEmail(
      data.email,
      '✓ การจองคิวสำเร็จ - ' + data.serviceName,
      'สวัสดี ' + data.name + '\n\n' +
      'การจองคิวของคุณสำเร็จแล้ว\n\n' +
      '📋 รายละเอียดการจอง:\n' +
      '• บริการ: ' + data.serviceName + '\n' +
      '• วัน เวลา: ' + data.date + ' เวลา ' + data.time + '\n' +
      '• ระยะเวลา: ' + data.duration + ' นาที\n' +
      '• ราคา: ฿' + data.price + '\n\n' +
      '---\n\n' +
      '❌ หากต้องการยกเลิกการจอง กรุณาคลิกลิงก์นี้:\n' +
      cancelLink + '\n\n' +
      '(ลิงก์นี้ใช้ได้เฉพาะการจองนี้เท่านั้น กรุณาเก็บไว้เป็นความลับ)\n\n' +
      'ขอบคุณที่ใช้บริการของเรา!'
    );
  } catch(err) {
    console.log('Customer email error: ' + err);
  }

  // ส่ง Email แจ้งเตือนแอดมิน
  try {
    MailApp.sendEmail(
      ADMIN_EMAIL,
      '🔔 มีการจองคิวใหม่ - ' + data.serviceName,
      '📅 มีการจองคิวใหม่เข้ามา!\n\n' +
      '👤 ชื่อลูกค้า: ' + data.name + '\n' +
      '📱 เบอร์โทร: ' + data.phone + '\n' +
      '📧 อีเมล: ' + data.email + '\n\n' +
      '💼 บริการ: ' + data.serviceName + '\n' +
      '📆 วันที่: ' + data.date + '\n' +
      '⏰ เวลา: ' + data.time + '\n' +
      '⏱ ระยะเวลา: ' + data.duration + ' นาที\n' +
      '💰 ราคา: ฿' + data.price + '\n\n' +
      '📝 หมายเหตุ: ' + (data.notes || '-') + '\n\n' +
      '---\n' +
      'ข้อมูลนี้ถูกบันทึกลง Google Sheets แล้ว'
    );
  } catch(err) {
    console.log('Admin email error: ' + err);
  }

  return ContentService.createTextOutput(JSON.stringify({status: "success", token: token}))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== CANCEL BOOKING FUNCTION (Admin) =====
function cancelBooking(data) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Bookings');
  var dataRange = sheet.getDataRange().getValues();
  var cancelledBooking = null;

  // หา booking ที่ต้องการยกเลิก (ใช้ email + date + time เป็น key)
  for (var i = 1; i < dataRange.length; i++) {
    if (dataRange[i][3] == data.email &&
        dataRange[i][5] == data.date &&
        dataRange[i][6] == data.time) {
      cancelledBooking = {
        name: dataRange[i][1],
        phone: dataRange[i][2],
        email: dataRange[i][3],
        serviceName: dataRange[i][4],
        date: dataRange[i][5],
        time: dataRange[i][6]
      };
      sheet.deleteRow(i + 1);
      break;
    }
  }

  if (!cancelledBooking) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: "Booking not found"}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ส่ง Email แจ้งลูกค้าว่ายกเลิกสำเร็จ
  try {
    MailApp.sendEmail(
      cancelledBooking.email,
      '❌ ยกเลิกการจองคิวสำเร็จ - ' + cancelledBooking.serviceName,
      'สวัสดี ' + cancelledBooking.name + '\n\n' +
      'การจองคิวของคุณได้ถูกยกเลิกแล้ว\n\n' +
      'บริการ: ' + cancelledBooking.serviceName + '\n' +
      'วัน เวลา: ' + cancelledBooking.date + ' เวลา ' + cancelledBooking.time + '\n\n' +
      'หากต้องการจองใหม่ กรุณาเข้าเว็บไซต์ของเรา\n\n' +
      'ขอบคุณครับ/ค่ะ'
    );
  } catch(err) {
    console.log('Customer cancel email error: ' + err);
  }

  // ส่ง Email แจ้งแอดมินว่ามีการยกเลิก
  try {
    MailApp.sendEmail(
      ADMIN_EMAIL,
      '⚠️ มีการยกเลิกนัดหมาย - ' + cancelledBooking.serviceName,
      '❌ มีการยกเลิกนัดหมาย!\n\n' +
      '👤 ชื่อลูกค้า: ' + cancelledBooking.name + '\n' +
      '📱 เบอร์โทร: ' + cancelledBooking.phone + '\n' +
      '📧 อีเมล: ' + cancelledBooking.email + '\n\n' +
      '💼 บริการ: ' + cancelledBooking.serviceName + '\n' +
      '📆 วันที่: ' + cancelledBooking.date + '\n' +
      '⏰ เวลา: ' + cancelledBooking.time + '\n\n' +
      '---\n' +
      'ข้อมูลนี้ถูกลบออกจาก Google Sheets แล้ว'
    );
  } catch(err) {
    console.log('Admin cancel email error: ' + err);
  }

  return ContentService.createTextOutput(JSON.stringify({status: "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== TOKEN-BASED BOOKING FUNCTIONS (สำหรับลูกค้า) =====
// ดึงข้อมูลการจองด้วย token
function getBookingByToken(token) {
  if (!token) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: "Token required"}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Bookings');
  var dataRange = sheet.getDataRange().getValues();

  // หา booking ที่ตรงกับ token (Column K = index 10)
  for (var i = 1; i < dataRange.length; i++) {
    if (dataRange[i][10] == token) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        booking: {
          name: dataRange[i][1],
          phone: dataRange[i][2],
          email: dataRange[i][3],
          serviceName: dataRange[i][4],
          date: dataRange[i][5],
          time: dataRange[i][6],
          notes: dataRange[i][7],
          price: dataRange[i][8],
          duration: dataRange[i][9]
        }
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({status: "error", message: "Booking not found"}))
    .setMimeType(ContentService.MimeType.JSON);
}

// ยกเลิกการจองด้วย token (สำหรับลูกค้า)
function cancelBookingByToken(token) {
  if (!token) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: "Token required"}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Bookings');
  var dataRange = sheet.getDataRange().getValues();
  var cancelledBooking = null;

  // หา booking ที่ตรงกับ token (Column K = index 10)
  for (var i = 1; i < dataRange.length; i++) {
    if (dataRange[i][10] == token) {
      cancelledBooking = {
        name: dataRange[i][1],
        phone: dataRange[i][2],
        email: dataRange[i][3],
        serviceName: dataRange[i][4],
        date: dataRange[i][5],
        time: dataRange[i][6]
      };
      sheet.deleteRow(i + 1);
      break;
    }
  }

  if (!cancelledBooking) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: "Booking not found or already cancelled"}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ส่ง Email แจ้งลูกค้าว่ายกเลิกสำเร็จ
  try {
    MailApp.sendEmail(
      cancelledBooking.email,
      '❌ ยกเลิกการจองคิวสำเร็จ - ' + cancelledBooking.serviceName,
      'สวัสดี ' + cancelledBooking.name + '\n\n' +
      'การจองคิวของคุณได้ถูกยกเลิกแล้ว\n\n' +
      'บริการ: ' + cancelledBooking.serviceName + '\n' +
      'วัน เวลา: ' + cancelledBooking.date + ' เวลา ' + cancelledBooking.time + '\n\n' +
      'หากต้องการจองใหม่ กรุณาเข้าเว็บไซต์ของเรา\n\n' +
      'ขอบคุณครับ/ค่ะ'
    );
  } catch(err) {
    console.log('Customer cancel email error: ' + err);
  }

  // ส่ง Email แจ้งแอดมินว่ามีการยกเลิก
  try {
    MailApp.sendEmail(
      ADMIN_EMAIL,
      '⚠️ ลูกค้ายกเลิกนัดหมาย - ' + cancelledBooking.serviceName,
      '❌ ลูกค้ายกเลิกนัดหมายเอง (ผ่านลิงก์ในอีเมล)\n\n' +
      '👤 ชื่อลูกค้า: ' + cancelledBooking.name + '\n' +
      '📱 เบอร์โทร: ' + cancelledBooking.phone + '\n' +
      '📧 อีเมล: ' + cancelledBooking.email + '\n\n' +
      '💼 บริการ: ' + cancelledBooking.serviceName + '\n' +
      '📆 วันที่: ' + cancelledBooking.date + '\n' +
      '⏰ เวลา: ' + cancelledBooking.time + '\n\n' +
      '---\n' +
      'ข้อมูลนี้ถูกลบออกจาก Google Sheets แล้ว'
    );
  } catch(err) {
    console.log('Admin cancel email error: ' + err);
  }

  return ContentService.createTextOutput(JSON.stringify({status: "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== SERVICE FUNCTIONS =====
function getServices() {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Services');
  var data = sheet.getDataRange().getValues();
  var services = [];

  // Skip header row (row 0)
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) { // ถ้ามี ID
      services.push({
        id: data[i][0],
        name: data[i][1],
        desc: data[i][2],
        price: parseFloat(data[i][3]),
        duration: parseInt(data[i][4])
      });
    }
  }

  return ContentService.createTextOutput(JSON.stringify({status: "success", services: services}))
    .setMimeType(ContentService.MimeType.JSON);
}

function addService(data) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Services');

  sheet.appendRow([
    data.id,
    data.name,
    data.desc,
    data.price,
    data.duration,
    new Date() // created_at
  ]);

  // ส่ง Email แจ้งแอดมิน
  try {
    MailApp.sendEmail(
      ADMIN_EMAIL,
      '➕ มีการเพิ่มบริการใหม่ - ' + data.name,
      '🆕 มีการเพิ่มบริการใหม่!\n\n' +
      '💼 ชื่อบริการ: ' + data.name + '\n' +
      '📝 รายละเอียด: ' + data.desc + '\n' +
      '💰 ราคา: ฿' + data.price + '\n' +
      '⏱ ระยะเวลา: ' + data.duration + ' นาที\n\n' +
      '---\n' +
      'ข้อมูลนี้ถูกบันทึกลง Google Sheets แล้ว'
    );
  } catch(err) {
    console.log('Admin email error: ' + err);
  }

  return ContentService.createTextOutput(JSON.stringify({status: "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}

function updateService(data) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Services');
  var dataRange = sheet.getDataRange().getValues();
  var oldService = null;

  for (var i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] == data.id) {
      oldService = {
        name: dataRange[i][1],
        desc: dataRange[i][2],
        price: dataRange[i][3],
        duration: dataRange[i][4]
      };
      sheet.getRange(i + 1, 2).setValue(data.name);
      sheet.getRange(i + 1, 3).setValue(data.desc);
      sheet.getRange(i + 1, 4).setValue(data.price);
      sheet.getRange(i + 1, 5).setValue(data.duration);
      sheet.getRange(i + 1, 7).setValue(new Date()); // updated_at
      break;
    }
  }

  // ส่ง Email แจ้งแอดมิน
  try {
    var changes = '';
    if (oldService) {
      if (oldService.name != data.name) changes += '• ชื่อ: ' + oldService.name + ' → ' + data.name + '\n';
      if (oldService.desc != data.desc) changes += '• รายละเอียด: เปลี่ยนแปลง\n';
      if (oldService.price != data.price) changes += '• ราคา: ฿' + oldService.price + ' → ฿' + data.price + '\n';
      if (oldService.duration != data.duration) changes += '• ระยะเวลา: ' + oldService.duration + ' → ' + data.duration + ' นาที\n';
    }

    MailApp.sendEmail(
      ADMIN_EMAIL,
      '✏️ มีการแก้ไขบริการ - ' + data.name,
      '📝 มีการแก้ไขข้อมูลบริการ!\n\n' +
      '💼 บริการ: ' + data.name + '\n\n' +
      '🔄 การเปลี่ยนแปลง:\n' + (changes || '• ไม่มีการเปลี่ยนแปลง\n') + '\n' +
      '📊 ข้อมูลปัจจุบัน:\n' +
      '• ชื่อ: ' + data.name + '\n' +
      '• รายละเอียด: ' + data.desc + '\n' +
      '• ราคา: ฿' + data.price + '\n' +
      '• ระยะเวลา: ' + data.duration + ' นาที\n\n' +
      '---\n' +
      'ข้อมูลนี้ถูกอัพเดทใน Google Sheets แล้ว'
    );
  } catch(err) {
    console.log('Admin email error: ' + err);
  }

  return ContentService.createTextOutput(JSON.stringify({status: "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}

function deleteService(data) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Services');
  var dataRange = sheet.getDataRange().getValues();
  var deletedService = null;

  for (var i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] == data.id) {
      deletedService = {
        name: dataRange[i][1],
        desc: dataRange[i][2],
        price: dataRange[i][3],
        duration: dataRange[i][4]
      };
      sheet.deleteRow(i + 1);
      break;
    }
  }

  // ส่ง Email แจ้งแอดมิน
  if (deletedService) {
    try {
      MailApp.sendEmail(
        ADMIN_EMAIL,
        '🗑️ มีการลบบริการ - ' + deletedService.name,
        '❌ มีการลบบริการออกจากระบบ!\n\n' +
        '💼 บริการที่ถูกลบ:\n' +
        '• ชื่อ: ' + deletedService.name + '\n' +
        '• รายละเอียด: ' + deletedService.desc + '\n' +
        '• ราคา: ฿' + deletedService.price + '\n' +
        '• ระยะเวลา: ' + deletedService.duration + ' นาที\n\n' +
        '---\n' +
        'ข้อมูลนี้ถูกลบออกจาก Google Sheets แล้ว'
      );
    } catch(err) {
      console.log('Admin email error: ' + err);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({status: "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== SETUP FUNCTION =====
// รันครั้งแรกเพื่อสร้าง Header
function setupSheets() {
  var ss = SpreadsheetApp.openById(SHEET_ID);

  // สร้าง Bookings sheet
  var bookingsSheet = ss.getSheetByName('Bookings');
  if (!bookingsSheet) {
    bookingsSheet = ss.insertSheet('Bookings');
  }
  bookingsSheet.getRange(1, 1, 1, 11).setValues([[
    'Timestamp', 'Name', 'Phone', 'Email', 'Service', 'Date', 'Time', 'Notes', 'Price', 'Duration', 'Token'
  ]]);

  // สร้าง Services sheet
  var servicesSheet = ss.getSheetByName('Services');
  if (!servicesSheet) {
    servicesSheet = ss.insertSheet('Services');
  }
  servicesSheet.getRange(1, 1, 1, 7).setValues([[
    'ID', 'Name', 'Description', 'Price', 'Duration', 'Created', 'Updated'
  ]]);
}
