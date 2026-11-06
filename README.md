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

Testes (com o servidor local rodando na porta 8765):
```bash
node tools/testes/funcional.cjs http://localhost:8765/
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
tools/build-preview.mjs
dist/                      prévias em arquivo único (geradas)
docs/PENDENCIAS.md         o que depende de arquivos/informações da GMAX
docs/IMPLANTACAO.md        checklist de testes e implantação
```

## Como atualizar sem programar

| Quero… | Edite |
|---|---|
| Mudar preços | `data/planos.js`. Economia, valor mensal, destaque, hero e FAQ são recalculados sozinhos. |
| Trocar/incluir capas | `data/catalogo.js` (instruções no topo do arquivo) |
| Mudar categorias de canais | `data/catalogo.js` → `canais` |
| Publicar avaliações reais | `data/avaliacoes.js` (somente com autorização) |
| Ligar o checkout | `data/config.js` → `checkout` e `modoPrototipo: false` (somente após aprovação) |

## Regras de segurança do projeto

- `modoPrototipo: true` bloqueia qualquer saída para checkout ou WhatsApp.
- Nenhum segredo no frontend: `data/config.js` é público por natureza.
- Conteúdo dinâmico é inserido com `textContent` (sem `innerHTML`) para evitar XSS.
- Vitrines exibem somente itens com `autorizado: true`.
- Nada é publicado em produção sem autorização expressa.
