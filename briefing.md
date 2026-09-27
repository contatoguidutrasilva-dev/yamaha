# Emily Pereira — briefing

**Cliente:** Emily Pereira, vendedora Yamaha (Mil Motos Yamaha, Ipatinga/MG)
**Entrega:** site de vendedor (vitrine + consórcio/financiamento + WhatsApp)
**Status:** criado em 25/09/2026 a partir do `_modelo-site`. Site funcionando com o catálogo Yamaha completo e os contatos da Emily confirmados.

## Já preenchido e confirmado

- Endereço: Avenida Pedro Linhares Gomes, 4000 – Horto, Ipatinga – MG, 35160-290 — conferido no pino do Google Maps em 27/09/2026 (a ficha da loja no Google bate com o endereço, com o telefone (31) 3829-7260 e com foto da fachada).
- Telefone da loja: (31) 3829-7260 — igual no site oficial e na ficha do Google.
- Horário de atendimento: seg a sex 8h–18h, sáb 8h–12h, fecha domingo — ficha da loja no Google Maps, 27/09/2026.
- "Como chegar" e mapa: os oficiais da própria loja.
- Loja: **Mil Motos Yamaha - Ipatinga** — é esse o nome oficial na ficha do Google Maps, confirma a suposição anterior.
- WhatsApp da Emily: (31) 9 8539-7522 — enviado por ela.
- Instagram da Emily: [@emilly_yamaha](https://www.instagram.com/emilly_yamaha) — enviado por ela.
- Foto da Emily: enviada por ela em 4K (uniforme Yamaha, na loja) → recortada no rosto/busto e otimizada para `assets/foto.webp` (23 KB) + `SITE.foto`.

## Pendências (precisa da Emily / da loja)

- [ ] Bio (uma frase, do jeito dela) → `SITE.bio`
- [ ] Logo da loja → `assets/logo.*` + `SITE.logo`
- [ ] Tabelas de consórcio reais por modelo → `js/consorcio.js` (enquanto não tiver, o site mostra uma estimativa a partir do preço sugerido da Yamaha — ver decisão de 27/09/2026)
- [ ] Qual administradora de consórcio a Emily usa, e a taxa de administração e o seguro reais dela → `SITE.consorcioTaxaAdm` e `SITE.consorcioSeguroMensal` (hoje em 15% e 0,12%/mês, aproximação de mercado)
- [ ] Quais modelos a Emily trabalha (hoje aparecem 27, inclusive linha off-road) → `SITE.ocultar`
- [ ] Onde caem os leads: só WhatsApp ou também uma planilha/CRM → `SITE.leadEndpoint`
- [ ] Vídeos do "Como funciona?" (ID do YouTube) → `SITE.videoConsorcio` / `SITE.videoFinanciamento`
- [ ] Razão social, CNPJ e e-mail de privacidade (da Emily como MEI ou da loja?) → `SITE.razaoSocial`, `cnpj`, `emailPrivacidade`; revisar `privacidade.html`
- [ ] Domínio e hospedagem (depois: `og:image`, canonical e sitemap)
- [ ] Autorização de uso das fotos e textos da Yamaha (vieram de yamaha-motor.com.br), do logo oficial e do vídeo de fundo (recorte do comercial "Nova Yamaha R15 ABS: Da corrida pra correria", Yamaha Motor do Brasil)
- [ ] Quais motos devem girar na abertura (hoje: R15, NMAX, MT-03, Lander, Fazer FZ25, Ténéré 700) → `SITE.destaques`
- [ ] Vai rodar anúncios? → `SITE.gtm` / `SITE.metaPixel`

## Decisões e histórico

- 27/09/2026: foto da Emily recebida em 4K (4096×4096, 12,3 MB). Recortei em quadrado fechando em rosto/busto (a original era corpo inteiro com a vitrine de motos atrás, ficava pequena e sem foco no avatar de 64 px) e otimizei pra WebP 480×480 (23 KB) em `assets/foto.webp`. Original foi pra Lixeira depois de testado no cabeçalho e na seção "Atendimento com".
- 27/09/2026: WhatsApp e Instagram reais da Emily (enviados por ela) substituíram os provisórios da loja em `SITE.whatsapp`/`instagram`. Conferi o endereço, o telefone e o horário direto na ficha da loja no Google Maps (print salvo na conversa) — todos bateram com o que já estava no site, e o horário (que estava pendente) veio de lá: seg a sex 8h–18h, sáb 8h–12h.
- 25/09/2026: site criado e testado no Chromium (desktop e celular). Catálogo com 27 modelos oficiais da Yamaha Brasil. Não testado no Safari/iOS.
- 25/09/2026: design e textos refeitos com identidade própria (originalidade), mantendo as mesmas funções. Eventos de métricas renomeados.
- 25/09/2026: animações e interações adicionadas (camada opcional; `SITE.animacoes = false` desliga). Cópia da versão sem animação em `YAMAHA/_backups/2026-09-25-antes-das-animacoes/`.
- 27/09/2026: o simulador de consórcio (sem tabela real) ficou mais simples depois que o Guilherme achou a versão anterior difícil de entender — trocada a caixa de preço + chips de prazo + caixa de parcela por uma frase única explicando o preço e o que fazer, e uma lista com a parcela de TODOS os prazos já calculada (antes só mostrava a do prazo escolhido).
- 27/09/2026: pesquisei o preço à vista de cada moto na loja oficial da Yamaha (yamaha-motor.com.br) e adicionei ao catálogo (`js/motos.js`, campos `preco`/`precoEm`) — aparece no cartão da vitrine, na ficha técnica e no simulador de consórcio. 17 dos 27 modelos têm preço; 10 (Factor, Fazer FZ15, R3 ABS, R7 e as off-road) não estão à venda online agora, então continuam sem preço. Também criei uma **estimativa** de parcela de consórcio pra quando não há tabela real: preço sugerido da Yamaha + taxa de administração (15%) e seguro mensal (0,12% do crédito) aproximados — valores típicos de mercado, pesquisados hoje, não os da administradora real —, menos a entrada que a pessoa digitar (pedido do Guilherme: "moto + parcelas, se colocar 2k de entrada aparecem as opções"). Sempre rotulada "estimativa", com aviso de que não é proposta oficial. Assim que houver uma tabela real da administradora em `js/consorcio.js`, ela substitui a estimativa automaticamente pra aquele modelo.
- 26/09/2026: vídeo de fundo na abertura (recorte de 10 s do comercial da R15, otimizado de 8 MB para 1,2 MB; 0,5 MB no celular), logo oficial da Yamaha na abertura e no rodapé, e troca automática de moto na abertura a cada 5 s. Cópia da versão anterior em `YAMAHA/_backups/2026-09-26-antes-do-video-e-carrossel/`. O original (8 MB) e o arquivo `.webp` da logo (280 KB) foram para a Lixeira depois do teste. Testado também no WebKit (motor do Safari); corrigida uma rolagem horizontal de 2 px nos filtros que só aparecia lá.
- CPF e data de nascimento no financiamento: opcionais, com aceite explícito (`SITE.pedirCpf = false` remove).
- Sem preços nem parcelas inventados: a tabela de consórcio só aparece com valores reais em `js/consorcio.js`.
