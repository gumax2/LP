# Pendências para a integração

Na página, cada item aparece com o selo amarelo **“a confirmar”** (ou “pendente de validação”).
Nada abaixo foi inventado no protótipo: onde falta informação, o texto é neutro e sinalizado.

## A. Bloqueiam a publicação

| # | O que preciso | Onde entra | Situação no protótipo |
|---|---|---|---|
| 1 | **Arquivo da logo oficial GMAX** (SVG ou PNG em alta resolução) + favicon | cabeçalho, CTA final, rodapé, `og:image` | nome “GMAX” e subtítulo “Canais, Filmes e Séries” em texto simples, sem desenho de marca |
| 2 | **Preços atuais da LP em produção** (todas as TVs e períodos, promoções e descontos vigentes) | `data/planos.js` | tabela de referência histórica, marcada “pendente de validação” |
| 3 | **Acesso aos arquivos do site atual** (FTP/painel ou exportação) | backup, inventário, integração | não acessado |
| 4 | **Links de checkout atuais (Mercado Pago) de cada plano**, sem alteração | `data/config.js` → `checkout` | botões mostram aviso “checkout desativado” |
| 5 | Formas de pagamento aceitas | nota dos planos, FAQ | “a confirmar” |
| 6 | Fluxo real após o pagamento (como e quando o cliente recebe o acesso) | “Como funciona”, FAQ de instalação | texto neutro, sem prometer ativação automática ou imediata |
| 7 | Termos de uso, política de privacidade, política de reembolso | rodapé, aviso de cookies | links desativados |
| 8 | Razão social e CNPJ | rodapé | “a informar” |
| 9 | Capturas reais do GMAX Player e ícone oficial do app | seção GMAX Player | interface demonstrativa em CSS |
| 10 | Recursos do app, aparelhos e versões Android comprovadamente suportados | seção GMAX Player, benefícios, FAQ | “a confirmar” |
| 11 | Links dos termos do aplicativo e do serviço | quadro comparativo | “link a confirmar” |

## B. Decisões sobre o Programa de Indicações

O banner usa exatamente o texto e as regras aprovados. Nenhuma regra extra foi criada.
Para responder dúvidas de clientes sem improviso, preciso da sua decisão sobre:

1. Existe limite de indicações por cliente?
2. Os meses grátis podem ser acumulados (ex.: 2 indicações = 2 meses)?
3. O “mês grátis” vale para qualquer plano do indicador (ex.: plano de 3 TVs ou plano anual)? Como é aplicado em planos trimestrais, semestrais e anuais?
4. Qualquer plano contratado pelo indicado conta (inclusive o mensal)?
5. Como o indicado informa quem o indicou (nome, telefone, código)?

Até a decisão, esses pontos **não** aparecem na página.

## C. Melhoram a conversão (não bloqueiam)

| # | Item | Onde entra |
|---|---|---|
| 12 | Capas e títulos com divulgação comercial autorizada (AVIF/WebP, 2:3) | `data/catalogo.js` (campo `fontes`) |
| 13 | Lista oficial de canais por categoria, se a divulgação for autorizada | vitrine de categorias |
| 14 | Existe teste? Quais condições? | FAQ “Teste” |
| 15 | Horário de atendimento | FAQ, rodapé |
| 16 | Avaliações reais com autorização por escrito | `data/avaliacoes.js` (a seção aparece sozinha) |
| 17 | IDs do GA4, Meta Pixel e Google Ads | função `track()` em `assets/js/app.js` |
| 18 | Selo oficial “Disponível no Google Play” (seguir as diretrizes de marca do Google) | botão da seção do app |
| 19 | Imagem de compartilhamento (`og:image` 1200×630) para links no Instagram/WhatsApp | `index.html` |
