/* =========================================================
   GDSS Pemilihan Laptop Laboratorium Komputer
   Metode: Weighted Product (individu) + Borda (konsensus kelompok)
   Arsitektur: HTML, CSS, Vanilla JS + PHP Native (PDO & Session) + MySQL
   ========================================================= */
'use strict';

/* =========================================================
   0. IKON (Lucide, https://lucide.dev - lisensi ISC)
   ========================================================= */
const ICONS = {
  'house': '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /> <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />',
  'square-pen': '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /> <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />',
  'trophy': '<path d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2" /> <path d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2" /> <path d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3" /> <path d="M4 22h16" /> <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" /> <path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3" />',
  'book-open': '<path d="M12 5v16" /> <path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" />',
  'log-out': '<path d="m16 17 5-5-5-5" /> <path d="M21 12H9" /> <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />',
  'plus': '<path d="M5 12h14" /> <path d="M12 5v14" />',
  'laptop': '<path d="M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z" /> <path d="M20.054 15.987H3.946" />',
  'wallet': '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" /> <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />',
  'cpu': '<path d="M12 20v2" /> <path d="M12 2v2" /> <path d="M17 20v2" /> <path d="M17 2v2" /> <path d="M2 12h2" /> <path d="M2 17h2" /> <path d="M2 7h2" /> <path d="M20 12h2" /> <path d="M20 17h2" /> <path d="M20 7h2" /> <path d="M7 20v2" /> <path d="M7 2v2" /> <rect x="4" y="4" width="16" height="16" rx="2" /> <rect x="8" y="8" width="8" height="8" rx="1" />',
  'memory-stick': '<path d="M12 12v-2" /> <path d="M12 18v-2" /> <path d="M16 12v-2" /> <path d="M16 18v-2" /> <path d="M2 11h1.5" /> <path d="M20 18v-2" /> <path d="M20.5 11H22" /> <path d="M4 18v-2" /> <path d="M8 12v-2" /> <path d="M8 18v-2" /> <rect x="2" y="6" width="20" height="10" rx="2" />',
  'battery-full': '<path d="M10 10v4" /> <path d="M14 10v4" /> <path d="M22 14v-4" /> <path d="M6 10v4" /> <rect x="2" y="6" width="16" height="12" rx="2" />',
  'shield-check': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /> <path d="m9 12 2 2 4-4" />',
  'check': '<path d="M20 6 9 17l-5-5" />',
  'clock': '<circle cx="12" cy="12" r="10" /> <path d="M12 6v6l4 2" />',
  'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2" /> <path d="M7 11V7a5 5 0 0 1 10 0v4" />',
  'arrow-left': '<path d="m12 19-7-7 7-7" /> <path d="M19 12H5" />',
  'arrow-right': '<path d="M5 12h14" /> <path d="m12 5 7 7-7 7" />',
  'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /> <path d="M16 3.128a4 4 0 0 1 0 7.744" /> <path d="M22 21v-2a4 4 0 0 0-3-3.87" /> <circle cx="9" cy="7" r="4" />',
  'clipboard-list': '<rect width="8" height="4" x="8" y="2" rx="1" ry="1" /> <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /> <path d="M12 11h4" /> <path d="M12 16h4" /> <path d="M8 11h.01" /> <path d="M8 16h.01" />',
  'chart-column': '<path d="M3 3v16a2 2 0 0 0 2 2h16" /> <path d="M18 17V9" /> <path d="M13 17V5" /> <path d="M8 17v-3" />',
  'save': '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /> <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" /> <path d="M7 3v4a1 1 0 0 0 1 1h7" />',
  'rotate-ccw': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /> <path d="M3 3v5h5" />',
  'menu': '<path d="M4 5h16" /> <path d="M4 12h16" /> <path d="M4 19h16" />',
  'x': '<path d="M18 6 6 18" /> <path d="m6 6 12 12" />',
  'table': '<path d="M12 3v18" /> <rect width="18" height="18" x="3" y="3" rx="2" /> <path d="M3 9h18" /> <path d="M3 15h18" />',
  'vote': '<path d="m9 12 2 2 4-4" /> <path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z" /> <path d="M22 19H2" />',
  'database': '<ellipse cx="12" cy="5" rx="9" ry="3" /> <path d="M3 5v14a9 3 0 0 0 18 0V5" /> <path d="M3 12a9 3 0 0 0 18 0" />',
  'triangle-alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /> <path d="M12 9v4" /> <path d="M12 17h.01" />'
};

function I(name, cls = '') {
  const inner = ICONS[name] || '';
  return '<svg class="ic ' + cls + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
}

function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => {
    el.outerHTML = I(el.dataset.icon);
  });
}

/* =========================================================
   1. STATE & API CLIENT
   ========================================================= */
const EPS = 1e-12;
const DEMO_PASSWORDS = { kepala: 'kepala123', dosen: 'dosen123', asisten: 'asisten123' };

let db = {
  users: [],
  criteria: [],
  alternatives: [],
  submissions: {},
  drafts: {},
  result: null
};

let currentUser = null;
let draftTimer = null;
const ui = { page: 'dashboard', assessTab: null, step: 1, draft: null, draftUser: null };

const deepClone = obj => JSON.parse(JSON.stringify(obj));

async function apiFetch(url, options = {}) {
  const opts = {
    method: options.method || 'GET',
    credentials: 'same-origin',
    headers: { 'Accept': 'application/json' }
  };
  if (options.body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(options.body);
  }
  const resp = await fetch(url, opts);
  const text = await resp.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('Respons server tidak valid. Pastikan halaman dibuka melalui Apache (http://localhost/gdss-laptop-lab/).');
  }
  if (!resp.ok || data.ok === false) {
    const err = new Error(data.message || `Terjadi kesalahan server (${resp.status}).`);
    err.status = resp.status;
    throw err;
  }
  return data;
}

function applyState(state) {
  if (!state) return;
  db = {
    users: state.users || [],
    criteria: state.criteria || [],
    alternatives: state.alternatives || [],
    submissions: state.submissions || {},
    drafts: state.drafts || {},
    result: state.result || null
  };
}

async function refreshState() {
  const data = await apiFetch('api/state.php');
  applyState(data.state);
  return data;
}

/* =========================================================
   2. HELPER UMUM
   ========================================================= */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
