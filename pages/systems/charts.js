/* Shared Ledger chart helpers (v18.74)
 * Small SVG renderers for dashboards that need charts without bringing in a framework.
 */
(function () {
  "use strict";
  if (window.LedgerChartsV1874) return;

  function n(v) { var x = Number(v); return Number.isFinite(x) ? x : 0; }
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (m) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m];
    });
  }
  function compactMoney(v) {
    v = n(v);
    var sign = v < 0 ? "-" : "";
    var a = Math.abs(v);
    if (a >= 1e12) return sign + "$" + (a / 1e12).toFixed(a >= 1e13 ? 0 : 1) + "T";
    if (a >= 1e9) return sign + "$" + (a / 1e9).toFixed(a >= 1e10 ? 0 : 1) + "B";
    if (a >= 1e6) return sign + "$" + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1) + "M";
    if (a >= 1e3) return sign + "$" + (a / 1e3).toFixed(a >= 1e4 ? 0 : 1) + "K";
    return sign + "$" + Math.round(a);
  }
  function seeded(seed) {
    var h = 2166136261 >>> 0;
    seed = String(seed || "ledger");
    for (var i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return function () {
      h += 0x6D2B79F5;
      var t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function sparkSVG(values, opts) {
    opts = opts || {};
    var v = (values || []).map(n);
    if (v.length < 2) return opts.empty || '<div class="biz1861-spark-empty">Not enough history yet.</div>';
    var color = opts.color || "#d8b16e";
    var W = opts.w || 240, H = opts.h || 46, pad = opts.pad || 3;
    var mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), rng = (mx - mn) || Math.abs(mx) || 1;
    var step = (W - pad * 2) / (v.length - 1);
    var pts = v.map(function (val, i) { return [pad + i * step, H - pad - ((val - mn) / rng) * (H - pad * 2)]; });
    var line = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    var area = "M" + pts[0][0].toFixed(1) + " " + (H - pad) + " " + pts.map(function (p) { return "L" + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ") + " L" + pts[pts.length - 1][0].toFixed(1) + " " + (H - pad) + " Z";
    return '<svg class="' + esc(opts.className || "ledger-chart-spark") + '" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="' + area + '" fill="' + esc(color) + '" opacity="0.16"/>' +
      '<path d="' + line + '" fill="none" stroke="' + esc(color) + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  }

  function donutSVG(segments, opts) {
    opts = opts || {};
    var segs = (segments || []).filter(function (s) { return n(s.value) > 0; });
    var total = segs.reduce(function (sum, s) { return sum + n(s.value); }, 0);
    if (total <= 0) return opts.empty || '<div class="biz1861-spark-empty">Nothing allocated yet.</div>';
    var R = 42, C = 2 * Math.PI * R, cx = 60, cy = 60, sw = 17, off = 0;
    var rings = segs.map(function (s) {
      var len = (n(s.value) / total) * C;
      var ring = '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="' + esc(s.color || "#d8b16e") + '" stroke-width="' + sw + '" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"></circle>';
      off += len;
      return ring;
    }).join("");
    var svg = '<svg class="' + esc(opts.svgClass || "biz1862-donut") + '" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="' + sw + '"></circle>' + rings +
      '<text x="' + cx + '" y="' + (cy - 1) + '" text-anchor="middle" fill="#fff3df" font-family="Fraunces,Georgia,serif" font-size="15">' + esc(compactMoney(total)) + '</text>' +
      '<text x="' + cx + '" y="' + (cy + 13) + '" text-anchor="middle" fill="#b9a98e" font-family="JetBrains Mono,monospace" font-size="7" letter-spacing="1.5">' + esc(opts.centerLabel || "TOTAL") + '</text></svg>';
    var legend = '<div class="' + esc(opts.legendClass || "biz1861-legend") + '">' + segs.map(function (s) {
      return '<span><i style="background:' + esc(s.color || "#d8b16e") + '"></i>' + esc(s.label) + ' <b>' + Math.round((n(s.value) / total) * 100) + '%</b> <em>' + esc(compactMoney(s.value)) + '</em></span>';
    }).join("") + '</div>';
    return '<div class="' + esc(opts.wrapClass || "biz1862-donut-wrap") + '">' + svg + legend + '</div>';
  }

  function candlesFromCloses(closes, id, perYear) {
    perYear = perYear || 12;
    var v = (closes || []).map(n).filter(function (x) { return x > 0; });
    var out = [];
    if (!v.length) return out;
    if (v.length === 1) v = [v[0], v[0] * 1.01];
    for (var y = 1; y < v.length; y++) {
      var start = v[y - 1], end = v[y], rnd = seeded(String(id || "x") + ":" + y);
      var vol = Math.max(0.025, Math.abs(end - start) / (start || 1) * 0.5 + 0.03);
      var prev = start;
      for (var mo = 0; mo < perYear; mo++) {
        var t = (mo + 1) / perYear;
        var target = start + (end - start) * t;
        var open = prev;
        var close = Math.max(0.01, target * (1 + (rnd() - 0.5) * vol));
        var hi = Math.max(open, close) * (1 + rnd() * vol * 0.6);
        var lo = Math.min(open, close) * (1 - rnd() * vol * 0.6);
        out.push({ o: open, h: hi, l: lo, c: close });
        prev = close;
      }
    }
    return out;
  }

  function candleSVG(candles, opts) {
    opts = opts || {};
    candles = (candles || []).slice();
    var maxN = opts.max || 48;
    if (candles.length > maxN) candles = candles.slice(candles.length - maxN);
    if (candles.length < 2) return opts.empty || '<div class="biz1861-spark-empty">Not enough price history yet.</div>';
    var W = opts.w || 320, H = opts.h || 90, pad = 4;
    var mn = Infinity, mx = -Infinity;
    candles.forEach(function (c) { if (n(c.l) < mn) mn = n(c.l); if (n(c.h) > mx) mx = n(c.h); });
    var rng = (mx - mn) || Math.abs(mx) || 1;
    var slot = (W - pad * 2) / candles.length, cw = Math.max(1.2, Math.min(slot * 0.66, 9));
    function yv(v) { return H - pad - ((v - mn) / rng) * (H - pad * 2); }
    var bars = candles.map(function (c, i) {
      var x = pad + i * slot + slot / 2, up = n(c.c) >= n(c.o), col = up ? "#3fae5f" : "#d65b5b";
      var yo = yv(n(c.o)), yc = yv(n(c.c)), top = Math.min(yo, yc), bh = Math.max(0.8, Math.abs(yc - yo));
      return '<line x1="' + x.toFixed(1) + '" y1="' + yv(n(c.h)).toFixed(1) + '" x2="' + x.toFixed(1) + '" y2="' + yv(n(c.l)).toFixed(1) + '" stroke="' + col + '" stroke-width="1"/>' +
        '<rect x="' + (x - cw / 2).toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + cw.toFixed(1) + '" height="' + bh.toFixed(1) + '" fill="' + col + '"/>';
    }).join("");
    return '<svg class="' + esc(opts.className || "biz1862-candles") + '" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">' + bars + '</svg>';
  }

  window.LedgerChartsV1874 = {
    sparkSVG: sparkSVG,
    donutSVG: donutSVG,
    candlesFromCloses: candlesFromCloses,
    candleSVG: candleSVG,
    candleFromClosesSVG: function (closes, id, opts) { return candleSVG(candlesFromCloses(closes, id, 12), opts || {}); }
  };
})();
