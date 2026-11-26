<?php
declare(strict_types=1);
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
?><!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GDSS Laptop Lab — Sistem Pendukung Keputusan Kelompok</title>
  <meta name="description" content="Group Decision Support System (Weighted Product & Borda) untuk pemilihan laptop laboratorium komputer.">
  <link rel="stylesheet" href="style.css?v=<?= filemtime(__DIR__ . '/style.css') ?>">
</head>
<body>

  <!-- ===================== ERROR DATABASE ===================== -->
  <section id="dbErrorView" class="auth-shell" hidden>
    <div class="auth-card">
      <div class="auth-header">
        <div class="brand-mark brand-mark-danger">!</div>
        <h1>Koneksi Database Gagal</h1>
        <p id="dbErrorMsg" class="muted">Tidak dapat terhubung ke server MySQL.</p>
      </div>
      <div class="alert alert-warning">
        Pastikan layanan <strong>MySQL</strong> aktif, database <code>gdss_laptop_lab</code> sudah di-import, dan kredensial di <code>config/database.php</code> sudah sesuai.
      </div>
      <button type="button" class="btn btn-primary btn-block" onclick="location.reload()">Muat Ulang</button>
    </div>
  </section>

  <!-- ===================== HALAMAN LOGIN (SPLIT-SCREEN CARD) ===================== -->
  <section id="loginView" class="auth-split" hidden>
    <div class="auth-frame">
      <div class="auth-left">
        <div class="auth-left-inner">
          <div class="auth-brand">
            <div class="brand-mark brand-mark-light"><i data-icon="laptop"></i></div>
            <span>GDSS Laptop Lab</span>
          </div>

          <div class="auth-hero">
            <h1>Pemilihan Laptop Laboratorium Komputer</h1>
            <p>Sistem Pendukung Keputusan Kelompok yang objektif dan transparan untuk menentukan perangkat terbaik bagi laboratorium.</p>
          </div>

          <ul class="auth-highlights">
            <li>
              <span class="hl-ico"><i data-icon="users"></i></span>
              <div>
                <strong>3 Pengambil Keputusan</strong>
                <span>Kepala Lab, Dosen Pengampu, dan Asisten Lab</span>
              </div>
            </li>
            <li>
              <span class="hl-ico"><i data-icon="chart-column"></i></span>
              <div>
                <strong>Weighted Product (WP)</strong>
                <span>Perankingan individu berdasarkan bobot kriteria</span>
              </div>
            </li>
            <li>
              <span class="hl-ico"><i data-icon="trophy"></i></span>
              <div>
                <strong>Konsensus Borda</strong>
                <span>Agregasi peringkat kelompok secara adil</span>
              </div>
            </li>
          </ul>

          <div class="auth-left-foot">
            Sistem Informasi · Laboratorium Komputer
          </div>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-panel">
          <div class="auth-header">
            <h2>Masuk ke Akun</h2>
            <p class="muted">Masukkan username dan password Anda untuk mengakses sistem.</p>
          </div>

          <form id="manualLoginForm" class="auth-form" novalidate>
            <div class="field">
              <label for="loginUsername">Username</label>
              <input id="loginUsername" name="username" type="text" placeholder="Masukkan username" autocomplete="username" required>
            </div>
            <div class="field">
              <label for="loginPassword">Password</label>
              <input id="loginPassword" name="password" type="password" placeholder="Masukkan password" autocomplete="current-password" required>
            </div>
            <p id="loginError" class="form-error" hidden></p>
            <button type="submit" id="loginSubmitBtn" class="btn btn-primary btn-block">Masuk</button>
          </form>

          <div class="auth-quick">
            <span class="auth-quick-label">Isi cepat akun demo</span>
            <div id="quickFillButtons" class="auth-quick-list"></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ===================== APLIKASI UTAMA ===================== -->
  <div id="appView" class="app" hidden>
    <aside id="sidebar" class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-mark brand-mark-sm"><i data-icon="laptop"></i></div>
        <div class="brand-text">
          <strong>GDSS Laptop Lab</strong>
          <span>WP &amp; Borda</span>
        </div>
      </div>

      <nav class="nav" aria-label="Navigasi utama">
        <button class="nav-item" data-action="nav" data-page="dashboard">
          <span class="nav-ico"><i data-icon="house"></i></span>
          <span class="nav-label">Dashboard</span>
        </button>
        <button class="nav-item" data-action="nav" data-page="penilaian">
          <span class="nav-ico"><i data-icon="square-pen"></i></span>
          <span class="nav-label">Penilaian WP</span>
          <span id="navAssessBadge" class="nav-badge"></span>
        </button>
        <button class="nav-item" data-action="nav" data-page="konsensus">
          <span class="nav-ico"><i data-icon="trophy"></i></span>
          <span class="nav-label">Hasil Konsensus</span>
          <span id="navConsensusBadge" class="nav-badge"></span>
        </button>
        <button class="nav-item" data-action="nav" data-page="panduan">
          <span class="nav-ico"><i data-icon="book-open"></i></span>
          <span class="nav-label">Panduan</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div id="sidebarUser" class="sidebar-user"></div>
        <div class="sidebar-actions">
          <button id="sidebarReset" class="btn btn-outline btn-sm btn-block btn-text-danger" data-action="reset-data" hidden>
            <i data-icon="rotate-ccw"></i> Reset Sesi
          </button>
          <button class="btn btn-outline btn-sm btn-block" data-action="logout">
            <i data-icon="log-out"></i> Keluar
          </button>
        </div>
      </div>
    </aside>

    <div id="sidebarOverlay" class="sidebar-overlay" data-action="toggle-sidebar"></div>

    <div class="main">
      <header class="topbar">
        <button class="icon-btn menu-btn" data-action="toggle-sidebar" aria-label="Buka menu">
          <i data-icon="menu"></i>
        </button>
        <div class="topbar-title">
          <h2 id="pageTitle">Dashboard</h2>
          <p id="pageSub" class="muted small"></p>
        </div>
        <div id="topbarUser" class="topbar-user"></div>
      </header>
      <main id="content" class="content"></main>
    </div>
  </div>

  <div id="modalRoot"></div>
  <div id="toastRoot" class="toast-root" aria-live="polite"></div>

  <script src="script.js?v=<?= filemtime(__DIR__ . '/script.js') ?>"></script>
</body>
</html>