const fmt = (n, d = 4) => (Number.isFinite(Number(n)) ? Number(n).toFixed(d) : '-');
const fmtRp = n => 'Rp ' + Number(n).toLocaleString('id-ID');
function fmtDate(raw) {
  if (!raw) return '-';
  const normalized = String(raw).includes('T') ? raw : String(raw).replace(' ', 'T');
  const dt = new Date(normalized);
  return Number.isNaN(dt.getTime()) ? String(raw) : dt.toLocaleString('id-ID');
}
const initials = name => String(name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
const getUser = username => db.users.find(u => u.username === username);
const getHeadUser = () => db.users.find(u => Number(u.rank) === 1) || db.users[0] || { username: 'kepala', name: 'Kepala Lab' };

function toast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = message;
  $('#toastRoot').appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

function rankPill(rank) {
  const cls = rank <= 3 ? ' r' + rank : '';
  return `<span class="rank-pill${cls}">${rank}</span>`;
}

function specOf(a, cid) {
  switch (cid) {
    case 'C1': return fmtRp(a.price);
    case 'C2': return a.cpu;
    case 'C3': return a.ram + ' GB';
    case 'C4': return a.battery + ' jam';
    case 'C5': return a.warranty + ' tahun';
    default: return '';
  }
}

const isSubmitted = username => !!db.submissions[username]?.submitted;
const submittedCount = () => db.users.filter(u => isSubmitted(u.username)).length;
const allSubmitted = () => db.users.length > 0 && submittedCount() === db.users.length;
const isConsensusDone = () => !!db.result;
const isCurrentHead = () => !!currentUser && Number(currentUser.rank) === 1;

/* =========================================================
   3. PRATINJAU WP (CLIENT) — PERHITUNGAN RESMI DI SERVER PHP
   ========================================================= */
function previewWP(weights, scores, alts) {
  db.criteria.forEach(c => {
    const w = Number(weights?.[c.id]);
    if (!Number.isInteger(w) || w < 1 || w > 5) {
      throw new Error(`Bobot kriteria ${c.name} belum diisi (harus angka 1-5).`);
    }
  });
  const sumW = db.criteria.reduce((s, c) => s + Number(weights[c.id]), 0);
  const exponents = {};
  db.criteria.forEach(c => {
    const wNorm = Number(weights[c.id]) / sumW;
    exponents[c.id] = c.type === 'cost' ? -wNorm : wNorm;
  });

  const rows = alts.map(a => {
    let S = 1;
    db.criteria.forEach(c => {
      const val = Number(scores?.[a.id]?.[c.id]);
      if (!Number.isInteger(val) || val < 1 || val > 5) {
        throw new Error(`Nilai ${a.name} pada ${c.name} belum diisi (harus angka 1-5).`);
      }
      S *= Math.pow(val, exponents[c.id]);
    });
    return { altId: a.id, name: a.name, S, V: 0, rank: 0 };
  });

  const sumS = rows.reduce((s, r) => s + r.S, 0);
  rows.forEach(r => { r.V = r.S / sumS; });

  const sorted = [...rows].sort((a, b) => b.V - a.V || a.name.localeCompare(b.name));
  let i = 0;
  while (i < sorted.length) {
    let j = i + 1;
    while (j < sorted.length && Math.abs(sorted[j].V - sorted[i].V) < EPS) j++;
    for (let k = i; k < j; k++) sorted[k].rank = i + 1;
    i = j;
  }
  return { rows };
}

/* =========================================================
   4. AUTENTIKASI & NAVIGASI
   ========================================================= */
function showDbError(message) {
  $('#loginView').hidden = true;
  $('#appView').hidden = true;
  $('#dbErrorView').hidden = false;
  $('#dbErrorMsg').textContent = message;
}

function showLogin() {
  currentUser = null;
  ui.draft = null;
  $('#dbErrorView').hidden = true;
  $('#appView').hidden = true;
  $('#loginView').hidden = false;
  $('#loginError').hidden = true;

  const shortLabel = u => u.username === 'kepala' ? 'Kepala Lab' : (u.username === 'dosen' ? 'Dosen' : 'Asisten');
  $('#quickFillButtons').innerHTML = db.users.map(u => `
    <button type="button" class="btn btn-outline btn-sm" data-action="quick-fill" data-user="${esc(u.username)}">
      ${esc(shortLabel(u))}
    </button>`).join('');
}

function quickFillLogin(username) {
  const pass = DEMO_PASSWORDS[username] || '';
  $('#loginUsername').value = username;
  $('#loginPassword').value = pass;
  $('#loginError').hidden = true;
  $('#loginSubmitBtn').focus();
}

async function handleManualLogin(e) {
  e.preventDefault();
  const errEl = $('#loginError');
  const btn = $('#loginSubmitBtn');
  errEl.hidden = true;

  const username = $('#loginUsername').value.trim();
  const password = $('#loginPassword').value;
  if (!username || !password) {
    errEl.textContent = 'Username dan password wajib diisi.';
    errEl.hidden = false;
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Memproses...';
  try {
    const data = await apiFetch('api/auth.php', {
      method: 'POST',
      body: { action: 'login', username, password }
    });
    applyState(data.state);
    $('#manualLoginForm').reset();
    ui.page = 'dashboard';
    ui.assessTab = null;
    ui.step = 1;
    ui.draft = null;
    startApp(data.user);
    toast(`Masuk sebagai ${data.user.name}.`, 'success');
  } catch (err) {
    errEl.textContent = err.message;
    errEl.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Masuk';
  }
}

function startApp(user) {
  currentUser = user;
  $('#dbErrorView').hidden = true;
  $('#loginView').hidden = true;
  $('#appView').hidden = false;
  $('#sidebarReset').hidden = Number(user.rank) !== 1;
  $('#sidebarUser').innerHTML = `<strong>${esc(user.name)}</strong><small>${esc(user.role)}${Number(user.rank) === 1 ? ' · Admin' : ''}</small>`;
  $('#topbarUser').innerHTML = `<span class="who"><strong>${esc(user.name)}</strong></span><span class="avatar">${esc(initials(user.name))}</span>`;
  render();
}

async function logout() {
  try {
    await apiFetch('api/auth.php', { method: 'POST', body: { action: 'logout' } });
  } catch (_) {}
  closeSidebar();
  try { await refreshState(); } catch (_) {}
  showLogin();
}

async function navigate(page) {
  ui.page = page;
  if (page === 'penilaian') { ui.assessTab = null; ui.step = 1; ui.draft = null; }
  closeSidebar();
  try {
    await refreshState();
  } catch (err) {
    toast(err.message, 'error');
  }
  render();
  window.scrollTo(0, 0);
}

function toggleSidebar() {
  $('#sidebar').classList.toggle('open');
  $('#sidebarOverlay').classList.toggle('show');
}
function closeSidebar() {
  $('#sidebar').classList.remove('open');
  $('#sidebarOverlay').classList.remove('show');
}

/* =========================================================
   5. RENDER UTAMA
   ========================================================= */
const PAGE_INFO = {
  dashboard: ['Dashboard', 'Ringkasan status penilaian, alternatif, dan kriteria'],
  penilaian: ['Penilaian Weighted Product', 'Input bobot kriteria dan penilaian alternatif'],
  konsensus: ['Hasil Konsensus Borda', 'Keputusan akhir kelompok berdasarkan agregasi peringkat'],
  panduan:   ['Panduan Sistem', 'Alur penggunaan dan ringkasan metode WP & Borda']
};

function render() {
  if (!currentUser) return;

  const info = PAGE_INFO[ui.page] || PAGE_INFO.dashboard;
  $('#pageTitle').textContent = info[0];
  $('#pageSub').textContent = info[1];
  $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === ui.page));

  const badge = $('#navConsensusBadge');
  badge.textContent = isConsensusDone() ? 'Selesai' : `${submittedCount()}/${db.users.length}`;
  badge.classList.toggle('ok', isConsensusDone());

  const ab = $('#navAssessBadge');
  const mine = isSubmitted(currentUser.username);
  ab.textContent = mine ? 'Selesai' : 'Belum';
  ab.classList.toggle('ok', mine);

  const view = {
    dashboard: renderDashboard,
    penilaian: renderAssessment,
    konsensus: renderConsensus,
    panduan:   renderGuide
  }[ui.page] || renderDashboard;

  $('#content').innerHTML = view();
  if (ui.page === 'penilaian') updateWeightShare();
}

/* =========================================================
   6. DASHBOARD (HALAMAN HOME)
   ========================================================= */
