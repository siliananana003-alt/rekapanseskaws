/* LiXi polish — hanya lapisan tampilan.
 * Tidak membaca/menulis data, tidak memanggil Supabase. Fungsi asli (doLogin, loadTx)
 * hanya dibungkus: dipanggil apa adanya, hasilnya dikembalikan apa adanya. */
(function () {
  'use strict';
  var byId = function (id) { return document.getElementById(id); };

  /* ---------- 1) Login: status "Masuk…" + cegah klik ganda ---------- */
  var origLogin = window.doLogin;
  if (typeof origLogin === 'function') {
    window.doLogin = async function () {
      var btn = document.querySelector('#authScreen .btn');
      if (btn && btn.disabled) return;
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Masuk…'; }
      try { return await origLogin.apply(this, arguments); }
      finally { if (btn) { btn.disabled = false; btn.textContent = label || 'Masuk'; } }
    };
  }

  /* ---------- 2) Login: pesan error ramah + goyang + dibacakan pembaca layar ---------- */
  var err = byId('loginError'), panel = document.querySelector('#authScreen .panel');
  if (err) {
    err.setAttribute('role', 'alert');
    var shaken = '';
    new MutationObserver(function () {
      var t = (err.textContent || '').trim(), friendly = null;
      if (!t) { shaken = ''; return; }
      if (/^Memeriksa/i.test(t)) { shaken = ''; return; }
      if (/Invalid login credentials/i.test(t)) friendly = 'Email atau password belum cocok. Coba cek lagi ya 🌷';
      else if (/Email not confirmed/i.test(t)) friendly = 'Email belum dikonfirmasi. Cek inbox kamu dulu ya 💌';
      else if (/rate limit|too many/i.test(t)) friendly = 'Terlalu sering mencoba. Tunggu sebentar, lalu coba lagi 🫧';
      if (friendly && t !== friendly) { err.textContent = friendly; return; }
      if (t === shaken || !panel) return;
      shaken = t;
      panel.classList.remove('lx-shake'); void panel.offsetWidth; panel.classList.add('lx-shake');
    }).observe(err, { childList: true, characterData: true, subtree: true });
    if (panel) panel.addEventListener('animationend', function (e) {
      if (e.animationName === 'lx-shake') panel.classList.remove('lx-shake');
    });
  }

  /* ---------- 3) Login: tombol lihat/sembunyikan password ---------- */
  var pass = byId('loginPass');
  if (pass && pass.parentNode) {
    var wrap = document.createElement('div');
    wrap.className = 'lx-pass';
    pass.parentNode.insertBefore(wrap, pass);
    wrap.appendChild(pass);
    var eye = document.createElement('button');
    eye.type = 'button'; eye.className = 'lx-eye';
    var draw = function (shown) {
      eye.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#' + (shown ? 'i-eyeoff' : 'i-eye') + '"/></svg>';
      eye.setAttribute('aria-label', shown ? 'Sembunyikan password' : 'Lihat password');
      eye.setAttribute('aria-pressed', shown ? 'true' : 'false');
    };
    draw(false);
    eye.addEventListener('click', function () {
      var show = pass.type === 'password';
      pass.type = show ? 'text' : 'password';
      draw(show);
    });
    wrap.appendChild(eye);
  }

  /* ---------- 4) Pemuatan pertama: kilau pada kartu sampai data tiba ---------- */
  var origLoadTx = window.loadTx, booted = false;
  if (typeof origLoadTx === 'function') {
    window.loadTx = async function () {
      if (booted) return origLoadTx.apply(this, arguments);
      booted = true;
      var root = document.documentElement;
      root.classList.add('lx-boot');
      try { return await origLoadTx.apply(this, arguments); }
      finally { root.classList.remove('lx-boot'); }
    };
  }

  /* ---------- 5) Tema baru: Lemon Soda & Mocha Latte ----------
   * Hanya menambah pilihan ke menu tema yang sudah ada; warnanya ada di style.css. */
  (function () {
    var pop = byId('themePop');
    if (!pop) return;
    var NEW = [['lemon', 'Lemon Soda', '#4cc0ac', '#ffeea0'], ['mocha', 'Mocha Latte', '#c1917a', '#f3dccd']];

    var face = '<g stroke="none"><circle cx="CX1" cy="CY" r="1.5" fill="#6b4a5a"/><circle cx="CX2" cy="CY" r="1.5" fill="#6b4a5a"/>' +
      '<ellipse cx="CH1" cy="CHY" rx="2" ry="1.2" fill="#ff9fbd" opacity=".6"/><ellipse cx="CH2" cy="CHY" rx="2" ry="1.2" fill="#ff9fbd" opacity=".6"/></g>';
    var lemonFace = face.replace('CX1', '12').replace('CX2', '20').replace(/CY/g, '16').replace('CH1', '9.3').replace('CH2', '22.7').replace(/CHY/g, '19');
    var sprite =
      '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' +
      '<symbol id="th-lemon" viewBox="0 0 32 32"><g stroke="#9a7384" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round">' +
        '<path d="M2.5 16Q4.500 8 16 7Q27.500 8 29.500 16Q27.500 24 16 25Q4.500 24 2.500 16Z" fill="#fff0a8"/>' +
        '<path d="M16 7c0-3 2.500-5 6.500-5-.3 3.600-2.700 5.400-6.500 5Z" fill="#c9e8bf"/>' + lemonFace +
        '<path d="M14.600 18.200q1.400 1.700 2.800 0" fill="none"/></g></symbol>' +
      '<symbol id="th-mocha" viewBox="0 0 32 32"><g stroke="#9a7384" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round">' +
        '<circle cx="7.500" cy="8" r="4.300" fill="#e6c9b0"/><circle cx="24.500" cy="8" r="4.300" fill="#e6c9b0"/>' +
        '<circle cx="7.500" cy="8" r="1.900" fill="#f3dccd" stroke="none"/><circle cx="24.500" cy="8" r="1.900" fill="#f3dccd" stroke="none"/>' +
        '<circle cx="16" cy="17.500" r="11.500" fill="#ecd2bb"/><ellipse cx="16" cy="21.500" rx="5.200" ry="3.700" fill="#fff3e8"/>' +
        '<g stroke="none"><circle cx="11.300" cy="15.500" r="1.500" fill="#6b4a5a"/><circle cx="20.700" cy="15.500" r="1.500" fill="#6b4a5a"/>' +
        '<ellipse cx="8.300" cy="19.300" rx="2" ry="1.200" fill="#ff9fbd" opacity=".6"/><ellipse cx="23.700" cy="19.300" rx="2" ry="1.200" fill="#ff9fbd" opacity=".6"/>' +
        '<ellipse cx="16" cy="20" rx="1.700" ry="1.200" fill="#6b4a5a"/></g>' +
        '<path d="M14.400 22.600q1.600 1.500 3.200 0" fill="none"/></g></symbol></svg>';
    var holder = document.createElement('div');
    holder.innerHTML = sprite;
    document.body.appendChild(holder.firstChild);

    // Daftarkan ikon & urutan tema ke daftar milik app (objek/array yang sudah ada, hanya ditambah isinya)
    try {
      NEW.forEach(function (n) {
        if (typeof themeIcons === 'object' && themeIcons) themeIcons[n[0]] = '<svg class="ic" aria-hidden="true"><use href="#th-' + n[0] + '"/></svg>';
        if (typeof themeList !== 'undefined' && Array.isArray(themeList) && themeList.indexOf(n[0]) < 0) themeList.push(n[0]);
      });
    } catch (e) { /* abaikan */ }

    // Swatch baru dipasang sebelum "Malam" supaya tema gelap tetap paling akhir
    var darkBtn = pop.querySelector('[data-t="dark"]');
    NEW.forEach(function (n) {
      if (pop.querySelector('[data-t="' + n[0] + '"]')) return;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'theme-sw'; b.setAttribute('role', 'menuitem');
      b.dataset.t = n[0]; b.title = n[1]; b.setAttribute('aria-label', n[1]);
      b.style.background = 'linear-gradient(135deg,' + n[2] + ' 50%,' + n[3] + ' 50%)';
      pop.insertBefore(b, darkBtn || null);
    });
    try { if (typeof markTheme === 'function') markTheme(localStorage.getItem('theme') || 'light'); } catch (e) { /* abaikan */ }
  })();

  /* ---------- 6) Kartu dashboard bisa diketuk ----------
   * Hanya memanggil page() milik app untuk pindah halaman; tidak ada data yang dibaca/ditulis. */
  (function () {
    var GO = {
      dOmzetToday: ['transaksi', 'Lihat transaksi hari ini', 'today'], dProfitToday: ['transaksi', 'Lihat transaksi hari ini', 'today'], dCount: ['transaksi', 'Lihat transaksi'],
      dOmzet: ['laporan', 'Lihat laporan'], dProfit: ['laporan', 'Lihat laporan'], dProfitWeek: ['laporan', 'Lihat laporan'],
      dCustTotal: ['pelanggan', 'Lihat pelanggan'], dRepeatCust: ['pelanggan', 'Lihat pelanggan']
    };
    function go(target, filter) {
      if (typeof page !== 'function') return;
      if (filter === 'today' && typeof window.lxShowToday === 'function') { window.lxShowToday(); return; }
      page(target);
      window.scrollTo(0, 0);
    }
    Object.keys(GO).forEach(function (id) {
      var v = byId(id), card = v && v.closest('.kawaii-card');
      if (!card || card.dataset.go) return;
      card.dataset.go = GO[id][0];
      if (GO[id][2]) card.dataset.filter = GO[id][2];
      card.setAttribute('role', 'button');
      card.tabIndex = 0;
      card.title = GO[id][1];
      card.addEventListener('click', function () { go(card.dataset.go, card.dataset.filter); });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(card.dataset.go, card.dataset.filter); }
      });
    });
  })();

  /* ---------- 7) Pil Bulan & Jam: ikon lucu yang warnanya ikut tema ----------
   * Ikon digambar dengan variabel CSS tema (--p, --p2, --ink), jadi otomatis serasi di semua tema. */
  (function () {
    var holder = document.createElement('div');
    holder.innerHTML =
      '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' +
      '<symbol id="i-cal-t" viewBox="0 0 32 32"><g style="stroke:var(--ic-line)" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round">' +
        '<rect x="4" y="6" width="24" height="22" rx="6" style="fill:var(--ic-body)"/>' +
        '<path d="M4 12.500V12a6 6 0 0 1 6-6h12a6 6 0 0 1 6 6v.5Z" style="fill:var(--p)"/>' +
        '<path d="M10 3v5M22 3v5" fill="none" stroke-width="1.800"/>' +
        '<g stroke="none"><circle cx="12" cy="19" r="1.500" style="fill:var(--ink)"/><circle cx="20" cy="19" r="1.500" style="fill:var(--ink)"/>' +
        '<ellipse cx="9.300" cy="21.800" rx="2" ry="1.200" fill="#ff9fbd" opacity=".65"/><ellipse cx="22.700" cy="21.800" rx="2" ry="1.200" fill="#ff9fbd" opacity=".65"/></g>' +
        '<path d="M14.600 21.200q1.400 1.700 2.800 0" fill="none"/></g></symbol>' +
      '<symbol id="i-clock-t" viewBox="0 0 32 32"><g style="stroke:var(--ic-line)" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round">' +
        '<circle cx="7.500" cy="8" r="3.700" style="fill:var(--p)"/><circle cx="24.500" cy="8" r="3.700" style="fill:var(--p)"/>' +
        '<circle cx="16" cy="17.500" r="11" style="fill:var(--ic-body)"/>' +
        '<path d="M16 11.500v6l4 2.300" fill="none" stroke-width="1.700"/>' +
        '<g stroke="none"><circle cx="16" cy="17.500" r="1.100" style="fill:var(--ic-line)"/>' +
        '<ellipse cx="9.800" cy="21.600" rx="2" ry="1.200" fill="#ff9fbd" opacity=".65"/><ellipse cx="22.200" cy="21.600" rx="2" ry="1.200" fill="#ff9fbd" opacity=".65"/></g>' +
        '<path d="M14.700 23.600q1.300 1.400 2.600 0" fill="none"/></g></symbol></svg>';
    document.body.appendChild(holder.firstChild);

    var swap = function (sel, id) {
      var u = document.querySelector(sel + ' .topbar-icon use');
      if (u) u.setAttribute('href', '#' + id);
    };
    swap('.month-control', 'i-cal-t');
    swap('.clock-control', 'i-clock-t');
  })();

  /* ---------- 8) Kartu "Hari Ini" -> Transaksi hari ini saja ----------
   * Murni penyaringan tampilan (data yang sudah dimuat). Tidak ada query/tulis ke database. */
  (function () {
    var todayOn = false, keep = false;
    var panel = document.querySelector('#transaksi .panel'), wrapEl = panel && panel.querySelector('.tablewrap');
    var chip = document.createElement('div');
    chip.id = 'lxTodayChip'; chip.className = 'lx-today-chip'; chip.hidden = true;
    chip.innerHTML = '<span class="lx-today-txt"></span><button type="button" class="lx-today-x">✕ Lihat semua</button>';
    if (panel && wrapEl) panel.insertBefore(chip, wrapEl);
    var txt = chip.querySelector('.lx-today-txt');

    function label(n) {
      var d = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      txt.textContent = '📅 Hari ini · ' + d + ' · ' + (n ? n + ' transaksi' : 'belum ada transaksi');
    }
    function setToday(on) { todayOn = on; chip.hidden = !on; }

    var origRender = window.renderTx;
    if (typeof origRender === 'function') {
      window.renderTx = function () {
        if (!todayOn || typeof txs === 'undefined' || typeof today !== 'function') return origRender.apply(this, arguments);
        var saved = txs, d = today();
        txs = saved.filter(function (t) { return t.transaction_date === d; });
        label(txs.length);
        try { return origRender.apply(this, arguments); }
        finally { txs = saved; }
      };
    }

    // Pindah halaman lewat menu = kembali melihat semua transaksi
    var origPage = window.page;
    if (typeof origPage === 'function') {
      window.page = function () {
        if (!keep && todayOn) setToday(false);
        return origPage.apply(this, arguments);
      };
    }

    chip.querySelector('.lx-today-x').addEventListener('click', function () {
      setToday(false);
      if (typeof resetTxPageAndRender === 'function') resetTxPageAndRender();
    });

    window.lxShowToday = function () {
      if (typeof page !== 'function' || typeof today !== 'function') return;
      // "Hari ini" selalu ada di bulan berjalan; samakan pemilih bulan agar Edit/Hapus tetap menemukan barisnya
      var gm = byId('globalMonth'), cur = today().slice(0, 7);
      if (gm && gm.value !== cur && typeof changeMonth === 'function') { gm.value = cur; changeMonth(); }
      var q = byId('search'), ft = byId('filterType');
      if (q) q.value = ''; if (ft) ft.value = 'all';
      if (typeof txPage !== 'undefined') txPage = 1;
      keep = true;
      try { setToday(true); page('transaksi'); }
      finally { keep = false; }
      window.scrollTo(0, 0);
    };
  })();

  /* ---------- 9) Hiasan kartu: pita label diganti washi tape + stiker ---------- */
  (function () {
    document.querySelectorAll('.kawaii-card .k-mini').forEach(function (el) {
      el.dataset.k = (el.textContent || '').trim().toLowerCase();
    });
  })();

  /* ---------- 11) Warna header browser (theme-color) ikut tema ----------
   * Sebelumnya tetap pink. Sekarang diperbarui setiap data-theme berubah.
   * Berlaku di browser HP (Chrome Android, Safari iOS 15+) dan aplikasi terpasang (PWA). */
  (function () {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    var root = document.documentElement;
    var isHex = function (v) { return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v || ''); };
    function apply() {
      var theme = root.getAttribute('data-theme') || 'light';
      var cs = getComputedStyle(root), color;
      if (theme === 'light') color = '#ffd9e8';                                  // tetap seperti semula
      else if (theme === 'dark') color = (cs.getPropertyValue('--bg') || '').trim();  // gelap menyatu dengan latar
      else color = (cs.getPropertyValue('--p3') || '').trim();                   // pastel kuat dari tema
      meta.setAttribute('content', isHex(color) ? color : '#ffd9e8');
    }
    new MutationObserver(apply).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    apply();
  })();
  /* ---------- 12) Pilihan Paket & Durasi: daftar yang mudah dipilih ----------
   * <select id="fProduct"> asli tetap jadi sumber kebenaran (hanya disembunyikan secara visual).
   * Memilih item = mengisi kolom produk + select lalu memicu event yang sudah dipakai app
   * (input pada #fProductName -> updateVariantDropdown, change pada #fProduct -> syncProduct).
   * Tidak ada query/tulis ke database. */
  (function () {
    var sel = byId('fProduct'), nameIn = byId('fProductName');
    if (!sel || !sel.parentNode || !nameIn) return;
    var box = sel.parentNode;
    box.classList.add('lx-pk');
    sel.classList.add('lx-sr');
    sel.tabIndex = -1;
    sel.setAttribute('aria-hidden', 'true');

    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'lx-pk-btn is-empty';
    btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Pilihan paket dan durasi');
    btn.innerHTML = '<span class="lx-pk-main"></span><span class="lx-pk-caret" aria-hidden="true">▾</span>';
    var list = document.createElement('div');
    list.className = 'lx-pk-list'; list.setAttribute('role', 'listbox'); list.hidden = true;
    box.appendChild(btn); box.appendChild(list);
    var main = btn.querySelector('.lx-pk-main');

    var esc2 = function (v) {
      return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
    };
    var money = function (n) {
      try { return typeof rupiah === 'function' ? rupiah(n) : 'Rp' + Number(n || 0).toLocaleString('id-ID'); } catch (e) { return ''; }
    };
    var prods = function () {
      try { return (typeof products !== 'undefined' && Array.isArray(products)) ? products : []; } catch (e) { return []; }
    };
    var byDur = function (a, b) {
      return (+a.duration_days || 0) - (+b.duration_days || 0) ||
        String(a.package || '').localeCompare(String(b.package || ''), 'id', { sensitivity: 'base', numeric: true });
    };
    var findById = function (id) { return prods().filter(function (p) { return String(p.id) === String(id); })[0]; };

    function label() {
      var p = sel.value ? findById(sel.value) : null;
      if (p) {
        main.innerHTML = '<b>' + esc2(p.package) + '</b><span> · ' + esc2(p.duration_days) + ' hari · ' + esc2(money(p.price)) + '</span>';
        btn.classList.remove('is-empty');
      } else {
        main.textContent = 'Pilih paket & durasi';
        btn.classList.add('is-empty');
      }
    }
    function item(p, on) {
      return '<button type="button" class="lx-pk-item' + (on ? ' on' : '') + '" role="option" aria-selected="' + (on ? 'true' : 'false') + '" data-id="' + esc2(p.id) + '">' +
        '<span class="lx-pk-name"><b>' + esc2(p.package) + '</b><small>' + esc2(p.duration_days) + ' hari</small></span>' +
        '<span class="lx-pk-price">' + esc2(money(p.price)) + '</span></button>';
    }
    function render() {
      var all = prods(), name = (nameIn.value || '').trim(), cur = sel.value, html = '';
      var mine = name ? all.filter(function (p) { return p.name === name; }).sort(byDur) : [];
      if (mine.length) {
        html = mine.map(function (p) { return item(p, String(p.id) === String(cur)); }).join('');
      } else if (all.length) {
        // Belum ada produk yang valid: tampilkan semua paket per produk, pilih sekali ketuk
        var groups = {}, order = [];
        all.forEach(function (p) { if (!groups[p.name]) { groups[p.name] = []; order.push(p.name); } groups[p.name].push(p); });
        order.sort(function (a, b) { return String(a).localeCompare(String(b), 'id', { sensitivity: 'base' }); });
        html = '<div class="lx-pk-hint">Pilih produk & paketnya sekaligus 👇</div>' + order.map(function (n) {
          return '<div class="lx-pk-group">' + esc2(n) + '</div>' + groups[n].sort(byDur).map(function (p) { return item(p, false); }).join('');
        }).join('');
      } else {
        html = '<div class="lx-pk-hint">Belum ada produk. Tambahkan lewat “+ Produk Baru” ✨</div>';
      }
      list.innerHTML = html;
    }
    function open() {
      render(); list.hidden = false;
      btn.setAttribute('aria-expanded', 'true'); box.classList.add('open');
      var on = list.querySelector('.on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest' });
    }
    function close() {
      list.hidden = true; btn.setAttribute('aria-expanded', 'false'); box.classList.remove('open');
    }

    btn.addEventListener('click', function () { if (list.hidden) open(); else close(); });
    document.addEventListener('click', function (e) { if (!list.hidden && !box.contains(e.target)) close(); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !list.hidden) { e.stopPropagation(); close(); btn.focus(); }
    });
    list.addEventListener('click', function (e) {
      var b = e.target.closest('.lx-pk-item');
      if (!b) return;
      var p = findById(b.dataset.id);
      if (!p) return;
      if ((nameIn.value || '').trim() !== p.name) {
        nameIn.value = p.name;
        nameIn.dispatchEvent(new Event('input', { bubbles: true }));   // -> updateVariantDropdown(null)
      }
      sel.value = String(p.id);
      sel.dispatchEvent(new Event('change', { bubbles: true }));       // -> syncProduct()
      close(); label();
    });

    // Label ikut berubah saat app membangun ulang pilihan paket (ganti produk / edit transaksi)
    if (window.MutationObserver) {
      new MutationObserver(function () { label(); if (!list.hidden) render(); }).observe(sel, { childList: true, subtree: true });
    }
    var form = byId('txForm');
    if (form) ['input', 'change'].forEach(function (ev) { form.addEventListener(ev, function () { setTimeout(label, 0); }); });
    var origOpen = window.openTx;
    if (typeof origOpen === 'function') {
      window.openTx = function () {
        close();
        var r = origOpen.apply(this, arguments);
        setTimeout(label, 60);
        return r;
      };
    }
    label();
  })();
  /* ---------- 13) Pemilih bulan yang manis ----------
   * Menggantikan kalender bawaan browser (yang tidak bisa didandani). Memilih bulan = mengisi
   * #globalMonth lalu memicu event "change" yang sudah dipakai app (-> changeMonth()).
   * Titik kecil menandai bulan yang punya transaksi (dibaca dari data yang sudah dimuat). */
  (function () {
    var input = byId('globalMonth');
    var label = input && input.closest('.month-control');
    if (!input || !label || !label.parentNode) return;
    var host = label.parentNode;
    host.classList.add('lx-mp-host');

    var SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    var FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    var EMO = ['❄️', '💝', '🌷', '🌦️', '🌼', '☀️', '🍉', '🌈', '🍂', '🎃', '🍄', '🎄'];

    // readonly: tidak memunculkan kalender bawaan / keyboard; nilai tetap bisa diisi lewat kode
    input.readOnly = true;
    input.setAttribute('inputmode', 'none');
    input.setAttribute('aria-haspopup', 'dialog');
    input.setAttribute('aria-expanded', 'false');

    var pop = document.createElement('div');
    pop.className = 'lx-mp'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Pilih bulan'); pop.hidden = true;
    host.appendChild(pop);

    var viewYear = new Date().getFullYear();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var curKey = function () { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1); };
    var selKey = function () { return /^\d{4}-\d{2}$/.test(input.value) ? input.value : curKey(); };
    function dataMonths() {
      var set = {};
      try {
        if (typeof allTxs !== 'undefined' && Array.isArray(allTxs)) allTxs.forEach(function (t) {
          var d = t && t.transaction_date;
          if (typeof d === 'string' && d.length >= 7) set[d.slice(0, 7)] = 1;
        });
      } catch (e) { /* abaikan */ }
      return set;
    }

    function render() {
      var sel = selKey(), now = curKey(), has = dataMonths(), h = '';
      h += '<div class="lx-mp-head"><button type="button" class="lx-mp-nav" data-y="-1" aria-label="Tahun sebelumnya">‹</button>' +
           '<div class="lx-mp-year" aria-live="polite">' + viewYear + '</div>' +
           '<button type="button" class="lx-mp-nav" data-y="1" aria-label="Tahun berikutnya">›</button></div><div class="lx-mp-grid" role="group" aria-label="Bulan">';
      for (var i = 0; i < 12; i++) {
        var key = viewYear + '-' + pad(i + 1);
        h += '<button type="button" class="lx-mp-m' + (key === sel ? ' on' : '') + (key === now ? ' now' : '') + (has[key] ? ' has' : '') +
             '" data-k="' + key + '" aria-pressed="' + (key === sel) + '" title="' + FULL[i] + ' ' + viewYear + '">' +
             '<span class="lx-mp-e" aria-hidden="true">' + EMO[i] + '</span><span>' + SHORT[i] + '</span></button>';
      }
      h += '</div><div class="lx-mp-foot"><button type="button" class="lx-mp-today">✨ Bulan ini</button>' +
           '<span class="lx-mp-leg"><i></i> ada transaksi</span></div>';
      pop.innerHTML = h;
    }
    function open() {
      viewYear = +selKey().slice(0, 4);
      render(); pop.hidden = false;
      label.classList.add('open'); input.setAttribute('aria-expanded', 'true');
      var on = pop.querySelector('.lx-mp-m.on') || pop.querySelector('.lx-mp-m');
      if (on) on.focus({ preventScroll: true });
    }
    function close(back) {
      pop.hidden = true; label.classList.remove('open'); input.setAttribute('aria-expanded', 'false');
      if (back) input.focus({ preventScroll: true });
    }
    function choose(key) {
      input.value = key;
      input.dispatchEvent(new Event('change', { bubbles: true }));   // -> changeMonth() milik app
      close(true);
    }

    label.addEventListener('click', function (e) { e.preventDefault(); if (pop.hidden) open(); else close(false); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); if (pop.hidden) open(); }
    });
    pop.addEventListener('click', function (e) {
      e.lxInside = true;   // render() mengganti isi panel; tandai agar klik ini tidak dianggap "di luar"
      var nav = e.target.closest('.lx-mp-nav');
      if (nav) {
        var dir = nav.dataset.y;
        viewYear += +dir; render();
        var again = pop.querySelector('.lx-mp-nav[data-y="' + dir + '"]');
        if (again) again.focus({ preventScroll: true });
        return;
      }
      var m = e.target.closest('.lx-mp-m');
      if (m) { choose(m.dataset.k); return; }
      if (e.target.closest('.lx-mp-today')) choose(curKey());
    });
    pop.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(true); return; }
      var btns = [].slice.call(pop.querySelectorAll('.lx-mp-m')), i = btns.indexOf(document.activeElement);
      var step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }[e.key];
      if (i >= 0 && step) { e.preventDefault(); var j = i + step; if (j >= 0 && j < 12) btns[j].focus(); }
    });
    document.addEventListener('click', function (e) {
      if (!e.lxInside && !pop.hidden && !pop.contains(e.target) && !label.contains(e.target)) close(false);
    });
  })();
  /* ---------- 14) Kalender manis (tanggal) + daftar durasi manis ----------
   * Keduanya melayang (position: fixed) di atas modal agar tidak terpotong.
   * Memilih = mengisi kolom yang sudah ada lalu memicu event "input"/"change" yang sudah dipakai app
   * (mis. #fStart onchange -> syncProduct/updateExpire, #fDuration oninput -> updateExpire).
   * Tidak ada query/tulis ke database. */
  (function () {
    var coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var ymd = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
    var MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    var EMO = ['❄️', '💝', '🌷', '🌦️', '🌼', '☀️', '🍉', '🌈', '🍂', '🎃', '🍄', '🎄'];
    var WD = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    var current = null;   // popover yang sedang terbuka: {kind, input, wrap, pop}

    /* ----- posisi & buka/tutup ----- */
    function place(pop, anchor) {
      var r = anchor.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
      var w = pop.offsetWidth, h = pop.offsetHeight, gap = 8;
      var left = Math.min(Math.max(8, r.left), Math.max(8, vw - w - 8));
      var top = r.bottom + gap;
      if (top + h > vh - 8) { var up = r.top - gap - h; top = up >= 8 ? up : Math.max(8, vh - h - 8); }
      pop.style.left = left + 'px'; pop.style.top = top + 'px';
    }
    function onMove() { if (current) place(current.pop, current.wrap); }
    function closeAll() {
      if (!current) return;
      current.pop.hidden = true;
      current.input.setAttribute('aria-expanded', 'false');
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
      current = null;
    }
    function show(kind, input, wrap, pop) {
      closeAll();
      pop.hidden = false;
      current = { kind: kind, input: input, wrap: wrap, pop: pop };
      input.setAttribute('aria-expanded', 'true');
      window.addEventListener('scroll', onMove, true);
      window.addEventListener('resize', onMove);
    }
    document.addEventListener('click', function (e) {
      if (!current || e.lxFp) return;
      if (current.pop.contains(e.target) || current.wrap.contains(e.target)) return;
      closeAll();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && current) {
        e.stopPropagation();
        var inp = current.input; closeAll();
        if (!coarse) inp.focus({ preventScroll: true });
      }
    }, true);

    // Bungkus kolom + ikon manis di kanan (ikon asli browser disembunyikan lewat CSS)
    function wrapInput(input, iconId) {
      var wrap = document.createElement('div');
      wrap.className = 'lx-dwrap';
      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(input);
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'lx-dbtn';
      btn.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#' + iconId + '"/></svg>';
      wrap.appendChild(btn);
      return { wrap: wrap, btn: btn };
    }
    var fire = function (inp) {
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    };

    /* ===== Kalender ===== */
    var cal = document.createElement('div');
    cal.className = 'lx-fp lx-cal'; cal.hidden = true;
    cal.setAttribute('role', 'dialog'); cal.setAttribute('aria-label', 'Pilih tanggal');
    document.body.appendChild(cal);
    var view = { y: 0, m: 0 };
    var parse = function (v) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? { y: +m[1], m: +m[2] - 1 } : null; };

    function renderCal() {
      var sel = current.input.value, todayKey = ymd(new Date()), h = '';
      var off = (new Date(view.y, view.m, 1).getDay() + 6) % 7;     // Senin = kolom pertama
      h += '<div class="lx-cal-head">' +
           '<button type="button" class="lx-cal-nav" data-n="-12" aria-label="Tahun sebelumnya">«</button>' +
           '<button type="button" class="lx-cal-nav" data-n="-1" aria-label="Bulan sebelumnya">‹</button>' +
           '<div class="lx-cal-title" aria-live="polite"><span aria-hidden="true">' + EMO[view.m] + '</span> ' + MONTHS[view.m] + ' ' + view.y + '</div>' +
           '<button type="button" class="lx-cal-nav" data-n="1" aria-label="Bulan berikutnya">›</button>' +
           '<button type="button" class="lx-cal-nav" data-n="12" aria-label="Tahun berikutnya">»</button></div>';
      h += '<div class="lx-cal-wd">' + WD.map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div><div class="lx-cal-grid" role="grid">';
      for (var i = 0; i < 42; i++) {
        var d = new Date(view.y, view.m, 1 - off + i), k = ymd(d);
        h += '<button type="button" class="lx-cal-d' + (d.getMonth() !== view.m ? ' out' : '') + (d.getDay() === 0 ? ' sun' : '') +
             (k === todayKey ? ' today' : '') + (k === sel ? ' on' : '') + '" data-k="' + k + '" aria-pressed="' + (k === sel) +
             '" aria-label="' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + '">' + d.getDate() + '</button>';
      }
      h += '</div><div class="lx-cal-foot"><button type="button" class="lx-cal-today">✨ Hari ini</button><button type="button" class="lx-cal-close">Tutup</button></div>';
      cal.innerHTML = h;
    }
    function pickDate(k) {
      var inp = current.input; closeAll();
      inp.value = k; fire(inp);
      if (!coarse) inp.focus({ preventScroll: true });
    }
    cal.addEventListener('click', function (e) {
      e.lxFp = true;   // isi panel digambar ulang; jangan dianggap klik "di luar"
      if (!current || current.kind !== 'date') return;
      var nav = e.target.closest('.lx-cal-nav');
      if (nav) {
        var t = new Date(view.y, view.m + (+nav.dataset.n), 1);
        view.y = t.getFullYear(); view.m = t.getMonth();
        renderCal(); place(cal, current.wrap);
        var again = cal.querySelector('.lx-cal-nav[data-n="' + nav.dataset.n + '"]');
        if (again) again.focus({ preventScroll: true });
        return;
      }
      var d = e.target.closest('.lx-cal-d');
      if (d) { pickDate(d.dataset.k); return; }
      if (e.target.closest('.lx-cal-today')) pickDate(ymd(new Date()));
      else if (e.target.closest('.lx-cal-close')) closeAll();
    });
    cal.addEventListener('keydown', function (e) {
      var days = [].slice.call(cal.querySelectorAll('.lx-cal-d')), i = days.indexOf(document.activeElement);
      var step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (i >= 0 && step) { e.preventDefault(); var j = i + step; if (j >= 0 && j < days.length) days[j].focus(); }
    });

    ['fDate', 'fStart', 'fExpire'].forEach(function (id) {
      var input = byId(id);
      if (!input || !input.parentNode || input.parentNode.classList.contains('lx-dwrap')) return;
      var w = wrapInput(input, 'i-cal-t');
      w.btn.setAttribute('aria-label', 'Buka kalender');
      input.setAttribute('aria-haspopup', 'dialog'); input.setAttribute('aria-expanded', 'false');
      if (coarse) input.readOnly = true;   // HP: cegah kalender bawaan browser (nilai tetap bisa diisi lewat kode)
      function open(focusDay) {
        var p = parse(input.value) || parse(ymd(new Date()));
        view.y = p.y; view.m = p.m;
        show('date', input, w.wrap, cal);
        renderCal(); place(cal, w.wrap);
        if (focusDay) { var on = cal.querySelector('.lx-cal-d.on') || cal.querySelector('.lx-cal-d.today'); if (on) on.focus({ preventScroll: true }); }
      }
      input.addEventListener('click', function () { if (!(current && current.input === input)) open(false); });
      w.btn.addEventListener('click', function () { if (current && current.input === input) closeAll(); else open(!coarse); });
    });

    /* ===== Daftar durasi ===== */
    // Kolom durasi dihitung dalam hari: 1 bulan = 30 hari, 1 tahun = 365 hari
    var OPTIONS = [
      { d: 7,   t: '7 hari',   s: '1 minggu',  e: '🌱' },
      { d: 14,  t: '14 hari',  s: '2 minggu',  e: '🌿' },
      { d: 30,  t: '1 bulan',  s: '30 hari',   e: '🌸' },
      { d: 365, t: '1 tahun',  s: '365 hari',  e: '🎂' }
    ];
    var dl = document.createElement('div');
    dl.className = 'lx-fp lx-dl'; dl.hidden = true; dl.setAttribute('role', 'listbox'); dl.setAttribute('aria-label', 'Pilih durasi');
    document.body.appendChild(dl);

    function renderDl() {
      var v = String(current.input.value).trim(), h = '';
      OPTIONS.forEach(function (o) {
        var on = String(o.d) === v;
        h += '<button type="button" class="lx-dl-item' + (on ? ' on' : '') + '" role="option" aria-selected="' + on + '" data-d="' + o.d + '">' +
             '<span class="lx-dl-name"><b>' + o.t + '</b><small>' + o.s + '</small></span>' +
             '<span class="lx-dl-emo" aria-hidden="true">' + o.e + '</span></button>';
      });
      h += '<button type="button" class="lx-dl-item lx-dl-type" data-d="type"><span class="lx-dl-name"><b>Ketik durasi sendiri</b><small>angka lain dalam hari, misalnya 25</small></span>' +
           '<span class="lx-dl-emo" aria-hidden="true">✏️</span></button>';
      dl.innerHTML = h;
    }
    dl.addEventListener('click', function (e) {
      e.lxFp = true;
      if (!current || current.kind !== 'dur') return;
      var b = e.target.closest('.lx-dl-item');
      if (!b) return;
      var inp = current.input; closeAll();
      if (b.dataset.d === 'type') {
        inp.setAttribute('inputmode', 'numeric');
        inp.blur(); inp.focus();
        try { inp.select(); } catch (err) { /* abaikan */ }
        return;
      }
      inp.value = b.dataset.d; fire(inp);   // fDuration -> updateExpire() milik app
    });
    dl.addEventListener('keydown', function (e) {
      var items = [].slice.call(dl.querySelectorAll('.lx-dl-item')), i = items.indexOf(document.activeElement);
      var step = { ArrowUp: -1, ArrowDown: 1 }[e.key];
      if (i >= 0 && step) { e.preventDefault(); var j = i + step; if (j >= 0 && j < items.length) items[j].focus(); }
    });

    // Durasi di form transaksi (#fDuration) sengaja tanpa daftar pilihan: cukup diketik manual,
    // lalu bagian 15 di bawah menyesuaikan paket/harga/modal. Daftar tetap dipakai di form produk.
    var fDur = byId('fDuration');
    if (fDur) { fDur.removeAttribute('list'); fDur.setAttribute('inputmode', 'numeric'); }

    ['qProductDuration', 'pDuration'].forEach(function (id) {
      var input = byId(id);
      if (!input || !input.parentNode || input.parentNode.classList.contains('lx-dwrap')) return;
      var w = wrapInput(input, 'i-clock-t');
      w.btn.setAttribute('aria-label', 'Buka daftar durasi');
      input.removeAttribute('list');
      input.setAttribute('aria-haspopup', 'listbox'); input.setAttribute('aria-expanded', 'false');
      input.setAttribute('inputmode', coarse ? 'none' : 'numeric');   // HP: ketuk = daftar, bukan keyboard
      function open(focusItem) {
        if (coarse) input.setAttribute('inputmode', 'none');
        show('dur', input, w.wrap, dl);
        renderDl(); place(dl, w.wrap);
        if (focusItem) { var on = dl.querySelector('.lx-dl-item.on') || dl.querySelector('.lx-dl-item'); if (on) on.focus({ preventScroll: true }); }
      }
      input.addEventListener('click', function () { if (!(current && current.input === input)) open(false); });
      input.addEventListener('input', function () { if (current && current.input === input) closeAll(); });   // mulai mengetik -> daftar menutup
      w.btn.addEventListener('click', function () { if (current && current.input === input) closeAll(); else open(!coarse); });
    });

    // Tutup bila modal ditutup / dibuka ulang
    var origOpen = window.openTx;
    if (typeof origOpen === 'function') {
      window.openTx = function () { closeAll(); return origOpen.apply(this, arguments); };
    }
    var modal = byId('modal');
    if (modal && window.MutationObserver) {
      new MutationObserver(function () {
        if (current && getComputedStyle(modal).display === 'none') closeAll();
      }).observe(modal, { attributes: true, attributeFilter: ['class', 'style'] });
    }
  })();

  /* ---------- 15) Ketik durasi -> paket, harga & modal ikut berubah ----------
   * Saat durasi (hari) diketik/dipilih di form Tambah Transaksi, cari paket produk yang sama
   * dengan durasi persis itu. Bila ada, paket dipilih otomatis lalu syncProduct() milik app
   * mengisi ulang harga jual, modal, dan tanggal expired. Bila tidak ada paket yang cocok,
   * isian tidak diubah (hanya tanggal expired yang ikut, seperti sebelumnya).
   * Tidak aktif saat mengedit transaksi lama, supaya harga lama tidak tertimpa.
   * Tidak ada query/tulis ke database. */
  (function () {
    var dur = byId('fDuration'), sel = byId('fProduct'), nameIn = byId('fProductName');
    if (!dur || !sel || !nameIn) return;

    dur.addEventListener('input', function () {
      try {
        if (typeof editId !== 'undefined' && editId) return;                  // mode edit: jangan ubah harga
        if (typeof products === 'undefined' || !Array.isArray(products)) return;
        var d = Number(dur.value);
        if (!Number.isInteger(d) || d < 1) return;
        var name = (nameIn.value || '').trim();
        if (!name) return;
        var matches = products.filter(function (p) { return p.name === name && Number(p.duration_days) === d; });
        if (!matches.length) return;                                          // durasi custom: biarkan apa adanya
        var cur = matches.filter(function (p) { return String(p.id) === String(sel.value); })[0];
        if (cur) return;                                                      // paket terpilih sudah cocok
        sel.value = String(matches[0].id);
        if (typeof syncProduct === 'function') syncProduct();                 // isi paket, harga, modal, expired
        sel.dispatchEvent(new Event('change', { bubbles: true }));            // segarkan label pilihan paket
      } catch (e) { /* abaikan */ }
    });
  })();
})();
