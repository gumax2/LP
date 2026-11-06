# Materiais oficiais das vitrines: como obter, autorizar e cadastrar

**Decisão vigente (06/11/2026): opção B.** As vitrines de filmes e séries ficam **ocultas** até haver
materiais oficiais autorizados (mínimo de 8 títulos por vitrine). Os carrosséis, a otimização de
imagens e a validação de licenças continuam prontos. O objetivo final segue sendo exibir títulos,
pôsteres e logotipos reais.

---

## 1. De onde vem o direito de divulgar um título ou canal

Para anunciar um filme, uma série ou um canal, a GMAX precisa de dois direitos:

1. **Direito de oferecer o conteúdo** ao assinante;
2. **Direito de divulgar** o nome, o pôster ou o logotipo em publicidade da GMAX.

Na prática, os dois costumam vir do **mesmo contrato** com o titular (estúdio, distribuidora,
agregador de conteúdo ou programadora do canal). Esses contratos normalmente têm uma cláusula de
marketing que autoriza o uso do material promocional (*key art*, pôsteres, logotipos, trailers) e
trazem o manual de marca a seguir.

**Por isso, o primeiro passo não é procurar imagens: é listar os contratos.** Para cada fornecedor
de conteúdo da GMAX, verifique:

- [ ] Qual conteúdo o contrato cobre (títulos, canais, território, período)?
- [ ] Existe cláusula de marketing/divulgação? O que ela permite (site, redes sociais, anúncios)?
- [ ] O fornecedor tem um **portal de parceiros** ou envia **kit de divulgação** (*marketing kit*) aos distribuidores?
- [ ] Há manual de marca (cores, fundo, área de proteção, créditos obrigatórios)?
- [ ] Quem é o contato de marketing do fornecedor para pedir materiais e autorizações?

> **Recomendação jurídica.** Para oferecer canais de TV linear no Brasil, a regulação do Serviço de
> Acesso Condicionado (SeAC, Lei 12.485/2011, regulamentada pela Anatel) e os contratos com as
> programadoras são pontos a confirmar com um advogado especializado em telecomunicações e direitos
> autorais antes de divulgar canais pelo nome ou logotipo.

## 2. Fontes de material: o que vale e o que não vale

| Fonte | Serve para a LP da GMAX? | Observação |
|---|---|---|
| **Kit de divulgação / portal de parceiros do fornecedor**, previsto em contrato | **Sim**, dentro das regras do contrato | É a fonte ideal: arquivos em alta resolução e regras claras |
| **Autorização escrita** do titular (e-mail ou carta) para uso específico | **Sim** | Guarde o e-mail; registre a referência na planilha |
| **Portais de imprensa** dos estúdios e canais (*press sites*) | **Em geral, não** | Costumam ser restritos a jornalistas cadastrados e a uso editorial (notícia, crítica), não publicitário. Só use com autorização escrita para a finalidade comercial |
| **TMDB, IMDb e outras bases/APIs** | **Não** | Os termos da API do TMDB proíbem uso comercial sem acordo específico, e o TMDB não é dono das imagens: os direitos continuam com os titulares |
| **Bancos de imagem** com selo *editorial use only* | **Não** | “Uso editorial” exclui publicidade |
| **Bancos de imagem com licença comercial** (fotos genéricas: família vendo TV, sala, controle remoto) | **Sim** | Bom recurso visual enquanto as vitrines oficiais não chegam (ver seção 6) |
| **Imagens de buscadores, redes sociais, sites de terceiros** | **Não** | Disponível na internet não significa licenciado |

## 3. Modelo de pedido de autorização (para enviar ao fornecedor)

> **Assunto:** Autorização de uso de material promocional no site da GMAX
>
> Olá, [nome],
>
> A GMAX oferece [títulos/canais] aos seus assinantes por meio do contrato [número/data].
> Gostaríamos de divulgar esses conteúdos na página comercial da GMAX (www.gmaxcanais.com.br),
> exibindo o nome oficial e o [pôster/logotipo] de cada um.
>
> Poderiam, por favor:
> 1. confirmar por escrito que esse uso está autorizado, e por qual período;
> 2. enviar os arquivos oficiais (pôsteres em alta resolução e/ou logotipos em SVG/PNG) ou o acesso ao portal de parceiros;
> 3. informar as regras de uso da marca e os créditos obrigatórios, se houver.
>
> Lista dos conteúdos: [anexar planilha].
>
> Obrigado,
> [nome] · GMAX · WhatsApp (31) 99002-9545