function nextStepInfo() {
  const isHead = isCurrentHead();
  const mySub = isSubmitted(currentUser.username);
  const waiting = db.users.filter(u => !isSubmitted(u.username)).map(u => u.name);

  if (isConsensusDone()) {
    const w = db.result.rows[0];
    return {
      cls: 'done', eyebrow: 'Keputusan Selesai',
      title: `Rekomendasi terpilih: ${w.name}`,
      text: `Konsensus Borda telah dijalankan dengan total ${w.total} dari ${db.result.grandTotal} poin (${fmt(w.weight * 100, 1)}%).`,
      btn: { icon: 'trophy', label: 'Lihat Hasil Konsensus', action: 'nav', page: 'konsensus', cls: 'btn-success' }
    };
  }
  if (!mySub) {
    return {
      cls: '', eyebrow: 'Tindakan Diperlukan',
      title: 'Lengkapi penilaian Weighted Product Anda',
      text: 'Tentukan bobot kepentingan tiap kriteria (1–5) dan nilai masing-masing alternatif laptop.',
      btn: { icon: 'square-pen', label: 'Mulai Penilaian', action: 'nav', page: 'penilaian', cls: 'btn-primary' }
    };
  }
  if (!allSubmitted()) {
    return {
      cls: 'wait', eyebrow: 'Menunggu Decision Maker Lain',
      title: 'Penilaian Anda telah tersimpan',
      text: `Menunggu penilaian dari ${waiting.join(' dan ')} (${submittedCount()}/${db.users.length} selesai).`,
      btn: { icon: 'chart-column', label: 'Lihat Hasil Saya', action: 'nav', page: 'penilaian', cls: 'btn-outline' }
    };
  }
  if (isHead) {
    return {
      cls: '', eyebrow: 'Siap Agregasi',
      title: 'Seluruh Decision Maker telah menilai',
      text: 'Jalankan Konsensus Borda untuk menggabungkan peringkat individu menjadi keputusan akhir kelompok.',
      btn: { icon: 'vote', label: 'Jalankan Konsensus Borda', action: 'run-borda', cls: 'btn-success' }
    };
  }
  return {
    cls: 'wait', eyebrow: 'Menunggu Konsensus',
    title: 'Semua penilaian telah lengkap',
    text: 'Menunggu Kepala Lab menjalankan Konsensus Borda untuk menetapkan keputusan akhir.',
    btn: { icon: 'chart-column', label: 'Lihat Hasil Saya', action: 'nav', page: 'penilaian', cls: 'btn-outline' }
  };
}

function renderDashboard() {
  const done = submittedCount();
  const totalDm = db.users.length || 3;
  const pct = Math.round((done / totalDm) * 100);
  const isHead = isCurrentHead();
  const myDone = isSubmitted(currentUser.username);
  const n = nextStepInfo();

  const stats = `
    <div class="grid grid-3">
      <div class="card stat-card">
        <div class="stat-label">Status Penilaian Anda</div>
        <div class="stat-value">${myDone ? 'Selesai' : 'Belum Diisi'}</div>
        <div class="stat-sub">${myDone ? 'Tersimpan di database' : 'Perlu mengisi bobot & skor'}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Partisipasi Kelompok</div>
        <div class="stat-value">${done} / ${totalDm}</div>
        <div class="stat-sub">${pct}% Decision Maker telah mengirim</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Status Konsensus Borda</div>
        <div class="stat-value">${isConsensusDone() ? 'Terkunci' : (allSubmitted() ? 'Siap Dijalankan' : 'Menunggu')}</div>
        <div class="stat-sub">${isConsensusDone() ? esc(db.result.rows[0]?.name || '-') : `${db.alternatives.length} alternatif · ${db.criteria.length} kriteria`}</div>
      </div>
    </div>`;

  const banner = `
    <div class="card action-banner ${n.cls}">
      <div class="txt">
        <div class="eyebrow">${esc(n.eyebrow)}</div>
        <h3>${esc(n.title)}</h3>
        <p>${esc(n.text)}</p>
      </div>
      <button class="btn ${n.btn.cls}" data-action="${n.btn.action}" ${n.btn.page ? `data-page="${n.btn.page}"` : ''}>
        ${I(n.btn.icon)} ${esc(n.btn.label)}
      </button>
    </div>`;

  const dmList = db.users.map(u => {
    const sub = db.submissions[u.username];
    const ok = !!sub?.submitted;
    return `
      <li class="dm-item">
        <span class="avatar">${esc(initials(u.name))}</span>
        <div class="info">
          <strong>${esc(u.name)}</strong>${Number(u.rank) === 1 ? ' <span class="badge badge-muted">Jabatan Tertinggi</span>' : ''}
          <small>${ok ? 'Dikirim ' + esc(fmtDate(sub.submittedAt)) : esc(u.focus)}</small>
        </div>
        <span class="badge ${ok ? 'badge-success' : 'badge-warning'}">${ok ? I('check') + ' Selesai' : I('clock') + ' Belum'}</span>
      </li>`;
  }).join('');

  let bordaBox = '';
  if (isHead) {
    const disabled = !allSubmitted() || isConsensusDone();
    const hint = isConsensusDone()
      ? 'Konsensus telah dijalankan dan hasilnya kini tampil di seluruh akun Decision Maker.'
      : (allSubmitted() ? 'Seluruh penilaian lengkap. Klik tombol di atas untuk memproses Borda.' : `Aktif setelah semua Decision Maker mengirim penilaian (${done}/${totalDm}).`);
    bordaBox = `
      <div class="card" style="margin:0;display:flex;flex-direction:column;justify-content:space-between;gap:12px">
        <div>
          <h3>${I('vote')} Eksekusi Konsensus Borda <span class="badge badge-primary">Akses Kepala Lab</span></h3>
          <p class="muted small">Menggabungkan peringkat seluruh Decision Maker menggunakan metode Borda. Setelah dijalankan, hasil otomatis tampil di semua akun.</p>
        </div>
        <div>
          <button class="btn btn-success btn-block" data-action="run-borda" ${disabled ? 'disabled' : ''}>
            ${I('vote')} ${isConsensusDone() ? 'Konsensus Sudah Dijalankan' : 'Jalankan Konsensus Borda'}
          </button>
          <p class="muted small" style="margin-top:8px">${hint}</p>
        </div>
      </div>`;
  } else {
    bordaBox = `
      <div class="card" style="margin:0;display:flex;flex-direction:column;justify-content:space-between;gap:12px">
        <div>
          <h3>${I('trophy')} Status Konsensus Borda</h3>
          <p class="muted small">${isConsensusDone()
            ? `Konsensus telah ditetapkan oleh <strong>${esc(getUser(db.result.runBy)?.name || 'Kepala Lab')}</strong> pada ${esc(fmtDate(db.result.runAt))}. Seluruh Decision Maker dapat melihat hasilnya.`
            : 'Eksekusi Konsensus Borda hanya dapat dijalankan oleh <strong>Kepala Lab</strong> setelah seluruh Decision Maker selesai menilai.'}</p>
        </div>
        <div>
          ${isConsensusDone()
            ? `<button class="btn btn-primary btn-block" data-action="nav" data-page="konsensus">${I('trophy')} Buka Rincian Hasil Borda</button>`
            : `<span class="badge badge-warning">${I('lock')} Menunggu Eksekusi Kepala Lab</span>`}
        </div>
      </div>`;
  }

  let bordaSummaryCard = '';
  if (isConsensusDone()) {
    const res = db.result;
    const dmCols = res.dmOrder.map(getUser).filter(Boolean);
    const maxTotal = Math.max(...res.rows.map(r => Number(r.total))) || 1;
    const bordaRows = res.rows.map(r => `
      <tr class="${r.finalRank === 1 ? 'top' : ''}">
        <td class="ctr">${rankPill(r.finalRank)}</td>
        <td><strong>${esc(r.name)}</strong></td>
        ${dmCols.map(u => `<td class="ctr">Rank ${esc(r.ranks[u.username])} · <strong>${esc(r.points[u.username])}</strong></td>`).join('')}
        <td class="num"><strong>${esc(r.total)}</strong></td>
        <td class="num">${fmt(r.weight * 100, 1)}%</td>
        <td style="min-width:110px"><div class="bar-row"><div class="bar-track"><span style="width:${(Number(r.total) / maxTotal) * 100}%"></span></div></div></td>
      </tr>`).join('');

    bordaSummaryCard = `
      <div class="card">
        <div class="card-head">
          <div>
            <h3>${I('trophy')} Hasil Konsensus Borda (Keputusan Kelompok)</h3>
            <span class="muted small">Dijalankan oleh ${esc(getUser(res.runBy)?.name || res.runBy)} · ${esc(fmtDate(res.runAt))} · Dapat dilihat oleh seluruh akun</span>
          </div>
          <button class="btn btn-outline btn-sm" data-action="nav" data-page="konsensus">Lihat Detail</button>
        </div>
        <div class="table-wrap">
          <table class="table compact">
            <thead>
              <tr>
                <th class="ctr">Rank</th>
                <th>Alternatif</th>
                ${dmCols.map(u => `<th class="ctr">${esc(u.name)}</th>`).join('')}
                <th class="num">Total Poin</th>
                <th class="num">Bobot</th>
                <th>Proporsi</th>
              </tr>
            </thead>
            <tbody>${bordaRows}</tbody>
          </table>
        </div>
      </div>`;
  }

  const canEdit = isHead && !isConsensusDone();
  const canDelete = canEdit && db.alternatives.length > 2;
  const altRows = db.alternatives.map(a => `
    <tr>
      <td><span class="badge badge-muted">${esc(a.id)}</span> <strong>${esc(a.name)}</strong></td>
      <td class="num">${esc(fmtRp(a.price))}</td>
      <td>${esc(a.cpu)}</td>
      <td class="num">${esc(a.ram)} GB</td>
      <td class="num">${esc(a.battery)} jam</td>
      <td class="num">${esc(a.warranty)} th</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-outline btn-sm" data-action="view-alt" data-id="${esc(a.id)}">Detail</button>
          ${canEdit ? `<button class="btn btn-outline btn-sm" data-action="edit-alt" data-id="${esc(a.id)}">Edit</button>` : ''}
          ${canDelete ? `<button class="btn btn-outline btn-sm btn-text-danger" data-action="delete-alt" data-id="${esc(a.id)}">Hapus</button>` : ''}
        </div>
      </td>
    </tr>`).join('');

  const critRows = db.criteria.map(c => `
    <tr>
      <td><span class="badge badge-muted">${esc(c.id)}</span> <strong>${esc(c.name)}</strong></td>
      <td>${esc(c.desc)}</td>
      <td><span class="badge ${c.type === 'cost' ? 'badge-danger' : 'badge-success'}">${c.type === 'cost' ? 'Cost' : 'Benefit'}</span></td>
      <td class="muted">${esc(c.scale)}</td>
    </tr>`).join('');

  return `
    ${stats}
    ${banner}
    ${bordaSummaryCard}

    <div class="grid grid-2">
      <div class="card" style="margin:0">
        <div class="card-head">
          <h3>${I('users')} Status Decision Maker</h3>
          <span class="badge badge-muted">${done}/${totalDm}</span>
        </div>
        <div class="progress"><span style="width:${pct}%"></span></div>
        <ul class="dm-list">${dmList}</ul>
      </div>
      ${bordaBox}
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <h3>${I('laptop')} Daftar Alternatif Laptop (${db.alternatives.length})</h3>
          <span class="muted small">${canEdit ? 'Kepala Lab dapat menambah, mengubah, atau menghapus alternatif sebelum konsensus.' : (isConsensusDone() ? 'Data terkunci setelah konsensus dijalankan.' : 'Klik Detail untuk melihat spesifikasi lengkap.')}</span>
        </div>
        ${canEdit ? `<button class="btn btn-primary btn-sm" data-action="add-alt">${I('plus')} Tambah Laptop</button>` : ''}
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Alternatif</th><th class="num">Harga</th><th>Prosesor</th><th class="num">RAM</th><th class="num">Baterai</th><th class="num">Garansi</th><th>Aksi</th></tr></thead>
          <tbody>${altRows}</tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <h3>${I('clipboard-list')} Kriteria Pengambilan Keputusan (${db.criteria.length})</h3>
          <span class="muted small">Cost = nilai lebih kecil lebih baik (−W<sub>j</sub>). Benefit = nilai lebih besar lebih baik (+W<sub>j</sub>).</span>
        </div>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Kriteria</th><th>Keterangan</th><th>Atribut</th><th>Skala Penilaian</th></tr></thead>
          <tbody>${critRows}</tbody>
        </table>
      </div>
    </div>`;
}

