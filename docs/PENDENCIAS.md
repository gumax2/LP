# Pendências: o que depende da GMAX

Itens marcados na página com o selo amarelo **“a confirmar”**.

## Bloqueiam a publicação

| # | Item | Onde entra |
|---|---|---|
| 1 | **Logo oficial GMAX** (SVG ou PNG em alta resolução) e favicon | cabeçalho, rodapé, `og:image` |
| 2 | **Confirmação da tabela comercial vigente** | `data/planos.js` → `status: "confirmada"` |
| 3 | **Arquivos ou acesso ao site atual** (stack, hospedagem, integrações) | backup + integração |
| 4 | **Links de checkout por plano** (sem alterações) | `data/config.js` → `checkout` |
| 5 | Formas de pagamento aceitas | FAQ, nota dos planos |
| 6 | Fluxo pós-pagamento (como o cliente recebe o acesso) | “Como funciona”, passo 3 |
| 7 | Termos de uso, política de privacidade, cancelamento/reembolso | rodapé, banner de cookies |
| 8 | CNPJ / razão social | rodapé |
| 9 | Capturas reais do GMAX Player | seção do app |
| 10 | Dispositivos e versões Android comprovadamente suportados | seção do app, FAQ |
| 11 | Termos de uso do app e do serviço (links) | quadro comparativo |

## Melhoram a conversão

| # | Item | Onde entra |
|---|---|---|
| 12 | Capas e títulos com divulgação autorizada | `data/catalogo.js` |
| 13 | Lista oficial de canais por categoria (sem “ao vivo” sem dados reais) | vitrine de categorias |
| 14 | Condições do teste (existe? duração?) | hero, FAQ |
| 15 | Horário de atendimento | FAQ, rodapé |
| 16 | Depoimentos reais com autorização (ou avaliações públicas com link) | nova seção de prova social |
| 17 | IDs de GA4 / Meta Pixel / Google Ads | `assets/js/app.js` → `track()` |
| 18 | Selo oficial da Google Play (seguir as diretrizes de marca do Google) | botão da seção do app |
