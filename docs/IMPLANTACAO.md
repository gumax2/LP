# Validação e implantação

## Testes executados no protótipo (06/11/2026)

| Teste | Resultado |
|---|---|
| Sintaxe JS (`node --check`) | ok |
| Erros no console (Chromium, 1440×900 e iPhone 13) | nenhum |
| Rolagem horizontal da página (desktop e celular) | nenhuma |
| Vitrines renderizadas (24 capas, 7 categorias) | ok |
| Seletor de TVs recalcula os 4 planos (ex.: 3 TVs anual → R$ 735, economia R$ 345 / 32%) | ok |
| Botão “Assinar” no protótipo → aviso, sem sair da página | ok |
| Prévia em arquivo único abre offline, com fontes | ok |

## Checklist antes de publicar (Etapas 4 e 5)

**Preparação**
- [ ] Backup completo do site atual (arquivos + banco, se houver) versionado neste repositório
- [ ] Inventário de integrações: checkout, gateway, webhooks, pixels, formulários
- [ ] Tabela comercial confirmada por escrito
- [ ] Todas as pendências bloqueantes de `docs/PENDENCIAS.md` resolvidas

**Integração**
- [ ] Links de checkout copiados sem alterações para `data/config.js`
- [ ] `modoPrototipo: false`
- [ ] Remover `<meta name="robots" content="noindex">` do `index.html`
- [ ] GA4/Pixel ligados em `track()`, só após consentimento

**Testes funcionais**
- [ ] Cada um dos 20 botões de plano abre o checkout correto (5 TVs × 4 períodos)
- [ ] Todos os botões de WhatsApp abrem a conversa com a mensagem certa
- [ ] Menu móvel, âncoras, FAQ, filtros e carrosséis (toque, setas, teclado)
- [ ] Eventos chegando ao GA4 (DebugView) e ao Meta (Test Events)

**Testes visuais e de desempenho**
- [ ] 360, 390, 768, 1024, 1440 px; Chrome, Safari iOS, Samsung Internet
- [ ] Lighthouse celular: Performance ≥ 90, Acessibilidade ≥ 95, SEO ≥ 95
- [ ] LCP < 2,5 s, CLS < 0,1, INP < 200 ms

**Publicação**
- [ ] Publicar em URL de homologação e aprovar com a GMAX
- [ ] Janela de publicação combinada e plano de reversão (restaurar o backup)
- [ ] Monitorar conversões e erros nas primeiras 48 h

## Cabeçalhos HTTP recomendados (produção)

Exemplo para Apache (`.htaccess`). Ajustar `script-src`/`connect-src`/`img-src`
aos domínios reais de analytics e checkout antes de ativar:

```apache
<IfModule mod_headers.c>
  Header set Strict-Transport-Security "max-age=31536000; includeSubDomains"
  Header set X-Content-Type-Options "nosniff"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  Header set Permissions-Policy "camera=(), microphone=(), geolocation=()"
  Header set Content-Security-Policy "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'"
</IfModule>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 month"
  ExpiresByType text/css "access plus 1 week"
  ExpiresByType application/javascript "access plus 1 week"
</IfModule>
```

**CSRF:** a página não tem formulários com backend. Se algum for criado, use token
anti-CSRF por sessão e cookies `SameSite=Lax; Secure; HttpOnly`.