/* =========================================================
   7. PENILAIAN WEIGHTED PRODUCT
   ========================================================= */
function getWorkingData(username) {
  const draft = db.drafts?.[username];
  const sub = db.submissions[username];
  const user = getUser(username);
  const pick = (a, b, fallback) => (a ?? b ?? fallback);
  const weights = {};
  db.criteria.forEach(c => {
    weights[c.id] = pick(draft?.weights?.[c.id], sub?.weights?.[c.id], user?.presetWeights?.[c.id] ?? 3);
  });
  const scores = {};
  db.alternatives.forEach(a => {
    scores[a.id] = {};
    db.criteria.forEach(c => {
      scores[a.id][c.id] = pick(draft?.scores?.[a.id]?.[c.id], sub?.scores?.[a.id]?.[c.id], a.ratings?.[c.id] ?? 3);
    });
  });
  return { weights, scores };
}

function ensureDraft() {
  if (!ui.draft || ui.draftUser !== currentUser.username) {
    ui.draft = getWorkingData(currentUser.username);
    ui.draftUser = currentUser.username;
  }
}

function scheduleDraftSave() {
  clearTimeout(draftTimer);
  const statusEl = $('#autosaveLabel');
  if (statusEl) statusEl.innerHTML = `${I('save')} Menyimpan draft...`;
  draftTimer = setTimeout(async () => {
    if (!ui.draft || !currentUser) return;
    try {
      await apiFetch('api/assessment.php', {
        method: 'POST',
        body: { action: 'save-draft', weights: ui.draft.weights, scores: ui.draft.scores }
      });
      const el = $('#autosaveLabel');
      if (el) el.innerHTML = `${I('save')} Draft tersimpan`;
    } catch (_) {
      const el = $('#autosaveLabel');
      if (el) el.innerHTML = `${I('triangle-alert')} Draft belum tersimpan`;
    }
  }, 350);
}

function renderAssessment() {
  const sub = db.submissions[currentUser.username];
  const locked = isConsensusDone();
  const hasResult = !!sub?.submitted && !!sub.wp;
  if (!ui.assessTab) ui.assessTab = hasResult ? 'result' : 'input';
  if (locked) ui.assessTab = 'result';
  if (ui.assessTab === 'result' && !hasResult) ui.assessTab = 'input';

  return ui.assessTab === 'result' ? renderWPResult(sub, locked) : renderWizard(hasResult);
}

function seg(name, attrs, value, lo, hi) {
  return `
    <div class="seg-wrap">
      <div class="seg" role="radiogroup">
        ${[1, 2, 3, 4, 5].map(n => `
          <label class="seg-opt"><input type="radio" name="${esc(name)}" value="${n}" ${attrs} ${Number(value) === n ? 'checked' : ''}><span>${n}</span></label>`).join('')}
      </div>
      <div class="seg-ends"><span>1 · ${esc(lo)}</span><span>5 · ${esc(hi)}</span></div>
    </div>`;
}

