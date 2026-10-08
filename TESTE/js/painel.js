/* Painel do vendedor (painel.html) — muda o preço de cada moto, editando direto na lista.
 *
 * Dois modos, escolhidos sozinho pelo que estiver preenchido no config.js:
 *  - MODO REAL (painelFormEmbed + painelFormEntradaMoto + painelFormEntradaPreco + painelPrecoCsv
 *    preenchidos): o vendedor digita o preço e clica Salvar, igual no modo local — só que por
 *    trás o site manda isso, sem o vendedor ver, pra um Formulário Google (é como uma planilha
 *    guarda o valor sem precisar de back-end próprio) e o preço aparece pra QUALQUER visitante do
 *    site, em qualquer aparelho. Ver _ferramentas/painel-preco.md pra como configurar (só o
 *    Guilherme faz essa parte, uma vez por cliente).
 *  - MODO LOCAL (só painelSenha preenchida): mesma lista editável, mas guardada em localStorage.
 *    Funciona na hora, sem configurar nada — mas o preço só aparece NESTE aparelho/navegador,
 *    não pra outros visitantes. Serve pra testar o painel ou como solução temporária.
 * Sem nem painelSenha, o painel fica todo desligado. */
(function () {
  "use strict";

  var SITE = window.SITE || {};
  var SENHA = SITE.painelSenha;
  var CSV_URL = SITE.painelPrecoCsv;
  var FORM_URL = SITE.painelFormEmbed;
  var CAMPO_MOTO = SITE.painelFormEntradaMoto;
  var CAMPO_PRECO = SITE.painelFormEntradaPreco;
  var MODO_REAL = Boolean(CSV_URL && FORM_URL && CAMPO_MOTO && CAMPO_PRECO);
  var FORM_ACTION = MODO_REAL ? FORM_URL.replace(/\/viewform.*$/, "/formResponse") : "";
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

  /* ---------------- lista (linha igual nos dois modos: nome, preço oficial, preço da loja
     quando já trocado, e um campo pra editar) ---------------- */
  function linhaHTML(m) {
    var pic = m.imgs && m.imgs[0]
      ? '<span class="pn-row__pic"><img src="' + esc(m.imgs[0]) + '" alt="" loading="lazy"></span>'
      : '<span class="pn-row__pic" aria-hidden="true"></span>';
    return '<div class="pn-row" data-id="' + esc(m.id) + '" data-nome="' + esc(m.nome) + '">' + pic +
      '<div class="pn-row__info"><b>' + esc(m.nome) + '</b>' +
        '<span class="pn-row__oficial">' + (m.preco ? brl(m.preco) + " — oficial Yamaha" : "sem preço oficial agora") + '</span>' +
        '<span class="pn-row__loja" data-loja hidden></span>' +
      "</div>" +
      '<div class="pn-row__editar">' +
        '<input type="text" inputmode="numeric" class="pn-row__preco" placeholder="Preço da loja" aria-label="Preço da loja para ' + esc(m.nome) + '">' +
        '<button type="button" class="btn btn--blue btn--sm" data-salvar>Salvar</button>' +
      "</div>" +
      '<span class="pn-row__status"></span>' +
    "</div>";
  }

  function mostrarStatus(row, texto, ok) {
    var status = $(".pn-row__status", row);
    status.textContent = texto;
    status.className = "pn-row__status " + (ok ? "is-ok" : "is-erro");
  }

  // Aceita o preço digitado em qualquer formato comum (1234, 1.234, 1234,56, 1.234,56, R$ 1.234,56)
  // e devolve um número inteiro de reais — o site não trabalha com centavos, então arredonda.
  function precoDigitado(row) {
    var bruto = String($(".pn-row__preco", row).value || "").trim().replace(/^R\$\s*/i, "");
    if (!bruto) return 0;
    var pontos = (bruto.match(/\./g) || []).length;
    var virgulas = (bruto.match(/,/g) || []).length;
    var normalizado;
    if (virgulas > 0 && pontos > 0) {
      normalizado = bruto.replace(/\./g, "").replace(",", "."); // 1.234,56 (milhar + decimal)
    } else if (virgulas > 0) {
      normalizado = bruto.replace(",", "."); // 1234,56 (só decimal)
    } else if (pontos === 1 && bruto.split(".")[1].length === 2) {
      normalizado = bruto; // 1234.56 (só decimal, formato en-US)
    } else {
      normalizado = bruto.replace(/\./g, ""); // 1.234 ou 1234 (pontos de milhar ou nada)
    }
    var n = parseFloat(normalizado.replace(/[^\d.]/g, ""));
    return isNaN(n) ? 0 : Math.round(n);
  }

  /* ---------------- modo real (Formulário escondido + CSV) ---------------- */
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

  function salvarReal(row) {
    var nome = row.getAttribute("data-nome");
    var preco = precoDigitado(row);
    var params = new URLSearchParams();
    params.set("entry." + CAMPO_MOTO, nome);
    params.set("entry." + CAMPO_PRECO, String(preco));
    var botao = $("[data-salvar]", row);
    botao.disabled = true;
    mostrarStatus(row, "Salvando…", true);
    fetch(FORM_ACTION, { method: "POST", mode: "no-cors", body: params })
      .then(function () {
        botao.disabled = false;
        var loja = $("[data-loja]", row);
        if (preco > 0) { loja.textContent = brl(preco) + " — preço da loja (atual)"; loja.hidden = false; }
        else loja.hidden = true;
        mostrarStatus(row, "Salvo! Pode levar até 2 minutinhos pra aparecer pra quem visita o site.", true);
      })
      .catch(function () {
        botao.disabled = false;
        mostrarStatus(row, "Não consegui salvar — confere a internet e tenta de novo.", false);
      });
  }

  /* ---------------- modo local (localStorage, só neste aparelho) ---------------- */
  function lerPrecosLocais() {
    try { return JSON.parse(localStorage.getItem(CHAVE_PRECOS_LOCAL) || "{}"); } catch (e) { return {}; }
  }

  function salvarPrecosLocais(precos) {
    try { localStorage.setItem(CHAVE_PRECOS_LOCAL, JSON.stringify(precos)); } catch (e) { /* modo privado */ }
  }

  function preencherPrecosLocais() {
    var precos = lerPrecosLocais();
    $$(".pn-row").forEach(function (row) {
      var atual = precos[row.getAttribute("data-id")];
      var loja = $("[data-loja]", row);
      if (atual) { loja.textContent = brl(atual) + " — preço da loja (atual)"; loja.hidden = false; }
      else loja.hidden = true;
      $(".pn-row__preco", row).value = atual || "";
    });
  }

  function salvarLocal(row) {
    var id = row.getAttribute("data-id");
    var preco = precoDigitado(row);
    var precos = lerPrecosLocais();
    if (preco > 0) precos[id] = preco; else delete precos[id];
    salvarPrecosLocais(precos);
    var loja = $("[data-loja]", row);
    if (preco > 0) { loja.textContent = brl(preco) + " — preço da loja (atual)"; loja.hidden = false; }
    else loja.hidden = true;
    mostrarStatus(row, preco > 0 ? "Salvo — abre o site NESTE aparelho pra ver." : "Voltou pro preço oficial (neste aparelho).", true);
  }

  /* ---------------- lista ---------------- */
  function mostrarLista(nome) {
    $("#pn-login").hidden = true;
    if (nome) $("#pn-loja").textContent = nome + " · " + (SITE.loja || SITE.vendedor || "");
    $("#pn-lista").hidden = false;
    $("#pn-aviso-local").hidden = MODO_REAL;
    $("#pn-aviso-real").hidden = !MODO_REAL;

    if (!MOTOS.length) {
      $("#pn-linhas").innerHTML = '<p class="painel__vazio">Nenhuma moto pra mostrar (confira SITE.ocultar no config.js).</p>';
      return;
    }

    $("#pn-linhas").innerHTML = MOTOS.map(linhaHTML).join("");

    $("#pn-linhas").addEventListener("click", function (e) {
      var row = e.target.closest(".pn-row");
      if (!row || !e.target.closest("[data-salvar]")) return;
      if (MODO_REAL) salvarReal(row); else salvarLocal(row);
    });

    if (MODO_REAL) {
      carregarPrecosReal();
      window.setInterval(function () { if (!document.hidden) carregarPrecosReal(); }, 15000);
      document.addEventListener("visibilitychange", function () { if (!document.hidden) carregarPrecosReal(); });
    } else {
      preencherPrecosLocais();
    }

    $("#pn-busca").addEventListener("input", function () {
      var q = this.value.trim().toLowerCase();
      $$(".pn-row").forEach(function (row) {
        row.hidden = q && !row.querySelector(".pn-row__info b").textContent.toLowerCase().includes(q);
      });
    });
  }
})();
