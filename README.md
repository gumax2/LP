# GMAX — Landing page (protótipo · Etapa 3)

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
tools/gerar-ilustracoes.mjs
tools/build-preview.mjs
dist/                      prévias em arquivo único (geradas)
docs/PENDENCIAS.md         o que depende de arquivos/informações da GMAX
docs/IMPLANTACAO.md        checklist de testes e implantação
```

## Como atualizar sem programar

| Quero… | Edite |
|---|---|
| Mudar preços | `data/planos.js`. Economia e valor mensal são recalculados sozinhos. |
| Trocar/incluir capas | `data/catalogo.js` (instruções no topo do arquivo) |
| Mudar categorias de canais | `data/catalogo.js` → `canais` |
| Ligar o checkout | `data/config.js` → `checkout` e `modoPrototipo: false` (somente após aprovação) |

## Regras de segurança do projeto

- `modoPrototipo: true` bloqueia qualquer saída para checkout ou WhatsApp.
- Nenhum segredo no frontend: `data/config.js` é público por natureza.
- Conteúdo dinâmico é inserido com `textContent` (sem `innerHTML`) para evitar XSS.
- Vitrines exibem somente itens com `autorizado: true`.
- Nada é publicado em produção sem autorização expressa.
