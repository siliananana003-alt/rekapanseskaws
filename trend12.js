/* LiXi trend 12 bulan — membaca tabel ringkasan bulanan (lihat trend_12bulan.sql).
 * Tidak mengubah app.js. Bila tabel ringkasan belum ada / gagal dibaca, grafik 3 bulan bawaan tetap jalan.
 * Pasang SETELAH backup.js dan resilience.js:  <script defer src="trend12.js"></script>
 * Memakai global milik app: db, rupiah, monthLabel, shiftMonth, monthKeyFromInput, pctChange, getCSS, $
 *
 * Selain grafik, file ini menambal angka bulan lama yang menyusut setelah Sapu Bersih: bila ringkasan bulanan
 * lebih lengkap daripada transaksi yang masih ada, Dashboard ("bulan ini", target, gelas), kartu Insight
 * ("Vs bulan lalu", rata-rata profit, produk terlaris) dan Laporan (omzet/modal/profit/margin, profit per produk)
 * memakai ringkasan. Daftar pelanggan/pembeli tetap dari transaksi yang tersisa. */
(function () {
  'use strict';

  var MONTHS = 12;
  var summary = null;        // { 'YYYY-MM': {omzet, cost, count} } atau null bila tidak tersedia
  var products = null;       // [{month, product_name, omzet, cost, tx_count}]
  var loadingPromise = null;  // permintaan yang sedang berjalan (satu pada satu waktu)
  var requestedKey = null;    // rentang terbaru yang diminta; dipakai agar permintaan basi diulang
  var loadedFrom = null;      // awal rentang ringkasan yang sudah dimuat (tanpa batas atas)

  function num(v) { return Number(v) || 0; }

  // Judul kartu mengikuti isi grafik: 12 bulan bila ringkasan tersedia, 3 bulan (bawaan) bila tidak.
  function setLabels(n) {
    var wrap = document.getElementById('trendChartWrap');
    var head = wrap && wrap.parentNode && wrap.parentNode.querySelector('.trend-head');
    if (!head) return;
    var h2 = head.querySelector('h2');
    if (h2) for (var i = 0; i < h2.childNodes.length; i++) {
      if (h2.childNodes[i].nodeType === 3) { h2.childNodes[i].nodeValue = 'Analitik Tren ' + n + ' Bulan '; break; }
    }
    var badge = head.querySelector('.insight-badge');
    if (badge) badge.textContent = n + ' BULAN';
  }

  async function fetchRange(startKey) {
    try {
      var a = await db.from('lixi_monthly_summary').select('month,tx_count,omzet,cost').gte('month', startKey).order('month');
      if (a.error) throw a.error;
      var b = await db.from('lixi_monthly_product_summary').select('month,product_name,tx_count,omzet,cost').gte('month', startKey);
      if (b.error) throw b.error;
      var map = {};
      (a.data || []).forEach(function (r) { map[r.month] = { omzet: num(r.omzet), cost: num(r.cost), count: num(r.tx_count) }; });
      summary = map;
      products = b.data || [];
      loadedFrom = startKey;
    } catch (e) {
      summary = null; products = null; loadedFrom = null;
      console.warn('Ringkasan bulanan belum tersedia, memakai grafik 3 bulan bawaan:', e && e.message ? e.message : e);
    }
  }

  // Bila bulan diganti saat permintaan masih berjalan, permintaan itu diulang untuk rentang terbaru
  // (sebelumnya panggilan kedua dibuang dan grafik memakai rentang lama).
  // Resolve true bila data diambil ulang (perlu menggambar ulang), false bila rentang sudah tercakup.
  // force = true setelah data transaksi berubah; pergantian bulan ke rentang yang sudah termuat tidak perlu query lagi.
  function refreshSummary(force) {
    if (typeof db === 'undefined' || !db) return Promise.resolve(false);
    requestedKey = shiftMonth(monthKeyFromInput(), -(MONTHS + 1));
    if (loadingPromise) return loadingPromise;
    if (!force && summary && loadedFrom && requestedKey >= loadedFrom) return Promise.resolve(false);
    loadingPromise = (async function () {
      try {
        var key;
        do { key = requestedKey; await fetchRange(key); } while (key !== requestedKey);
        return true;
      } finally {
        loadingPromise = null;
      }
    })();
    return loadingPromise;
  }

  /* ---------- Angka bulan lama setelah Sapu Bersih ----------
   * Sapu Bersih menghapus transaksi yang expired > 30 hari, sehingga total bulan lama yang dihitung dari
   * transaksi menyusut. Ringkasan bulanan dipakai HANYA bila: (a) bulan itu mulai lebih dari 30 hari lalu
   * (hanya bulan seperti itu yang bisa terkena Sapu Bersih) dan (b) jumlah transaksinya lebih banyak
   * daripada yang masih ada. Selain itu angka tetap dari transaksi, jadi bulan berjalan tidak berubah. */
  function mayHaveBeenSwept(key) {
    var c = new Date(); c.setDate(c.getDate() - 30);
    return key + '-01' < localDateString(c);
  }
  function monthTotals(key) {
    var arr = monthTx(key), om = 0, co = 0;
    arr.forEach(function (t) { om += +t.price || 0; co += +t.cost || 0; });
    var s = summary && summary[key];
    if (s && s.count > arr.length && mayHaveBeenSwept(key)) return { omzet: s.omzet, cost: s.cost, count: s.count, fromSummary: true };
    return { omzet: om, cost: co, count: arr.length, fromSummary: false };
  }
  function monthProducts(key) {
    return (products || []).filter(function (p) { return p.month === key && num(p.tx_count) > 0; })
      .map(function (p) { return { name: p.product_name || 'Produk', count: num(p.tx_count), profit: num(p.omzet) - num(p.cost) }; });
  }
  function put(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; return el; }

  function fixDash() {
    var t = monthTotals(monthKeyFromInput());
    if (!t.fromSummary) return;
    var profit = t.omzet - t.cost;
    put('dOmzet', rupiah(t.omzet)); put('dProfit', rupiah(profit)); put('dCount', t.count + ' Trx');
    var target = getTarget(), pct = Math.min((t.omzet / target) * 100, 100);
    put('goalText', hideMoney ? 'Rp •••••• / Rp •••••• (' + pct.toFixed(1) + '%)' : rupiah(t.omzet) + ' / ' + rupiah(target) + ' (' + pct.toFixed(1) + '%)');
    var fill = document.getElementById('goalFill');
    if (fill) { fill.style.width = pct + '%'; fill.style.backgroundColor = pct >= 100 ? 'var(--green)' : 'var(--p)'; }
    if (typeof updateGoalDecor === 'function') updateGoalDecor(pct);
    var pos = Math.max(profit, 0), total = pos + t.cost;
    put('dChartOmzet', rupiah(t.omzet)); put('dChartProfit', rupiah(pos)); put('dChartCost', rupiah(t.cost));
    put('dChartPct', (total > 0 ? Math.round(pos / total * 100) : 0) + '% profit');
  }

  function fixInsight() {
    var curKey = monthKeyFromInput(), prevKey = shiftMonth(curKey, -1);
    var cur = monthTotals(curKey), prev = monthTotals(prevKey);
    if (!cur.fromSummary && !prev.fromSummary) return;
    if (cur.fromSummary) {
      put('insAvgProfit', rupiah(cur.count ? (cur.omzet - cur.cost) / cur.count : 0));
      var top = monthProducts(curKey).sort(function (a, b) { return b.count - a.count || b.profit - a.profit; })[0];
      if (top) { put('insTopProduct', top.name); put('insTopProductNote', top.count + ' transaksi • ' + rupiah(top.profit) + ' profit'); }
    }
    var ch = pctChange(cur.omzet, prev.omzet), el = put('insMonthChange', (ch > 0 ? '+' : '') + ch + '%');
    if (el) el.style.color = ch > 0 ? 'var(--green)' : ch < 0 ? 'var(--red)' : 'var(--muted)';
    put('insMonthChangeNote', 'Omzet vs ' + monthLabel(prevKey) + ' • ' + rupiah(prev.omzet) + (prev.fromSummary ? ' (ringkasan bulanan)' : ''));
  }

  function sweepNote(show) {
    var box = document.getElementById('lxSweepNote'), cards = document.getElementById('laporanSummaryCards');
    if (!box && show && cards && cards.parentNode) {
      box = document.createElement('div');
      box.id = 'lxSweepNote';
      box.style.cssText = 'margin:0 0 12px;padding:8px 14px;border-radius:16px;border:2px dashed var(--p3);background:var(--p2);font-size:12px;font-weight:700;color:var(--ink)';
      box.textContent = 'Sebagian transaksi bulan ini sudah dibersihkan (Sapu Bersih). Omzet, modal, profit, dan profit per produk memakai ringkasan bulanan; daftar pembeli hanya dari transaksi yang masih tersimpan.';
      cards.parentNode.insertBefore(box, cards);
    }
    if (box) box.style.display = show ? 'block' : 'none';
  }
  function fixReport() {
    var key = monthKeyFromInput(), t = monthTotals(key);
    sweepNote(t.fromSummary);
    if (!t.fromSummary) return;
    var profit = t.omzet - t.cost;
    put('rOmzet', rupiah(t.omzet)); put('rCost', rupiah(t.cost)); put('rProfit', rupiah(profit));
    put('rMargin', t.omzet ? Math.round(profit / t.omzet * 100) + '%' : '0%');
    var list = document.getElementById('rProducts'), rows = monthProducts(key).sort(function (a, b) { return b.profit - a.profit; });
    if (list && rows.length) {
      list.innerHTML = rows.map(function (p) {
        return '<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--line)"><b>' + esc(p.name) + '</b><strong class="green">' + rupiah(p.profit) + '</strong></div>';
      }).join('');
    }
  }

  function wrap(name, fix) {
    var orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () {
      var r = orig.apply(this, arguments);
      try { if (summary) fix(); } catch (e) { console.warn('Penyesuaian ringkasan (' + name + ') gagal:', e); }
      return r;
    };
  }
  wrap('renderDash', fixDash);
  wrap('renderLixiInsight', fixInsight);
  wrap('renderReport', fixReport);

  // Setelah ringkasan tiba, gambar ulang halaman yang menampilkan angka bulanan.
  function rerender() {
    var p = document.querySelector('.page.show'), id = p && p.id;
    if ((id === 'dashboard' || id === 'laporan') && typeof window.renderCurrentPage === 'function') window.renderCurrentPage();
  }

  function noteBox() {
    var wrap = document.getElementById('trendChartWrap');
    if (!wrap) return null;
    var box = document.getElementById('lxTrendNote');
    if (!box) {
      box = document.createElement('div');
      box.id = 'lxTrendNote';
      box.style.cssText = 'margin-top:12px;font-size:13px;line-height:1.6;color:var(--ink)';
      wrap.insertAdjacentElement('afterend', box);
    }
    return box;
  }

  function drawFromSummary() {
    setLabels(MONTHS);
    var curKey = monthKeyFromInput();
    var keys = [];
    for (var i = MONTHS - 1; i >= 0; i--) keys.push(shiftMonth(curKey, -i));
    var rows = keys.map(function (k) {
      var s = summary[k] || { omzet: 0, cost: 0, count: 0 };
      return { key: k, omzet: s.omzet, profit: s.omzet - s.cost };
    });

    var chart = window.trendChartObj;
    if (chart && chart.data) {
      chart.data.labels = rows.map(function (r) { return monthLabel(r.key); });
      chart.data.datasets[0].data = rows.map(function (r) { return r.omzet; });
      chart.data.datasets[1].data = rows.map(function (r) { return r.profit; });
      chart.update('none');
    }

    var bestOm = rows.reduce(function (a, b) { return b.omzet > a.omzet ? b : a; }, rows[0]);
    var bestPr = rows.reduce(function (a, b) { return b.profit > a.profit ? b : a; }, rows[0]);
    var el;
    if ((el = document.getElementById('trendBestMonth'))) el.textContent = bestOm.omzet > 0 ? monthLabel(bestOm.key) : '-';
    if ((el = document.getElementById('trendBestOmzet'))) el.textContent = rupiah(bestOm.omzet);
    if ((el = document.getElementById('trendBestProfit'))) el.textContent = rupiah(bestPr.profit);

    var box = noteBox();
    if (!box) return;
    box.textContent = '';
    var cur = rows[rows.length - 1];
    var prevKey = shiftMonth(curKey, -12);
    var prevS = summary[prevKey];

    var line1 = document.createElement('div');
    if (prevS && prevS.omzet > 0) {
      var ch = pctChange(cur.omzet, prevS.omzet);
      line1.textContent = 'Omzet ' + monthLabel(curKey) + ' vs ' + monthLabel(prevKey) + ': ' +
        (ch > 0 ? '+' : '') + ch + '% (' + rupiah(prevS.omzet) + ' tahun lalu)';
    } else {
      line1.textContent = 'Belum ada data ' + monthLabel(prevKey) + ' untuk dibandingkan dengan tahun lalu.';
    }
    box.appendChild(line1);

    var top = (products || []).filter(function (p) { return p.month === curKey; })
      .map(function (p) { return { name: p.product_name, profit: num(p.omzet) - num(p.cost), count: num(p.tx_count) }; })
      .filter(function (p) { return p.count > 0; })
      .sort(function (a, b) { return b.profit - a.profit; }).slice(0, 3);
    if (top.length) {
      var line2 = document.createElement('div');
      line2.textContent = 'Produk untung terbesar ' + monthLabel(curKey) + ': ' +
        top.map(function (p, i) { return (i + 1) + '. ' + p.name + ' (' + rupiah(p.profit) + ')'; }).join('  ');
      box.appendChild(line2);
    }
  }

  var origTrend = window.renderTrendChart;
  if (typeof origTrend === 'function') {
    window.renderTrendChart = function () {
      var r = origTrend.apply(this, arguments);        // buat/siapkan grafik bawaan dulu
      try { if (summary) drawFromSummary(); else setLabels(3); } catch (e) { console.warn('Tren 12 bulan gagal digambar:', e); }
      return r;
    };
  }

  // Muat ulang ringkasan setiap kali data transaksi berubah (fungsi ini dipanggil setelah setiap muat/simpan/hapus).
  var origProfiles = window.loadCustomerProfiles;
  if (typeof origProfiles === 'function') {
    window.loadCustomerProfiles = async function () {
      var r = await origProfiles.apply(this, arguments);
      refreshSummary(true).then(rerender);
      return r;
    };
  }

  // Ganti bulan di filter global: ambil ringkasan untuk rentang baru
  var origChange = window.changeMonth;
  if (typeof origChange === 'function') {
    window.changeMonth = function () {
      var r = origChange.apply(this, arguments);
      refreshSummary(false).then(function (fetched) { if (fetched) rerender(); });
      return r;
    };
  }
})();