function renderWizard(hasResult) {
  ensureDraft();
  const step = ui.step;
  const steps = [
    ['1', 'Bobot Kriteria', 'Tingkat kepentingan (1–5)'],
    ['2', 'Nilai Alternatif', 'Skor tiap laptop (1–5)'],
    ['3', 'Konfirmasi & Kirim', 'Tinjau hasil peringkat']
  ];
  const stepper = `
    <div class="stepper">
      ${steps.map((s, i) => {
        const n = i + 1;
        return `<button class="step-btn ${n === step ? 'active' : ''} ${n < step ? 'finished' : ''}" data-action="goto-step" data-step="${n}">
          <span class="dot">${n < step ? I('check') : s[0]}</span><span><strong>${s[1]}</strong><small>${s[2]}</small></span></button>`;
      }).join('')}
    </div>`;

  const back = hasResult ? `<button class="btn btn-outline" data-action="back-result">${I('arrow-left')} Kembali ke Hasil</button>` : '';
  let body = '';
  let nav = '';

  if (step === 1) {
    body = `
      <div class="card">
        <h3>Langkah 1 · Bobot Kepentingan Kriteria</h3>
        <p class="muted small" style="margin-bottom:12px">Pilih bobot 1 (kurang penting) sampai 5 (sangat penting) sesuai peran Anda sebagai <strong>${esc(currentUser.role)}</strong>.</p>
        ${db.criteria.map(c => `
          <div class="q-row">
            <div class="q">
              <strong>${I(c.icon)} ${esc(c.id)} · ${esc(c.name)} <span class="badge ${c.type === 'cost' ? 'badge-danger' : 'badge-success'}">${c.type === 'cost' ? 'Cost' : 'Benefit'}</span></strong>
              <small>${esc(c.plain)}</small>
              <div class="share"><div class="bar-track"><span data-share-bar="${c.id}" style="width:0"></span></div><span data-share="${c.id}">-</span></div>
            </div>
            ${seg('w_' + c.id, `data-w="${c.id}"`, ui.draft.weights[c.id], 'Rendah', 'Sangat penting')}
          </div>`).join('')}
      </div>`;
    nav = `<div>${back}</div><div><button class="btn btn-primary" data-action="next-step">Lanjut ke Penilaian Alternatif ${I('arrow-right')}</button></div>`;
  } else if (step === 2) {
    body = `
      <div class="alert alert-warning">
        <strong>Catatan Kriteria Harga (Cost):</strong> Skala 1 = sangat murah hingga 5 = sangat mahal. Berikan nilai besar untuk laptop dengan harga tinggi.
      </div>
      ${db.alternatives.map(a => `
        <div class="laptop-card">
          <header>
            <h3>${I('laptop')} ${esc(a.id)} · ${esc(a.name)}</h3>
            <div class="chips"><span class="chip">${esc(fmtRp(a.price))}</span><span class="chip">${esc(a.cpu)}</span><span class="chip">${esc(a.ram)} GB</span><span class="chip">${esc(a.battery)} jam</span><span class="chip">${esc(a.warranty)} th</span></div>
          </header>
          ${db.criteria.map(c => `
            <div class="q-row">
              <div class="q"><strong>${I(c.icon)} ${esc(c.name)}</strong><small>${esc(specOf(a, c.id))}</small></div>
              ${seg(`s_${a.id}_${c.id}`, `data-a="${esc(a.id)}" data-c="${c.id}"`, ui.draft.scores[a.id]?.[c.id], c.lo, c.hi)}
            </div>`).join('')}
        </div>`).join('')}`;
    nav = `<div><button class="btn btn-outline" data-action="prev-step">${I('arrow-left')} Kembali</button></div><div><button class="btn btn-primary" data-action="next-step">Lanjut ke Konfirmasi ${I('arrow-right')}</button></div>`;
  } else {
    let preview = '';
    let canSend = true;
    try {
      const res = previewWP(ui.draft.weights, ui.draft.scores, db.alternatives);
      const top = [...res.rows].sort((a, b) => a.rank - b.rank)[0];
      preview = `
        <div class="alert alert-success">Seluruh input lengkap. Peringkat teratas sementara: <strong>${esc(top.name)}</strong>.</div>
        ${rankListHtml(res.rows)}`;
    } catch (err) {
      canSend = false;
      preview = `<div class="alert alert-danger">${esc(err.message)}</div>`;
    }
    body = `
      <div class="card">
        <h3>Langkah 3 · Pratinjau &amp; Kirim Penilaian</h3>
        <p class="muted small" style="margin-bottom:12px">Periksa kembali hasil peringkat sementara sebelum mengirim penilaian.</p>
        ${preview}
      </div>
      <div class="card">
        <h3>Ringkasan Bobot Kriteria</h3>
        <div class="table-wrap"><table class="table compact">
          <thead><tr><th>Kriteria</th><th class="ctr">Bobot (1–5)</th></tr></thead>
          <tbody>${db.criteria.map(c => `<tr><td>${esc(c.id)} · ${esc(c.name)}</td><td class="ctr"><strong>${esc(ui.draft.weights[c.id] ?? '-')}</strong></td></tr>`).join('')}</tbody>
        </table></div>
      </div>`;
    nav = `<div><button class="btn btn-outline" data-action="prev-step">${I('arrow-left')} Kembali</button></div>
           <div><button class="btn btn-success" data-action="submit-assessment" ${canSend ? '' : 'disabled'}>${I('check')} Kirim Penilaian</button></div>`;
  }

  return `
    ${stepper}
    ${body}
    <div class="wizard-nav">
      ${nav}
      <div style="display:flex;align-items:center;gap:14px">
        <span id="autosaveLabel" class="autosave">${I('save')} Draft tersimpan</span>
        <button class="link-btn" data-action="load-preset">Kembalikan nilai default</button>
      </div>
    </div>`;
}

function rankListHtml(rows) {
  const sorted = [...rows].sort((a, b) => a.rank - b.rank);
  const maxV = Math.max(...rows.map(r => Number(r.V))) || 1;
  return `<div class="rank-list">${sorted.map(r => `
    <div class="rank-item ${r.rank === 1 ? 'first' : ''}">
      ${rankPill(r.rank)}
      <div class="rname">
        <strong>${esc(r.name)}</strong>
        <div class="bar-track"><span style="width:${(Number(r.V) / maxV) * 100}%"></span></div>
      </div>
      <div class="pct">${fmt(Number(r.V) * 100, 1)}%</div>
    </div>`).join('')}</div>`;
}

function renderWPResult(sub, locked) {
  const wp = sub.wp;
  const topRow = wp.rows.find(r => r.rank === 1);
  const sortedRows = [...wp.rows].sort((a, b) => a.rank - b.rank);

  const weightRows = db.criteria.map(c => `
    <tr>
      <td><strong>${c.id}</strong></td><td>${esc(c.name)}</td>
      <td><span class="badge ${c.type === 'cost' ? 'badge-danger' : 'badge-success'}">${c.type === 'cost' ? 'Cost' : 'Benefit'}</span></td>
      <td class="num">${esc(sub.weights[c.id])}</td>
      <td class="num">${fmt(wp.W[c.id])}</td>
      <td class="num">${fmt(wp.exponents[c.id])}</td>
    </tr>`).join('');

  const matrixRows = wp.rows.map(r => `
    <tr><td><strong>${esc(r.name)}</strong></td>${db.criteria.map(c => `<td class="num">${esc(r.x[c.id])}</td>`).join('')}</tr>`).join('');

  const termRows = wp.rows.map(r => `
    <tr>
      <td><strong>${esc(r.name)}</strong></td>
      ${db.criteria.map(c => `<td class="num">${fmt(r.terms[c.id], 5)}</td>`).join('')}
      <td class="num"><strong>${fmt(r.S, 5)}</strong></td>
    </tr>`).join('');

  const rankRows = sortedRows.map(r => `
    <tr class="${r.rank === 1 ? 'top' : ''}">
      <td class="ctr">${rankPill(r.rank)}</td>
      <td><strong>${esc(r.name)}</strong></td>
      <td class="num">${fmt(r.S, 5)}</td>
      <td class="num">${fmt(r.V, 5)}</td>
      <td class="num">${fmt(r.V * 100, 2)}%</td>
      <td class="num">${esc(r.points)}</td>
    </tr>`).join('');

  return `
    <div class="card">
      <div class="card-head">
        <div>
          <h3>Peringkat Teratas Anda: ${esc(topRow ? topRow.name : '-')}</h3>
          <p class="muted small" style="margin:0">Dikirim pada ${esc(fmtDate(sub.submittedAt))}</p>
        </div>
        ${locked ? `<span class="badge badge-warning">${I('lock')} Terkunci</span>` : `<button class="btn btn-outline btn-sm" data-action="edit-assessment">${I('square-pen')} Ubah Penilaian</button>`}
      </div>
      ${rankListHtml(wp.rows)}
    </div>

    <details class="more" open>
      <summary>${I('chart-column')} Rincian Perhitungan Weighted Product</summary>

      <div class="card">
        <h3>1. Normalisasi Bobot (W<sub>j</sub>)</h3>
        <div class="table-wrap"><table class="table compact">
          <thead><tr><th>Kode</th><th>Kriteria</th><th>Atribut</th><th class="num">Bobot (w)</th><th class="num">W<sub>j</sub></th><th class="num">Pangkat (±W<sub>j</sub>)</th></tr></thead>
          <tbody>${weightRows}</tbody>
          <tfoot><tr><td colspan="3">Total</td><td class="num">${esc(wp.sumW)}</td><td class="num">${fmt(db.criteria.reduce((s, c) => s + Number(wp.W[c.id] || 0), 0))}</td><td></td></tr></tfoot>
        </table></div>
      </div>

      <div class="card">
        <h3>2. Matriks Keputusan (X<sub>ij</sub>)</h3>
        <div class="table-wrap"><table class="table compact">
          <thead><tr><th>Alternatif</th>${db.criteria.map(c => `<th class="num">${c.id} ${esc(c.name)}</th>`).join('')}</tr></thead>
          <tbody>${matrixRows}</tbody>
        </table></div>
      </div>

      <div class="card">
        <h3>3. Vektor S (S<sub>i</sub> = Π X<sub>ij</sub><sup>±W<sub>j</sub></sup>)</h3>
        <div class="table-wrap"><table class="table compact">
          <thead><tr><th>Alternatif</th>${db.criteria.map(c => `<th class="num">${c.id}</th>`).join('')}<th class="num">S<sub>i</sub></th></tr></thead>
          <tbody>${termRows}</tbody>
          <tfoot><tr><td colspan="${db.criteria.length + 1}">Σ S</td><td class="num">${fmt(wp.sumS, 5)}</td></tr></tfoot>
        </table></div>
      </div>

      <div class="card">
        <h3>4. Vektor V &amp; Poin Borda Individu</h3>
        <div class="table-wrap"><table class="table compact">
          <thead><tr><th class="ctr">Rank</th><th>Alternatif</th><th class="num">S<sub>i</sub></th><th class="num">V<sub>i</sub></th><th class="num">Persentase</th><th class="num">Poin Borda</th></tr></thead>
          <tbody>${rankRows}</tbody>
        </table></div>
      </div>
    </details>`;
}

