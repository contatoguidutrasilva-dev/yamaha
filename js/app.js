/* Site de vendedor Yamaha — comportamento da página (JS puro, sem dependências).
 * Tudo que é específico do cliente vem de js/config.js. */
(function () {
  "use strict";

  var SITE = window.SITE || {};
  var CONS = window.CONSORCIO || {};
  var CATS = window.CATEGORIAS || [];
  var OCULTAR = SITE.ocultar || [];
  var MOTOS = (window.MOTOS || []).filter(function (m) { return OCULTAR.indexOf(m.id) < 0; });

  var state = { cat: "Todas", faixa: "todas", currentId: null, contato: null };

  /* ---------------- voz e nomes (vêm do config.js) ---------------- */
  var EU = Boolean(SITE.vendedor);                       // site de vendedor fala em 1ª pessoa
  function titulo() { return SITE.vendedor || SITE.loja || "Motos Yamaha"; }
  function primeiroNome() { return String(SITE.vendedor || "").trim().split(/\s+/)[0]; }
  var PARA_QUEM = EU ? primeiroNome() : "a loja";
  function voz(euTxt, lojaTxt) { return EU ? euTxt : lojaTxt; }

  /* ---------------- helpers ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function esc(v) {
    return String(v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function digits(v) { return String(v || "").replace(/\D/g, ""); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function waHref(text) {
    return "https://wa.me/" + digits(SITE.whatsapp) + "?text=" + encodeURIComponent(text);
  }

  function setWa(a, text) {
    a.setAttribute("data-wa", text);
    a.href = waHref(text);
  }

  function waLink(text, cls, inner, id) {
    return '<a' + (id ? ' id="' + id + '"' : "") + ' class="' + cls + '" target="_blank" rel="noopener" data-wa="' + esc(text) + '" href="' + esc(waHref(text)) + '">' + inner + "</a>";
  }

  function icon(id) { return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }

  function brl(n) {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/ /g, " ");
  }

  function fmtTel(v) {
    var d = digits(v);
    if (d.indexOf("55") === 0 && d.length > 11) d = d.slice(2);
    if (d.length === 11) return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
    if (d.length === 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return d;
  }

  function handleIG() { return SITE.instagram ? String(SITE.instagram).replace(/^@/, "") : ""; }

  function findMoto(id) {
    for (var i = 0; i < MOTOS.length; i++) if (MOTOS[i].id === id) return MOTOS[i];
    return null;
  }

  function store(action, key, value) {
    try {
      if (action === "get") return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) { /* armazenamento bloqueado: segue sem persistir */ }
    return null;
  }

  function openLink(url) {
    var a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---------------- dados da moto ---------------- */
  function fato(m, rotulo) {
    var g = m.ficha || [];
    for (var i = 0; i < g.length; i++) {
      for (var j = 0; j < g[i].itens.length; j++) if (g[i].itens[j][0] === rotulo) return g[i].itens[j][1];
    }
    return "";
  }

  function curto(v) { return String(v || "").replace(/\s*\(.*$/, "").trim(); }

  function potencia(m) { return curto(fato(m, "Potência máxima") || fato(m, "Potência (gasolina)") || fato(m, "Potência nominal")); }

  function ccNum(m) {
    var d = String(m.cilindrada || "").replace(/\D/g, "");
    return d ? parseInt(d, 10) : null;
  }

  /* ---------------- métricas e leads ---------------- */
  var FB_STD = { lead_financiamento: "Lead", lead_contato: "Contact" };

  function track(evento, dados) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: evento }, dados || {}));
    if (window.fbq) {
      if (FB_STD[evento]) window.fbq("track", FB_STD[evento], dados || {});
      else window.fbq("trackCustom", evento, dados || {});
    }
  }

  function loadTracking() {
    if (loadTracking.done) return;
    loadTracking.done = true;

    if (/^GTM-[A-Z0-9]+$/.test(SITE.gtm || "")) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
      var g = document.createElement("script");
      g.async = true; g.src = "https://www.googletagmanager.com/gtm.js?id=" + SITE.gtm;
      document.head.appendChild(g);
    }

    if (/^\d{8,20}$/.test(SITE.metaPixel || "")) {
      var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!window._fbq) window._fbq = n;
      n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      var f = document.createElement("script");
      f.async = true; f.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(f);
      window.fbq("init", SITE.metaPixel);
      window.fbq("track", "PageView");
    }
  }

  function sendLead(tipo, dados) {
    if (!SITE.leadEndpoint) return;
    var body = JSON.stringify(Object.assign({
      tipo: tipo,
      pagina: location.href.split("#")[0],
      data: new Date().toISOString()
    }, dados));
    try {
      // text/plain evita o preflight de CORS; o endpoint lê o corpo como texto e faz JSON.parse.
      window.fetch(SITE.leadEndpoint, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain;charset=UTF-8" }, body: body });
    } catch (e) { /* lead perdido não pode travar o WhatsApp */ }
  }

  /* ---------------- imagem / avatar ---------------- */
  var PLACEHOLDER = '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="44" r="8"/><circle cx="52" cy="44" r="8"/><path d="M12 44l14-10h14l6-12M40 34l12 10M42 22h9"/></svg>';

  function picHTML(m, idx, eager) {
    var src = m.imgs && m.imgs[idx || 0];
    if (!src) {
      return '<span class="pic pic--vazio" role="img" aria-label="Foto da ' + esc(m.nome) + ' em breve">' + PLACEHOLDER + "<em>Foto em breve</em></span>";
    }
    return '<span class="pic"><img src="' + esc(src) + '" alt="' + esc(m.nome) + '" width="500" height="500" decoding="async"' + (eager ? "" : ' loading="lazy"') + "></span>";
  }

  // Foto do vendedor tem prioridade; depois a logo da loja; depois o ícone padrão.
  function avatarHTML(alt) {
    var src = SITE.foto || SITE.logo;
    return src ? '<img class="' + (SITE.foto ? "is-foto" : "is-logo") + '" src="' + esc(src) + '" alt="' + esc(alt || "") + '">' : PLACEHOLDER;
  }

  /* ---------------- abertura, cabeçalho, rodapé, mapa ---------------- */
  function setupSite() {
    var cidadeBarra = [SITE.cidade, SITE.uf].filter(Boolean).join("/");
    var cidadeUf = [SITE.cidade, SITE.uf].filter(Boolean).join(" · ");

    $("#titulo").textContent = titulo();
    $("#tb-nome").textContent = titulo();
    $("#eyebrow").textContent = [EU ? (SITE.loja || "Motos Yamaha") : "Motos Yamaha", cidadeBarra].filter(Boolean).join(" · ");
    $("#bio").textContent = SITE.bio || voz(
      "Eu cuido do seu atendimento do começo ao fim: você escolhe a moto, simula consórcio ou financiamento e fecha tudo pelo WhatsApp.",
      "Escolha sua Yamaha, simule consórcio ou financiamento e resolva tudo pelo WhatsApp.");
    $("#cta-label").textContent = voz("Falar comigo", "Chamar no WhatsApp");
    $("#sticky-label").textContent = voz("Falar com " + primeiroNome(), "Chamar no WhatsApp");
    $("#dt-title").textContent = "Fale com " + PARA_QUEM;
    $("#rodape-nome").textContent = titulo();
    $("#rodape-loc").textContent = [EU ? SITE.loja : "", cidadeBarra].filter(Boolean).map(function (t) { return " · " + t; }).join("");

    $("#tb-avatar").innerHTML = avatarHTML();
    if (EU) {
      $("#who").hidden = false;
      $("#who-avatar").innerHTML = avatarHTML(SITE.vendedor);
      $("#who-nome").textContent = SITE.vendedor;
    }

    $("#facts").innerHTML = [
      MOTOS.length + " modelos Yamaha",
      "Consórcio e financiamento",
      SITE.cidade ? "Atendimento em " + SITE.cidade : "Atendimento no WhatsApp"
    ].map(function (t) { return "<li>" + icon("check") + esc(t) + "</li>"; }).join("");

    document.title = (titulo() === "Motos Yamaha" ? "" : titulo() + " | ") + "Motos Yamaha" + (SITE.cidade ? " em " + SITE.cidade : "");
    var desc = "Escolha sua Yamaha" + (SITE.cidade ? " em " + SITE.cidade + " e região" : "") + ": NMAX, Fazer, Crosser, Lander, MT, R3 e mais. Simule consórcio e financiamento e fale direto no WhatsApp.";
    [["meta[name='description']", desc], ["meta[property='og:description']", desc],
     ["meta[property='og:title']", titulo() + " | Sua próxima Yamaha"]].forEach(function (p) {
      var m = $(p[0]); if (m) m.setAttribute("content", p[1]);
    });

    $$("[data-wa]").forEach(function (a) { setWa(a, a.getAttribute("data-wa")); });

    var ig = handleIG();
    $$("[data-instagram]").forEach(function (a) {
      if (!ig) return;
      a.href = "https://instagram.com/" + ig;
      a.hidden = false;
    });

    var tel = digits(SITE.telefone);
    $$("[data-tel]").forEach(function (a) {
      if (!tel) return;
      a.href = "tel:+" + (tel.indexOf("55") === 0 ? tel : "55" + tel);
      a.hidden = false;
      var txt = $("[data-tel-text]", a);
      if (txt) txt.textContent = fmtTel(tel);
    });
    if (tel) $("#row-tel").hidden = false;

    if (SITE.comoChegar) {
      $$("[data-route]").forEach(function (a) { a.href = SITE.comoChegar; a.hidden = false; });
    }

    // "Onde estamos" só aparece se houver o que mostrar (endereço, mapa ou cidade).
    if (SITE.endereco || SITE.mapaEmbed || SITE.cidade) {
      $("#onde").hidden = false;
      $$("[data-onde]").forEach(function (a) { a.hidden = false; });
      $("#where-city").textContent = cidadeUf;
      $("#where-city").hidden = !cidadeUf;
      if (SITE.endereco) { $("#addr").textContent = SITE.endereco; $("#row-addr").hidden = false; }
      if (SITE.horario) { $("#hours").textContent = SITE.horario; $("#row-hours").hidden = false; }
      $("#where-note").textContent = (SITE.atendimento || (SITE.cidade ? "Atendemos " + SITE.cidade + " e região." : "")) + " Prefere conversar antes de vir? Chame no WhatsApp.";
      var query = [SITE.endereco, SITE.cidade, SITE.uf].filter(Boolean).join(", ");
      $("#map").src = SITE.mapaEmbed || "https://www.google.com/maps?q=" + encodeURIComponent(query) + "&output=embed";
    }

    var ld = $("#ld");
    if (ld) {
      try {
        var d = JSON.parse(ld.textContent);
        d.name = EU && SITE.loja ? SITE.vendedor + " — " + SITE.loja : titulo();
        if (SITE.endereco) d.address.streetAddress = SITE.endereco;
        if (SITE.cidade) { d.address.addressLocality = SITE.cidade; d.areaServed = [SITE.cidade]; }
        if (SITE.uf) d.address.addressRegion = SITE.uf;
        if (SITE.telefone || SITE.whatsapp) d.telephone = "+" + (digits(SITE.telefone) || digits(SITE.whatsapp));
        if (ig) d.sameAs = ["https://instagram.com/" + ig];
        ld.textContent = JSON.stringify(d);
      } catch (e) { /* JSON-LD estático continua valendo */ }
    }
  }

  // Moto em destaque na abertura: a do config (SITE.destaque), senão a NMAX, senão a primeira com foto.
  function setupHero() {
    var m = findMoto(SITE.destaque) || findMoto("nmax-abs") || MOTOS.filter(function (x) { return x.imgs && x.imgs.length; })[0];
    if (!m) { $("#stage").hidden = true; return; }
    var btn = $("#hero-moto");
    btn.setAttribute("data-id", m.id);
    btn.setAttribute("aria-label", "Ver ficha da " + m.nome);
    btn.innerHTML = picHTML(m, 0, true);
    $("#hero-tag").innerHTML = "<small>Em destaque</small><b>" + esc(m.nome) + "</b>";
  }

  /* ---------------- vitrine ---------------- */
  var FAIXAS = [
    { k: "todas", t: "Todas as cilindradas" },
    { k: "ate160", t: "Até 160 cc", ok: function (n) { return n !== null && n <= 160; } },
    { k: "161a400", t: "161 a 400 cc", ok: function (n) { return n !== null && n > 160 && n <= 400; } },
    { k: "acima400", t: "Acima de 400 cc", ok: function (n) { return n !== null && n > 400; } },
    { k: "eletrica", t: "Elétrica", ok: function (n, m) { return /létric/i.test(m.cilindrada || ""); } }
  ];

  function faixaDef(k) { return FAIXAS.filter(function (f) { return f.k === k; })[0] || FAIXAS[0]; }

  function filtrar(cat, faixa) {
    var f = faixaDef(faixa);
    return MOTOS.filter(function (m) {
      return (cat === "Todas" || m.categoria === cat) && (!f.ok || f.ok(ccNum(m), m));
    });
  }

  function visibleMotos() { return filtrar(state.cat, state.faixa); }

  function renderFilters() {
    var present = CATS.filter(function (c) { return MOTOS.some(function (m) { return m.categoria === c; }); });
    $("#tabs").innerHTML = ["Todas"].concat(present).map(function (c) {
      var n = filtrar(c, state.faixa).length;
      return '<button type="button" class="tab" data-cat="' + esc(c) + '" aria-pressed="' + (c === state.cat) + '"' +
        (n === 0 && c !== state.cat ? " disabled" : "") + ">" + esc(c) + " <em>" + n + "</em></button>";
    }).join("");

    var faixas = FAIXAS.filter(function (f) { return f.k === "todas" || filtrar("Todas", f.k).length > 0; });
    $("#segs").hidden = faixas.length < 3;
    $("#segs").innerHTML = faixas.map(function (f) {
      var n = filtrar(state.cat, f.k).length;
      return '<button type="button" class="seg__btn" data-faixa="' + f.k + '" aria-pressed="' + (f.k === state.faixa) + '"' +
        (n === 0 && f.k !== state.faixa ? " disabled" : "") + ">" + esc(f.t) + "</button>";
    }).join("");
  }

  function renderGrid() {
    var list = visibleMotos();
    $("#empty").hidden = list.length > 0;
    $("#count").textContent = list.length + (list.length === 1 ? " moto" : " motos");
    $("#grid").innerHTML = list.map(function (m) {
      var chips = [m.cilindrada, potencia(m), fato(m, "Peso")].filter(Boolean).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
      return '<article class="card" data-id="' + esc(m.id) + '">' +
        '<button type="button" class="card__stage" data-open="ficha" aria-label="Ver ficha da ' + esc(m.nome) + '">' +
          '<span class="card__cat">' + esc(m.categoria) + "</span>" + picHTML(m) + "</button>" +
        '<div class="card__body">' +
          '<h3 class="card__name"><button type="button" data-open="ficha">' + esc(m.nome) + "</button></h3>" +
          (chips ? '<ul class="card__facts">' + chips + "</ul>" : "") +
          '<div class="card__actions">' +
            '<button type="button" class="btn btn--line btn--sm" data-open="consorcio">Consórcio</button>' +
            '<button type="button" class="btn btn--line btn--sm" data-open="financiamento">Financiar</button>' +
          "</div>" +
          '<button type="button" class="card__more" data-open="ficha">Ver ficha ' + icon("arrow") + "</button>" +
        "</div></article>";
    }).join("");
  }

  function refresh() { renderFilters(); renderGrid(); }

  /* ---------------- gavetas ---------------- */
  var dlgs = {
    ficha: $("#dlg-ficha"), consorcio: $("#dlg-consorcio"), financiamento: $("#dlg-financiamento"), contato: $("#dlg-contato")
  };
  var MOTO_DLGS = ["ficha", "consorcio", "financiamento"];
  var SWIPE_DLGS = ["ficha", "consorcio"];

  // stack = true: abre por cima do que já está aberto (contato); senão troca de gaveta.
  function showDlg(name, stack) {
    if (!stack) Object.keys(dlgs).forEach(function (k) { if (k !== name && dlgs[k].open) dlgs[k].close(); });
    var d = dlgs[name];
    if (!d.open) { if (d.showModal) d.showModal(); else d.setAttribute("open", ""); }
    document.body.classList.add("is-locked");
  }

  function syncLock() {
    document.body.classList.toggle("is-locked", Object.keys(dlgs).some(function (k) { return dlgs[k].open; }));
  }

  function setHash(id) {
    try { history.replaceState(null, "", id ? "#moto=" + id : location.pathname + location.search); } catch (e) { /* file:// */ }
  }

  function openModal(name, id) {
    var m = findMoto(id);
    if (!m) return;
    state.currentId = id;
    if (name === "ficha") { buildFicha(m); setHash(id); }
    if (name === "consorcio") buildConsorcio(m);
    if (name === "financiamento") buildFinanciamento(m);
    showDlg(name);
    var body = $(".drawer__body", dlgs[name]);
    if (body) body.scrollTop = 0;
    track("abrir_" + name, { moto: m.nome });
  }

  function currentDlgName() {
    for (var i = 0; i < MOTO_DLGS.length; i++) if (dlgs[MOTO_DLGS[i]].open) return MOTO_DLGS[i];
    return null;
  }

  function goNeighbor(step) {
    var name = currentDlgName();
    var list = visibleMotos();
    var idx = -1;
    for (var i = 0; i < list.length; i++) if (list[i].id === state.currentId) idx = i;
    if (idx < 0) {
      // moto aberta por link direto fora do filtro ativo: navega pela lista completa
      list = MOTOS;
      for (var j = 0; j < list.length; j++) if (list[j].id === state.currentId) idx = j;
    }
    if (!name || idx < 0 || !list.length) return;
    openModal(name, list[(idx + step + list.length) % list.length].id);
  }

  /* ---- ficha ---- */
  function buildFicha(m) {
    $("#dd-title").textContent = m.nome;
    $("#dd-kicker").textContent = [m.categoria, m.ano ? "Modelo " + m.ano : ""].filter(Boolean).join(" · ");
    var imgs = m.imgs || [];

    var strip = "";
    if (imgs.length > 1 || m.video) {
      strip = '<div class="gal__thumbs" role="group" aria-label="Fotos e vídeo">' +
        (imgs.length > 1 ? imgs.map(function (src, i) {
          return '<button type="button" data-thumb="' + i + '" aria-label="Foto ' + (i + 1) + '"' + (i === 0 ? ' aria-current="true"' : "") + '><img src="' + esc(src) + '" alt="" loading="lazy"></button>';
        }).join("") : "") +
        (m.video ? '<button type="button" class="thumb-video" data-video="' + esc(m.video) + '" aria-label="Assistir ao vídeo da ' + esc(m.nome) + '">' + icon("play") + "<span>Vídeo</span></button>" : "") +
        "</div>";
    }

    var pares = [
      [/létric/i.test(m.cilindrada || "") ? "Motor" : "Cilindrada", m.cilindrada],
      ["Potência", potencia(m)], ["Torque", curto(fato(m, "Torque máximo"))], ["Peso", fato(m, "Peso")]
    ].filter(function (p) { return p[1]; });

    var destaques = (m.destaques || []).map(function (d, i) {
      return '<li><span class="num">' + pad(i + 1) + "</span><div><h4>" + esc(d.t) + "</h4><p>" + esc(d.d) + "</p></div></li>";
    }).join("");

    var grupos = (m.ficha || []).map(function (g, i) {
      return '<details class="grp"' + (i === 0 ? " open" : "") + "><summary>" + esc(g.grupo) + '</summary><table class="specs"><tbody>' +
        g.itens.map(function (r) { return "<tr><th>" + esc(r[0]) + "</th><td>" + esc(r[1]) + "</td></tr>"; }).join("") +
        "</tbody></table></details>";
    }).join("");

    $("#dd-body").innerHTML =
      '<div class="gal"><div class="stage" id="dd-stage">' + picHTML(m, 0, true) + "</div>" + strip + "</div>" +
      (pares.length ? '<ul class="facts">' + pares.map(function (p) { return "<li><small>" + esc(p[0]) + "</small><b>" + esc(p[1]) + "</b></li>"; }).join("") + "</ul>" : "") +
      '<div class="tabs2" role="tablist" aria-label="Conteúdo da ficha">' +
        '<button type="button" role="tab" id="tab-resumo" aria-selected="true" aria-controls="pn-resumo" data-tab="resumo">Resumo</button>' +
        '<button type="button" role="tab" id="tab-ficha" aria-selected="false" aria-controls="pn-ficha" data-tab="ficha">Ficha técnica</button>' +
      "</div>" +
      '<div id="pn-resumo" role="tabpanel" aria-labelledby="tab-resumo">' +
        (destaques ? '<ol class="destaques">' + destaques + "</ol>" : '<p class="hint">Peça o resumo desta moto pelo WhatsApp.</p>') + "</div>" +
      '<div id="pn-ficha" role="tabpanel" aria-labelledby="tab-ficha" hidden>' + (grupos || '<p class="hint">Ficha técnica em breve.</p>') + "</div>" +
      '<p class="note">Imagens ilustrativas. Informações técnicas conforme a Yamaha Motor do Brasil, sujeitas a alteração sem aviso prévio. Cores, equipamentos e valores: confirme no atendimento.</p>';

    var msg = "Olá! Vi a " + m.nome + " no seu site e quero saber mais.";
    $("#dd-bar").innerHTML =
      '<button type="button" class="btn btn--line" data-open="consorcio">Consórcio</button>' +
      '<button type="button" class="btn btn--line" data-open="financiamento">Financiar</button>' +
      waLink(msg, "btn btn--wa", icon("wa") + "WhatsApp");
  }

  function selectTab(name) {
    $$("[data-tab]").forEach(function (b) { b.setAttribute("aria-selected", String(b.getAttribute("data-tab") === name)); });
    $("#pn-resumo").hidden = name !== "resumo";
    $("#pn-ficha").hidden = name !== "ficha";
  }

  function showVideo(id) {
    $("#dd-stage").innerHTML = '<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
      '?autoplay=1&rel=0" title="Vídeo da moto" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>';
    $$("[data-thumb]").forEach(function (b) { b.removeAttribute("aria-current"); });
    $(".thumb-video").setAttribute("aria-current", "true");
  }

  /* ---- "Como funciona" (usado nas gavetas e na seção Como comprar) ---- */
  var INFO = {
    consorcio: {
      titulo: "Consórcio", ideal: "Ideal para quem planeja e não tem pressa",
      resumo: "Sem juros: você paga parcelas mensais mais a taxa de administração e concorre à contemplação por sorteio ou lance.",
      how: "Entenda o consórcio",
      passos: [
        "Você entra em um grupo e paga a parcela todo mês. Não há juros; há taxa de administração.",
        "Todo mês o grupo tem contemplação: por sorteio ou por lance.",
        "Contemplado, você usa o crédito para comprar a moto que escolheu.",
        "Prazo e parcela dependem do grupo — " + voz("eu explico", "a gente explica") + " as opções na conversa."
      ],
      nota: "Valores e condições seguem as regras da administradora do consórcio.",
      videoId: "videoConsorcio", linkKey: "consorcioOficial", linkTxt: "Conhecer o Consórcio Yamaha"
    },
    financiamento: {
      titulo: "Financiamento", ideal: "Ideal para quem quer rodar logo",
      resumo: "Você dá uma entrada, " + voz("eu consulto", "a loja consulta") + " as condições no mercado e você escolhe a parcela que cabe.",
      how: "Entenda o financiamento",
      passos: [
        "Você conta a entrada e seus dados básicos (leva dois minutos).",
        voz("Eu consulto", "A loja consulta") + " as condições para a moto que você escolheu.",
        "Com o crédito aprovado, você escolhe prazo e parcela e retira a moto.",
        "Sem entrada? Deixe o campo em branco — dá para simular do mesmo jeito."
      ],
      nota: "Sujeito à análise e à aprovação de crédito.",
      videoId: "videoFinanciamento", linkKey: "financiamentoOficial", linkTxt: "Conhecer o LiberaCRED Yamaha"
    },
    repasse: {
      titulo: "Repasse de cota", ideal: "Ideal para quem quer ganhar tempo",
      resumo: "Assuma uma cota de consórcio que já está andando. Consulte o que está disponível agora.",
      how: "Como funciona o repasse",
      passos: [
        "Você diz qual moto quer e qual parcela cabe no seu bolso.",
        voz("Eu procuro", "A gente procura") + " cotas em andamento que combinem com isso.",
        "Você confere valores e regras da transferência antes de decidir."
      ],
      nota: "Disponibilidade e regras dependem da administradora."
    }
  };

  function howHTML(key) {
    var i = INFO[key];
    var vid = i.videoId ? SITE[i.videoId] : "";
    var url = i.linkKey ? SITE[i.linkKey] : "";
    return '<details class="how"><summary>' + esc(i.how) + "</summary><div class=\"how__body\">" +
      (vid ? '<div class="video" data-yt="' + esc(vid) + '"></div>' : "") +
      '<ol class="passos">' + i.passos.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ol>" +
      '<p class="legal">' + esc(i.nota) + "</p>" +
      (url ? '<a class="link" href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(i.linkTxt) + " " + icon("arrow") + "</a>" : "") +
      "</div></details>";
  }

  function renderCaminhos() {
    $("#paths").innerHTML = ["consorcio", "financiamento", "repasse"].map(function (k, n) {
      var i = INFO[k];
      var cta = k === "repasse"
        ? waLink("Olá! Vim pelo seu site e quero saber sobre repasse de consórcio.", "btn btn--amber btn--sm", "Consultar cotas " + icon("arrow"))
        : '<a class="btn btn--amber btn--sm" href="#vitrine">Escolher a moto ' + icon("arrow") + "</a>";
      return '<article class="path"><span class="path__no">' + pad(n + 1) + "</span>" +
        "<h3>" + esc(i.titulo) + '</h3><p class="path__ideal">' + esc(i.ideal) + "</p>" +
        "<p>" + esc(i.resumo) + "</p>" + howHTML(k) + '<div class="path__cta">' + cta + "</div></article>";
    }).join("");
  }

  /* ---- consórcio ---- */
  function tiers(m) {
    var c = CONS[m.id], out = [];
    if (!c) return out;
    if (c.sem) out.push({ key: "sem", titulo: "Sem emplacamento", plano: c.sem });
    if (c.com) out.push({ key: "com", titulo: "Com emplacamento", plano: c.com });
    return out;
  }

  function radioChip(name, value, text, checked, disabled) {
    return '<label><input type="radio" name="' + name + '" value="' + value + '"' + (checked ? " checked" : "") + (disabled ? " disabled" : "") + "><span>" + text + "</span></label>";
  }

  function buildConsorcio(m) {
    $("#dc-title").textContent = m.nome;
    var t = tiers(m), corpo;

    if (t.length) {
      corpo =
        (t.length > 1 ? '<fieldset class="fset"><legend>Emplacamento</legend><div class="radios radios--seg">' +
          t.map(function (x, i) { return radioChip("tier", x.key, x.titulo, i === 0); }).join("") + "</div></fieldset>" : "") +
        '<fieldset class="fset"><legend>Prazo</legend><div class="radios" id="prazos"></div></fieldset>' +
        '<div class="out" aria-live="polite"><small>Parcela de referência</small><strong id="out-val">—</strong><span id="out-sub"></span></div>';
    } else {
      corpo =
        '<fieldset class="fset"><legend>Prazo de interesse <em>(opcional)</em></legend><div class="radios">' +
          (SITE.prazosConsorcio || []).map(function (p) { return radioChip("prazo", p, p + "x"); }).join("") + "</div></fieldset>" +
        '<div class="out out--soft"><small>Simulação sob medida</small><strong>Vamos calcular pra você</strong>' +
          "<span>" + voz("Eu monto", "A gente monta") + " a simulação com o crédito e o prazo que cabem no seu bolso.</span></div>";
    }

    $("#dc-body").innerHTML =
      '<div class="mini"><span class="mini__pic">' + picHTML(m, 0, true) + '</span><div><b>' + esc(m.nome) + "</b><span>" + esc([m.categoria, m.cilindrada].filter(Boolean).join(" · ")) + "</span></div></div>" +
      corpo +
      '<p class="legal">Valores de referência. A parcela final depende do grupo, do crédito e da administradora.</p>' +
      howHTML("consorcio");

    $("#dc-bar").innerHTML =
      waLink("Olá! Quero simular o consórcio da " + m.nome + ".", "btn btn--wa btn--block", icon("wa") + "Pedir esta simulação no WhatsApp", "dc-wa") +
      waLink("Olá! Quero falar sobre repasse de consórcio para a " + m.nome + ".", "btn btn--line btn--block", "Tenho interesse em repasse de cota");

    if (t.length) renderPrazos(m);
    refreshSim(m);
  }

  function renderPrazos(m) {
    var box = $("#prazos"), t = tiers(m);
    if (!box || !t.length) return;
    var tierEl = $("input[name='tier']:checked", $("#dc-body"));
    var plano = (t.filter(function (x) { return x.key === (tierEl ? tierEl.value : t[0].key); })[0] || t[0]).plano;
    var todos = {};
    t.forEach(function (x) { Object.keys(x.plano).forEach(function (p) { todos[p] = 1; }); });
    var prazos = Object.keys(todos).map(Number).sort(function (a, b) { return b - a; });
    var atual = $("input[name='prazo']:checked", box);
    var escolhido = atual && plano[atual.value] ? Number(atual.value) : prazos.filter(function (p) { return plano[p]; })[0];
    box.innerHTML = prazos.map(function (p) { return radioChip("prazo", p, p + "x", p === escolhido, !plano[p]); }).join("");
  }

  function refreshSim(m) {
    var msg = "Olá! Quero simular o consórcio da " + m.nome + ".";
    var body = $("#dc-body"), t = tiers(m);
    var pr = $("input[name='prazo']:checked", body);
    if (t.length) {
      var tierEl = $("input[name='tier']:checked", body);
      var x = t.filter(function (y) { return y.key === (tierEl ? tierEl.value : t[0].key); })[0] || t[0];
      var v = pr ? x.plano[pr.value] : null;
      if (v) {
        var txt = pr.value + "x de " + brl(Number(v));
        $("#out-val").textContent = brl(Number(v));
        $("#out-sub").textContent = "por mês, em " + pr.value + "x" + (t.length > 1 ? " · " + x.titulo.toLowerCase() : "");
        msg += " Simulação escolhida: " + txt + (t.length > 1 ? " (" + x.titulo.toLowerCase() + ")" : "") + ".";
      }
    } else if (pr) {
      msg += " Prazo de interesse: " + pr.value + "x.";
    }
    setWa($("#dc-wa"), msg);
  }

  /* ---- financiamento (3 passos) ---- */
  function field(id, name, label, attrs, hint) {
    return '<div class="fld"><label for="' + id + '">' + label + '</label><input id="' + id + '" name="' + name + '" ' + (attrs || "") + ">" +
      (hint ? "<small>" + hint + "</small>" : "") + "</div>";
  }

  function buildFinanciamento(m) {
    $("#df-title").textContent = m.nome;

    var opcionais = SITE.pedirCpf
      ? '<p class="form-hint">Opcional — ajuda a agilizar a análise de crédito.</p>' +
        field("f-nasc", "nascimento", "Data de nascimento", 'type="text" inputmode="numeric" autocomplete="off" placeholder="dd/mm/aaaa"') +
        field("f-cpf", "cpf", "CPF", 'type="text" inputmode="numeric" autocomplete="off" placeholder="000.000.000-00"')
      : "";

    $("#df-body").innerHTML =
      '<div class="mini"><span class="mini__pic">' + picHTML(m, 0, true) + '</span><div><b>' + esc(m.nome) + "</b><span>" +
        esc(voz("Me conte em 3 passos e eu volto com as melhores condições.", "Conte em 3 passos e a gente volta com as melhores condições.")) + "</span></div></div>" +
      '<ol class="stepper" id="stepper" aria-label="Etapas do formulário">' +
        '<li data-s="1" class="is-on" aria-current="step"><i>1</i><span>Você</span></li>' +
        '<li data-s="2"><i>2</i><span>Entrada</span></li>' +
        '<li data-s="3"><i>3</i><span>Confirmar</span></li>' +
      "</ol>" +
      '<form id="fin-form" novalidate data-step="1">' +
        '<section data-panel="1"><h3>Como posso te chamar?</h3>' +
          field("f-nome", "nome", "Seu nome", 'type="text" autocomplete="name" required') +
          field("f-tel", "tel", "Telefone com WhatsApp", 'type="tel" inputmode="numeric" autocomplete="tel-national" required placeholder="(00) 00000-0000"') +
        "</section>" +
        '<section data-panel="2" hidden><h3>Entrada e habilitação</h3>' +
          field("f-ent", "entrada", "Valor de entrada (opcional)", 'type="text" inputmode="numeric" autocomplete="off" placeholder="R$ 0"', "Sem entrada? Deixe em branco.") +
          '<fieldset class="fset"><legend>Você tem CNH?</legend><div class="radios radios--seg">' +
            radioChip("cnh", "Sim", "Sim") + radioChip("cnh", "Não", "Não") + "</div></fieldset>" +
        "</section>" +
        '<section data-panel="3" hidden><h3>Confere e envia</h3><dl class="sum" id="sum"></dl>' + opcionais +
          '<label class="check"><input type="checkbox" name="lgpd" required><span>Concordo com a <a href="privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a> e autorizo o envio destes dados para ' + esc(PARA_QUEM) + " pelo WhatsApp.</span></label>" +
        "</section>" +
        '<p class="err" id="fin-err" role="alert" hidden></p>' +
        '<div class="wiz"><button type="button" class="btn btn--line" data-back hidden>Voltar</button>' +
          '<button type="submit" class="btn btn--blue" id="fin-next">Continuar ' + icon("arrow") + "</button></div>" +
        '<p class="ok" id="fin-ok" role="status" hidden>' + icon("check") + "Pronto! Abrimos o WhatsApp com os seus dados. É só tocar em enviar.</p>" +
      "</form>" +
      howHTML("financiamento");
  }

  function goStep(form, n) {
    form.setAttribute("data-step", n);
    $$("[data-panel]", form).forEach(function (p) { p.hidden = Number(p.getAttribute("data-panel")) !== n; });
    $$("#stepper li").forEach(function (li) {
      var s = Number(li.getAttribute("data-s"));
      li.classList.toggle("is-on", s === n);
      li.classList.toggle("is-done", s < n);
      if (s === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    $("[data-back]", form).hidden = n === 1;
    $("#fin-next", form).innerHTML = n < 3 ? "Continuar " + icon("arrow") : icon("wa") + "Enviar pelo WhatsApp";
    if (n === 3) fillResumo(form);
    $("#fin-err").hidden = true;
    var first = $("input, select", $('[data-panel="' + n + '"]', form));
    if (first) first.focus();
  }

  function fillResumo(form) {
    var m = findMoto(state.currentId);
    var linhas = [["Moto", m.nome], ["Nome", form.nome.value.trim()], ["Telefone", form.tel.value],
      ["Entrada", form.entrada.value || "Sem entrada"], ["Habilitação", form.cnh.value]];
    $("#sum").innerHTML = linhas.map(function (l) { return "<div><dt>" + esc(l[0]) + "</dt><dd>" + esc(l[1]) + "</dd></div>"; }).join("");
  }

  function validateStep(form, n) {
    if (n === 1) {
      if (form.nome.value.trim().length < 3) return "Informe seu nome.";
      if (digits(form.tel.value).length < 10) return "Informe um telefone com DDD.";
    }
    if (n === 2 && !form.cnh.value) return "Diga se você tem CNH.";
    if (n === 3) {
      var nasc = form.nascimento ? form.nascimento.value.trim() : "";
      var cpf = form.cpf ? form.cpf.value.trim() : "";
      if (nasc && !validDate(nasc)) return "Confira a data de nascimento (dd/mm/aaaa) ou deixe em branco.";
      if (cpf && !validCPF(cpf)) return "Confira o CPF ou deixe em branco.";
      if (!form.lgpd.checked) return "Precisamos do seu aceite para enviar os dados.";
    }
    return "";
  }

  function submitFinanciamento(form) {
    var n = Number(form.getAttribute("data-step"));
    var problem = validateStep(form, n);
    var err = $("#fin-err");
    if (problem) { err.textContent = problem; err.hidden = false; return; }
    err.hidden = true;
    if (n < 3) { goStep(form, n + 1); return; }

    var m = findMoto(state.currentId);
    var nasc = form.nascimento ? form.nascimento.value.trim() : "";
    var cpf = form.cpf ? form.cpf.value.trim() : "";
    var dados = { moto: m.nome, nome: form.nome.value.trim(), telefone: form.tel.value, entrada: form.entrada.value || "sem entrada", habilitacao: form.cnh.value };
    if (nasc) dados.nascimento = nasc;
    if (cpf) dados.cpf = cpf;

    var msg = "Olá! Quero simular o financiamento da " + m.nome + ".\n" +
      "Nome: " + dados.nome + "\n" +
      "Telefone: " + dados.telefone + "\n" +
      "Entrada: " + dados.entrada + "\n" +
      "Tenho CNH: " + dados.habilitacao +
      (nasc ? "\nNascimento: " + nasc : "") +
      (cpf ? "\nCPF: " + cpf : "");

    sendLead("financiamento", dados);
    track("lead_financiamento", { moto: m.nome });
    openLink(waHref(msg));
    $("#fin-ok").hidden = false;
  }

  /* ---------------- máscaras e validação ---------------- */
  function maskPhone(v) {
    var d = digits(v).slice(0, 11);
    if (d.length <= 2) return d ? "(" + d : "";
    if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }

  function maskMoney(v) {
    var d = digits(v).slice(0, 9);
    return d ? "R$ " + Number(d).toLocaleString("pt-BR") : "";
  }

  function maskCPF(v) {
    var d = digits(v).slice(0, 11);
    return d.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  function maskDate(v) {
    var d = digits(v).slice(0, 8);
    return d.replace(/^(\d{2})(\d)/, "$1/$2").replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
  }

  function validCPF(v) {
    var d = digits(v);
    if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
    for (var t = 9; t < 11; t++) {
      var s = 0;
      for (var i = 0; i < t; i++) s += Number(d[i]) * (t + 1 - i);
      if (((s * 10) % 11) % 10 !== Number(d[t])) return false;
    }
    return true;
  }

  function validDate(v) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
    if (!m) return false;
    var d = Number(m[1]), mo = Number(m[2]), y = Number(m[3]), dt = new Date(y, mo - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d && y >= 1900 && dt <= new Date();
  }

  /* ---- contato (só quando há endpoint de leads) ---- */
  function openContato(text) {
    state.contato = { text: text };
    $("#dt-body").innerHTML =
      '<p class="lead">Deixe nome e telefone e abrimos o WhatsApp com a sua mensagem pronta. Assim ninguém perde o contato.</p>' +
      '<form id="ct-form" novalidate>' +
        field("c-nome", "nome", "Seu nome", 'type="text" autocomplete="name"') +
        field("c-tel", "tel", "Telefone com WhatsApp", 'type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="(00) 00000-0000"') +
        '<p class="form-hint">Ao continuar, você concorda com a <a href="privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a>.</p>' +
        '<p class="err" id="ct-err" role="alert" hidden></p>' +
        '<button class="btn btn--wa btn--block" type="submit">' + icon("wa") + "Abrir o WhatsApp</button>" +
        '<button class="btn btn--line btn--block" type="button" id="ct-skip">Continuar sem preencher</button>' +
      "</form>";
    showDlg("contato", true);
  }

  function submitContato(form, skip) {
    var nome = skip ? "" : form.nome.value.trim();
    var tel = skip ? "" : digits(form.tel.value);
    if (tel && tel.length < 10) {
      var err = $("#ct-err");
      err.textContent = "Confira o telefone com DDD ou deixe em branco.";
      err.hidden = false;
      return;
    }
    var text = state.contato.text + (nome ? " Meu nome é " + nome + "." : "");
    if (nome || tel) {
      sendLead("contato", { nome: nome, telefone: form.tel.value, mensagem: state.contato.text });
      track("lead_contato", {});
    }
    dlgs.contato.close();
    openLink(waHref(text));
  }

  /* ---------------- eventos ---------------- */
  function bindSwipe(d) {
    var x0 = 0, y0 = 0, ok = false;
    d.addEventListener("touchstart", function (e) {
      var t = e.touches[0];
      x0 = t.clientX; y0 = t.clientY;
      ok = !e.target.closest("input, select, textarea, iframe, .gal__thumbs, .tabs2, table");
    }, { passive: true });
    d.addEventListener("touchend", function (e) {
      if (!ok || dlgs.contato.open) return;
      var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      goNeighbor(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  function bind() {
    document.addEventListener("click", function (e) {
      var t = e.target;

      var tab = t.closest(".tab");
      if (tab) { state.cat = tab.getAttribute("data-cat"); refresh(); return; }

      var seg = t.closest(".seg__btn");
      if (seg) { state.faixa = seg.getAttribute("data-faixa"); refresh(); return; }

      if (t.closest("[data-reset]")) { state.cat = "Todas"; state.faixa = "todas"; refresh(); return; }

      var opener = t.closest("[data-open]");
      if (opener) {
        var host = opener.closest("[data-id]");
        openModal(opener.getAttribute("data-open"), host ? host.getAttribute("data-id") : state.currentId);
        return;
      }

      if (t.closest("[data-close]")) {
        var d = t.closest("dialog");
        if (d) d.close();
        return;
      }

      var nav = t.closest("[data-nav]");
      if (nav) { goNeighbor(Number(nav.getAttribute("data-nav"))); return; }

      var tb = t.closest("[data-tab]");
      if (tb) { selectTab(tb.getAttribute("data-tab")); return; }

      var thumb = t.closest("[data-thumb]");
      if (thumb) {
        var m = findMoto(state.currentId);
        $("#dd-stage").innerHTML = picHTML(m, Number(thumb.getAttribute("data-thumb")), true);
        $$("[data-thumb], .thumb-video").forEach(function (b) { b.removeAttribute("aria-current"); });
        thumb.setAttribute("aria-current", "true");
        return;
      }

      var vid = t.closest("[data-video]");
      if (vid) { showVideo(vid.getAttribute("data-video")); return; }

      var back = t.closest("[data-back]");
      if (back) { var f = $("#fin-form"); goStep(f, Number(f.getAttribute("data-step")) - 1); return; }

      var wa = t.closest("a[data-wa]");
      if (wa) {
        var dlg = wa.closest("dialog");
        var moto = state.currentId && dlg ? (findMoto(state.currentId) || {}).nome : "";
        track("clique_whatsapp", { origem: dlg ? dlg.id : "pagina", moto: moto || "" });
        if (SITE.leadEndpoint) { e.preventDefault(); openContato(wa.getAttribute("data-wa")); }
        return;
      }

      if (t.id === "ct-skip") submitContato($("#ct-form"), true);
    });

    // Vídeo do "Como funciona" só carrega quando a pessoa abre o bloco.
    document.addEventListener("toggle", function (e) {
      var d = e.target;
      if (!d.open || !d.classList || !d.classList.contains("how")) return;
      var v = $("[data-yt]", d);
      if (v && !v.firstChild) {
        v.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.getAttribute("data-yt")) +
          '?rel=0" title="Vídeo explicativo" allowfullscreen loading="lazy"></iframe>';
      }
    }, true);

    // Clique no fundo escuro fecha a gaveta; ao fechar, libera o scroll e limpa o que tiver vídeo.
    Object.keys(dlgs).forEach(function (k) {
      dlgs[k].addEventListener("click", function (e) { if (e.target === dlgs[k]) dlgs[k].close(); });
      dlgs[k].addEventListener("close", function () {
        syncLock();
        if (k === "ficha") { $("#dd-body").innerHTML = ""; if (!currentDlgName()) setHash(""); }
      });
    });
    SWIPE_DLGS.forEach(function (k) { bindSwipe(dlgs[k]); });

    document.addEventListener("keydown", function (e) {
      if ((e.key !== "ArrowLeft" && e.key !== "ArrowRight") || !currentDlgName() || dlgs.contato.open) return;
      if (e.target.closest && e.target.closest("input, select, textarea, [role=tab]")) return;
      goNeighbor(e.key === "ArrowRight" ? 1 : -1);
    });

    document.addEventListener("change", function (e) {
      var m = findMoto(state.currentId);
      if (!m || !dlgs.consorcio.open) return;
      if (e.target.name === "tier") { renderPrazos(m); refreshSim(m); }
      if (e.target.name === "prazo") refreshSim(m);
    });

    document.addEventListener("input", function (e) {
      var id = e.target.id;
      if (id === "f-tel" || id === "c-tel") e.target.value = maskPhone(e.target.value);
      if (id === "f-ent") e.target.value = maskMoney(e.target.value);
      if (id === "f-cpf") e.target.value = maskCPF(e.target.value);
      if (id === "f-nasc") e.target.value = maskDate(e.target.value);
    });

    document.addEventListener("submit", function (e) {
      if (e.target.id === "fin-form") { e.preventDefault(); submitFinanciamento(e.target); }
      if (e.target.id === "ct-form") { e.preventDefault(); submitContato(e.target, false); }
    });

    var cookie = $("#cookie");
    if (store("get", "ym_cookies") === "ok") loadTracking();
    else { cookie.hidden = false; document.body.classList.add("has-cookie"); }
    $("#cookie-ok").addEventListener("click", function () {
      store("set", "ym_cookies", "ok");
      cookie.hidden = true;
      document.body.classList.remove("has-cookie");
      loadTracking();
    });
  }

  function openFromHash() {
    var m = /^#moto=([\w-]+)$/.exec(location.hash);
    if (m && findMoto(m[1])) openModal("ficha", m[1]);
  }

  setupSite();
  setupHero();
  renderFilters();
  renderGrid();
  renderCaminhos();
  bind();
  openFromHash();
  window.addEventListener("hashchange", openFromHash);
})();
