# GMAX — Landing page (protótipo · versão 2)

Protótipo navegável e responsivo da nova landing page da GMAX.
**Independente do site em produção**: não contém checkout, credenciais, webhooks nem URLs comerciais ativas.

## Como visualizar

**Opção 1: arquivo único (mais simples)**
Abra `dist/gmax-prototipo.html` no navegador (duplo clique). Tudo está embutido.

**Opção 2: projeto completo (para desenvolvimento)**
```bash
python3 -m http.server 8080      # ou: npx serve .
# abra http://localhost:8080
```

Depois de mudar código ou dados, gere de novo:
```bash
node tools/gerar-ilustracoes.mjs   # capas ilustrativas a partir de data/catalogo.js
node tools/build-preview.mjs       # dist/gmax-prototipo.html
```

Materiais oficiais (pôsteres e logotipos autorizados), ver `docs/MATERIAIS.md`:
```bash
npm install                        # uma vez (instala o otimizador de imagens)
npm run imagens                    # AVIF/WebP/JPG a partir de materiais/recebidos/
npm run validar                    # bloqueia item sem licença, vencido ou ausente
```

Testes (com o servidor local rodando na porta 8765):
```bash
node tools/testes/funcional.cjs http://localhost:8765/
node tools/testes/materiais-oficiais.mjs   # fluxo de materiais oficiais (cópia temporária)
```

## Estrutura

```
index.html                 página (HTML semântico, SEO, CSP)
assets/css/main.css        design system (tokens) + componentes, sem dependências
assets/js/app.js           comportamento (~24 KB sem compressão, JS puro, sem framework)
assets/fonts/              Sora e Inter hospedadas localmente (licença OFL)
assets/img/catalogo/       capas ilustrativas originais (SVG, geradas por código)
data/config.js             modo protótipo, WhatsApp, Play Store, links de checkout (vazio)
data/planos.js             tabela comercial: fonte única dos preços
data/catalogo.js           filmes, séries e categorias das vitrines
data/avaliacoes.js         avaliações reais e autorizadas (vazio: seção oculta)
tools/testes/funcional.cjs testes automatizados (Playwright)
tools/gerar-ilustracoes.mjs
tools/otimizar-imagens.mjs  pôsteres/logotipos autorizados → AVIF/WebP/JPG
tools/validar-catalogo.mjs  regra de licença antes de publicar
tools/build-preview.mjs
dist/                      prévias em arquivo único (geradas)
docs/PENDENCIAS.md         o que depende de arquivos/informações da GMAX
docs/MATERIAIS.md          pôsteres e logotipos oficiais: o que falta e como enviar
docs/IMPLANTACAO.md        checklist de testes e implantação
```

## Como atualizar sem programar

| Quero… | Edite |
|---|---|
| Mudar preços | `data/planos.js`. Economia, valor mensal, destaque, hero e FAQ são recalculados sozinhos. |
| Trocar capas por pôsteres oficiais | `docs/MATERIAIS.md` (passo a passo) |
| Incluir logotipos de canais | `data/catalogo.js` → `destaques` (com licença) |
| Ocultar capas demonstrativas | `data/config.js` → `vitrines.permitirDemonstrativas: false` |
| Mudar categorias de canais | `data/catalogo.js` → `canais` |
| Publicar avaliações reais | `data/avaliacoes.js` (somente com autorização) |
| Ligar o checkout | `data/config.js` → `checkout` e `modoPrototipo: false` (somente após aprovação) |

## Regras de segurança do projeto

- `modoPrototipo: true` bloqueia qualquer saída para checkout ou WhatsApp.
- Nenhum segredo no frontend: `data/config.js` é público por natureza.
- Conteúdo dinâmico é inserido com `textContent` (sem `innerHTML`) para evitar XSS.
- Títulos, pôsteres e logotipos de terceiros só aparecem com licença completa, válida e disponível no serviço.
- Nada é publicado em produção sem autorização expressa.