function updateWeightShare() {
  if (!ui.draft) return;
  const w = ui.draft.weights;
  const sum = db.criteria.reduce((s, c) => s + (Number(w[c.id]) || 0), 0);
  db.criteria.forEach(c => {
    const share = sum > 0 ? (Number(w[c.id]) || 0) / sum : 0;
    const bar = $(`[data-share-bar="${c.id}"]`);
    const txt = $(`[data-share="${c.id}"]`);
    if (bar) bar.style.width = (share * 100).toFixed(1) + '%';
    if (txt) txt.textContent = `${(share * 100).toFixed(1)}% bobot relatif`;
  });
}

function handleChoice(input) {
  ensureDraft();
  const val = Number(input.value);
  if (input.dataset.w) {
    ui.draft.weights[input.dataset.w] = val;
    updateWeightShare();
  } else if (input.dataset.a) {
    if (!ui.draft.scores[input.dataset.a]) ui.draft.scores[input.dataset.a] = {};
    ui.draft.scores[input.dataset.a][input.dataset.c] = val;
  }
  scheduleDraftSave();
}

function gotoStep(n) {
  ui.step = Math.min(3, Math.max(1, n));
  render();
  window.scrollTo(0, 0);
}

async function submitAssessment() {
  if (isConsensusDone()) { toast('Konsensus sudah dijalankan; penilaian terkunci.', 'warning'); return; }
  ensureDraft();
  clearTimeout(draftTimer);
  try {
    const data = await apiFetch('api/assessment.php', {
      method: 'POST',
      body: { action: 'submit', weights: ui.draft.weights, scores: ui.draft.scores }
    });
    applyState(data.state);
    ui.assessTab = 'result';
    ui.draft = null;
    render();
    window.scrollTo(0, 0);
    toast('Penilaian berhasil disimpan.', 'success');
  } catch (err) {
    toast(err.message, 'error');
  }
}

function loadPreset() {
  const user = getUser(currentUser.username);
  ui.draft = {
    weights: deepClone(user?.presetWeights || {}),
    scores: Object.fromEntries(db.alternatives.map(a => [a.id, deepClone(a.ratings || {})]))
  };
  ui.draftUser = currentUser.username;
  scheduleDraftSave();
  render();
  toast('Isian dikembalikan ke nilai default.', 'info');
}

/* =========================================================
   8. HASIL KONSENSUS (BORDA)
   ========================================================= */
async function runBorda() {
  try {
    const data = await apiFetch('api/consensus.php', { method: 'POST', body: {} });
    applyState(data.state);
    ui.page = 'konsensus';
    render();
    window.scrollTo(0, 0);
    toast('Konsensus Borda berhasil dijalankan.', 'success');
  } catch (err) {
    toast(err.message, 'error');
  }
}

function confirmRunBorda() {
  openModal({
    title: 'Jalankan Konsensus Borda?',
    small: true,
    body: '<p>Sistem akan menggabungkan peringkat seluruh Decision Maker menjadi satu keputusan akhir kelompok.</p><p class="muted small">Setelah dijalankan, data alternatif dan penilaian akan terkunci.</p>',
    actions: [
      { label: 'Batal', cls: 'btn-outline', onClick: closeModal },
      { label: 'Jalankan Konsensus', cls: 'btn-success', onClick: () => { closeModal(); runBorda(); } }
    ]
  });
}

