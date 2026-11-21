/* LiXi safety — pengaman bila library dari CDN gagal dimuat.
 * Bila Chart.js tidak tersedia, pasang pengganti kosong supaya halaman Laporan dan
 * Dashboard tetap terbuka (hanya grafiknya yang kosong), bukan error total. */
(function () {
  'use strict';
  if (typeof window.Chart !== 'undefined') return;

  console.warn('Chart.js gagal dimuat dari CDN. Grafik dinonaktifkan sementara.');

  function ChartStub() {
    this.data = { labels: [], datasets: [{ data: [] }, { data: [] }, { data: [] }] };
    this.options = {};
    this.update = function () {};
    this.destroy = function () {};
  }
  ChartStub.register = function () {};
  ChartStub.defaults = { font: {}, animation: false, plugins: {}, color: '', borderColor: '' };
  ChartStub.isStub = true;
  window.Chart = ChartStub;

  function addNotes() {
    ['chart', 'trendChartWrap', 'dashChartNote'].forEach(function (id) {
      var host = document.getElementById(id);
      if (host && host.tagName === 'CANVAS') host = host.parentNode;
      if (!host || host.querySelector('.lx-chart-note')) return;
      var note = document.createElement('div');
      note.className = 'lx-chart-note';
      note.textContent = 'Grafik tidak dapat dimuat. Periksa koneksi internet lalu muat ulang halaman.';
      host.appendChild(note);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addNotes, { once: true });
  else addNotes();
})();
