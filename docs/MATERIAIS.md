# Materiais oficiais das vitrines: o que falta e como enviar

## Situação atual

| Vitrine | Hoje no protótipo | Para trocar pelo oficial |
|---|---|---|
| Filmes em destaque | 12 capas demonstrativas originais (títulos fictícios, selo “Demonstrativo”) | lista de títulos + pôster oficial + autorização de cada um |
| Séries populares | 12 capas demonstrativas originais | idem |
| Categorias de canais | 7 cartões com ícones próprios da GMAX (sem marcas de terceiros) | nada: podem continuar como estão |
| Canais em destaque (novo) | grade pronta com espaços “Logotipo oficial” (só no protótipo; sem logotipos, a seção não aparece no site) | lista de canais + logotipo oficial + autorização de cada titular |

Nenhum pôster, título real ou logotipo de terceiros foi usado. Imagens encontradas na internet,
em buscadores ou em APIs (como TMDB) **não** foram consideradas autorizadas: os termos do TMDB
não concedem direito de uso comercial das imagens, que pertencem aos estúdios e distribuidoras.

## 1. A pergunta que vem antes das imagens

Para anunciar um título ou canal, a GMAX precisa poder **oferecê-lo legalmente** e **divulgá-lo**.
Em geral, os dois direitos vêm do mesmo lugar: o contrato de licenciamento/distribuição com o
titular (estúdio, distribuidora, programadora do canal). Esses contratos costumam incluir o
direito de uso do material de divulgação (*key art*, pôsteres, logotipos) e o manual de marca.

Portanto, para cada título ou canal que vocês queiram destacar, preciso saber:

- [ ] **Base legal da oferta:** a GMAX tem contrato/licença para disponibilizar este conteúdo? Com quem?
- [ ] **Direito de divulgação:** o contrato (ou uma autorização escrita) permite usar o nome, o pôster ou o logotipo em publicidade da GMAX?
- [ ] **Restrições:** prazo, território, regras de marca (cores, área de proteção, fundo), obrigatoriedade de créditos.

Sem essas confirmações, o item não deve ir para a página, e o sistema já bloqueia isso (seção 4).

## 2. O que enviar por título ou canal

| Campo | Exemplo | Uso |
|---|---|---|
| Nome oficial | como consta no contrato | título exibido |
| Gênero / categoria | Drama · Esportes | filtros da vitrine |
| Arquivo oficial | pôster vertical 2:3, ≥ 1000×1500 px (JPG/PNG) · logotipo em SVG ou PNG transparente ≥ 640 px | imagem |
| Titular do direito | Distribuidora X | campo `licenca.titular` |
| Referência do documento | “Contrato 2026/014” ou “e-mail de 10/11/2026” | campo `licenca.documento` (interno, não aparece no site) |
| Validade | 30/06/2027 | o item some sozinho após a data |
| Disponível no serviço | sim | campo `licenca.disponivelNoServico` |

Envie preferencialmente os arquivos fornecidos pelo titular (kit de divulgação ou portal de imprensa),
não capturas de tela nem imagens baixadas de sites.

## 3. Como os materiais entram no site (já implementado)

1. Os arquivos vão para `materiais/recebidos/filmes|series|canais/<id>.ext` (pasta fora do Git).
2. `npm run imagens` gera automaticamente:
   - pôsteres em **AVIF, WebP e JPG**, nas larguras 180, 270, 360 e 540 px (o navegador baixa só a necessária);
   - logotipos em WebP e PNG (160 e 320 px), ou o SVG original;
   - avisos de baixa resolução ou proporção diferente de 2:3 (a proporção original é preservada, sem corte).
3. Os campos gerados e o bloco `licenca` entram em `data/catalogo.js`.
4. `npm run validar` **bloqueia** a publicação se faltar licença, se ela estiver vencida, se o conteúdo
   não estiver disponível no serviço ou se faltar algum arquivo.

Referência de peso: cada pôster em AVIF de 270–360 px costuma ficar entre 15 e 40 KB. Com carregamento
progressivo (lazy loading), o celular baixa apenas as capas que aparecem na tela.

## 4. Proteções na própria página

- Item oficial sem licença completa, vencido ou não disponível no serviço **não aparece**, mesmo que esteja no catálogo.
- Sem logotipos autorizados, a seção “Canais em destaque” não aparece no site publicado.
- Capas demonstrativas exibem o selo “Demonstrativo” até serem substituídas.
- Testes: `tools/testes/materiais-oficiais.mjs` comprova esse comportamento numa cópia temporária do site.

## 5. Decisão que preciso de você

Escolha como seguir até os materiais oficiais chegarem:

- **A. Publicar com as capas demonstrativas** (selo “Demonstrativo”) e trocar título a título conforme as autorizações chegarem.
- **B. Publicar sem as vitrines de filmes e séries**, mantendo só as categorias de canais (ícones próprios), e ativar as vitrines quando houver um conjunto mínimo autorizado (ex.: 8 títulos por vitrine).
- **C. Aguardar os materiais oficiais** para publicar a nova página.

Minha recomendação é a **B**: uma vitrine com títulos fictícios pode confundir quem procura saber o
que realmente vai assistir. Categorias com ícones próprios comunicam a variedade sem prometer nada
que ainda não foi confirmado.
