# Emily Pereira — briefing

**Cliente:** Emily Pereira, vendedora Yamaha (Mil Motos Yamaha, Ipatinga/MG — a confirmar)
**Entrega:** site de vendedor (vitrine + consórcio/financiamento + WhatsApp)
**Status:** criado em 25/09/2026 a partir do `_modelo-site`. Site funcionando com o catálogo Yamaha completo; faltam os dados pessoais da Emily.

## Já preenchido (dados da loja, do site oficial milmotos.com.br em 25/09/2026)

- Endereço: Avenida Pedro Linhares Gomes, 4000 (do km 244,510 ao km 246,580) – Horto, Ipatinga – MG
- Telefone da loja: (31) 3829-7260
- "Como chegar" e mapa: os oficiais da própria loja (o pino do Google Maps confere com o endereço)
- Suposição: a Emily trabalha na **Mil Motos Ipatinga**, a única concessionária Yamaha autorizada que achei em Ipatinga. Não consegui consultar o localizador da própria Yamaha (carrega dinâmico).

## Provisório (trocar pelos dados da Emily)

- **WhatsApp:** está o (33) 3212-4200, que o site da Mil Motos usa em todas as filiais (DDD 33, Governador Valadares). Num site de vendedor, o lead tem que cair no WhatsApp **da Emily**. Uma listagem de terceiros cita (31) 99580-6167 pra Ipatinga, mas não aparece no site oficial.
- **Instagram:** está o `@milmotos` (perfil da rede). Trocar pelo da Emily.

## Pendências (precisa da Emily / da loja)

- [ ] WhatsApp da Emily (só dígitos, DDI+DDD) → `SITE.whatsapp`
- [ ] Instagram da Emily → `SITE.instagram`
- [ ] Foto quadrada da Emily → `assets/foto.jpg` + `SITE.foto`
- [ ] Bio (uma frase, do jeito dela) → `SITE.bio`
- [ ] Confirmar a loja (Mil Motos Ipatinga?) → `SITE.loja`
- [ ] Horário de atendimento (o site da Mil Motos não informa o de Ipatinga; nas outras unidades é seg–sex 8h–18h, sáb 8h–12h) → `SITE.horario`
- [ ] Logo da loja → `assets/logo.*` + `SITE.logo`
- [ ] Tabelas de consórcio reais por modelo → `js/consorcio.js` (sem valores, o modal só mostra prazos e pede simulação)
- [ ] Quais modelos a Emily trabalha (hoje aparecem 27, inclusive linha off-road) → `SITE.ocultar`
- [ ] Onde caem os leads: só WhatsApp ou também uma planilha/CRM → `SITE.leadEndpoint`
- [ ] Vídeos do "Como funciona?" (ID do YouTube) → `SITE.videoConsorcio` / `SITE.videoFinanciamento`
- [ ] Razão social, CNPJ e e-mail de privacidade (da Emily como MEI ou da loja?) → `SITE.razaoSocial`, `cnpj`, `emailPrivacidade`; revisar `privacidade.html`
- [ ] Domínio e hospedagem (depois: `og:image`, canonical e sitemap)
- [ ] Autorização de uso das fotos e textos da Yamaha (vieram de yamaha-motor.com.br)
- [ ] Vai rodar anúncios? → `SITE.gtm` / `SITE.metaPixel`

## Decisões e histórico

- 25/09/2026: site criado e testado no Chromium (desktop e celular). Catálogo com 27 modelos oficiais da Yamaha Brasil. Não testado no Safari/iOS.
- 25/09/2026: design e textos refeitos com identidade própria (originalidade), mantendo as mesmas funções. Eventos de métricas renomeados.
- 25/09/2026: animações e interações adicionadas (camada opcional; `SITE.animacoes = false` desliga). Cópia da versão sem animação em `YAMAHA/_backups/2026-09-25-antes-das-animacoes/`.
- CPF e data de nascimento no financiamento: opcionais, com aceite explícito (`SITE.pedirCpf = false` remove).
- Sem preços nem parcelas inventados: a tabela de consórcio só aparece com valores reais em `js/consorcio.js`.
