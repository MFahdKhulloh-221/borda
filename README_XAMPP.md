# Panduan Menjalankan Aplikasi di XAMPP & phpMyAdmin

Aplikasi **GDSS Pemilihan Laptop Laboratorium Komputer** kini menggunakan stack:
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** PHP Native (PDO & PHP Session)
- **Database:** MySQL / MariaDB (XAMPP / phpMyAdmin)

## 1. Persiapan Folder di XAMPP
1. Pastikan **XAMPP** sudah terinstal (mis. di `C:\xampp`).
2. Salin seluruh folder project ini (`UAS`) ke dalam folder `C:\xampp\htdocs\` dan ubah namanya misalnya menjadi:
   ```text
   C:\xampp\htdocs\gdss-laptop-lab\
   ```
   *(Atau jalankan langsung dari folder ini jika Anda membuat VirtualHost / symlink ke `htdocs`.)*

## 2. Menyalakan Apache & MySQL
1. Buka **XAMPP Control Panel**.
2. Klik **Start** pada **Apache** dan **MySQL** hingga keduanya berwarna hijau.

## 3. Import Database di phpMyAdmin
1. Buka browser dan kunjungi: `http://localhost/phpmyadmin`
2. Klik tab **Import** di menu bagian atas.
3. Klik **Choose File**, lalu pilih file `database.sql` dari folder project ini.
4. Klik tombol **Import / Go** di bagian bawah.
5. Database `gdss_laptop_lab` beserta **11 tabel relasional** dan data awal akan otomatis terbuat.

> **Tips untuk Laporan (ERD dari phpMyAdmin):**
> Setelah import berhasil, klik database `gdss_laptop_lab` di panel kiri phpMyAdmin, lalu buka tab **Designer** (Perancang) di menu atas. Semua garis relasi Foreign Key antar 11 tabel akan langsung tampil dan bisa di-screenshot untuk **Bab 5 (Database Aplikasi / ERD)**!

## 4. Konfigurasi Koneksi (Opsional)
Secara default, `config/database.php` menggunakan pengaturan standar XAMPP:
- Host: `127.0.0.1` (Port `3306`)
- Database: `gdss_laptop_lab`
- User: `root`
- Password: *(kosong)*

Jika MySQL XAMPP Anda memakai password atau port berbeda, sesuaikan di `config/database.php`.

## 5. Membuka Aplikasi
Buka browser dan akses:
```text
http://localhost/gdss-laptop-lab/
```

### Akun Demo (Tersedia di Tabel `users`)
| Peran | Username | Password | Hak Akses Khusus |
|---|---|---|---|
| Kepala Lab | `kepala` | `kepala123` | Jabatan tertinggi, CRUD Laptop, Jalankan Konsensus Borda, Reset Data |
| Dosen Pengampu | `dosen` | `dosen123` | Penilaian WP Individu & Lihat Hasil Konsensus |
| Asisten Lab | `asisten` | `asisten123` | Penilaian WP Individu & Lihat Hasil Konsensus |
