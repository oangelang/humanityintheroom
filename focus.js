/* "Where we focus" slider.
   The copy lives in the .focus-card elements in index.html. This script reads it,
   builds the slider, and hides the cards. With JavaScript off, the cards show instead. */
(function () {
  "use strict";

  function init() {
    var section = document.getElementById("focus");
    if (!section) return;
    var live = section.querySelector(".focus-live");
    var cardsWrap = section.querySelector(".focus-cards");

    var PILLARS = Array.prototype.map.call(section.querySelectorAll(".focus-card"), function (card) {
      function field(name) { return card.querySelector('[data-field="' + name + '"]').textContent.trim(); }
      return { name: field("name"), q: field("q"), good: field("good"), watch: field("watch") };
    });
    if (!PILLARS.length) return;

    live.hidden = false;
    cardsWrap.hidden = true;

    var stage = live.querySelector(".stage");
    var photo = stage.querySelector("canvas.scene");
    var codeCanvas = stage.querySelector("canvas.code");
    var codeLayer = stage.querySelector(".layer-code");
    var handle = stage.querySelector(".handle");
    var copyG = stage.querySelector(".copy-good");
    var copyW = stage.querySelector(".copy-watch");
    var cue = stage.querySelector(".cue");
    var tabs = live.querySelector(".tabs");
    var question = live.querySelector(".question");

    var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
    if (mq("(pointer: coarse)")) cue.textContent = "Swipe";
    var reduce = mq("(prefers-reduced-motion: reduce)");

    PILLARS.forEach(function (p, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = p.name;
      b.setAttribute("data-i", String(i));
      b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      tabs.appendChild(b);
    });

    /* Seeded random, so every scene draws the same way each time. */
    function rng(seed) {
      return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }

    /* ---------- Scenes, in brand colors only. Placeholders for photos later. ---------- */
    var INK = "#8F0A0A";
    var cur = 0;

    function person(ctx, x, y, s) {
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.arc(x, y - s * 0.92, s * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x, y - s * 0.58, s * 0.16, s * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x - s * 0.11, y - s * 0.35, s * 0.09, s * 0.35);
      ctx.fillRect(x + s * 0.02, y - s * 0.35, s * 0.09, s * 0.35);
    }
    function seated(ctx, x, y, s) {
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.arc(x, y - s * 0.78, s * 0.11, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x, y - s * 0.46, s * 0.15, s * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x - s * 0.05, y - s * 0.16, s * 0.42, s * 0.12);
    }
    function sky(ctx, w, h, hy, stops) {
      var g = ctx.createLinearGradient(0, 0, 0, hy), i;
      for (i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
      ctx.fillStyle = stops[stops.length - 1][1]; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, hy);
    }
    function glowSun(ctx, cx, cy, r, limitY, w) {
      var g = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 5);
      g.addColorStop(0, "rgba(255,241,221,.95)");
      g.addColorStop(0.35, "rgba(255,201,60,.5)");
      g.addColorStop(1, "rgba(255,201,60,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, limitY);
      ctx.fillStyle = "#FFF1DD";
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }
    var DAWN = [[0, "#FFF1DD"], [0.35, "#FBE0BE"], [0.7, "#FFC93C"], [1, "#F28C00"]];

    function sceneClimate(ctx, w, h) {
      var R = rng(7), hy = h * 0.68, m = Math.min(w, h * 1.15), r = m * 0.14;
      var cx = w * 0.5, cy = hy - r * 0.2, g, i, x, y, t, wd;
      sky(ctx, w, h, hy, DAWN);
      glowSun(ctx, cx, cy, r, hy, w);

      ctx.fillStyle = "rgba(196,42,30,.5)";
      ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(0, hy - h * 0.05);
      ctx.quadraticCurveTo(w * 0.12, hy - h * 0.085, w * 0.26, hy - h * 0.02);
      ctx.lineTo(w * 0.3, hy); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(w, hy); ctx.lineTo(w, hy - h * 0.035);
      ctx.quadraticCurveTo(w * 0.88, hy - h * 0.06, w * 0.74, hy - h * 0.012);
      ctx.lineTo(w * 0.72, hy); ctx.closePath(); ctx.fill();

      function turbine(tx, ty, th, bl, rot) {
        ctx.strokeStyle = "rgba(143,10,10,.9)";
        ctx.lineWidth = Math.max(1.5, th * 0.04);
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx, ty - th); ctx.stroke();
        var q, an;
        for (q = 0; q < 3; q++) {
          an = rot + q * Math.PI * 2 / 3;
          ctx.beginPath(); ctx.moveTo(tx, ty - th);
          ctx.lineTo(tx + Math.cos(an) * bl, ty - th + Math.sin(an) * bl); ctx.stroke();
        }
      }
      turbine(w * 0.06, hy - h * 0.055, h * 0.1, h * 0.05, -1.2);
      turbine(w * 0.14, hy - h * 0.052, h * 0.1, h * 0.05, -0.4);
      turbine(w * 0.85, hy - h * 0.035, h * 0.08, h * 0.04, -0.9);

      g = ctx.createLinearGradient(0, hy, 0, h);
      g.addColorStop(0, "#F28C00"); g.addColorStop(1, "#E24A12");
      ctx.fillStyle = g; ctx.fillRect(0, hy, w, h - hy);

      for (i = 0; i < 46; i++) {
        t = i / 46;
        y = hy + Math.pow(t, 1.4) * (h * 0.2) + 2;
        wd = r * (1.6 - t * 0.6) * (0.4 + R() * 0.9);
        x = cx + (R() - 0.5) * r * 0.9 * (1 + t * 1.5);
        ctx.fillStyle = "rgba(255,201,60," + (0.55 - t * 0.4) + ")";
        ctx.fillRect(x - wd / 2, y, wd, Math.max(1.5, h * 0.0045));
      }

      function baseY(px) {
        return h * 0.915 - h * 0.02 * Math.sin(px / w * Math.PI * 2 + 0.9) - h * 0.012 * Math.sin(px / w * Math.PI * 5);
      }
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.moveTo(0, h);
      for (x = 0; x <= w; x += 8) ctx.lineTo(x, baseY(x));
      ctx.lineTo(w, baseY(w)); ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
      var n = Math.max(7, Math.round(w / 110));
      for (i = 0; i < n; i++) {
        x = (i + 0.5) / n * w + (R() - 0.5) * (w / n) * 0.7;
        person(ctx, x, baseY(x) + 2, h * (0.075 + R() * 0.04));
      }
    }

    function sceneHealth(ctx, w, h) {
      var R = rng(11), hy = h * 0.7, m = Math.min(w, h * 1.15), r = m * 0.12;
      var cx = w * 0.76, cy = hy - r * 0.4, gy = h * 0.86, i, x, k, y, j;
      sky(ctx, w, h, hy, DAWN);
      glowSun(ctx, cx, cy, r, hy, w);

      ctx.fillStyle = "rgba(226,74,18,.55)";
      ctx.beginPath(); ctx.moveTo(0, h);
      for (x = 0; x <= w; x += 8) ctx.lineTo(x, hy - h * 0.03 - h * 0.035 * Math.sin(x / w * 5 + 1));
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#E24A12";
      ctx.beginPath(); ctx.moveTo(0, h);
      for (x = 0; x <= w; x += 8) ctx.lineTo(x, hy + h * 0.04 - h * 0.03 * Math.sin(x / w * 3 + 0.5));
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#F28C00"; ctx.fillRect(0, gy, w, h - gy);

      var dx = w * 0.36, bw = Math.min(w * 0.36, h * 0.64), bh = h * 0.15, bx = dx - bw / 2, by = gy - bh;

      ctx.fillStyle = "#FBE0BE";
      ctx.beginPath();
      ctx.moveTo(dx - bw * 0.06, gy); ctx.lineTo(dx + bw * 0.06, gy);
      ctx.lineTo(dx + bw * 0.5, h); ctx.lineTo(dx - bw * 0.5, h);
      ctx.closePath(); ctx.fill();

      ctx.fillStyle = INK;
      ctx.fillRect(w * 0.09 - h * 0.008, gy - h * 0.1, h * 0.016, h * 0.1);
      ctx.beginPath(); ctx.arc(w * 0.09, gy - h * 0.13, h * 0.05, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(w * 0.09 - h * 0.04, gy - h * 0.1, h * 0.04, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(w * 0.09 + h * 0.04, gy - h * 0.1, h * 0.04, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = INK; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = "#C42A1E"; ctx.fillRect(bx - bw * 0.02, by, bw * 1.04, bh * 0.1);
      ctx.fillStyle = "#FFC93C";
      var wx = [0.1, 0.26, 0.62, 0.78];
      for (j = 0; j < wx.length; j++) ctx.fillRect(bx + bw * wx[j], by + bh * 0.3, bw * 0.12, bh * 0.3);
      ctx.fillStyle = "#F28C00"; ctx.fillRect(dx - bw * 0.06, gy - bh * 0.5, bw * 0.12, bh * 0.5);
      var pw = bh * 0.07;
      ctx.fillStyle = "#FFF1DD";
      ctx.fillRect(dx - pw * 1.5, by + bh * 0.22 - pw * 0.5, pw * 3, pw);
      ctx.fillRect(dx - pw * 0.5, by + bh * 0.22 - pw * 1.5, pw, pw * 3);

      var ks = [0, 0, 0.18, 0.34, 0.5, 0.66, 0.82];
      for (i = 0; i < ks.length; i++) {
        k = ks[i];
        x = dx + (i < 2 ? (i ? 1 : -1) * bw * 0.04 : (R() - 0.5) * bw * 0.34 * (1 + k * 1.6));
        y = gy + k * (h - gy) * 0.8;
        person(ctx, x, y, Math.min(h * 0.11, h * (0.07 + k * 0.045)));
      }
    }

    function sceneEducation(ctx, w, h) {
      var R = rng(5), hy = h * 0.72, m = Math.min(w, h * 1.15), r = m * 0.12, j, x, g;
      var cx = w * 0.2, cy = hy - r * 0.3, gy = h * 0.9;
      sky(ctx, w, h, hy, DAWN);
      glowSun(ctx, cx, cy, r, hy, w);

      ctx.fillStyle = "rgba(226,74,18,.45)";
      ctx.beginPath(); ctx.moveTo(0, h);
      for (x = 0; x <= w; x += 8) ctx.lineTo(x, hy - h * 0.025 - h * 0.02 * Math.sin(x / w * 4 + 2));
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
      g = ctx.createLinearGradient(0, hy, 0, h);
      g.addColorStop(0, "#F28C00"); g.addColorStop(1, "#E24A12");
      ctx.fillStyle = g; ctx.fillRect(0, hy, w, h - hy);

      var tcx = w * 0.58, cw = Math.min(w * 0.8, h * 1.0);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.moveTo(tcx - h * 0.022, gy); ctx.lineTo(tcx - h * 0.01, h * 0.62);
      ctx.lineTo(tcx + h * 0.01, h * 0.62); ctx.lineTo(tcx + h * 0.022, gy);
      ctx.closePath(); ctx.fill();
      for (j = 0; j < 7; j++) {
        ctx.beginPath();
        ctx.ellipse(tcx + (j - 3) / 3 * cw * 0.38, h * 0.6 + Math.abs(j - 3) * h * 0.01,
          cw * 0.2, h * 0.04 + R() * h * 0.01, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath(); ctx.ellipse(tcx, h * 0.585, cw * 0.3, h * 0.035, 0, 0, Math.PI * 2); ctx.fill();

      for (j = 0; j < 6; j++) seated(ctx, tcx - cw * 0.42 + j * cw * 0.064, gy + (j % 2) * h * 0.012, h * 0.075);
      person(ctx, tcx + cw * 0.12, gy, h * 0.12);

      var bw2 = Math.max(cw * 0.12, h * 0.1), bx2 = tcx + cw * 0.28;
      ctx.strokeStyle = INK; ctx.lineWidth = Math.max(2, h * 0.005);
      ctx.beginPath();
      ctx.moveTo(bx2 - bw2 * 0.3, gy - h * 0.07); ctx.lineTo(bx2 - bw2 * 0.38, gy);
      ctx.moveTo(bx2 + bw2 * 0.3, gy - h * 0.07); ctx.lineTo(bx2 + bw2 * 0.38, gy);
      ctx.stroke();
      ctx.fillStyle = "#FFF1DD"; ctx.fillRect(bx2 - bw2 / 2, gy - h * 0.15, bw2, h * 0.085);
      ctx.strokeStyle = "rgba(143,10,10,.6)"; ctx.lineWidth = Math.max(1.5, h * 0.003);
      for (j = 0; j < 3; j++) {
        var ly = gy - h * 0.14 + j * h * 0.02 + h * 0.008;
        ctx.beginPath(); ctx.moveTo(bx2 - bw2 * 0.4, ly); ctx.lineTo(bx2 + bw2 * (0.15 + R() * 0.25), ly); ctx.stroke();
      }
    }

    function sceneMobility(ctx, w, h) {
      var R = rng(3), n = 9, stepH = h * 0.034, base = h * 0.93, py = base - n * stepH;
      var x1 = w * 0.64, stepW = x1 / n, m = Math.min(w, h * 1.15), r = m * 0.11;
      var cx = w * 0.74, cy = py - h * 0.1, i, x, bwid, bhgt, ty;
      sky(ctx, w, h, py, DAWN);
      glowSun(ctx, cx, cy, r, py, w);

      ctx.fillStyle = "rgba(196,42,30,.65)";
      x = w * 0.6;
      while (x < w) {
        bwid = w * (0.025 + R() * 0.035);
        bhgt = h * (0.03 + R() * 0.09);
        ctx.fillRect(x, py - bhgt, bwid, bhgt + 2);
        x += bwid + w * 0.004;
      }

      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.moveTo(0, h);
      for (i = 0; i < n; i++) {
        ty = base - (i + 1) * stepH;
        ctx.lineTo(i * stepW, ty); ctx.lineTo((i + 1) * stepW, ty);
      }
      ctx.lineTo(w, py); ctx.lineTo(w, h); ctx.closePath(); ctx.fill();

      var js = [0, 2, 3, 5, 7];
      for (i = 0; i < js.length; i++) person(ctx, (js[i] + 0.5) * stepW, base - (js[i] + 1) * stepH, h * 0.075);
      person(ctx, w * 0.76, py, h * 0.095);
      person(ctx, w * 0.84, py, h * 0.085);
    }

    var SCENES = [sceneClimate, sceneHealth, sceneEducation, sceneMobility];
    function drawScene(ctx, w, h) { SCENES[cur % SCENES.length](ctx, w, h); }

    /* ---------- Code side: each character takes the color of the pixel beneath it. ---------- */
    function buildStream() {
      var R = rng(21);
      function hex() { var s = "", i; for (i = 0; i < 6; i++) s += "0123456789ABCDEF"[Math.floor(R() * 16)]; return s; }
      var bits = ["const sun=", "\"#FBE0BE\"", "model.fit(", "x,y", "loss=", "rgb(", "251,224,190", ")",
        "if(bias>", "0.41", "){", "flag(user);", "}", "return", "predict(", "data", ".map(", "=>",
        "tokens", "[", "i", "]", "softmax(", "weights", "layer", "fetch(", "null", "true",
        "def train(", "epoch", "for(", "let", ".length", "alpha:", "0.5", "color:", ";", "{", "}",
        "import", "torch", "as np", "sky", "water", "hill"];
      var out = "", k;
      while (out.length < 60000) {
        k = R();
        if (k < 0.38) out += "#" + hex();
        else if (k < 0.5) out += "0x" + hex();
        else out += bits[Math.floor(R() * bits.length)];
        if (R() < 0.35) out += ";";
      }
      return out.replace(/\s+/g, "");
    }
    var STREAM = buildStream();

    function drawCode(ctx, w, h, dpr, data) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#8F0A0A"; ctx.fillRect(0, 0, w, h);
      var fs = Math.max(7.5, Math.min(11, w / 140));
      var lh = Math.round(fs * 1.3);
      ctx.font = fs + "px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
      ctx.textBaseline = "top";
      var cw = ctx.measureText("0").width;
      var cols = Math.floor(w / cw), rows = Math.ceil(h / lh);
      var idx = 0, L = STREAM.length, ry, cxx, x, y, sx, sy, p, r, g, b;
      for (ry = 0; ry < rows; ry++) {
        y = ry * lh;
        sy = Math.min(h - 1, Math.floor(y + lh / 2));
        for (cxx = 0; cxx < cols; cxx++) {
          x = cxx * cw;
          sx = Math.min(w - 1, Math.floor(x + cw / 2));
          p = (sy * w + sx) * 4;
          r = Math.min(255, data[p] * 1.15 + 30); g = Math.min(255, data[p + 1] * 1.15 + 20); b = Math.min(255, data[p + 2] * 1.15 + 15);
          ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
          ctx.fillText(STREAM.charAt(idx++ % L), x, y);
        }
      }
    }

    /* ---------- Render both layers at the stage size. ---------- */
    var lastW = 0, lastH = 0, raf = 0;
    function render(force) {
      var rect = stage.getBoundingClientRect();
      var w = Math.round(rect.width), h = Math.round(rect.height);
      if (!w || !h || (!force && w === lastW && h === lastH)) return;
      lastW = w; lastH = h;
      stage.classList.toggle("is-compact", w < 640);
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      photo.width = w * dpr; photo.height = h * dpr;
      codeCanvas.width = w * dpr; codeCanvas.height = h * dpr;
      var pctx = photo.getContext("2d");
      pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawScene(pctx, w, h);
      var sc = document.createElement("canvas");
      sc.width = w; sc.height = h;
      var sctx = sc.getContext("2d", { willReadFrequently: true });
      drawScene(sctx, w, h);
      drawCode(codeCanvas.getContext("2d"), w, h, dpr, sctx.getImageData(0, 0, w, h).data);
    }
    function scheduleRender() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () { render(); updateCopy(); });
    }
    if (window.ResizeObserver) new ResizeObserver(scheduleRender).observe(stage);
    else window.addEventListener("resize", scheduleRender);

    /* ---------- Copy ---------- */
    function fill(sel, text) {
      Array.prototype.forEach.call(stage.querySelectorAll(sel), function (el) { el.textContent = text; });
    }
    function showPillar(i) {
      var p = PILLARS[i];
      question.textContent = p.q;
      if (cur !== i) { cur = i; render(true); }
      fill('[data-slot="name"]', p.name);
      fill('[data-slot="good"]', p.good);
      fill('[data-slot="watch"]', p.watch);
      Array.prototype.forEach.call(tabs.querySelectorAll("button"), function (b, j) {
        b.setAttribute("aria-pressed", j === i ? "true" : "false");
      });
    }

    /* ---------- The slider ---------- */
    var TEASER = 85, pos = TEASER;
    function setPos(p) {
      pos = Math.max(0, Math.min(100, p));
      var clip = "inset(0 0 0 " + pos + "%)";
      codeLayer.style.clipPath = clip;
      codeLayer.style.webkitClipPath = clip;
      handle.style.left = pos + "%";
      updateCopy();
      handle.setAttribute("aria-valuenow", String(Math.round(pos)));
      handle.setAttribute("aria-valuetext",
        pos > 66 ? "Mostly what AI can do" : pos < 34 ? "Mostly what we watch for" : "Both sides");
    }
    function updateCopy() {
      if (stage.classList.contains("is-compact")) {
        copyG.classList.toggle("is-off", pos < 50);
        copyW.classList.toggle("is-off", pos >= 50);
        return;
      }
      var x = pos / 100 * stage.clientWidth;
      copyG.classList.toggle("is-off", x < copyG.offsetLeft + copyG.offsetWidth + 4);
      copyW.classList.toggle("is-off", x > copyW.offsetLeft - 4);
    }
    function moveTo(clientX) {
      var r = stage.getBoundingClientRect();
      setPos((clientX - r.left) / r.width * 100);
    }

    var down = false, dragging = false, startX = 0, demoId = null;
    function stopDemo() { if (demoId) { cancelAnimationFrame(demoId); demoId = null; } }
    function markTouched() { stage.classList.add("touched"); }

    stage.addEventListener("pointerdown", function (e) {
      stopDemo(); markTouched();
      down = true; startX = e.clientX;
      dragging = e.pointerType !== "touch";
      if (dragging) { try { stage.setPointerCapture(e.pointerId); } catch (err) {} moveTo(e.clientX); }
    });
    stage.addEventListener("pointermove", function (e) {
      if (!down) return;
      if (!dragging) {
        if (Math.abs(e.clientX - startX) > 6) {
          dragging = true;
          try { stage.setPointerCapture(e.pointerId); } catch (err) {}
        } else return;
      }
      moveTo(e.clientX);
    });
    stage.addEventListener("pointerup", function (e) {
      if (down && !dragging && e.pointerType === "touch") moveTo(e.clientX);
      down = false; dragging = false;
    });
    stage.addEventListener("pointercancel", function () { down = false; dragging = false; });

    handle.addEventListener("keydown", function (e) {
      var handled = true;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") setPos(pos - 4);
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") setPos(pos + 4);
      else if (e.key === "PageDown") setPos(pos - 12);
      else if (e.key === "PageUp") setPos(pos + 12);
      else if (e.key === "Home") setPos(0);
      else if (e.key === "End") setPos(100);
      else handled = false;
      if (handled) { e.preventDefault(); stopDemo(); markTouched(); }
    });

    function runDemo(keys, D) {
      if (reduce) return;
      var t0 = performance.now();
      keys = keys || [TEASER, 38, TEASER]; D = D || 2600;
      function step(now) {
        var t = Math.min(1, (now - t0) / D);
        var seg = t * (keys.length - 1);
        var i = Math.min(keys.length - 2, Math.floor(seg));
        var f = seg - i;
        var ease = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
        setPos(keys[i] + (keys[i + 1] - keys[i]) * ease);
        demoId = t < 1 ? requestAnimationFrame(step) : null;
      }
      demoId = requestAnimationFrame(step);
    }

    tabs.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      showPillar(parseInt(b.getAttribute("data-i"), 10));
      stopDemo();
      setPos(TEASER);
      setTimeout(function () { runDemo([TEASER, 58, TEASER], 1700); }, 350);
    });

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { io.disconnect(); setTimeout(function () { runDemo(); }, 500); }
      }, { threshold: 0.5 });
      io.observe(stage);
    }

    render(true);
    showPillar(0);
    setPos(TEASER);

    /* Redraw once the brand fonts arrive so the copy edges are measured correctly. */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateCopy);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
