/*
 * Configuração do site — é AQUI que se troca tudo que é do cliente.
 * Tudo que estiver vazio ("") some da página ou usa um texto padrão seguro.
 */
window.SITE = {
  /* ---------- Quem aparece no topo ---------- */

  // Nome do vendedor (a pessoa). Vira o título da página e o site passa a falar em 1ª pessoa
  // ("Fale comigo", "para que eu possa trazer..."). Vazio → usa o nome da loja e fala "a gente".
  vendedor: "Emily Pereira",

  // Foto do vendedor, quadrada (ex.: "assets/foto.jpg"). Vazio → usa a logo da loja ou o ícone padrão.
  foto: "",

  // Frase curta embaixo do nome. Vazio → texto padrão.
  bio: "",

  /* ---------- Loja / concessionária ---------- */

  loja: "Mil Motos Yamaha",  // a confirmar: Emily trabalha na Mil Motos Ipatinga?
  cidade: "Ipatinga",
  uf: "MG",

  // Frase da seção "Onde estamos". Ex.: "Atendemos Ipatinga e toda a região do Vale do Aço."
  // Vazio → "Atendemos {cidade} e região."
  atendimento: "Atendemos Ipatinga e toda a região do Vale do Aço.",

  // Logo da loja (SVG ou PNG quadrado), ex.: "assets/logo.png". Vazio → usa o ícone padrão.
  logo: "",

  // Moto em destaque na abertura do site: ID de js/motos.js (ex.: "nmax-abs"). Vazio → NMAX.
  destaque: "",

  // Endereço completo (rua, número, bairro). Sem endereço, mapa e cidade, a seção "Onde estamos" some.
  endereco: "Avenida Pedro Linhares Gomes, 4000 – Horto",  // dado oficial da Mil Motos Ipatinga (milmotos.com.br), 25/09/2026

  // Link "Como chegar" (Google Maps) e mapa da página. Se mapaEmbed ficar vazio, o mapa é buscado pelo endereço.
  comoChegar: "https://maps.app.goo.gl/mMTYFxynVBxTSYSS8",
  mapaEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3761.337745082519!2d-42.55298750000001!3d-19.484099699999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xaffff9abc5d521%3A0x5ae751ca56c21bd2!2sMil%20Motos%20Yamaha!5e0!3m2!1spt-BR!2sbr",

  // Horário de atendimento, texto livre. Ex.: "Seg a Sex 8h–18h · Sáb 8h–12h". Vazio → não aparece.
  horario: "",  // confirmar com a loja (o site da Mil Motos não informa o horário de Ipatinga)

  /* ---------- Contato ---------- */

  // WhatsApp: só dígitos, com DDI+DDD. Ex.: "5531900000000".
  // Vazio → os botões abrem o WhatsApp sem contato definido (wa.me/?text=). Em site de vendedor, é o do vendedor.
  whatsapp: "553332124200",  // PROVISÓRIO: central da Mil Motos (DDD 33). Trocar pelo WhatsApp da Emily

  // Telefone fixo/alternativo, só dígitos com DDI+DDD. Vazio → o botão de ligar não aparece.
  telefone: "553138297260",  // telefone da loja Mil Motos Ipatinga

  // Instagram, sem o @. Vazio → o botão não aparece.
  instagram: "milmotos",  // PROVISÓRIO: perfil da rede Mil Motos. Trocar pelo da Emily

  /* ---------- Consórcio e financiamento ---------- */

  // Prazos (em meses) da simulação de consórcio quando o modelo ainda não tem tabela em js/consorcio.js.
  prazosConsorcio: [80, 60, 48, 36, 24, 18, 12],

  // Vídeos do "Como funciona?" — só o ID do YouTube (ex.: "YJ7diRxrblk"). Vazio → só o texto.
  videoConsorcio: "",
  videoFinanciamento: "",

  // Páginas oficiais da Yamaha citadas no "Como funciona?". Vazio → o link some.
  consorcioOficial: "https://www.consorcioyamaha.com.br/",
  financiamentoOficial: "http://www.liberacredyamaha.com.br/",

  /* ---------- Catálogo ---------- */

  // IDs de modelos (ver js/motos.js) que este vendedor NÃO trabalha e devem sumir do site. Ex.: ["yz65", "pw50"].
  ocultar: [],

  /* ---------- Movimento ---------- */

  // Animações e interações (js/animacoes.js + css/animacoes.css). false → o site fica sem animação.
  // Quem pede "reduzir movimento" no aparelho já vê o site sem animação, independente disto.
  animacoes: true,

  /* ---------- Formulários, leads e métricas ---------- */

  // Formulário de financiamento pede CPF e data de nascimento (opcionais)? Sem back-end, esses
  // dados vão na mensagem do WhatsApp — deixe false se preferir pedir só na conversa.
  pedirCpf: true,

  // Onde guardar os leads além do WhatsApp: URL que aceita POST JSON (Google Apps Script,
  // Make/Zapier, Formspree...). Vazio → só abre o WhatsApp. Quando preenchido, o site também
  // pede nome + telefone antes de abrir o WhatsApp, pra não perder quem desistir no meio.
  leadEndpoint: "",

  // Métricas (só carregam depois do "Continuar" do aviso de cookies). Vazio → desligado.
  gtm: "",         // ex.: "GTM-XXXXXXX"
  metaPixel: "",   // ex.: "123456789012345"

  /* ---------- Política de privacidade (privacidade.html) ---------- */

  // Quem responde pelos dados: vendedor (MEI/CNPJ) ou a loja. Vazio → aparece "a informar" e um aviso de rascunho.
  razaoSocial: "",
  cnpj: "",
  emailPrivacidade: "",
};
