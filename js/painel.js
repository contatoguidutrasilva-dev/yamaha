/* Painel do vendedor (painel.html) — muda o preço de cada moto.
 *
 * Dois modos, escolhidos sozinho pelo que estiver preenchido no config.js:
 *  - MODO REAL (painelFormEmbed + painelPrecoCsv preenchidos): o preço novo vem de um Formulário
 *    Google embutido e aparece pra QUALQUER visitante do site, em qualquer aparelho. Ver
 *    _ferramentas/painel-preco.md pra como configurar.
 *  - MODO LOCAL (só painelSenha preenchida): edição direto na lista, guardada em localStorage.
 *    Funciona na hora, sem configurar nada — mas o preço só aparece NESTE aparelho/navegador,
 *    não pra outros visitantes. Serve pra testar o painel ou como solução temporária.
 * Sem nem painelSenha, o painel fica todo desligado. */
(function () {
  "use strict";

  var SITE = window.SITE || {};
  var SENHA = SITE.painelSenha;
  var CSV_URL = SITE.painelPrecoCsv;
  var FORM_URL = SITE.painelFormEmbed;
  var MODO_REAL = Boolean(CSV_URL && FORM_URL);
  var OCULTAR = SITE.ocultar || [];
  var MOTOS = (window.MOTOS || []).filter(function (m) { return OCULTAR.indexOf(m.id) < 0; });
  var CHAVE_SENHA = "ym_painel_senha";
  var CHAVE_NOME = "ym_painel_nome";
  var CHAVE_PRECOS_LOCAL = "ym_precos_loja"; // mesma chave que js/app.js lê em carregarPrecoLocal()

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function esc(v) {
    return String(v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function brl(n) {
    return Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/ /g, " ");
  }

  // Parser de CSV simples (aspas + vírgula dentro de aspas) — o suficiente pro que o Google
  // Sheets publica. Só usado no modo real.
  function parseCSV(texto) {
    var linhas = [], linha = [], campo = "", aspas = false;
    for (var i = 0; i < texto.length; i++) {
      var c = texto[i];
      if (aspas) {
        if (c === '"') { if (texto[i + 1] === '"') { campo += '"'; i++; } else aspas = false; }
        else campo += c;
      } else if (c === '"') aspas = true;
      else if (c === ",") { linha.push(campo); campo = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && texto[i + 1] === "\n") i++;
        linha.push(campo); campo = ""; linhas.push(linha); linha = [];
      } else campo += c;
    }
    if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
    return linhas.filter(function (l) { return l.length > 1 || l[0]; });
  }

  $("#pn-loja").textContent = SITE.loja || SITE.vendedor || "";

  if (!SENHA) {
    $("#pn-login-form").hidden = true;
    $("#pn-sem-url").hidden = false;
    return;
  }

  /* ---------------- login ----------------
   * Trava simples client-side: sem servidor não dá pra esconder a senha de verdade (ela está no
   * código-fonte do site). Serve pra afastar visitante curioso, não é segurança forte.
   * "Salvar a senha" é opcional (desmarcado por padrão): só quando o vendedor marca a caixa é que
   * a senha fica guardada nesse aparelho (localStorage), pra não pedir de novo da próxima vez. */
  function entrar(senha, nome, lembrar, form) {
    $("#pn-login-erro").hidden = true;
    if (senha !== SENHA) {
      $("#pn-login-erro").textContent = "Senha incorreta.";
      $("#pn-login-erro").hidden = false;
      if (form) $("#pn-senha", form).value = "";
      return;
    }
    try {
      if (lembrar) localStorage.setItem(CHAVE_SENHA, senha); else localStorage.removeItem(CHAVE_SENHA);
      if (nome) localStorage.setItem(CHAVE_NOME, nome);
    } catch (e) { /* modo privado */ }
    mostrarLista(nome);
  }

  $("#pn-login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    entrar($("#pn-senha").value, $("#pn-nome").value.trim(), $("#pn-lembrar").checked, e.target);
  });

  try {
    var senhaSalva = localStorage.getItem(CHAVE_SENHA);
    if (senhaSalva === SENHA) mostrarLista(localStorage.getItem(CHAVE_NOME) || "");
  } catch (e) { /* modo privado */ }

  /* ---------------- modo real (Formulário + CSV) ---------------- */
  function linhaHTMLReal(m) {
    var pic = m.imgs && m.imgs[0]
      ? '<span class="pn-row__pic"><img src="' + esc(m.imgs[0]) + '" alt="" loading="lazy"></span>'
      : '<span class="pn-row__pic" aria-hidden="true"></span>';
    return '<div class="pn-row" data-nome="' + esc(m.nome) + '">' + pic +
      '<div class="pn-row__info"><b>' + esc(m.nome) + '</b>' +
        '<span class="pn-row__oficial">' + (m.preco ? brl(m.preco) + " — oficial Yamaha" : "sem preço oficial agora") + '</span>' +
        '<span class="pn-row__loja" data-loja hidden></span>' +
      "</div>" +
    "</div>";
  }

  function preencherPrecosReal(overrides) {
    $$(".pn-row").forEach(function (row) {
      var o = overrides[row.getAttribute("data-nome")];
      var loja = $("[data-loja]", row);
      if (o) { loja.textContent = brl(o.preco) + " — preço da loja (atual)"; loja.hidden = false; }
      else loja.hidden = true;
    });
  }

  function carregarPrecosReal() {
    return fetch(CSV_URL + (CSV_URL.indexOf("?") >= 0 ? "&" : "?") + "_=" + Date.now())
      .then(function (r) { return r.text(); })
      .then(function (texto) {
        var linhas = parseCSV(texto);
        linhas.shift(); // cabeçalho: Carimbo de data/hora, Qual moto?, Novo preço (R$)
        var overrides = {};
        linhas.forEach(function (l) {
          var nome = (l[1] || "").trim();
          var preco = Number(String(l[2] || "").replace(/\D/g, ""));
          if (!nome) return;
          if (preco > 0) overrides[nome] = { preco: preco };
          else delete overrides[nome]; // 0 (ou vazio) = voltar pro preço oficial
        });
        preencherPrecosReal(overrides);
      })
      .catch(function () { /* CSV fora do ar não pode quebrar o painel */ });
  }

  /* ---------------- modo local (localStorage, só neste aparelho) ---------------- */
  function lerPrecosLocais() {
    try { return JSON.parse(localStorage.getItem(CHAVE_PRECOS_LOCAL) || "{}"); } catch (e) { return {}; }
  }

  function salvarPrecosLocais(precos) {
    try { localStorage.setItem(CHAVE_PRECOS_LOCAL, JSON.stringify(precos)); } catch (e) { /* modo privado */ }
  }

  function linhaHTMLLocal(m, precos) {
    var pic = m.imgs && m.imgs[0]
      ? '<span class="pn-row__pic"><img src="' + esc(m.imgs[0]) + '" alt="" loading="lazy"></span>'
      : '<span class="pn-row__pic" aria-hidden="true"></span>';
    var atual = precos[m.id];
    return '<div class="pn-row" data-id="' + esc(m.id) + '">' + pic +
      '<div class="pn-row__info"><b>' + esc(m.nome) + '</b>' +
        '<span class="pn-row__oficial">' + (m.preco ? brl(m.preco) + " — oficial Yamaha" : "sem preço oficial agora") + '</span>' +
      "</div>" +
      '<div class="pn-row__editar">' +
        '<input type="text" inputmode="numeric" class="pn-row__preco" placeholder="Preço da loja" value="' + (atual ? esc(atual) : "") + '" aria-label="Preço da loja para ' + esc(m.nome) + '">' +
        '<button type="button" class="btn btn--blue btn--sm" data-salvar>Salvar</button>' +
      "</div>" +
      '<span class="pn-row__status"></span>' +
    "</div>";
  }

  function salvarLocal(row) {
    var id = row.getAttribute("data-id");
    var input = $(".pn-row__preco", row);
    var preco = Number(String(input.value).replace(/\D/g, ""));
    var precos = lerPrecosLocais();
    if (preco > 0) precos[id] = preco; else delete precos[id];
    salvarPrecosLocais(precos);
    var status = $(".pn-row__status", row);
    status.textContent = preco > 0 ? "Salvo — abre o site NESTE aparelho pra ver." : "Voltou pro preço oficial (neste aparelho).";
    status.className = "pn-row__status is-ok";
  }

  /* ---------------- lista ---------------- */
  function mostrarLista(nome) {
    $("#pn-login").hidden = true;
    if (nome) $("#pn-loja").textContent = nome + " · " + (SITE.loja || SITE.vendedor || "");
    $("#pn-lista").hidden = false;
    $("#pn-form-box").hidden = !MODO_REAL;
    $("#pn-aviso-local").hidden = MODO_REAL;
    if (MODO_REAL) $("#pn-form-frame").src = FORM_URL;

    if (!MOTOS.length) {
      $("#pn-linhas").innerHTML = '<p class="painel__vazio">Nenhuma moto pra mostrar (confira SITE.ocultar no config.js).</p>';
      return;
    }

    if (MODO_REAL) {
      $("#pn-linhas").innerHTML = MOTOS.map(linhaHTMLReal).join("");
      carregarPrecosReal();
      window.setInterval(function () { if (!document.hidden) carregarPrecosReal(); }, 15000);
      document.addEventListener("visibilitychange", function () { if (!document.hidden) carregarPrecosReal(); });
    } else {
      var precos = lerPrecosLocais();
      $("#pn-linhas").innerHTML = MOTOS.map(function (m) { return linhaHTMLLocal(m, precos); }).join("");
      $("#pn-linhas").addEventListener("click", function (e) {
        var row = e.target.closest(".pn-row");
        if (row && e.target.closest("[data-salvar]")) salvarLocal(row);
      });
    }

    $("#pn-busca").addEventListener("input", function () {
      var q = this.value.trim().toLowerCase();
      $$(".pn-row").forEach(function (row) {
        row.hidden = q && !row.querySelector(".pn-row__info b").textContent.toLowerCase().includes(q);
      });
    });
  }
})();
