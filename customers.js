/* LiXi pelanggan — ubah nomor WhatsApp & hapus pelanggan. Tidak mengubah app.js.
 * Butuh customer_manage.sql di Supabase. Pasang SETELAH trend12.js:
 *   <script defer src="customers.js?v=1"></script>
 * Memakai global milik app: db, esc, rupiah, formatWA, toast, loadTx, lxIc, allTxs,
 * customerDirectoryCache, customerProfilesLoaded; dan window.lxBackupAll dari backup.js. */
(function () {
  'use strict';

  var dlg = null, st = null, busy = false, opener = null;

  function $id(id) { return document.getElementById(id); }
  function say(m) { try { toast(m); } catch (e) { console.warn(m); } }
  function ic(n) { return typeof lxIc === 'function' ? lxIc(n, 'ic-sm') : ''; }
  function rp(n) { return typeof rupiah === 'function' ? rupiah(n) : 'Rp' + Number(n || 0).toLocaleString('id-ID'); }
  function infoOf(wa) {
    return (typeof customerDirectoryCache !== 'undefined' && customerDirectoryCache && customerDirectoryCache.get(wa)) || null;
  }
  function txCount(wa) {
    return (allTxs || []).filter(function (t) { return formatWA(t.customer_wa) === wa; }).length;
  }
  function explain(er) {
    var m = String((er && er.message) || er || '');
    if (/NUMBER_EXISTS/.test(m)) return 'Nomor itu sudah dipakai pelanggan lain. Centang gabungkan bila memang orang yang sama.';
    if (/INVALID_WA/.test(m)) return 'Nomor WhatsApp tidak valid. Periksa kode negara dan jumlah digitnya.';
    if (/SAME_WA/.test(m)) return 'Nomor baru sama dengan nomor sekarang.';
    if (/NOT_FOUND/.test(m)) return 'Pelanggan tidak ditemukan. Datanya mungkin sudah berubah, muat ulang halaman lalu coba lagi.';
    if (/NOT_AUTHENTICATED/.test(m)) return 'Sesi habis. Masuk lagi, lalu coba kembali.';
    if (/Could not find the function|PGRST202|does not exist/i.test(m)) return 'Fungsi database belum terpasang. Jalankan customer_manage.sql di Supabase SQL Editor.';
    return m || 'Terjadi kesalahan. Coba lagi.';
  }
  async function refresh() {
    try { if (typeof loadTx === 'function') await loadTx(); }
    catch (e) { console.error(e); say('Data sudah berubah, tetapi gagal dimuat ulang. Muat ulang halaman.'); }
  }

  /* ---------- Dialog (memakai pola .modal.lx-dialog yang sudah ada) ---------- */
  function build() {
    if (dlg) return;
    dlg = document.createElement('div');
    dlg.className = 'modal lx-dialog lx-cust-dialog';
    dlg.setAttribute('role', 'dialog');
    dlg.setAttribute('aria-modal', 'true');
    dlg.setAttribute('aria-labelledby', 'custDlgTitle');
    dlg.innerHTML = '<div class="box">' +
      '<div class="ph"><h2 id="custDlgTitle"></h2><button type="button" class="btn light" data-lx-close aria-label="Tutup">✕</button></div>' +
      '<div class="lx-cust-body"></div>' +
      '<div class="actions"><button type="button" class="btn light" data-lx-close>Batal</button>' +
      '<button type="button" class="btn" id="custDlgGo"></button></div></div>';
    document.body.appendChild(dlg);

    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || (e.target.closest && e.target.closest('[data-lx-close]'))) return close();
      if (e.target.closest && e.target.closest('#custDlgGo') && !busy && st) (st.mode === 'rename' ? runRename : runDelete)();
    });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); return close(); }
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') {
        e.preventDefault();
        var go = $id('custDlgGo');
        if (!go.disabled && !busy && st) go.click();
        return;
      }
      if (e.key === 'Tab') {
        var f = [].filter.call(dlg.querySelectorAll('button,input'), function (x) { return !x.disabled && x.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
  function show(title, html, goText, danger) {
    build();
    $id('custDlgTitle').textContent = title;
    dlg.querySelector('.lx-cust-body').innerHTML = html;
    var go = $id('custDlgGo');
    go.textContent = goText; go.className = 'btn' + (danger ? ' lx-cust-danger' : ''); go.disabled = true;
    dlg.style.display = 'flex';
  }
  function close() {
    if (busy || !dlg) return;
    dlg.style.display = 'none'; st = null;
    if (opener && document.contains(opener)) opener.focus();
  }
  function card(c) {
    return '<div class="lx-cust-card"><div><b>' + esc(c.name) + '</b><div class="customer-meta">' + esc(c.wa) + '</div></div>' +
      '<div class="lx-cust-stats"><span><b>' + c.count + '</b> pembelian</span><span><b>' + rp(c.total) + '</b> total belanja</span></div></div>';
  }

  /* ---------- Ubah nomor ---------- */
  function openRename(wa) {
    var c = infoOf(wa); if (!c) return;
    st = { mode: 'rename', wa: wa, c: c, n: '', merge: false };
    show('Ubah nomor WhatsApp', card(c) +
      '<label for="custNewWa">Nomor baru</label>' +
      '<input id="custNewWa" type="tel" inputmode="numeric" autocomplete="off" placeholder="Contoh: 081234… atau 6281234…" aria-describedby="custHint">' +
      '<div id="custHint" class="lx-cust-hint" aria-live="polite"></div>' +
      '<div id="custMergeBox" class="lx-cust-warn is-merge" hidden><span id="custMergeText"></span>' +
      '<label class="lx-cust-check"><input type="checkbox" id="custMerge"> Ya, gabungkan jadi satu pelanggan</label></div>' +
      '<p class="lx-cust-note">Semua transaksi dan jumlah pembelian ikut pindah ke nomor baru. Nama pelanggan tidak berubah.</p>' +
      '<div id="custErr" class="error" role="alert"></div>', 'Simpan nomor', false);
    $id('custNewWa').addEventListener('input', checkRename);
    $id('custMerge').addEventListener('change', checkRename);
    $id('custNewWa').focus();
  }
  function checkRename() {
    if (!st || st.mode !== 'rename') return;
    var n = formatWA($id('custNewWa').value), hint = $id('custHint'), go = $id('custDlgGo');
    var ok = false, msg = '', cls = '', other = null;
    $id('custErr').textContent = '';
    if (n) {
      if (!/^62\d{8,13}$/.test(n)) { msg = 'Nomor belum valid. Periksa kode negara dan jumlah digitnya.'; cls = 'bad'; }
      else if (n === st.wa) { msg = 'Sama dengan nomor sekarang.'; cls = 'bad'; }
      else { ok = true; msg = 'Akan disimpan sebagai ' + n; cls = 'ok'; other = infoOf(n); }
    }
    hint.textContent = msg; hint.className = 'lx-cust-hint ' + cls;
    $id('custMergeBox').hidden = !other;
    if (other) $id('custMergeText').textContent = 'Nomor ini sudah dipakai ' + other.name + ' (' + other.count +
      ' pembelian). Digabung berarti riwayat keduanya disatukan dan memakai nama ' + st.c.name + '.';
    go.textContent = other ? 'Gabungkan & ubah nomor' : 'Simpan nomor';
    go.disabled = !ok || (!!other && !$id('custMerge').checked);
    st.n = n; st.merge = !!other;
  }
  async function runRename() {
    var go = $id('custDlgGo'), err = $id('custErr'), name = st.c.name, n = st.n;
    busy = true; go.disabled = true; go.textContent = 'Menyimpan…';
    try {
      var res = await db.rpc('lixi_change_customer_wa', { p_old_wa: st.wa, p_new_wa: n, p_merge: st.merge });
      if (res.error) { err.textContent = explain(res.error); return; }
      busy = false; close();
      say('Nomor ' + name + ' diubah ke ' + n + ' ✨');
      await refresh();
    } catch (e) {
      console.error(e); err.textContent = 'Koneksi bermasalah. Coba lagi.';
    } finally {
      busy = false; if (st) checkRename();
    }
  }

  /* ---------- Hapus pelanggan ---------- */
  function openDelete(wa) {
    var c = infoOf(wa); if (!c) return;
    var n = txCount(wa);
    st = { mode: 'delete', wa: wa, c: c };
    show('Hapus pelanggan', card(c) +
      '<div class="lx-cust-warn is-danger" role="note"><b>Tidak bisa dibatalkan.</b> ' +
      (n ? 'Profil pelanggan dan ' + n + ' transaksi yang masih tersimpan ikut dihapus. Omzet dan profit dari transaksi itu hilang dari Dashboard dan Laporan.'
         : 'Tidak ada transaksi tersimpan. Yang dihapus hanya profil dan catatan ' + c.count + ' pembelian.') + '</div>' +
      '<label class="lx-cust-check"><input type="checkbox" id="custBackup" checked> Unduh file backup dulu (disarankan)</label>' +
      '<label for="custConfirm">Ketik HAPUS untuk melanjutkan</label>' +
      '<input id="custConfirm" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="HAPUS">' +
      '<div id="custErr" class="error" role="alert"></div>', 'Hapus pelanggan', true);
    $id('custConfirm').addEventListener('input', function () {
      $id('custDlgGo').disabled = this.value.trim().toUpperCase() !== 'HAPUS';
    });
    $id('custConfirm').focus();
  }
  async function runDelete() {
    var go = $id('custDlgGo'), err = $id('custErr'), wantBackup = $id('custBackup').checked, name = st.c.name;
    function reset() { go.textContent = 'Hapus pelanggan'; go.disabled = false; }
    busy = true; go.disabled = true; err.textContent = '';
    try {
      if (wantBackup) {
        go.textContent = 'Membuat backup…';
        var ok = typeof window.lxBackupAll === 'function' && await window.lxBackupAll({ strict: true });
        if (!ok) { err.textContent = 'Backup gagal, jadi belum ada yang dihapus. Coba lagi.'; return reset(); }
      }
      go.textContent = 'Menghapus…';
      var res = await db.rpc('lixi_delete_customer', { p_wa: st.wa });
      if (res.error) { err.textContent = explain(res.error); return reset(); }
      busy = false; close();
      say(name + ' dihapus dari daftar pelanggan');
      await refresh();
    } catch (e) {
      console.error(e); err.textContent = 'Koneksi bermasalah. Coba lagi.'; reset();
    } finally {
      busy = false;
    }
  }

  /* ---------- Tombol di tiap baris pelanggan ---------- */
  function decorate() {
    var body = $id('customerTable'); if (!body) return;
    [].forEach.call(body.querySelectorAll('tr'), function (tr) {
      var td = tr.children;
      if (td.length < 6 || td[5].querySelector('[data-lx-cust]')) return;
      var wa = ((td[1].firstChild && td[1].firstChild.nodeType === 3) ? td[1].firstChild.nodeValue : '').trim();
      if (!/^\d+$/.test(wa)) return;
      var c = infoOf(wa), name = c ? c.name : 'pelanggan';
      var box = document.createElement('span');
      box.className = 'lx-cust-actions';
      box.innerHTML =
        '<button type="button" class="btn light flex-mini" data-lx-cust="wa" data-wa="' + wa + '" aria-label="Ubah nomor ' + esc(name) + '">' + ic('i-pencil') + ' Ubah nomor</button>' +
        '<button type="button" class="btn light flex-mini lx-cust-del" data-lx-cust="del" data-wa="' + wa + '" aria-label="Hapus ' + esc(name) + '">Hapus</button>';
      td[5].appendChild(box);
    });
  }
  var origRender = window.renderCustomers;
  if (typeof origRender === 'function') {
    window.renderCustomers = function () {
      var r = origRender.apply(this, arguments);
      try { decorate(); } catch (e) { console.warn('Tombol pelanggan gagal dipasang:', e); }
      return r;
    };
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-lx-cust]');
    if (!b) return;
    if (typeof customerProfilesLoaded !== 'undefined' && !customerProfilesLoaded) {
      return say('Fitur ini butuh profil pelanggan permanen. Jalankan SQL migrasi profil dulu.');
    }
    opener = b;
    if (b.dataset.lxCust === 'wa') openRename(b.dataset.wa); else openDelete(b.dataset.wa);
  });
})();
