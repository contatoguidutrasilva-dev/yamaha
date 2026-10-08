/* Animações e interações (camada opcional, JS puro). Roda depois do app.js.
 * Não muda dados nem regras do site: só observa o DOM que o app.js monta e dá movimento a ele.
 * Desligar: SITE.animacoes = false no config.js (ou tirar css/animacoes.css e este arquivo do index.html). */
(function () {
  "use strict";

  var SITE = window.SITE || {};
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || SITE.animacoes === false || !Element.prototype.animate || !window.IntersectionObserver || !window.MutationObserver) {
    doc.classList.remove("anim");
    return;
  }
  doc.classList.add("anim");

  var EASE = "cubic-bezier(.2,.8,.2,1)";
  var FINE = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var MOBILE = window.matchMedia("(max-width: 767px)");

  /* ---------------- helpers ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function esc(v) {
    return String(v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  // Um único laço de quadros; cada consumidor devolve true enquanto quer o próximo quadro.
  var consumers = [], rafId = 0;
  function kick() { if (!rafId) rafId = requestAnimationFrame(frame); }
  function frame(t) {
    rafId = 0;
    var again = false;
    for (var i = 0; i < consumers.length; i++) if (consumers[i](t)) again = true;
    if (again) rafId = requestAnimationFrame(frame);
  }
  function addConsumer(fn) { consumers.push(fn); }

  // Leitores de tela: os valores animados mudam vários quadros; o valor final é anunciado uma vez.
  var live = document.createElement("div");
  live.className = "sr-only"; live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite");
  document.body.appendChild(live);
  function announce(txt) { live.textContent = ""; window.setTimeout(function () { live.textContent = txt; }, 60); }

  /* ---------------- contagem de números ---------------- */
  // "27 modelos", "145 kg", "15,1 cv": conta do zero até o número, mantendo o resto do texto.
  function countNode(node, delay, dur) {
    var m = /^(\d{1,3})(?:,(\d+))?(?=\s|$)([\s\S]*)$/.exec(node.nodeValue || "");
    if (!m) return;
    var dec = m[2] ? m[2].length : 0, end = parseFloat(m[1] + (m[2] ? "." + m[2] : "")), rest = m[3], original = node.nodeValue;
    if (!(end > 0)) return;
    var t0 = 0;
    node.nodeValue = (dec ? (0).toFixed(dec).replace(".", ",") : "0") + rest;
    function step(t) {
      if (!t0) t0 = t;
      var p = clamp((t - t0 - delay) / dur, 0, 1);
      if (p <= 0) { requestAnimationFrame(step); return; }
      if (p >= 1) { node.nodeValue = original; return; }
      var v = end * easeOut(p);
      node.nodeValue = (dec ? v.toFixed(dec).replace(".", ",") : String(Math.round(v))) + rest;
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function lastText(el) {
    for (var n = el.lastChild; n; n = n.previousSibling) if (n.nodeType === 3 && n.nodeValue.trim()) return n;
    return null;
  }

  /* ---------------- entrada por rolagem ---------------- */
  function makeReveal(root) {
    var io = new IntersectionObserver(function (entries) {
      var vis = entries.filter(function (e) { return e.isIntersecting; }).sort(function (a, b) {
        return (a.boundingClientRect.top - b.boundingClientRect.top) || (a.boundingClientRect.left - b.boundingClientRect.left);
      });
      vis.forEach(function (e, i) {
        var el = e.target, delay = Math.min(i, 7) * 75;
        io.unobserve(el);
        el.style.setProperty("--rd", delay + "ms");
        void el.offsetWidth;                       // fixa o estado inicial antes de transitar
        el.classList.add("is-in");
        var done = false;
        function clean() {
          if (done) return; done = true;
          el.classList.remove("rv", "is-in"); el.style.removeProperty("--rd");
        }
        el.addEventListener("transitionend", function (ev) { if (ev.target === el && ev.propertyName === "opacity") clean(); });
        window.setTimeout(clean, 1600 + delay);
      });
    }, { root: root || null, rootMargin: "0px 0px -6% 0px", threshold: 0.08 });
    return function (el, kind) {
      if (!el || el.getAttribute("data-rv")) return;
      el.setAttribute("data-rv", kind || "up");
      el.classList.add("rv");
      io.observe(el);
    };
  }
  var rv = makeReveal(null);

  function setupReveals() {
    $$(".sec__head > *").forEach(function (el) { rv(el, "up"); });
    rv($(".filters")); rv($("#count"));
    $$(".path").forEach(function (el) { rv(el, "pop"); });
    $$(".where__card, .where__map").forEach(function (el) { rv(el, "up"); });
    $$(".footer .wrap > *:not(.footer__painel)").forEach(function (el) { rv(el, "up"); });
  }

  /* ---------------- barra superior: progresso e seção ativa ---------------- */
  function setupScroll() {
    var top = $(".topbar");
    if (!top) return;
    var bar = document.createElement("div");
    bar.className = "progress"; bar.setAttribute("aria-hidden", "true"); bar.innerHTML = "<i></i>";
    top.appendChild(bar);
    var fill = bar.firstChild;
    var links = $$('.topbar__nav a[href^="#"]');
    var secs = links.map(function (a) { return $(a.getAttribute("href")); });
    var queued = false;

    function upd() {
      queued = false;
      var max = doc.scrollHeight - window.innerHeight;
      fill.style.transform = "scaleX(" + (max > 0 ? clamp(window.scrollY / max, 0, 1) : 0).toFixed(4) + ")";
      top.classList.toggle("is-stuck", window.scrollY > 8);
      var probe = window.scrollY + window.innerHeight * 0.35, cur = -1;
      secs.forEach(function (s, i) { if (s && !s.hidden && s.offsetTop <= probe) cur = i; });
      links.forEach(function (a, i) { a.classList.toggle("is-active", i === cur); });
    }
    window.addEventListener("scroll", function () { if (!queued) { queued = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener("resize", upd);
    upd();
  }

  /* ---------------- abertura ---------------- */
  function setupHero() {
    var hero = $(".hero");
    if (!hero) return;

    var h1 = $("#titulo");
    if (h1) {
      var words = h1.textContent.trim().split(/\s+/);
      h1.setAttribute("aria-label", words.join(" "));     // o nome acessível não depende de como o navegador junta as palavras
      h1.innerHTML = words.map(function (w, i) { return '<span class="w"><span style="--wi:' + i + '">' + esc(w) + "</span></span>"; }).join(" ");
    }

    var first = $("#facts li");
    var n = first && lastText(first);
    if (n) countNode(n, 900, 1100);

    var tx = 0, ty = 0, cx = 0, cy = 0, lastS = -1, vis = true;
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) kick(); }).observe(hero);
    if (FINE) {
      hero.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        var r = hero.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
        kick();
      });
      hero.addEventListener("pointerleave", function () { tx = 0; ty = 0; kick(); });
    }
    window.addEventListener("scroll", function () { if (vis) kick(); }, { passive: true });
    addConsumer(function () {
      if (!vis) return false;
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      var s = Math.min(window.scrollY, window.innerHeight);
      hero.style.setProperty("--px", cx.toFixed(3));
      hero.style.setProperty("--py", cy.toFixed(3));
      if (s !== lastS) { hero.style.setProperty("--sy", String(s)); lastS = s; }
      return Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002;
    });
    kick();
  }

  /* ---------------- faixa de categorias que reage à rolagem ---------------- */
  function setupMarquee() {
    var hero = $(".hero");
    var motos = window.MOTOS || [];
    var cats = (window.CATEGORIAS || []).filter(function (c) { return motos.some(function (m) { return m.categoria === c; }); });
    if (!hero || !cats.length) return;
    var words = cats.slice();
    words.push("Consórcio", "Financiamento");
    if (SITE.cidade) words.push(SITE.cidade);

    var el = document.createElement("div");
    el.className = "marquee"; el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<div class="marquee__track"></div>';
    hero.parentNode.insertBefore(el, hero.nextSibling);
    var track = el.firstChild;

    function group() {
      return words.map(function (w, i) { return '<span class="marquee__item' + (i % 2 ? " is-out" : "") + '">' + esc(w) + "<i></i></span>"; }).join("");
    }
    var gw = 0;
    function build() {
      track.innerHTML = group();
      gw = track.getBoundingClientRect().width;
      var reps = Math.max(2, Math.ceil((window.innerWidth * 2) / Math.max(gw, 1)) + 1);
      track.innerHTML = new Array(reps + 1).join(group());
    }
    build();
    window.addEventListener("resize", build);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);

    var x = 0, vel = 0, lastY = window.scrollY, last = 0, vis = false;
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) { last = 0; kick(); } }).observe(el);
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      vel += ((y - lastY) - vel) * 0.35;
      lastY = y;
    }, { passive: true });
    addConsumer(function (t) {
      if (!vis) return false;
      var dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
      last = t;
      vel *= 0.9;
      x -= (55 + clamp(vel * 26, -1400, 1400)) * dt;
      if (gw > 0) x = ((x % gw) - gw) % gw;
      track.style.transform = "translate3d(" + x.toFixed(1) + "px,0,0) skewX(" + clamp(-vel * 0.5, -9, 9).toFixed(2) + "deg)";
      return true;
    });
  }

  /* ---------------- vitrine: cartões, filtros ---------------- */
  function setupGrid() {
    var grid = $("#grid");
    if (!grid) return;

    // FLIP: guarda as posições antes do filtro e anima os cartões até as novas posições.
    var before = null;
    function snap() {
      var m = {};
      $$(".card", grid).forEach(function (c) { m[c.getAttribute("data-id")] = c.getBoundingClientRect(); });
      return m;
    }
    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest(".tab, .seg__btn, [data-reset]")) before = snap();
    }, true);

    function flip(cards, prev) {
      var novos = 0;
      cards.forEach(function (c) {
        var a = prev[c.getAttribute("data-id")], b = c.getBoundingClientRect();
        if (a) {
          var dx = a.left - b.left, dy = a.top - b.top;
          if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            c.animate([{ transform: "translate(" + dx + "px," + dy + "px)" }, { transform: "none" }], { duration: 650, easing: EASE });
          }
        } else {
          c.animate([{ opacity: 0, transform: "translateY(28px) scale(.94)" }, { opacity: 1, transform: "none" }],
            { duration: 560, delay: 160 + Math.min(novos++, 8) * 60, easing: EASE, fill: "backwards" });
        }
      });
    }

    new MutationObserver(function () {
      var cards = $$(".card", grid), prev = before;
      before = null;
      if (prev) flip(cards, prev); else cards.forEach(function (c) { rv(c, "pop"); });
    }).observe(grid, { childList: true });
    $$(".card", grid).forEach(function (c) { rv(c, "pop"); });

    // Inclinação 3D e luz que segue o mouse (só com mouse de verdade).
    if (!FINE) return;
    function tilt(container, sel, withTilt, litClass) {
      if (!container) return;
      var cur = null, raf = 0, px = 0, py = 0;
      function apply() {
        raf = 0;
        if (!cur) return;
        var r = cur.getBoundingClientRect(), x = (px - r.left) / r.width, y = (py - r.top) / r.height;
        cur.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        cur.style.setProperty("--my", (y * 100).toFixed(1) + "%");
        if (withTilt) {
          cur.style.setProperty("--rx", ((0.5 - y) * 7).toFixed(2) + "deg");
          cur.style.setProperty("--ry", ((x - 0.5) * 9).toFixed(2) + "deg");
          cur.style.setProperty("--tx", ((x - 0.5) * -16).toFixed(1));
          cur.style.setProperty("--ty", ((y - 0.5) * -12).toFixed(1));
          cur.classList.add("is-tilt");
        } else cur.classList.add(litClass);
      }
      function leave() {
        if (!cur) return;
        cur.classList.remove("is-tilt", litClass || "x");
        ["--rx", "--ry"].forEach(function (p) { cur.style.setProperty(p, "0deg"); });
        ["--tx", "--ty"].forEach(function (p) { cur.style.setProperty(p, "0"); });
        cur = null;
      }
      container.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        var c = e.target.closest(sel);
        if (!c) { leave(); return; }
        if (cur && cur !== c) leave();
        cur = c; px = e.clientX; py = e.clientY;
        if (!raf) raf = requestAnimationFrame(apply);
      });
      container.addEventListener("pointerleave", leave);
    }
    tilt(grid, ".card", true);
    tilt($("#paths"), ".path", false, "is-lit");
  }

  // Indicador que desliza sob o filtro ativo.
  function setupIndicators() {
    function place(box, animate) {
      var on = $('[aria-pressed="true"]', box);
      if (!on || !box.offsetWidth) { box.style.setProperty("--io", "0"); return; }
      if (!animate) box.classList.add("no-tr");
      box.setAttribute("data-ind", "1");
      box.style.setProperty("--ix", on.offsetLeft + "px");
      box.style.setProperty("--iy", on.offsetTop + "px");
      box.style.setProperty("--iw", on.offsetWidth + "px");
      box.style.setProperty("--ih", on.offsetHeight + "px");
      box.style.setProperty("--io", "1");
      if (!animate) { void box.offsetWidth; box.classList.remove("no-tr"); }
      if (box.scrollWidth > box.clientWidth + 2) {
        box.scrollTo({ left: on.offsetLeft - (box.clientWidth - on.offsetWidth) / 2, behavior: animate ? "smooth" : "auto" });
      }
    }
    ["#tabs", "#segs"].forEach(function (sel) {
      var box = $(sel);
      if (!box) return;
      new MutationObserver(function () { place(box, box.hasAttribute("data-ind")); }).observe(box, { childList: true });
      place(box, false);
      window.addEventListener("resize", function () { place(box, false); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { place(box, false); });
    });
  }

  /* ---------------- botões: ondulação e ímã ---------------- */
  function setupButtons() {
    document.addEventListener("pointerdown", function (e) {
      var b = e.target.closest && e.target.closest(".btn");
      if (!b || b.disabled || b.closest(".hero__cta")) return;
      var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2;
      var i = document.createElement("span");
      i.className = "rip";
      i.style.cssText = "width:" + s + "px;height:" + s + "px;left:" + (e.clientX - r.left - s / 2) + "px;top:" + (e.clientY - r.top - s / 2) + "px";
      b.appendChild(i);
      window.setTimeout(function () { if (i.parentNode) i.parentNode.removeChild(i); }, 750);
    });

    if (!FINE) return;
    var els = $$(".topbar .btn, .path__cta .btn");
    els.forEach(function (el) { el.classList.add("mag"); el._tx = 0; el._ty = 0; });
    var mx = -999, my = -999, q = 0;
    function update() {
      q = 0;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > window.innerHeight + 80) return;
        var cx = r.left + r.width / 2 - el._tx, cy = r.top + r.height / 2 - el._ty;
        var dx = mx - cx, dy = my - cy, reach = Math.max(r.width, r.height) * 0.85;
        if (Math.hypot(dx, dy) < reach) {
          el._tx = clamp(dx * 0.22, -9, 9); el._ty = clamp(dy * 0.3, -7, 7);
          el.style.translate = el._tx.toFixed(1) + "px " + el._ty.toFixed(1) + "px";
        } else if (el._tx || el._ty) {
          el._tx = 0; el._ty = 0; el.style.translate = "";
        }
      });
    }
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX; my = e.clientY;
      if (!q) q = requestAnimationFrame(update);
    }, { passive: true });
  }

  /* ---------------- sanfonas (details) com altura animada ---------------- */
  function toggleDetails(d) {
    if (d._a) {
      var wasOpening = d._opening;
      d._a.onfinish = d._a.oncancel = null;
      d._a.cancel(); d._a = null;
      d.style.overflow = "";
      if (!wasOpening) d.open = false;
    }
    var opening = !d.open, h0 = d.offsetHeight, h1;
    if (opening) { d.open = true; h1 = d.offsetHeight; }
    else { d.open = false; h1 = d.offsetHeight; d.open = true; }
    d._opening = opening;
    d.style.overflow = "hidden";
    var a = d._a = d.animate({ height: [h0 + "px", h1 + "px"] }, { duration: 400, easing: EASE });
    a.onfinish = a.oncancel = function () {
      d._a = null; d.style.overflow = "";
      if (!opening) d.open = false;
    };
  }

  /* ---------------- gavetas ---------------- */
  var direction = 0;   // -1 moto anterior, 1 próxima, 0 abertura

  function setupDrawers() {
    var ids = { ficha: "#dlg-ficha", consorcio: "#dlg-consorcio", financiamento: "#dlg-financiamento", contato: "#dlg-contato" };
    var bodies = { ficha: "#dd-body", consorcio: "#dc-body", financiamento: "#df-body", contato: "#dt-body" };
    var list = Object.keys(ids).map(function (k) { return $(ids[k]); }).filter(Boolean);

    // Direção da navegação (setas, teclado, deslize) para a troca de moto vir do lado certo.
    document.addEventListener("click", function (e) {
      var n = e.target.closest && e.target.closest("[data-nav]");
      direction = n ? Number(n.getAttribute("data-nav")) : 0;
    }, true);
    document.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") direction = 1; else if (e.key === "ArrowLeft") direction = -1;
    }, true);
    var sx = 0, sy = 0;
    document.addEventListener("touchstart", function (e) { direction = 0; sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { capture: true, passive: true });
    document.addEventListener("touchend", function (e) {
      var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) >= 70 && Math.abs(dx) >= Math.abs(dy) * 1.5) direction = dx < 0 ? 1 : -1;
    }, { capture: true, passive: true });

    list.forEach(function (d) { wrapDialog(d, list); dragToClose(d); });

    Object.keys(bodies).forEach(function (k) {
      var body = $(bodies[k]), dlg = $(ids[k]);
      if (!body || !dlg) return;
      var revealIn = makeReveal(body);
      new MutationObserver(function (recs) { onMutations(recs, dlg, body, revealIn); })
        .observe(body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "aria-selected", "data-step"], attributeOldValue: true, characterData: true });
    });

    // Sanfonas
    document.addEventListener("click", function (e) {
      var s = e.target.closest && e.target.closest("summary");
      if (!s) return;
      var d = s.parentNode;
      if (!d || !d.matches || !d.matches("details.grp, details.how")) return;
      e.preventDefault();
      toggleDetails(d);
    }, true);
  }

  // Fechar com animação (o app chama d.close(); aqui o fechamento espera a saída terminar).
  function wrapDialog(d, all) {
    var nativeClose = d.close.bind(d), nativeShow = d.showModal ? d.showModal.bind(d) : null;

    function closeFrames() {
      if (MOBILE.matches) {
        var cs = window.getComputedStyle(d).transform;
        return [{ transform: cs && cs !== "none" ? cs : "translateY(0)" }, { transform: "translateY(105%)" }];
      }
      if (d.classList.contains("drawer--sm")) return [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(10px) scale(.97)" }];
      return [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateX(56px)" }];
    }

    function finish() {
      if (!d._closing) return;
      d._closing = false;
      nativeClose();
      if (d._anim) { d._anim.cancel(); d._anim = null; }
      d.style.transform = "";
      d.classList.remove("is-closing", "is-swapped");
    }

    d.close = function (ret) {
      if (!d.open || d._closing) return;
      d._closing = true;
      d.classList.add("is-closing");
      var frames = closeFrames();
      Promise.resolve().then(function () {
        if (!d._closing) return;
        if (d._swapped) { d._swapped = false; finish(); return; }   // outra gaveta abriu por cima: troca direta
        d._anim = d.animate(frames, { duration: 240, easing: "cubic-bezier(.5,0,.9,.4)", fill: "forwards" });
        d._anim.onfinish = finish;
      });
    };

    if (nativeShow) {
      d.showModal = function () {
        var trocando = false;
        all.forEach(function (o) { if (o !== d && o._closing) { o._swapped = true; trocando = true; } });
        if (trocando) d.classList.add("is-swapped");
        nativeShow();
      };
    }

    // Esc também fecha com animação
    d.addEventListener("cancel", function (e) { e.preventDefault(); d.close(); });
  }

  function cancelClosing(d) {
    if (!d._closing) return;
    d._closing = false; d._swapped = false;
    if (d._anim) { d._anim.onfinish = null; d._anim.cancel(); d._anim = null; }
    d.classList.remove("is-closing");
  }

  // Celular: puxar o topo da gaveta para baixo fecha.
  function dragToClose(d) {
    var head = $(".drawer__head", d);
    if (!head) return;
    var id = null, y0 = 0, dy = 0, t0 = 0;
    head.addEventListener("pointerdown", function (e) {
      if (!MOBILE.matches || e.target.closest("button, a")) return;
      id = e.pointerId; y0 = e.clientY; dy = 0; t0 = performance.now();
      try { head.setPointerCapture(id); } catch (err) { /* segue sem captura */ }
      d.classList.add("is-dragging");
    });
    head.addEventListener("pointermove", function (e) {
      if (e.pointerId !== id) return;
      dy = Math.max(0, e.clientY - y0);
      d.style.transform = "translateY(" + dy + "px)";
    });
    function end(e) {
      if (e.pointerId !== id) return;
      id = null;
      d.classList.remove("is-dragging");
      var v = dy / Math.max(1, performance.now() - t0);
      if (dy > 110 || (dy > 40 && v > 0.6)) { d.close(); return; }
      if (dy > 0) d.animate([{ transform: "translateY(" + dy + "px)" }, { transform: "none" }], { duration: 300, easing: EASE });
      d.style.transform = "";
    }
    head.addEventListener("pointerup", end);
    head.addEventListener("pointercancel", end);
  }

  /* ---------------- o que acontece dentro das gavetas ---------------- */
  function onMutations(recs, dlg, body, revealIn) {
    var built = false;
    recs.forEach(function (m) {
      if (m.type === "childList" && m.target === body && m.addedNodes.length) built = true;
    });
    if (built) onBuilt(dlg, body, revealIn);

    recs.forEach(function (m) {
      var t = m.target;
      if (m.type === "childList" && t.id === "dd-stage" && !built) stageSwap(t);
      if (m.type === "attributes") onAttr(m, dlg);
      if ((m.type === "childList" || m.type === "characterData") && !built) {
        var host = m.type === "characterData" ? t.parentNode : t;
        if (host && host.id === "out-val") tweenMoney(host, dlg);
        if (host && host.classList && host.classList.contains("err") && host.textContent) shake(host);
      }
    });
  }

  function onBuilt(dlg, body, revealIn) {
    cancelClosing(dlg);
    var dir = direction; direction = 0;

    Array.prototype.slice.call(body.children).forEach(function (c, i) {
      c.animate([
        { opacity: 0, transform: dir ? "translateX(" + dir * 44 + "px)" : "translateY(20px)" },
        { opacity: 1, transform: "none" }
      ], { duration: 520, delay: (dir ? 0 : 110) + i * 55, easing: EASE, fill: "backwards" });
    });
    if (dir) {
      $$(".drawer__head h2, .drawer__kicker", dlg).forEach(function (h) {
        h.animate([{ opacity: 0, transform: "translateX(" + dir * 30 + "px)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: EASE });
      });
    }

    $$(".facts b", body).forEach(function (b, i) { var n = lastText(b); if (n) countNode(n, 260 + i * 70, 800); });
    $$(".destaques li", body).forEach(function (li) { revealIn(li, "left"); });
    var out = $("#out-val", body);
    if (out) tweenMoney(out, dlg);
    placeTabs2(body, false);
  }

  function placeTabs2(body, animate) {
    var box = $(".tabs2", body);
    if (!box) return;
    var on = $('[aria-selected="true"]', box);
    if (!on || !box.offsetWidth) return;
    if (!animate) box.classList.add("no-tr");
    box.style.setProperty("--ix", on.offsetLeft + "px");
    box.style.setProperty("--iw", on.offsetWidth + "px");
    if (!animate) { void box.offsetWidth; box.classList.remove("no-tr"); }
  }

  function onAttr(m, dlg) {
    var t = m.target, name = m.attributeName;
    if (name === "aria-selected" && t.hasAttribute("data-tab")) { placeTabs2(dlg, true); return; }
    if (name === "hidden" && !t.hasAttribute("hidden")) {
      if (t.id === "pn-resumo" || t.id === "pn-ficha") {
        t.animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: EASE });
      } else if (t.id === "fin-ok") {
        t.animate([{ opacity: 0, transform: "scale(.92)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: EASE });
        confetti(dlg, $("#fin-next", dlg) || t);
        window.setTimeout(function () { try { t.style.scrollMarginBottom = "28px"; t.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) { /* segue */ } }, 500);
      } else if (t.classList.contains("err")) shake(t);
      return;
    }
    if (name === "data-step") {
      var from = Number(m.oldValue) || 1, to = Number(t.getAttribute("data-step")) || 1;
      var panel = $("[data-panel]:not([hidden])", t);
      if (panel && from !== to) {
        var dir = to > from ? 1 : -1;
        panel.animate([{ opacity: 0, transform: "translateX(" + dir * 34 + "px)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: EASE });
      }
    }
  }

  // Troca de foto na galeria: entra com leve zoom.
  function stageSwap(stage) {
    var el = $(".pic img", stage) || stage.firstElementChild;
    if (!el) return;
    var img = el.tagName === "IMG";
    el.animate(img
      ? [{ opacity: 0, transform: "scale(1.08) translateX(18px)" }, { opacity: 1, transform: "none" }]
      : [{ opacity: 0 }, { opacity: 1 }], { duration: 480, easing: EASE });
  }

  // Parcela: rola do valor anterior até o novo.
  function tweenMoney(el, dlg) {
    var txt = el.textContent;
    if (txt === el._w) return;                            // fui eu que escrevi
    var digitsOnly = txt.replace(/[^\d,]/g, "").replace(",", ".");
    var n = digitsOnly ? parseFloat(digitsOnly) : NaN;
    if (isNaN(n)) { el._num = undefined; el._w = txt; return; }
    var first = el._num === undefined;
    var from = first ? 0 : (el._cur !== undefined ? el._cur : el._num);
    el._num = n;
    var box = el.closest(".out");
    if (box) box.setAttribute("aria-live", "off");
    var t0 = 0, token = el._tk = (el._tk || 0) + 1;
    function fmt(v) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/\u00a0/g, " "); }
    function step(t) {
      if (el._tk !== token) return;
      if (!t0) t0 = t;
      var p = clamp((t - t0) / 650, 0, 1);
      if (p >= 1) {
        el._w = txt; el._cur = n; el.textContent = txt;
        announce("Parcela de referência: " + txt);
        return;
      }
      el._cur = from + (n - from) * easeOut(p);
      var s = fmt(el._cur);
      el._w = s; el.textContent = s;
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    if (!first && box) {
      box.animate([{ boxShadow: "0 0 0 0 rgba(255,184,28,.75)" }, { boxShadow: "0 0 0 16px rgba(255,184,28,0)" }], { duration: 650, easing: "ease-out" });
    }
  }

  function shake(el) {
    if (el._sh) return;
    el._sh = true;
    el.animate([{ transform: "translateX(0)" }, { transform: "translateX(-9px)" }, { transform: "translateX(8px)" }, { transform: "translateX(-5px)" }, { transform: "translateX(3px)" }, { transform: "none" }], { duration: 420, easing: "ease-out" })
      .onfinish = function () { el._sh = false; };
  }

  function confetti(dlg, anchor) {
    var r = dlg.getBoundingClientRect(), a = anchor.getBoundingClientRect();
    var ox = a.left - r.left + a.width / 2, oy = a.top - r.top + a.height / 2;
    var cores = ["#2140e8", "#ffb81c", "#0a0f2e", "#5a73ff", "#ffd67a"];
    var box = document.createElement("div");
    box.className = "confetti"; box.setAttribute("aria-hidden", "true");
    for (var i = 0; i < 28; i++) {
      var p = document.createElement("i");
      p.style.cssText = "left:" + ox + "px;top:" + oy + "px;background:" + cores[i % cores.length];
      box.appendChild(p);
      var ang = (-90 + (Math.random() - 0.5) * 150) * Math.PI / 180, dist = 110 + Math.random() * 190;
      var ux = Math.cos(ang) * dist, uy = Math.sin(ang) * dist, fall = 150 + Math.random() * 130, rot = Math.random() * 900 - 450;
      function tf(fx, fy, fr) { return "translate(" + (ux * fx).toFixed(0) + "px," + (uy + fall * fy).toFixed(0) + "px) rotate(" + (rot * fr).toFixed(0) + "deg)"; }
      p.animate([
        { transform: "translate(0,0) rotate(0deg)", opacity: 1, offset: 0, easing: "cubic-bezier(.1,.7,.3,1)" },
        { transform: tf(1, 0, 0.4), opacity: 1, offset: 0.4, easing: "cubic-bezier(.45,0,.85,.6)" },
        { transform: tf(1.08, 0.62, 0.8), opacity: 1, offset: 0.8 },
        { transform: tf(1.12, 1, 1), opacity: 0, offset: 1 }
      ], { duration: 1500 + Math.random() * 600, fill: "forwards" });
    }
    dlg.appendChild(box);
    window.setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 2300);
  }

  /* ---------------- início ---------------- */
  setupScroll();
  setupHero();
  setupMarquee();
  setupReveals();
  setupGrid();
  setupIndicators();
  setupButtons();
  setupDrawers();
})();
