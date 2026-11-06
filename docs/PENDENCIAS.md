# Pendências para a implantação definitiva

Situação em 06/11/2026. Protótipo na branch `prototipo/etapa-3`. **Nada publicado em produção.**

## 1. Bloqueiam a publicação (preciso receber da GMAX)

| # | Item | Para quê |
|---|---|---|
| 1 | **Arquivo da logo oficial** (SVG ou PNG em alta resolução) e favicon | cabeçalho, rodapé, compartilhamento |
| 2 | **Acesso ao site atual** (FTP/painel ou arquivos) | backup, inventário e integração |
| 3 | **Preços exatamente como estão na LP atual** (todas as TVs e períodos, promoções e descontos) | substituir a tabela de referência, sem alterar nenhum valor |
| 4 | **Links/botões do Mercado Pago** de cada plano, como estão hoje | contratação direta, sem mexer na integração |
| 5 | Formas de pagamento aceitas | nota dos planos e FAQ |
| 6 | Fluxo real após o pagamento (quem confere o comprovante, o que o cliente recebe) | “Como funciona” e FAQ |
| 7 | Horário de atendimento e, se quiserem, um prazo médio de resposta | aviso de demora, FAQ, rodapé |
| 8 | Termos de uso, política de privacidade e política de reembolso | rodapé e aviso de cookies |
| 9 | Razão social e CNPJ | rodapé |
| 10 | Capturas reais do GMAX Player, ícone do app e aparelhos/versões comprovadamente compatíveis | seção do app e FAQ |

## 2. Decisões que preciso de você

| # | Decisão | Opções |
|---|---|---|
| 11 | Resumo antes do pagamento (pede o comprovante e avisa sobre a demora) | manter (recomendado) ou ir direto ao Mercado Pago (`confirmarAntesDoCheckout: false`) |
| 12 | Página “obrigado” (`obrigado.html`) como retorno do Mercado Pago | usar (exige alterar a URL de retorno no Mercado Pago, com sua autorização) ou não usar |
| 13 | Regras abertas do programa de indicações | limite de indicações? acúmulo de meses? como fica em planos trimestrais/semestrais/anuais e com várias TVs? qualquer plano do indicado conta? como o indicado informa quem indicou? |
| 14 | Teste antes da compra | existe? quais condições? |

## 3. Vitrines oficiais (objetivo mantido; ver `docs/MATERIAIS.md`)

| # | Item |
|---|---|
| 15 | Lista dos fornecedores de conteúdo e dos contratos (títulos/canais cobertos, cláusula de marketing) |
| 16 | Contato de marketing de cada fornecedor e acesso a portais de parceiros/kits de divulgação |
| 17 | Planilha `cadastro.csv` preenchida + arquivos oficiais (meta: 8 filmes e 8 séries para ativar as vitrines) |
| 18 | Logotipos e manuais de marca dos canais autorizados |
| 19 | Parecer jurídico sobre a divulgação de canais e títulos (SeAC/Anatel e direitos autorais) |

## 4. Na implantação (comigo, após os itens acima)

- [ ] Backup completo do site atual e plano de reversão (`docs/IMPLANTACAO.md`)
- [ ] Inventário: checkout, webhooks, pixels, formulários (somente leitura, nada alterado)
- [ ] Preços de produção em `data/planos.js` (`status: "validada"`) e links do Mercado Pago em `data/config.js`
- [ ] `modoPrototipo: false` e remoção do `noindex`
- [ ] GA4/Meta Pixel com consentimento
- [ ] Testes em aparelhos reais: iPhone (Safari), Android (Chrome e Samsung Internet), navegador do Instagram
- [ ] Homologação em URL separada e sua aprovação final antes de publicar

## 5. Melhoram a conversão (não bloqueiam)

- Avaliações reais com autorização (a seção aparece sozinha ao cadastrar em `data/avaliacoes.js`)
- Selo oficial “Disponível no Google Play”, seguindo as diretrizes do Google
- Imagem de compartilhamento (1200×630) para links no Instagram e no WhatsApp
- Vídeo curto do GMAX Player e fotos com licença comercial (ver `docs/MATERIAIS.md`, seção 6)
