# Emily Pereira — site de vendedor Yamaha

Contexto para o Claude. Leia inteiro antes de mexer nesta pasta. O estado e as pendências do cliente estão em `briefing.md`.

## O que é

Site estático (HTML + CSS + JS, sem build e sem dependências) de **Emily Pereira**, vendedor(a) de motos Yamaha. É a "página do vendedor": o visitante escolhe a moto, vê detalhes e ficha técnica, simula consórcio e financiamento e cai no WhatsApp do vendedor. Design e textos próprios (navy + azul elétrico + âmbar), criados do zero; não copiar layout ou texto de outros sites.

Feito por Guilherme Dutra Silva (designer / web designer freelancer), que vende o mesmo site para vários vendedores Yamaha. Cada cliente é uma pasta em `MazyOS/clientes/`, cópia do modelo `../_modelo-site/`. **Leia `../_modelo-site/CLAUDE.md`** para a visão completa do produto, da estrutura e das regras.

## Regra de ouro: o código é do modelo, os dados são do cliente

| É deste cliente (edite aqui) | É do modelo (não edite só aqui) |
|---|---|
| `js/config.js`: nome, foto, loja, cidade, contatos, textos, o que ocultar, animações (`animacoes`), leads, métricas | `index.html`, `privacidade.html`, `css/style.css`, `css/animacoes.css`, `js/app.js`, `js/animacoes.js` |
| `js/consorcio.js`: tabelas de consórcio reais | `js/motos.js` (gerado) e `assets/motos/` (fotos oficiais) |
| `assets/foto.*` e `assets/logo.*` | `assets/favicon.svg` |
| `CLAUDE.md` e `briefing.md` | |

Melhoria de código que vale pra todos: fazer em `../_modelo-site/` e depois, a partir de `MazyOS/`, `python3 scripts/sites-vendedor.py sincronizar --aplicar`.
Se algo só serve pra este cliente, prefira uma opção nova no `config.js` do modelo a editar o código só aqui. Se mesmo assim editar o código só nesta pasta, registre em "Desvios do modelo" abaixo, senão a próxima sincronização apaga.

## Dados do cliente

- Vendedor(a): Emily Pereira
- Loja: Mil Motos Yamaha
- Cidade / UF: Ipatinga / MG
- Pasta: `clientes/Emily-Pereira`
- Criado em: 25/09/2026
- Estado: site funcionando com os dados da loja de Ipatinga (endereço, telefone, mapa). **WhatsApp e Instagram em `config.js` ainda são os da loja/rede, provisórios**: o lead precisa cair no WhatsApp da Emily. Loja "Mil Motos Yamaha" é suposição a confirmar.

Manter esta lista atualizada. O detalhe e as pendências ficam no `briefing.md`.

## Desvios do modelo

Nenhum.

## Regras de trabalho

- Nunca inventar dado do cliente, preço ou parcela: sem dado, o campo fica vazio no `config.js` e o site esconde. Consórcio só com valores reais da administradora.
- Texto em português do Brasil, direto e simples.
- LGPD: CPF e data de nascimento opcionais no financiamento e com aceite explícito; métricas só depois do aceite de cookies.
- Fotos e textos das motos vêm de yamaha-motor.com.br: confirmar autorização de uso antes de publicar.
- Não reproduzir o logotipo da Yamaha: a marca só aparece como texto.

## Como testar

Na pasta do cliente: `python3 -m http.server 8000` e abrir http://localhost:8000. Conferir topo (nome, foto, botões), vitrine, gavetas de ficha / consórcio / financiamento em desktop e celular, e se o link do WhatsApp abre com o número certo.

## Publicação

Hospedagem estática (Netlify, Vercel, Cloudflare Pages...): publicar a pasta inteira deste cliente. Antes: domínio, tags de compartilhamento (og:image com URL absoluta), revisão da `privacidade.html` e `briefing.md` sem pendência crítica.
