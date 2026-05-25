/**
 * Setup and initialize the Google Spreadsheet tabs for the Sarana Prasarana database.
 * Run this function from the Google Apps Script editor once to create the tables.
 */
function setupSpreadsheet() {
  // 1. Setup the "Setting" sheet in the Master Spreadsheet container
  var masterSs = getMasterSpreadsheet();
  if (masterSs) {
    var settingSheet = masterSs.getSheetByName("Setting");
    if (!settingSheet) {
      settingSheet = masterSs.insertSheet("Setting");
      settingSheet.appendRow(["Key", "Value", "Keterangan"]);
      settingSheet.setFrozenRows(1);
      var headerRange = settingSheet.getRange(1, 1, 1, 3);
      headerRange.setBackground("#0f172a")
                 .setFontColor("#ffffff")
                 .setFontWeight("bold")
                 .setHorizontalAlignment("center");
      
      // Add default configurations
      var defaultSettings = [
        ["DATABASE_URL", "", "URL/ID Spreadsheet untuk database utama. Kosongkan jika ingin menyimpan di spreadsheet ini (master)."],
        ["ADMIN_PASSWORD", "admin123", "Password login untuk mode Administrator di aplikasi web."],
        ["LOGO_URL", "https://cdn-icons-png.flaticon.com/512/3061/3061341.png", "URL logo aplikasi untuk sidebar dashboard dan icon favicon web app."]
      ];
      defaultSettings.forEach(function(row) {
        settingSheet.appendRow(row);
      });
      Logger.log("Setting sheet initialized in Master spreadsheet.");
    }
  }

  // 2. Open the configured database spreadsheet
  var ss;
  try {
    ss = getSpreadsheet();
    if (!ss) {
      throw new Error("No spreadsheet found. Please configure the Spreadsheet URL in Settings.");
    }
  } catch (e) {
    Logger.log("Error finding spreadsheet: " + e.toString());
    ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error("Gagal menginisialisasi spreadsheet database.");
    }
  }

  // Definition of all sheets and their column headers
  var sheetsDefinition = {
    "Lahan": ["ID", "Timestamp", "Nama Lahan", "Sertifikat", "Belum Sertifikat", "Total", "Keterangan"],
    "Gedung": ["ID", "Timestamp", "Nama Lahan", "Nama Gedung", "Jumlah Lantai", "Tahun Dibangun", "Ukuran Panjang (m)", "Ukuran Lebar (m)", "URL Foto"],
    "Ruangan": ["ID", "Timestamp", "Nama Gedung", "Jenis Ruangan", "Nama Ruangan", "Keterangan"],
    "AirSanitasi": ["ID", "Timestamp", "Sumber Air", "Keterangan"],
    "Mebel": ["ID", "Timestamp", "Jenis Mebel", "Jumlah Baik", "Jumlah Rusak Ringan", "Jumlah Rusak Berat", "URL Foto"],
    "PerlengkapanPenunjang": ["ID", "Timestamp", "Jenis Perlengkapan", "Jumlah Baik", "Jumlah Rusak Ringan", "Jumlah Rusak Berat", "URL Foto"],
    "OlahRagaSeni": ["ID", "Timestamp", "Nama Item", "Jumlah Baik", "Jumlah Rusak Ringan", "Jumlah Rusak Berat", "URL Foto"],
    "PerlengkapanLaboratorium": ["ID", "Timestamp", "Nama Item", "Jumlah Baik", "Jumlah Rusak Ringan", "Jumlah Rusak Berat", "URL Foto"],
    "FasilitasKeterampilan": ["ID", "Timestamp", "Nama Item", "Jumlah Baik", "Jumlah Rusak Ringan", "Jumlah Rusak Berat", "URL Foto"],
    "ListrikInternet": ["ID", "Timestamp", "Nama Gedung", "Jenis Layanan", "Daya"],
    "KebutuhanTambahan": ["ID", "Timestamp", "Nama Item", "Jumlah Baik", "Jumlah Rusak Ringan", "Jumlah Rusak Berat", "URL Foto"],
    "SaranaPembelajaran": ["ID", "Timestamp", "Nama Item", "Jumlah Baik", "Jumlah Rusak Ringan", "Jumlah Rusak Berat", "URL Foto"],
    "SaranaAdministrasi": ["ID", "Timestamp", "Nama Item", "Jumlah Baik", "Jumlah Rusak", "Stok", "URL Foto"],
    "SaranaPerpustakaan": ["ID", "Timestamp", "Jenis Buku", "Judul Buku", "Pengarang & Penerbit", "ISBN", "Jumlah"]
  };

  // Iterate and create/update data sheets inside the target spreadsheet
  for (var sheetName in sheetsDefinition) {
    var sheet = ss.getSheetByName(sheetName);
    var headers = sheetsDefinition[sheetName];
    
    if (!sheet) {
      // Create new sheet
      sheet = ss.insertSheet(sheetName);
      Logger.log("Created sheet: " + sheetName);
    } else {
      Logger.log("Sheet " + sheetName + " already exists. Checking headers...");
    }
    
    // Set headers if the sheet is empty or check/repair first row
    var lastColumn = sheet.getLastColumn();
    if (lastColumn === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      // Format header row
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#1e293b")
                 .setFontColor("#ffffff")
                 .setFontWeight("bold")
                 .setHorizontalAlignment("center");
    }
  }

  // Remove default "Sheet1" if it exists and is empty
  var sheet1 = ss.getSheetByName("Sheet1");
  if (sheet1 && sheet1.getLastRow() === 0 && sheet1.getLastColumn() === 0) {
    ss.deleteSheet(sheet1);
  }

  return "Database Sarana Prasarana initialized successfully with " + Object.keys(sheetsDefinition).length + " data sheets and 1 Setting sheet.";
}