function renderConsensus() {
  const isHead = isCurrentHead();
  const res = db.result;

  if (!res) {
    const done = submittedCount();
    const status = db.users.map(u =>
      `<li class="dm-item"><span class="avatar">${esc(initials(u.name))}</span><div class="info"><strong>${esc(u.name)}</strong></div>
       <span class="badge ${isSubmitted(u.username) ? 'badge-success' : 'badge-warning'}">${isSubmitted(u.username) ? I('check') + ' Selesai' : I('clock') + ' Belum'}</span></li>`).join('');
    return `
      <div class="card lock-box">
        <div class="ico">${I('lock')}</div>
        <h3>Konsensus Belum Tersedia</h3>
        <p class="muted" style="max-width:440px;margin:0 auto 16px">${allSubmitted()
          ? 'Seluruh penilaian telah lengkap. Menunggu Kepala Lab menjalankan Konsensus Borda.'
          : `Menunggu seluruh Decision Maker mengirim penilaian (${done}/${db.users.length} selesai).`}</p>
        <ul class="dm-list" style="max-width:400px;margin:0 auto 18px;text-align:left">${status}</ul>
        ${isHead ? `<button class="btn btn-success" data-action="run-borda" ${allSubmitted() ? '' : 'disabled'}>${I('vote')} Jalankan Konsensus Borda</button>` : ''}
        ${!isSubmitted(currentUser.username) ? `<div style="margin-top:12px"><button class="btn btn-primary" data-action="nav" data-page="penilaian">${I('square-pen')} Isi Penilaian Saya</button></div>` : ''}
      </div>`;
  }

  const winner = res.rows[0];
  const maxTotal = Math.max(...res.rows.map(r => Number(r.total))) || 1;
  const dmCols = res.dmOrder.map(getUser).filter(Boolean);
  const headUser = getHeadUser();
  const reason = dmCols.map(u => `${u.name} (Rank ${winner.ranks[u.username]}, +${winner.points[u.username]} poin)`).join(', ');

  const rows = res.rows.map(r => `
    <tr class="${r.finalRank === 1 ? 'top' : ''}">
      <td class="ctr">${rankPill(r.finalRank)}</td>
      <td><strong>${esc(r.name)}</strong></td>
      ${dmCols.map(u => `<td class="ctr">Rank ${esc(r.ranks[u.username])} · <strong>${esc(r.points[u.username])}</strong></td>`).join('')}
      <td class="num"><strong>${esc(r.total)}</strong></td>
      <td class="num">${fmt(r.weight, 4)}</td>
      <td style="min-width:130px"><div class="bar-row"><div class="bar-track"><span style="width:${(Number(r.total) / maxTotal) * 100}%"></span></div><span class="small">${fmt(r.weight * 100, 1)}%</span></div></td>
    </tr>`).join('');

  const indiv = dmCols.map(u => {
    const wp = db.submissions[u.username]?.wp;
    const top = wp ? wp.rows.find(r => r.rank === 1) : null;
    return `<tr><td><strong>${esc(u.name)}</strong></td><td>${esc(top ? top.name : '-')}</td>
      <td class="muted">${wp ? [...wp.rows].sort((a, b) => a.rank - b.rank).map(r => `${esc(r.name)} (${fmt(r.V, 3)})`).join(' &gt; ') : '-'}</td></tr>`;
  }).join('');

  const tieNote = res.tieAtTop
    ? `<div class="alert alert-warning">Terjadi poin seri pada peringkat teratas. Peringkat dari <strong>${esc(headUser.name)}</strong> (jabatan tertinggi) digunakan sebagai penentu.</div>`
    : '';

  return `
    <div class="card winner">
      <div class="trophy">${I('trophy')}</div>
      <div>
        <p>Rekomendasi Laptop Terpilih</p>
        <h3>${esc(winner.name)}</h3>
        <p>Total ${esc(winner.total)} dari ${esc(res.grandTotal)} poin (${fmt(winner.weight * 100, 1)}%) · ${esc(reason)}</p>
      </div>
    </div>
    ${tieNote}

    <div class="card">
      <div class="card-head">
        <h3>${I('table')} Tabel Agregasi Borda</h3>
        <span class="muted small">Dijalankan oleh ${esc(getUser(res.runBy)?.name || res.runBy)} · ${esc(fmtDate(res.runAt))}</span>
      </div>
      <div class="table-wrap"><table class="table">
        <thead><tr><th class="ctr">Rank</th><th>Alternatif</th>${dmCols.map(u => `<th class="ctr">${esc(u.name)}</th>`).join('')}<th class="num">Total Poin</th><th class="num">Bobot Borda</th><th>Proporsi</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="${2 + dmCols.length}">Total</td><td class="num">${esc(res.grandTotal)}</td><td class="num">${fmt(res.rows.reduce((s, r) => s + Number(r.weight), 0), 4)}</td><td></td></tr></tfoot>
      </table></div>
    </div>

    <div class="card">
      <h3>Perbandingan Peringkat Individu (WP)</h3>
      <div class="table-wrap"><table class="table compact">
        <thead><tr><th>Decision Maker</th><th>Peringkat 1</th><th>Urutan Lengkap (Nilai V)</th></tr></thead>
        <tbody>${indiv}</tbody>
      </table></div>
    </div>`;
}

/* =========================================================
   9. PANDUAN SISTEM
   ========================================================= */
function renderGuide() {
  return `
    <div class="guide-steps">
      <div class="guide-step"><span class="num">1</span><div><h4>Autentikasi Peran</h4><p>Setiap pengambil keputusan (Kepala Lab, Dosen Pengampu, Asisten Lab) masuk menggunakan akun masing-masing.</p></div></div>
      <div class="guide-step"><span class="num">2</span><div><h4>Penilaian Weighted Product</h4><p>Isi bobot kepentingan kriteria (1–5) dan nilai setiap alternatif laptop (1–5) pada menu Penilaian WP.</p></div></div>
      <div class="guide-step"><span class="num">3</span><div><h4>Konsensus Borda</h4><p>Setelah seluruh Decision Maker mengirim penilaian, Kepala Lab menjalankan Konsensus Borda di Dashboard.</p></div></div>
      <div class="guide-step"><span class="num">4</span><div><h4>Keputusan Kelompok</h4><p>Peringkat akhir kelompok dan rincian poin Borda dapat diakses oleh seluruh akun di menu Hasil Konsensus.</p></div></div>
    </div>

    <div class="card">
      <h3>${I('book-open')} Ringkasan Metode</h3>
      <p><strong>Weighted Product (WP)</strong> digunakan untuk menghasilkan peringkat individu tiap Decision Maker dengan rumus <code>S_i = Π X_ij^(±W_j)</code> dan <code>V_i = S_i / Σ S</code>. Kriteria <em>Benefit</em> berpangkat positif (<code>+W_j</code>) dan kriteria <em>Cost</em> berpangkat negatif (<code>-W_j</code>).</p>
      <p><strong>Metode Borda</strong> menggabungkan peringkat seluruh Decision Maker menjadi satu keputusan kelompok: peringkat 1 memperoleh <code>n</code> poin hingga peringkat <code>n</code> memperoleh <code>1</code> poin. Jika terjadi seri di peringkat teratas, peringkat dari Kepala Lab (jabatan tertinggi) menjadi penentu.</p>
    </div>

    <div class="card">
      <h3>${I('database')} Struktur Database Relasional</h3>
      <p class="muted small">Seluruh data transaksi, master kriteria, alternatif, hasil WP, dan konsensus Borda disimpan pada database MySQL <code>gdss_laptop_lab</code> yang terdiri dari 11 tabel ternormalisasi:</p>
      <p class="small"><code>users</code> · <code>criteria</code> · <code>alternatives</code> · <code>alternative_ratings</code> · <code>user_preset_weights</code> · <code>submissions</code> · <code>submission_weights</code> · <code>submission_scores</code> · <code>wp_results</code> · <code>consensus_sessions</code> · <code>consensus_details</code></p>
    </div>`;
}

/* =========================================================
   10. CRUD ALTERNATIF LAPTOP
   ========================================================= */
function viewAlternative(id) {
  const a = db.alternatives.find(x => x.id === id);
  if (!a) return;
  const ratings = db.criteria.map(c => `<tr><td>${esc(c.id)} · ${esc(c.name)}</td><td class="ctr">${esc(a.ratings?.[c.id] ?? '-')}</td></tr>`).join('');
  openModal({
    title: `${a.id} · ${a.name}`,
    body: `
      <dl class="detail-list">
        <dt>Harga</dt><dd>${esc(fmtRp(a.price))}</dd>
        <dt>Prosesor</dt><dd>${esc(a.cpu)}</dd>
        <dt>RAM</dt><dd>${esc(a.ram)} GB</dd>
        <dt>Baterai</dt><dd>${esc(a.battery)} jam</dd>
        <dt>Garansi</dt><dd>${esc(a.warranty)} tahun</dd>
        <dt>Catatan</dt><dd>${esc(a.note || '-')}</dd>
      </dl>
      <h4 style="margin:14px 0 8px;font-size:13px">Nilai Referensi (Skala 1–5)</h4>
      <div class="table-wrap"><table class="table compact"><thead><tr><th>Kriteria</th><th class="ctr">Nilai</th></tr></thead><tbody>${ratings}</tbody></table></div>`,
    actions: [{ label: 'Tutup', cls: 'btn-primary', onClick: closeModal }]
  });
}

