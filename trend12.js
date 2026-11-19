/* LiXi trend 12 bulan — membaca tabel ringkasan bulanan (lihat trend_12bulan.sql).
 * Tidak mengubah app.js. Bila tabel ringkasan belum ada / gagal dibaca, grafik 3 bulan bawaan tetap jalan.
 * Pasang SETELAH backup.js dan resilience.js:  <script defer src="trend12.js"></script>
 * Memakai global milik app: db, rupiah, monthLabel, shiftMonth, monthKeyFromInput, pctChange, getCSS, $ */
(function () {
  'use strict';

  var MONTHS = 12;
  var summary = null;        // { 'YYYY-MM': {omzet, cost, count} } atau null bila tidak tersedia
  var products = null;       // [{month, product_name, omzet, cost, tx_count}]
  var loadingPromise = null;  // permintaan yang sedang berjalan (satu pada satu waktu)
  var requestedKey = null;    // rentang terbaru yang diminta; dipakai agar permintaan basi diulang

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
    } catch (e) {
      summary = null; products = null;
      console.warn('Ringkasan bulanan belum tersedia, memakai grafik 3 bulan bawaan:', e && e.message ? e.message : e);
    }
  }

  // Bila bulan diganti saat permintaan masih berjalan, permintaan itu diulang untuk rentang terbaru
  // (sebelumnya panggilan kedua dibuang dan grafik memakai rentang lama).
  function refreshSummary() {
    if (typeof db === 'undefined' || !db) return Promise.resolve();
    requestedKey = shiftMonth(monthKeyFromInput(), -(MONTHS + 1));
    if (loadingPromise) return loadingPromise;
    loadingPromise = (async function () {
      try {
        var key;
        do { key = requestedKey; await fetchRange(key); } while (key !== requestedKey);
      } finally {
        loadingPromise = null;
      }
    })();
    return loadingPromise;
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
      refreshSummary().then(function () {
        var rep = document.getElementById('laporan');
        if (rep && rep.classList.contains('show') && typeof window.renderTrendChart === 'function') window.renderTrendChart();
      });
      return r;
    };
  }

  // Ganti bulan di filter global: ambil ringkasan untuk rentang baru
  var origChange = window.changeMonth;
  if (typeof origChange === 'function') {
    window.changeMonth = function () {
      var r = origChange.apply(this, arguments);
      refreshSummary().then(function () { if (typeof window.renderTrendChart === 'function') window.renderTrendChart(); });
      return r;
    };
  }
})();
