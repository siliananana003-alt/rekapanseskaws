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
})();