function openAlternativeForm(existing = null) {
  if (!isCurrentHead() || isConsensusDone()) { toast('Data alternatif tidak dapat diubah.', 'warning'); return; }
  const isEdit = !!existing;
  const a = existing || {
    id: '', name: '', price: 11000000, cpu: '', ram: 8, battery: 9, warranty: 2, note: '',
    ratings: Object.fromEntries(db.criteria.map(c => [c.id, 3]))
  };

  openModal({
    title: isEdit ? `Edit ${a.name}` : 'Tambah Alternatif Laptop',
    body: `
      <form id="altForm" data-mode="${isEdit ? 'update' : 'create'}" data-id="${esc(a.id)}" novalidate>
        <div class="form-grid">
          <div class="full"><label for="af_name">Nama Laptop</label><input id="af_name" type="text" maxlength="100" value="${esc(a.name)}" placeholder="Contoh: MSI Modern 14"></div>
          <div><label for="af_price">Harga (Rp)</label><input id="af_price" type="number" min="1" step="100000" value="${esc(a.price)}"></div>
          <div><label for="af_cpu">Prosesor</label><input id="af_cpu" type="text" maxlength="100" value="${esc(a.cpu)}" placeholder="Contoh: Intel Core i5-1335U"></div>
          <div><label for="af_ram">RAM (GB)</label><input id="af_ram" type="number" min="1" step="1" value="${esc(a.ram)}"></div>
          <div><label for="af_battery">Baterai (jam)</label><input id="af_battery" type="number" min="1" step="0.5" value="${esc(a.battery)}"></div>
          <div><label for="af_warranty">Garansi (tahun)</label><input id="af_warranty" type="number" min="1" step="1" value="${esc(a.warranty)}"></div>
          <div class="full"><label for="af_note">Catatan</label><textarea id="af_note" rows="2" maxlength="250">${esc(a.note || '')}</textarea></div>
        </div>
        <h4 style="margin:14px 0 8px;font-size:13px">Nilai Referensi (Skala 1–5)</h4>
        <div class="form-grid">
          ${db.criteria.map(c => `<div><label for="af_r_${c.id}">${esc(c.id)} · ${esc(c.name)}</label><input id="af_r_${c.id}" type="number" min="1" max="5" step="1" value="${esc(a.ratings?.[c.id] ?? 3)}"></div>`).join('')}
        </div>
        <p id="altError" class="form-error" hidden></p>
      </form>`,
    actions: [
      { label: 'Batal', cls: 'btn-outline', onClick: closeModal },
      { label: isEdit ? 'Simpan' : 'Tambah', cls: 'btn-primary', onClick: saveAlternative }
    ]
  });
}

async function saveAlternative() {
  const form = $('#altForm');
  const err = $('#altError');
  err.hidden = true;

  const payload = {
    action: form.dataset.mode,
    id: form.dataset.id,
    name: $('#af_name').value.trim(),
    cpu: $('#af_cpu').value.trim(),
    price: Number($('#af_price').value),
    ram: Number($('#af_ram').value),
    battery: Number($('#af_battery').value),
    warranty: Number($('#af_warranty').value),
    note: $('#af_note').value.trim(),
    ratings: {}
  };
  for (const c of db.criteria) payload.ratings[c.id] = Number($('#af_r_' + c.id).value);

  try {
    const data = await apiFetch('api/alternatives.php', { method: 'POST', body: payload });
    applyState(data.state);
    closeModal();
    render();
    toast(data.message || 'Data alternatif disimpan.', 'success');
  } catch (e) {
    err.textContent = e.message;
    err.hidden = false;
  }
}

function confirmDeleteAlternative(id) {
  const a = db.alternatives.find(x => x.id === id);
  if (!a) return;
  openModal({
    title: `Hapus ${a.name}?`,
    small: true,
    body: `<p>Alternatif <strong>${esc(a.name)}</strong> (${esc(a.id)}) akan dihapus dari database.</p><p class="muted small">Jika sudah ada penilaian terkirim, status penilaian akan dikembalikan ke draft.</p>`,
    actions: [
      { label: 'Batal', cls: 'btn-outline', onClick: closeModal },
      { label: 'Hapus', cls: 'btn-danger', onClick: async () => {
        closeModal();
        try {
          const data = await apiFetch('api/alternatives.php', { method: 'POST', body: { action: 'delete', id } });
          applyState(data.state);
          render();
          toast(data.message || 'Alternatif dihapus.', 'success');
        } catch (err) {
          toast(err.message, 'error');
        }
      }}
    ]
  });
}

/* =========================================================
   11. MODAL & RESET SESI (KHUSUS KEPALA LAB)
   ========================================================= */
function openModal({ title, body, actions = [], small = false }) {
  const root = $('#modalRoot');
  root.innerHTML = `
    <div class="modal-backdrop" data-action="modal-backdrop">
      <div class="modal ${small ? 'sm' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" data-action="close-modal" aria-label="Tutup">${I('x')}</button></div>
        <div>${body}</div>
        <div class="modal-foot"></div>
      </div>
    </div>`;
  const foot = $('.modal-foot', root);
  actions.forEach(a => {
    const btn = document.createElement('button');
    btn.className = 'btn ' + (a.cls || 'btn-outline');
    btn.textContent = a.label;
    btn.addEventListener('click', a.onClick);
    foot.appendChild(btn);
  });
}
function closeModal() { $('#modalRoot').innerHTML = ''; }

function confirmReset() {
  openModal({
    title: 'Reset Sesi Penilaian?',
    small: true,
    body: '<p>Seluruh penilaian, hasil konsensus, dan perubahan alternatif akan dikembalikan ke data awal.</p><p class="muted small">Tindakan ini tidak dapat dibatalkan.</p>',
    actions: [
      { label: 'Batal', cls: 'btn-outline', onClick: closeModal },
      { label: 'Ya, Reset', cls: 'btn-danger', onClick: () => { closeModal(); resetAll(); } }
    ]
  });
}

async function resetAll() {
  try {
    const data = await apiFetch('api/reset.php', { method: 'POST', body: {} });
    applyState(data.state);
    ui.assessTab = null;
    ui.step = 1;
    ui.draft = null;
    if (currentUser) { ui.page = 'dashboard'; render(); }
    toast(data.message || 'Sesi berhasil direset.', 'success');
  } catch (err) {
    toast(err.message, 'error');
  }
}

/* =========================================================
   12. EVENT HANDLER & INISIALISASI
   ========================================================= */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;

  if (action === 'modal-backdrop') { if (e.target === el) closeModal(); return; }

  switch (action) {
    case 'nav': navigate(el.dataset.page); break;
    case 'logout': logout(); break;
    case 'toggle-sidebar': toggleSidebar(); break;
    case 'quick-fill': quickFillLogin(el.dataset.user); break;
    case 'reset-data': confirmReset(); break;
    case 'run-borda': confirmRunBorda(); break;
    case 'view-alt': viewAlternative(el.dataset.id); break;
    case 'add-alt': openAlternativeForm(null); break;
    case 'edit-alt': openAlternativeForm(db.alternatives.find(x => x.id === el.dataset.id)); break;
    case 'delete-alt': confirmDeleteAlternative(el.dataset.id); break;
    case 'close-modal': closeModal(); break;
    case 'goto-step': gotoStep(Number(el.dataset.step)); break;
    case 'next-step': gotoStep(ui.step + 1); break;
    case 'prev-step': gotoStep(ui.step - 1); break;
    case 'edit-assessment':
      if (isConsensusDone()) { toast('Konsensus sudah dijalankan; penilaian terkunci.', 'warning'); break; }
      ui.draft = null;
      ui.assessTab = 'input';
      ui.step = 1;
      render();
      window.scrollTo(0, 0);
      break;
    case 'back-result':
      ui.assessTab = 'result';
      ui.draft = null;
      render();
      break;
    case 'submit-assessment': submitAssessment(); break;
    case 'load-preset': loadPreset(); break;
  }
});

document.addEventListener('change', e => {
  if (e.target.matches('input[type="radio"][data-w], input[type="radio"][data-a]')) handleChoice(e.target);
});

document.addEventListener('submit', e => {
  if (e.target.id === 'manualLoginForm') handleManualLogin(e);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

(async function init() {
  hydrateIcons();
  let data;
  try {
    data = await refreshState();
  } catch (err) {
    showDbError(err.message);
    return;
  }
  if (data.user) startApp(data.user);
  else showLogin();
})();
