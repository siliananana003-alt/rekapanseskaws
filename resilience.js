/* LiXi resilience — tambahan kecil, tidak mengubah app.js.
 * 1. Bila data gagal dimuat (sinyal buruk / Supabase bermasalah), tampil banner dengan tombol "Coba lagi".
 *    Sebelumnya pesan error ditulis ke #loginError yang sudah tersembunyi, jadi layar tampak kosong tanpa penjelasan.
 * 2. Data dimuat ulang otomatis saat tab dibuka kembali setelah lama ditinggal (mis. dipakai di 2 perangkat).
 * 3. Error JavaScript yang tak tertangani dicatat rapi di console.
 * Pasang SETELAH backup.js:  <script defer src="resilience.js"></script> */
(function () {
  'use strict';

  var STALE_MS = 5 * 60 * 1000;   // muat ulang bila tab disembunyikan > 5 menit
  var hiddenAt = 0;
  var bar = null;
  var failed = false;   // true bila ada kegagalan muat sejak retry() dimulai

  function ensureBar() {
    if (bar) return bar;
    bar = document.createElement('div');
    bar.id = 'lxLoadBanner';
    bar.setAttribute('role', 'alert');
    bar.style.cssText = 'display:none;position:fixed;left:12px;right:12px;top:calc(env(safe-area-inset-top,0px) + 10px);' +
      'z-index:9999;padding:12px 14px;border-radius:16px;background:var(--panel,#fff);color:var(--ink,#333);' +
      'border:2px solid var(--red,#e5566d);box-shadow:0 6px 24px rgba(0,0,0,.18);font-weight:700;' +
      'align-items:center;justify-content:space-between;gap:10px';
    var msg = document.createElement('span');
    msg.className = 'lx-banner-msg';
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'btn'; btn.textContent = 'Coba lagi';
    btn.addEventListener('click', retry);
    bar.appendChild(msg); bar.appendChild(btn);
    document.body.appendChild(bar);
    return bar;
  }
  function showBanner(text) {
    failed = true;
    var b = ensureBar();
    b.querySelector('.lx-banner-msg').textContent = text;
    b.style.display = 'flex';
  }
  function hideBanner() { if (bar) bar.style.display = 'none'; }

  var retrying = false;
  async function retry() {
    if (retrying || typeof window.reload !== 'function') return;
    retrying = true;
    var b = ensureBar().querySelector('button');
    b.disabled = true; b.textContent = 'Memuat…';
    try {
      failed = false;
      await window.reload();
      // reload() menangani errornya sendiri dan wrapper di bawah memanggil showBanner() (failed = true).
      // Banner hanya disembunyikan bila tidak ada kegagalan, supaya tidak hilang padahal data belum termuat.
      if (!failed) hideBanner();
    } finally {
      retrying = false; b.disabled = false; b.textContent = 'Coba lagi';
    }
  }

  /* 1a) loadProducts melempar error saat gagal */
  var origProducts = window.loadProducts;
  if (typeof origProducts === 'function') {
    window.loadProducts = async function () {
      try {
        var r = await origProducts.apply(this, arguments);
        hideBanner();
        return r;
      } catch (e) {
        showBanner('Data produk gagal dimuat. Periksa koneksi internet.');
        throw e;
      }
    };
  }

  /* 1b) loadTx tidak melempar error, hanya memanggil toast('Gagal memuat transaksi: ...') */
  var origToast = window.toast;
  if (typeof origToast === 'function') {
    window.toast = function (s) {
      if (typeof s === 'string' && s.indexOf('Gagal memuat transaksi') === 0) {
        showBanner('Transaksi gagal dimuat. Periksa koneksi internet.');
      }
      return origToast.apply(this, arguments);
    };
  }

  /* 2) Segarkan data saat tab kembali aktif */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (!hiddenAt || Date.now() - hiddenAt < STALE_MS) return;
    hiddenAt = 0;
    var app = document.getElementById('appMain');
    var modal = document.getElementById('modal');
    var loggedIn = app && getComputedStyle(app).display !== 'none';
    var formOpen = modal && getComputedStyle(modal).display !== 'none';
    if (!loggedIn || formOpen || !navigator.onLine || typeof window.reload !== 'function') return;
    window.reload();
  });

  /* 3) Catat error tak tertangani */
  window.addEventListener('unhandledrejection', function (e) {
    console.error('[LiXi] Promise tidak tertangani:', e.reason);
  });
  window.addEventListener('error', function (e) {
    console.error('[LiXi] Error:', e.message, e.filename + ':' + e.lineno);
  });
})();
