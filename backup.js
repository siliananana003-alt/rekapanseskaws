/* LiXi backup — ekspor semua tabel ke satu file JSON.
 * Hanya MEMBACA data (select). Tidak ada tulis/hapus ke database.
 * Memakai variabel global milik app: db, toast, esc. */
(function () {
  'use strict';

  var TABLES = [
    { name: 'products', order: 'id', required: true },
    { name: 'transactions', order: 'id', required: true },
    // Tabel ini baru ada setelah SQL migrasi profil dijalankan; bila belum ada, dilewati.
    // sweepRequired: tabel opsional, tetapi WAJIB ikut ter-backup sebelum Sapu Bersih (menyimpan jumlah pembelian permanen).
    { name: 'lixi_customer_profiles', order: 'customer_wa', required: false, sweepRequired: true },
    // Ringkasan bulanan untuk tren 12 bulan; dilewati bila belum dibuat.
    { name: 'lixi_monthly_summary', order: 'month', required: false },
    { name: 'lixi_monthly_product_summary', order: ['month', 'product_name'], required: false }
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
      var q = db.from(table).select('*');
      [].concat(order).forEach(function (col) { q = q.order(col, { ascending: true }); });
      var res = await q.range(offset, offset + PAGE - 1);
      if (res.error) throw res.error;
      var batch = res.data || [];
      if (!batch.length) break;
      rows.push.apply(rows, batch);
      offset += batch.length;
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

  // Mengembalikan true bila file backup berhasil dibuat, false bila gagal / sedang berjalan.
  // opts.strict = true (dipakai Sapu Bersih): tabel bertanda sweepRequired tidak boleh dilewati.
  async function runBackup(opts) {
    var strict = !!(opts && opts.strict === true);   // klik tombol mengirim Event, bukan opsi
    if (running) return false;
    var btn = byId('btnBackup');
    if (typeof db === 'undefined' || !db) { say('Koneksi belum siap. Login dulu ya.'); return false; }
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
          if (t.required || (strict && t.sweepRequired)) throw new Error('Tabel ' + t.name + ': ' + (err && err.message ? err.message : err));
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
      return true;
    } catch (err) {
      console.error('Backup gagal:', err);
      say('Backup gagal: ' + (err && err.message ? err.message : 'periksa koneksi lalu coba lagi'));
      return false;
    } finally {
      running = false;
      if (btn) { btn.disabled = false; btn.textContent = label || 'Backup Sekarang'; }
    }
  }

  window.lxBackupAll = runBackup;

  /* ---------- Sapu Bersih: backup lengkap wajib sebelum menghapus ----------
   * Fungsi asli (bulkDeleteExpired di app.js) tidak diubah, hanya dibungkus:
   *  1. Hitung dulu transaksi yang akan dihapus (kriteria sama dengan fungsi asli).
   *  2. Bila tidak ada, langsung panggil fungsi asli (ia akan menampilkan "aman").
   *  3. Bila ada, backup lengkap harus berhasil dulu. Gagal = penghapusan dibatalkan.
   *  4. Setelah itu fungsi asli berjalan seperti biasa, termasuk dialog konfirmasinya. */
  var origSweep = window.bulkDeleteExpired;
  if (typeof origSweep === 'function') {
    var sweeping = false;
    window.bulkDeleteExpired = async function () {
      if (sweeping) return;
      sweeping = true;
      try {
        if (typeof customerProfilesLoaded === 'undefined' || typeof db === 'undefined' || !db || typeof localDateString !== 'function') {
          say('Tidak bisa memastikan backup aman. Penghapusan dibatalkan.');
          return;
        }
        if (!customerProfilesLoaded) return await origSweep.apply(this, arguments);   // app.js yang menolak dengan pesannya sendiri
        var cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        var res = await db.from('transactions').select('id', { count: 'exact', head: true }).lt('expire_date', localDateString(cutoff));
        if (res.error) { say('Gagal memeriksa transaksi expired: ' + res.error.message); return; }
        if (!res.count) return await origSweep.apply(this, arguments);

        say('Sebelum dihapus, backup lengkap diunduh dulu 🛟');
        var ok = await runBackup({ strict: true });
        if (!ok) { say('Penghapusan dibatalkan karena backup gagal. Tidak ada data yang dihapus.'); return; }
        if (!confirm('File backup (lixi-backup-....json) sudah terunduh di perangkat ini?\n\nKlik OK hanya bila file itu benar-benar ada. Setelah ini transaksi expired akan dihapus permanen.')) {
          say('Penghapusan dibatalkan. Tidak ada data yang dihapus.');
          return;
        }
        return await origSweep.apply(this, arguments);
      } finally {
        sweeping = false;
      }
    };
  }

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