## 4. Como cadastrar (já implementado)

1. Copie `modelos/cadastro-catalogo.csv` para `materiais/cadastro.csv` e preencha no Excel ou no Google Planilhas
   (salvar como CSV). Uma linha por título ou canal:

   | Coluna | Exemplo |
   |---|---|
   | `tipo` | `filme`, `serie` ou `canal` |
   | `id` | `nome-do-filme` (minúsculas, sem acento) |
   | `titulo` | nome oficial |
   | `genero_ou_categoria` | `Drama` (filmes/séries) ou `esportes` (canais) |
   | `arquivo` | nome do arquivo em `materiais/recebidos/<filmes|series|canais>/` |
   | `titular_do_direito` | quem autorizou |
   | `tipo_de_licenca` | `contrato-distribuicao`, `kit-divulgacao` ou `autorizacao-escrita` |
   | `documento_de_autorizacao` | “Contrato 2026/014”, “e-mail de 10/11/2026”… (**fica só na planilha**) |
   | `valido_ate` | `2027-06-30` (vazio = sem data de término) |
   | `disponivel_no_servico` | `sim` |

2. Coloque os arquivos oficiais em `materiais/recebidos/filmes|series|canais/`
   (pôster vertical a partir de 1000×1500 px; logotipo em SVG ou PNG transparente a partir de 640 px).
3. Rode `npm run importar`. O importador:
   - rejeita linhas com licença incompleta, vencida, conteúdo não disponível no serviço, arquivo ausente ou categoria inválida;
   - gera os pôsteres em **AVIF, WebP e JPG** (180, 270, 360 e 540 px) e os logotipos em WebP/PNG ou SVG;
   - grava `data/catalogo-oficial.js` **sem** o texto do documento de autorização (apenas um código `LIC-xxxxxxxx`);
   - grava o relatório em `materiais/relatorio-importacao.txt`.
4. Rode `npm run validar` e confira a prévia.
5. Quando cada vitrine tiver pelo menos 8 títulos oficiais, ela aparece sozinha (configurável em `data/config.js`).

A pasta `materiais/` não vai para o repositório, porque contém referências de contratos.

## 5. Proteções automáticas

- Item oficial sem licença completa, vencido ou não disponível no serviço **não aparece**, mesmo se alguém editar os arquivos à mão.
- Licença com data de validade some do site sozinha quando vence.
- Capas de exemplo nunca aparecem no site publicado com a opção B; no protótipo, só ao clicar em “Ver vitrines de exemplo”, e sempre com o selo “Exemplo”.
- Testes: `tools/testes/materiais-oficiais.mjs` (26 verificações, inclusive a importação pela planilha).

## 6. Enquanto as vitrines oficiais não chegam

O que já está aplicado no protótipo:

- **Hero com ilustração própria:** uma TV estilizada com a interface de categorias da GMAX, em vez de capas de terceiros.
- **Categorias em mosaico:** 7 cartões com ícones e cores próprios; cada um abre o WhatsApp perguntando quais canais estão disponíveis naquela categoria (a dúvida vira conversa comercial).
- **Grade de canais em destaque** pronta, mas oculta no site até haver logotipos autorizados.

Recursos visuais que a GMAX pode providenciar sem depender dos titulares:

1. **Capturas reais do GMAX Player** (o app é da GMAX): a melhor prova visual disponível hoje.
2. **Vídeo curto (10–15 s) navegando no app**, sem mostrar conteúdo de terceiros na tela.
3. **Fotos com licença comercial** de pessoas assistindo TV em casa (bancos de imagem com licença comercial, não editorial).
4. **Fotos próprias** de TVs com o GMAX Player aberto na tela inicial.
5. **Depoimentos reais** de clientes, com autorização.
