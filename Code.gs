/**
 * Server-side controller for Sarana Prasarana Web Application.
 */

function doGet(e) {
  // Jika ada parameter payload, tangani sebagai API request
  if (e && e.parameter && e.parameter.payload) {
    return handleApiRequest(e.parameter.payload);
  }
  
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('SIPRAS - Sistem Informasi Sarana Prasarana')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Menangani API request dari client eksternal (luar GAS environment).
 * Menerima payload JSON: { action: string, params: object }
 */
function handleApiRequest(payloadStr) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    var payload = JSON.parse(payloadStr);
    var action = payload.action;
    var params = payload.params || {};
    var result;
    
    switch (action) {
      case "readData":
        result = readData(params.sheetName);
        break;
      case "addData":
        result = addData(params.sheetName, params.item);
        break;
      case "updateData":
        result = updateData(params.sheetName, params.id, params.item);
        break;
      case "deleteData":
        result = deleteData(params.sheetName, params.id);
        break;
      case "runSetupFromWeb":
        result = runSetupFromWeb();
        break;
      case "getDatabaseConfig":
        result = getDatabaseConfig();
        break;
      case "saveDatabaseConfig":
        result = saveDatabaseConfig(params.url);
        break;
      case "saveLogoConfig":
        result = saveLogoConfig(params.url);
        break;
      case "verifyAdminPassword":
        result = verifyAdminPassword(params.password);
        break;
      case "changeAdminPassword":
        result = changeAdminPassword(params.oldPassword, params.newPassword);
        break;
      default:
        throw new Error("Action tidak dikenal: " + action);
    }
    
    output.setContent(JSON.stringify({ result: result }));
  } catch (e) {
    output.setContent(JSON.stringify({ error: e.message || e.toString() }));
  }
  
  return output;
}

/**
 * Helper to include other HTML files (CSS, JS) in the main template.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Generic Read operation for any sheet.
 * Maps sheet rows into an array of objects based on header names.
 */
function readData(sheetName) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];
    
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return []; // Empty sheet or only headers
    
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    
    var data = [];
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        var val = row[j];
        if (val instanceof Date) {
          // Format date for consistent display
          val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
        }
        obj[headers[j]] = val;
      }
      data.push(obj);
    }
    return data;
  } catch (e) {
    Logger.log("Error in readData (" + sheetName + "): " + e.toString());
    throw new Error("Gagal membaca data: " + e.toString());
  }
}

/**
 * Generic Create operation.
 * Appends a new row to the sheet mapping properties to headers.
 */
function addData(sheetName, item) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000); // Wait up to 15 seconds for lock
  } catch (e) {
    throw new Error("Gagal mendapatkan kunci sheet. Silakan coba lagi.");
  }
  
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet '" + sheetName + "' tidak ditemukan.");
    
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    
    // Auto-generate ID and Timestamp
    var prefix = sheetName.substring(0, 3).toUpperCase();
    var timestamp = new Date();
    var randomSuffix = Math.floor(Math.random() * 9000 + 1000); // 4 digit random
    var id = prefix + "-" + Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "yyMMdd") + "-" + randomSuffix;
    
    item["ID"] = id;
    item["Timestamp"] = timestamp;
    
    // Construct the row array aligned to sheet headers
    var newRow = headers.map(function(header) {
      var value = item[header];
      return value !== undefined && value !== null ? value : "";
    });
    
    sheet.appendRow(newRow);
    return { success: true, id: id, data: item };
  } catch (e) {
    Logger.log("Error in addData (" + sheetName + "): " + e.toString());
    throw new Error("Gagal menambah data: " + e.toString());
  } finally {
    lock.releaseLock();
  }
}

/**
 * Generic Update operation.
 * Finds a row by ID and updates only modified properties.
 */
function updateData(sheetName, id, item) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    throw new Error("Gagal mendapatkan kunci sheet. Silakan coba lagi.");
  }
  
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet '" + sheetName + "' tidak ditemukan.");
    
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) throw new Error("Tidak ada data untuk diedit.");
    
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().map(function(row) {
      return row[0].toString();
    });
    
    var rowIndex = ids.indexOf(id.toString());
    if (rowIndex === -1) throw new Error("Data dengan ID " + id + " tidak ditemukan.");
    
    var actualRowIndex = rowIndex + 2; // Header (1) + 0-index offset (1)
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    
    // Update individual cells based on keys in item (skipping ID & Timestamp)
    for (var j = 2; j < headers.length; j++) {
      var headerName = headers[j];
      if (item[headerName] !== undefined) {
        var value = item[headerName];
        sheet.getRange(actualRowIndex, j + 1).setValue(value !== null ? value : "");
      }
    }
    
    return { success: true };
  } catch (e) {
    Logger.log("Error in updateData (" + sheetName + "): " + e.toString());
    throw new Error("Gagal memperbarui data: " + e.toString());
  } finally {
    lock.releaseLock();
  }
}

/**
 * Generic Delete operation.
 * Deletes a row matching ID.
 */
function deleteData(sheetName, id) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    throw new Error("Gagal mendapatkan kunci sheet. Silakan coba lagi.");
  }
  
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet '" + sheetName + "' tidak ditemukan.");
    
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) throw new Error("Tidak ada data untuk dihapus.");
    
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().map(function(row) {
      return row[0].toString();
    });
    
    var rowIndex = ids.indexOf(id.toString());
    if (rowIndex === -1) throw new Error("Data dengan ID " + id + " tidak ditemukan.");
    
    sheet.deleteRow(rowIndex + 2);
    return { success: true };
  } catch (e) {
    Logger.log("Error in deleteData (" + sheetName + "): " + e.toString());
    throw new Error("Gagal menghapus data: " + e.toString());
  } finally {
    lock.releaseLock();
  }
}

