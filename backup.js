/* LiXi backup — ekspor semua tabel ke satu file JSON.
 * Hanya MEMBACA data (select). Tidak ada tulis/hapus ke database.
 * Memakai variabel global milik app: db, toast, esc. */
(function () {
  'use strict';

  var TABLES = [
    { name: 'products', order: 'id', required: true },
    { name: 'transactions', order: 'id', required: true },
    // Tabel ini baru ada setelah SQL migrasi profil dijalankan; bila belum ada, dilewati.
    { name: 'lixi_customer_profiles', order: 'customer_wa', required: false }
  ];
  var PAGE = 1000;
  var KEY = 'lixiLastBackup';
  var running = false;

  function byId(id) { return document.getElementById(id); }
  function say(msg) { try { if (typeof toast === 'function') toast(msg); } catch (e) { /* abaikan */ } }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function stamp(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      '_' + pad(d.getHours()) + pad(d.getMinutes());
  }

  async function fetchAll(table, order) {
    var rows = [], offset = 0;
    while (true) {
      var res = await db.from(table).select('*').order(order, { ascending: true }).range(offset, offset + PAGE - 1);
      if (res.error) throw res.error;
      var batch = res.data || [];
      rows.push.apply(rows, batch);
      if (batch.length < PAGE) break;
      offset += PAGE;
    }
    return rows;
  }

  function showStatus() {
    var el = byId('backupStatus');
    if (!el) return;
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { /* abaikan */ }
    if (!raw) { el.textContent = 'Belum pernah backup di perangkat ini.'; el.dataset.old = '1'; return; }
    var d = new Date(raw);
    if (isNaN(d.getTime())) { el.textContent = 'Belum pernah backup di perangkat ini.'; el.dataset.old = '1'; return; }
    var days = Math.floor((Date.now() - d.getTime()) / 86400000);
    var when = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + ' ' +
      pad(d.getHours()) + ':' + pad(d.getMinutes());
    el.textContent = 'Backup terakhir: ' + when + (days >= 7 ? ' (' + days + ' hari lalu, saatnya backup lagi)' : '');
    el.dataset.old = days >= 7 ? '1' : '';
  }

  async function runBackup() {
    if (running) return;
    var btn = byId('btnBackup');
    if (typeof db === 'undefined' || !db) { say('Koneksi belum siap. Login dulu ya.'); return; }
    running = true;
    var label = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Mengambil data…'; }
    try {
      var out = { app: 'LiXi Store', version: 1, exported_at: new Date().toISOString(), counts: {}, skipped: {}, data: {} };
      for (var i = 0; i < TABLES.length; i++) {
        var t = TABLES[i];
        try {
          out.data[t.name] = await fetchAll(t.name, t.order);
          out.counts[t.name] = out.data[t.name].length;
        } catch (err) {
          if (t.required) throw new Error('Tabel ' + t.name + ': ' + (err && err.message ? err.message : err));
          out.skipped[t.name] = err && err.message ? err.message : String(err);
          out.data[t.name] = [];
          out.counts[t.name] = 0;
        }
      }
      var json = JSON.stringify(out, null, 2);
      var blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'lixi-backup-' + stamp(new Date()) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      try { localStorage.setItem(KEY, new Date().toISOString()); } catch (e) { /* abaikan */ }
      showStatus();
      var skippedNames = Object.keys(out.skipped);
      say('Backup selesai: ' + out.counts.transactions + ' transaksi, ' + out.counts.products + ' produk' +
        (skippedNames.length ? ' (tabel ' + skippedNames.join(', ') + ' dilewati)' : '') + ' ✨');
    } catch (err) {
      console.error('Backup gagal:', err);
      say('Backup gagal: ' + (err && err.message ? err.message : 'periksa koneksi lalu coba lagi'));
    } finally {
      running = false;
      if (btn) { btn.disabled = false; btn.textContent = label || 'Backup Sekarang'; }
    }
  }

  window.lxBackupAll = runBackup;

  function init() {
    var btn = byId('btnBackup');
    if (btn && !btn.dataset.bound) { btn.dataset.bound = '1'; btn.addEventListener('click', runBackup); }
    showStatus();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();

  // Segarkan teks status setiap kali halaman Pengaturan dibuka
  var settings = byId('pengaturan');
  if (settings && window.MutationObserver) {
    new MutationObserver(function () { if (settings.classList.contains('show')) showStatus(); })
      .observe(settings, { attributes: true, attributeFilter: ['class'] });
  }
})();
