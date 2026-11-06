# Validação e implantação

## 1. Relatório de testes do protótipo (06/11/2026)

### Testes funcionais automatizados: 70 de 70 aprovados
Script: `tools/testes/funcional.cjs` (Playwright + Chromium).

| Área | O que foi verificado |
|---|---|
| Layout | Sem rolagem horizontal e sem erros de console em 320, 360, 390, 414, 768, 1024, 1280, 1440 e 1920 px |
| Hero | Parede de capas só no computador; faixa de capas só no celular (cada versão carrega apenas as próprias imagens); preço do hero calculado da tabela; botões visíveis na primeira tela do celular |
| Vitrines | 12 filmes, 12 séries, 7 categorias; selo “Demonstrativo” nas 24 capas; lazy loading; setas (estado inicial e rolagem); rolagem por toque; filtros por categoria |
| Planos | Os 20 preços (5 TVs × 4 períodos) e as economias conferem com `data/planos.js`; “Melhor custo-benefício” calculado; aviso “pendente de validação”; “Assinar” mostra o aviso e não navega |
| Indicações | Mensagem de WhatsApp idêntica à aprovada; regras abertas no computador e recolhidas no celular |
| Avaliações | Nenhum dado fictício; aviso de “seção preparada” só no modo protótipo |
| FAQ | Abre/fecha com `aria-expanded`; conteúdo fechado fica `inert`; filtro por tema |
| Conversão | Barra fixa do celular: oculta no topo, oculta sobre planos/indicações/CTA final, nunca junto com o aviso de cookies; botão flutuante só no computador |
| LGPD | `dataLayer` vazio sem consentimento; eventos enviados após “Aceitar” |
| Eventos | `view_plans`, `select_tvs`, `begin_checkout`, `whatsapp_click`, `referral_click`, `faq_open`, `filtro_vitrine`, `rail_nav` |
| Acessibilidade | Primeiro Tab = “Pular para o conteúdo”; menu fecha com Esc; movimento reduzido para a parede e as revelações |
| Samsung Internet | Emulação de user-agent e viewport de 360 px (motor Chromium) |

### Lighthouse 12 (servidor local sem compressão nem cache)
| | Desempenho | Acessibilidade | Boas práticas | SEO |
|---|---|---|---|---|
| Celular (4G simulado) | 96–99 | 100 | 100 | 66* |
| Computador | 100 | 100 | 100 | 66* |

Celular: FCP 1,5–1,7 s · LCP 2,1–2,6 s · TBT 30–70 ms · CLS 0–0,024 · peso total 371 KiB.
\* SEO 66 por causa do `noindex` proposital do protótipo. Sem ele, a auditoria de indexação passa.
Os alertas de compressão e cache vêm do servidor de teste e são resolvidos pelos cabeçalhos da seção 4.

### Limitações (não executado)
- **Safari (iOS/macOS):** o ambiente não tem WebKit. Testar em um iPhone real antes da publicação.
- **Samsung Internet real:** só emulação. Testar em um aparelho Samsung.
- **Instagram (navegador interno):** testar abrindo o link de prévia pelo app.

## 2. Inventário a fazer antes da integração (depende de acesso ao site atual)

- [ ] Hospedagem, servidor, versão de PHP/CMS e estrutura de pastas
- [ ] Configuração comercial: onde ficam preços, promoções e descontos
- [ ] Checkout Mercado Pago: links/botões por plano, URLs de retorno
- [ ] Webhooks e endpoints (somente listar, sem alterar)
- [ ] Formulários e para onde enviam
- [ ] Pixels e tags (GA4, Meta, Google Ads, outros)
- [ ] DNS, SSL, redirecionamentos e `robots.txt`/`sitemap.xml`
- [ ] Páginas legais existentes

## 3. Estratégia de backup e reversão

1. **Backup completo** (arquivos + banco, se houver) baixado e versionado na pasta `backup/` de uma branch própria, com data e hash.
2. **Homologação:** a nova página é publicada em URL separada (ex.: subdomínio de prévia) usando os checkouts reais, só para teste interno.
3. **Publicação** em janela combinada, trocando apenas o arquivo da página inicial e os assets novos. Integrações, webhooks e configurações de produção não são tocados.
4. **Reversão em menos de 5 minutos:** restaurar o arquivo anterior da página (guardado como `index.anterior.html`) ou reaplicar o backup.
5. **Monitoramento por 48 h:** conversões, cliques no WhatsApp, erros de console e chegada de pagamentos.

## 4. Checklist de publicação

**Integração**
- [ ] Pendências bloqueantes de `docs/PENDENCIAS.md` resolvidas
- [ ] `data/planos.js` com os preços de produção e `status: "validada"`
- [ ] Links de checkout copiados sem alteração para `data/config.js`
- [ ] `modoPrototipo: false`
- [ ] Remover `<meta name="robots" content="noindex">`
- [ ] GA4/Pixel ligados em `track()`, só após consentimento; CSP ajustada aos domínios deles

**Testes**
- [ ] Os 20 botões de plano abrem o checkout correto
- [ ] Todos os botões de WhatsApp abrem a conversa com a mensagem certa
- [ ] iPhone (Safari), Android (Chrome e Samsung Internet), navegador interno do Instagram
- [ ] Lighthouse no servidor real: desempenho ≥ 90 no celular
- [ ] Eventos chegando ao GA4 (DebugView) e ao Meta (Test Events)

## 5. Cabeçalhos HTTP recomendados (Apache, `.htaccess`)

Ajustar `script-src`/`connect-src`/`img-src` aos domínios reais de analytics antes de ativar.

```apache
<IfModule mod_headers.c>
  Header set Strict-Transport-Security "max-age=31536000; includeSubDomains"
  Header set X-Content-Type-Options "nosniff"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  Header set Permissions-Policy "camera=(), microphone=(), geolocation=()"
  Header set Content-Security-Policy "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'"
</IfModule>
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml
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
