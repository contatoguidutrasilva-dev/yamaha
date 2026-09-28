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
  foto: "assets/foto.webp",  // enviada por ela em 4K, recortada no rosto/busto e otimizada (27/09/2026)

  // Frase curta embaixo do nome. Vazio → texto padrão.
  bio: "",

  /* ---------- Loja / concessionária ---------- */

  loja: "Mil Motos Yamaha",  // confirmado: nome oficial no Google Maps é "Mil Motos Yamaha - Ipatinga" (27/09/2026)
  cidade: "Ipatinga",
  uf: "MG",

  // Frase da seção "Onde estamos". Ex.: "Atendemos Ipatinga e toda a região do Vale do Aço."
  // Vazio → "Atendemos {cidade} e região."
  atendimento: "Atendemos Ipatinga e toda a região do Vale do Aço.",

  // Logo da loja (SVG ou PNG quadrado), ex.: "assets/logo.png". Vazio → usa o ícone padrão.
  logo: "",

  // Motos que se alternam na abertura (uma nova a cada 5 s): IDs de js/motos.js.
  // Vazio → seleção padrão (R15, NMAX, MT-03, Lander, Fazer FZ25, Ténéré 700).
  destaques: [],

  // Moto que abre a sequência (ID de js/motos.js, ex.: "nmax-abs"). Vazio → a primeira da lista acima.
  destaque: "",

  // Vídeo de fundo da abertura: caminho SEM extensão. Usa NOME.mp4 (computador), NOME-m.mp4 (celular)
  // e NOME.webp (capa, aparece antes do vídeo e quando o vídeo não roda). Vazio → sem vídeo.
  videoFundo: "assets/hero/r15",

  // Endereço completo (rua, número, bairro). Sem endereço, mapa e cidade, a seção "Onde estamos" some.
  endereco: "Avenida Pedro Linhares Gomes, 4000 – Horto",  // confirmado com o pino do Google Maps em 27/09/2026 (ver briefing.md)

  // Link "Como chegar" (Google Maps) e mapa da página. Se mapaEmbed ficar vazio, o mapa é buscado pelo endereço.
  comoChegar: "https://maps.app.goo.gl/mMTYFxynVBxTSYSS8",
  mapaEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3761.337745082519!2d-42.55298750000001!3d-19.484099699999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xaffff9abc5d521%3A0x5ae751ca56c21bd2!2sMil%20Motos%20Yamaha!5e0!3m2!1spt-BR!2sbr",

  // Horário de atendimento, texto livre. Ex.: "Seg a Sex 8h–18h · Sáb 8h–12h". Vazio → não aparece.
  horario: "Seg a sex, 8h–18h · Sáb, 8h–12h",  // Google Maps (ficha da loja), 27/09/2026

  /* ---------- Contato ---------- */

  // WhatsApp: só dígitos, com DDI+DDD. Ex.: "5531900000000".
  // Vazio → os botões abrem o WhatsApp sem contato definido (wa.me/?text=). Em site de vendedor, é o do vendedor.
  whatsapp: "5531985397522",  // WhatsApp da Emily (confirmado por ela, 27/09/2026)

  // Telefone fixo/alternativo, só dígitos com DDI+DDD. Vazio → o botão de ligar não aparece.
  telefone: "553138297260",  // telefone da loja Mil Motos Ipatinga

  // Instagram, sem o @. Vazio → o botão não aparece.
  instagram: "emilly_yamaha",  // perfil da Emily (confirmado por ela, 27/09/2026)

  /* ---------- Consórcio e financiamento ---------- */

  // Prazos (em meses) da simulação de consórcio quando o modelo ainda não tem tabela real em
  // js/consorcio.js. Servem tanto pra estimativa automática (quando o modelo tem preço sugerido
  // em js/motos.js) quanto pro "prazo de interesse" sem preço nenhum. Baseado nos prazos usuais
  // do consórcio Yamaha (36 a 72 meses) — ajuste se a administradora do cliente trabalhar diferente.
  prazosConsorcio: [72, 60, 48, 36, 24, 12],

  // Taxa de administração aproximada (fração do crédito, diluída no prazo) e seguro mensal
  // aproximado (fração do crédito, cobrado todo mês), usados SÓ na estimativa automática — quando
  // o modelo não tem tabela real em js/consorcio.js mas tem preço sugerido em js/motos.js. Valores
  // de mercado pra consórcio de moto (taxa ~15%, seguro ~0,12% ao mês); troque pelos reais assim
  // que souber a administradora do cliente. A ESTIMATIVA NUNCA é mostrada como proposta oficial.
  consorcioTaxaAdm: 0.15,
  consorcioSeguroMensal: 0.0012,

  // Vídeos do "Como funciona?" — só o ID do YouTube (ex.: "YJ7diRxrblk"). Vazio → só o texto.
  videoConsorcio: "",
  videoFinanciamento: "",

  // Páginas oficiais da Yamaha citadas no "Como funciona?". Vazio → o link some.
  consorcioOficial: "https://www.consorcioyamaha.com.br/",
  financiamentoOficial: "http://www.liberacredyamaha.com.br/",

  /* ---------- Catálogo ---------- */

  // IDs de modelos (ver js/motos.js) que este vendedor NÃO trabalha e devem sumir do site. Ex.: ["yz65", "pw50"].
  ocultar: [],

  // Painel do vendedor (painel.html): a Emily muda o preço de uma moto preenchendo um Formulário
  // Google (embutido na página do painel), sem mexer em código. Passo a passo em
  // _ferramentas/painel-preco.md no modelo. Vazio (qualquer um dos três) → painel desligado.
  painelSenha: "Vendedora456",  // senha combinada com o Guilherme (27/09/2026); login também pede um nome, só decorativo
  painelFormEmbed: "",          // pendente: falta criar o Formulário (ver briefing.md)
  painelPrecoCsv: "",           // pendente: falta publicar a planilha de respostas em CSV (ver briefing.md)

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
