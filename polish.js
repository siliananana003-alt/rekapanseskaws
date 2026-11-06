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

    // Ketuk di mana saja pada pil bulan -> pemilih bulan terbuka (jika browser mendukung)
    var m = byId('globalMonth');
    if (m && typeof m.showPicker === 'function') {
      m.addEventListener('click', function () { try { m.showPicker(); } catch (e) { /* abaikan */ } });
    }
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

  /* ---------- 10) Durasi: daftar pilihan (dropdown) di kolom durasi ----------
   * Dipasang di form transaksi, form "Produk Baru" (di dalam transaksi), dan form Produk.
   * Hanya menambah daftar saran pada kolom durasi yang sudah ada; tidak menyentuh data. */
  (function () {
    var PRESET = [7, 14, 30, 60, 90, 180, 365];
    var NAMES = { 7: '1 minggu', 14: '2 minggu', 30: '1 bulan', 60: '2 bulan', 90: '3 bulan', 180: '6 bulan', 365: '1 tahun' };
    var builders = [];

    // Preset + durasi yang dipakai produk milikmu (paling sering dipakai dulu, maks. 5 tambahan)
    function durations() {
      var extra = {};
      try {
        if (typeof products !== 'undefined') products.forEach(function (p) {
          var n = Number(p.duration_days);
          if (Number.isInteger(n) && n > 0 && PRESET.indexOf(n) < 0) extra[n] = (extra[n] || 0) + 1;
        });
      } catch (e) { /* abaikan */ }
      var more = Object.keys(extra).map(Number).sort(function (a, b) { return extra[b] - extra[a] || a - b; }).slice(0, 5);
      return PRESET.concat(more).sort(function (a, b) { return a - b; });
    }

    function attach(dur, listId) {
      if (!dur || !dur.parentNode) return;
      var dl = document.createElement('datalist');
      dl.id = listId;
      dur.parentNode.insertBefore(dl, dur.nextSibling);
      dur.setAttribute('list', listId);
      dur.setAttribute('inputmode', 'numeric');
      function build() {
        var list = durations(), key = list.join(',');
        if (dl.dataset.key === key) return;
        dl.dataset.key = key;
        dl.innerHTML = '';
        list.forEach(function (n) {
          var o = document.createElement('option');
          o.value = String(n);
          o.label = n + ' hari' + (NAMES[n] ? ' (' + NAMES[n] + ')' : '');
          dl.appendChild(o);
        });
      }
      builders.push(build);
      build();
    }
    function refresh() { builders.forEach(function (f) { f(); }); }

    attach(byId('fDuration'), 'fDurationList');
    attach(byId('qProductDuration'), 'qProductDurationList');
    attach(byId('pDuration'), 'pDurationList');

    // Daftar disegarkan saat modal dibuka (produk baru bisa membawa durasi baru)
    var origOpen = window.openTx;
    if (typeof origOpen === 'function') {
      window.openTx = function () {
        var r = origOpen.apply(this, arguments);
        setTimeout(refresh, 60);
        return r;
      };
    }
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
})();