/**
 * Setup sheet utility trigger from Web frontend interface.
 */
function runSetupFromWeb() {
  try {
    return setupSpreadsheet();
  } catch (e) {
    return "Error: " + e.toString();
  }
}

/**
 * Helper to get the master spreadsheet container where settings are stored.
 */
function getMasterSpreadsheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch(e) {
    Logger.log("Error opening active spreadsheet: " + e.toString());
  }
  return null;
}

/**
 * Gets a setting value by key from the "Setting" sheet in the master spreadsheet.
 */
function getSettingValue(key) {
  var ss = getMasterSpreadsheet();
  if (!ss) return "";
  
  var sheet = ss.getSheetByName("Setting");
  if (!sheet) return ""; // Sheet hasn't been set up yet
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return "";
  
  var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0].toString().trim() === key) {
      return data[i][1] ? data[i][1].toString() : "";
    }
  }
  return "";
}

/**
 * Sets a setting value by key in the "Setting" sheet in the master spreadsheet.
 */
function setSettingValue(key, value) {
  var ss = getMasterSpreadsheet();
  if (!ss) return;
  
  var sheet = ss.getSheetByName("Setting");
  if (!sheet) {
    // Re-setup Settings sheet if deleted
    sheet = ss.insertSheet("Setting");
    sheet.appendRow(["Key", "Value", "Keterangan"]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 3).setBackground("#0f172a").setFontColor("#ffffff").setFontWeight("bold");
  }
  
  var lastRow = sheet.getLastRow();
  var data = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 2).getValues() : [];
  var rowIndex = -1;
  
  for (var i = 0; i < data.length; i++) {
    if (data[i][0].toString().trim() === key) {
      rowIndex = i + 2; // +2 offset for 1-based index and headers row
      break;
    }
  }
  
  if (rowIndex !== -1) {
    sheet.getRange(rowIndex, 2).setValue(value);
  } else {
    sheet.appendRow([key, value, ""]);
  }
}

/**
 * Helper function to open/retrieve the target database Spreadsheet.
 * Checks if a custom URL/ID has been saved in settings, 
 * and falls back to the active container spreadsheet if not set.
 */
function getSpreadsheet() {
  var url = getSettingValue('DATABASE_URL');
  if (url) {
    try {
      url = url.trim();
      if (url.indexOf("http") === 0) {
        return SpreadsheetApp.openByUrl(url);
      } else {
        return SpreadsheetApp.openById(url);
      }
    } catch (e) {
      Logger.log("Failed to open spreadsheet by URL/ID: " + e.toString());
    }
  }
  
  // Fallback to container-bound master spreadsheet
  var masterSs = getMasterSpreadsheet();
  if (masterSs) return masterSs;
  
  return null;
}

/**
 * API to get the current database configuration.
 * Returns the custom URL, the fallback active URL, and Logo URL.
 */
function getDatabaseConfig() {
  var customUrl = getSettingValue('DATABASE_URL');
  var logoUrl = getSettingValue('LOGO_URL') || "https://cdn-icons-png.flaticon.com/512/3061/3061341.png";
  var currentUrl = "";
  
  try {
    var ss = getSpreadsheet();
    if (ss) {
      currentUrl = ss.getUrl();
    }
  } catch (e) {}
  
  return {
    customUrl: customUrl,
    currentUrl: currentUrl,
    logoUrl: logoUrl
  };
}

/**
 * API to save a new spreadsheet URL or ID as the database.
 */
function saveDatabaseConfig(url) {
  try {
    if (url) {
      url = url.trim();
      // Test opening the spreadsheet first to validate
      if (url.indexOf("http") === 0) {
        SpreadsheetApp.openByUrl(url);
      } else {
        SpreadsheetApp.openById(url);
      }
      setSettingValue('DATABASE_URL', url);
    } else {
      setSettingValue('DATABASE_URL', "");
    }
    return { success: true };
  } catch (e) {
    throw new Error("URL Spreadsheet tidak valid atau tidak memiliki izin akses: " + e.toString());
  }
}

/**
 * API to save a new application Logo URL.
 */
function saveLogoConfig(url) {
  try {
    if (url) {
      url = url.trim();
    }
    setSettingValue('LOGO_URL', url);
    return { success: true };
  } catch (e) {
    throw new Error("Gagal menyimpan URL Logo: " + e.toString());
  }
}

/**
 * Verifies if the provided password matches the configured admin password.
 * Default password is "admin123" if not set.
 */
function verifyAdminPassword(password) {
  var storedPassword = getSettingValue('ADMIN_PASSWORD') || "admin123";
  return password === storedPassword;
}

/**
 * Changes the admin password.
 * Requires verifying the old password first.
 */
function changeAdminPassword(oldPassword, newPassword) {
  var storedPassword = getSettingValue('ADMIN_PASSWORD') || "admin123";
  if (oldPassword !== storedPassword) {
    throw new Error("Password lama tidak cocok.");
  }
  
  if (!newPassword || newPassword.trim().length < 4) {
    throw new Error("Password baru minimal harus 4 karakter.");
  }
  
  setSettingValue('ADMIN_PASSWORD', newPassword.trim());
  return true;
}
