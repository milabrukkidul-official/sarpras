# Aplikasi Sarana Prasarana (SIPRAS) - Google Apps Script & Sheets

Aplikasi manajemen sarana prasarana (sarpras) berbasis web menggunakan **Google Apps Script** sebagai backend controller dan **Google Sheets** sebagai database relasional, dengan tampilan antarmuka (UI) dashboard modern bertema *glassmorphism dark mode* yang responsif.

---

## 📂 Struktur File Proyek

1. **`setup.gs`**: Kode backend untuk menginisialisasi tabel-tabel (sheet) database secara otomatis dengan nama kolom dan format yang sesuai.
2. **`Code.gs`**: Kode backend utama Google Apps Script untuk penanganan routing web app (`doGet`), rendering template HTML, dan operasi CRUD (Create, Read, Update, Delete) yang aman dengan sistem penguncian (Lock Service).
3. **`Index.html`**: File utama antarmuka pengguna (Single-page Application) yang berisi struktur HTML, gaya CSS (Vanilla), dan logika JavaScript klien untuk interaksi CRUD, validasi, penelusuran, preview gambar, dan visualisasi statistik.

---

## 🛠️ Cara Setup dan Penyebaran (Deployment)

Ikuti langkah-langkah di bawah ini untuk memasang dan menjalankan aplikasi ini:

### Langkah 1: Buat Spreadsheet Baru
1. Buka [Google Sheets](https://sheets.google.com) dan buat sebuah Spreadsheet baru.
2. Beri nama spreadsheet Anda, misalnya `Database Sarana Prasarana`.

### Langkah 2: Buka Apps Script Editor
1. Di dalam Google Spreadsheet tersebut, klik menu **Ekstensi** > **Apps Script**.
2. Anda akan diarahkan ke halaman editor Google Apps Script.

### Langkah 3: Salin File Kode
Salin isi dari file proyek lokal ini ke editor Apps Script:
1. **`Code.gs`**: Salin seluruh isi dari `Code.gs` lokal dan gantikan semua kode yang ada di file `Code.gs` di editor Apps Script Anda.
2. **`setup.gs`**: Di editor Apps Script, klik tombol **+** (Tambah File) di samping "Layanan" dan pilih **Skrip**. Beri nama file tersebut `setup`. Salin seluruh isi dari `setup.gs` lokal ke sana.
3. **`Index.html`**: Klik tombol **+** lagi, pilih **HTML**. Beri nama file tersebut `Index` (tanpa ekstensi `.html`). Salin seluruh isi dari `Index.html` lokal ke sana.
4. Klik tombol **Simpan Proyek** (ikon disket) untuk menyimpan semua file.

### Langkah 4: Jalankan Inisialisasi Database
1. Pada editor Apps Script, di bar bagian atas dekat tombol "Jalankan", pilih fungsi **`setupSpreadsheet`** dari dropdown.
2. Klik tombol **Jalankan**.
3. Google akan meminta izin otorisasi untuk mengakses Spreadsheet Anda. Klik **Tinjau Izin**, pilih akun Google Anda, klik **Lanjutan** (Advanced), lalu pilih **Buka Database Sarana Prasarana (tidak aman)**, dan klik **Izinkan** (Allow).
4. Setelah eksekusi selesai, periksa tab spreadsheet Anda. Anda akan melihat 14 tab sheet baru lengkap dengan header kolom yang diformat rapi secara otomatis.

### Langkah 5: Terapkan (Deploy) Sebagai Web App
1. Di kanan atas editor Apps Script, klik tombol **Terapkan** > **Penerapan Baru** (Deploy > New deployment).
2. Klik ikon gerigi (Pilih jenis penerapan) di samping "Terapkan", pilih **Aplikasi web** (Web app).
3. Konfigurasikan setelan berikut:
   - **Deskripsi**: `Penerapan Awal SIPRAS`
   - **Jalankan sebagai**: `Saya (email Anda)`
   - **Yang memiliki akses**: `Siapa saja` (Jika ingin dapat diakses publik/pengguna lain tanpa login Google).
4. Klik **Terapkan**.
5. Salin URL Aplikasi Web yang diberikan (misalnya `https://script.google.com/macros/s/.../exec`). URL ini adalah link untuk membuka aplikasi Sarana Prasarana Anda.

---

## 🌟 Fitur Utama Aplikasi

- **Mode Akses Admin & Tamu (Read-Only)**: Aplikasi membedakan hak akses secara otomatis. Tamu (Guest) hanya bisa melihat data dan statistik. Administrator dapat masuk menggunakan password (bawaan: `admin123`) untuk membuka menu tambah, edit, hapus, konfigurasi database, dan setup database.
- **Desain Modern Glassmorphism**: Dashboard modern dengan efek blur kaca transparan, warna harmonis, ikon dinamis, dan efek transisi hover yang halus.
- **Konfigurasi URL Database Dinamis**: Pengguna dapat memantau dan mengubah URL atau ID Spreadsheet yang terhubung langsung dari antarmuka Web App (via tombol **Database Config**) tanpa perlu membuka/mengedit kode program `Code.gs`.
- **Navigasi Sidebar Accordion**: Menu terbagi rapi ke dalam tiga kategori utama:
  - **Aset Tetap**: Lahan, Gedung, Ruangan, Air Sanitasi, Mebel, Perlengkapan Penunjang, Olah Raga & Seni, Perlengkapan Laboratorium, Fasilitas Keterampilan, Listrik dan Internet, Kebutuhan Tambahan, Sarana Pembelajaran.
  - **Aset Lancar**: Sarana Administrasi.
  - **Perpustakaan**: Sarana Perpustakaan.
- **Relasi Dropdown Otomatis**: Form Gedung mendeteksi daftar Lahan yang terdaftar. Form Ruangan & Listrik/Internet mendeteksi daftar Gedung yang terdaftar.
- **Validasi & Kalkulasi Otomatis**: Total luas lahan dihitung secara real-time dari penjumlahan Lahan Bersertifikat + Belum Sertifikat. Form Listrik/Internet secara otomatis mengubah satuan input Daya antara KWh dan Mbps tergantung pilihan jenis layanan.
- **Galeri Foto Terintegrasi**: Input URL Foto langsung menampilkan preview thumbnail di tabel dan form, serta dapat diklik untuk memperbesar gambar (*lightbox overlay*).
- **Pencarian Cepat**: Filter instan pada tabel saat mengetik kata kunci pencarian.
- **Visualisasi Statistik Instan**: Panel di bagian atas menampilkan ringkasan data seperti total luas lahan bersertifikat, jumlah barang kondisi baik/rusak, dan jumlah stok.
