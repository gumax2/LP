/*
 * Testes funcionais do protótipo (Playwright + Chromium).
 * Uso:  python3 -m http.server 8765  (na raiz do projeto, em outro terminal)
 *       node tools/testes/funcional.cjs [http://localhost:8765/]
 */
const { chromium, devices } = require("playwright");
const URL = process.argv[2] || "http://localhost:8765/";

// Tabela de referência (deve bater com data/planos.js)
const TABELA = { 1: [35, 95, 175, 300], 2: [70, 185, 340, 580], 3: [90, 240, 435, 735], 4: [120, 315, 560, 940], 5: [150, 390, 685, 1125] };
const PERIODOS = ["Mensal", "Trimestral", "Semestral", "Anual"];
const brl = (v) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

let ok = 0, falhas = 0;
function check(nome, cond, extra) {
  if (cond) { ok++; console.log("  ✔ " + nome); }
  else { falhas++; console.log("  ✘ " + nome + (extra ? " → " + extra : "")); }
}

async function pagina(browser, opts, initConsent) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const erros = [], eventos = [];
  page.on("pageerror", (e) => erros.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") erros.push(m.text());
    if (m.text().startsWith("[GMAX evento]")) eventos.push(m.text().split(" ")[2]);
  });
  if (initConsent) await page.addInitScript((v) => localStorage.setItem("gmax_consent", v), initConsent);
  await page.goto(URL, { waitUntil: "networkidle" });
  return { ctx, page, erros, eventos };
}

const toastTexto = (page) => page.locator("#toast").innerText();

(async () => {
  const browser = await chromium.launch();

  console.log("\n▶ Layout: sem rolagem horizontal");
  for (const w of [320, 360, 390, 414, 768, 1024, 1280, 1440, 1920]) {
    const { ctx, page, erros } = await pagina(browser, { viewport: { width: w, height: 800 } }, "nao");
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    check(`${w}px: largura ${sw}`, sw <= w);
    check(`${w}px: sem erros no console`, erros.length === 0, erros.join(" | "));
    await ctx.close();
  }

  console.log("\n▶ Computador (1440×900)");
  {
    const { ctx, page, erros, eventos } = await pagina(browser, { viewport: { width: 1440, height: 900 } }, null);
    check("primeiro foco do teclado é o link 'Pular para o conteúdo'", await (async () => { await page.keyboard.press("Tab"); return page.evaluate(() => document.activeElement.className === "skip"); })());
    check("parede de capas montada no hero", (await page.locator("#hero-cols img").count()) > 0);
    check("faixa de capas do celular NÃO carregada no computador", (await page.locator("#hero-band img").count()) === 0);
    check("hero mostra preço calculado da tabela", (await page.locator("#hero-preco").innerText()).replace(/\u00a0/g, " ").includes("R$ 25,00/mês"));

    check("12 filmes", (await page.locator('[data-rail="filmes"] .poster').count()) === 12);
    check("12 séries", (await page.locator('[data-rail="series"] .poster').count()) === 12);
    check("7 categorias de canais", (await page.locator(".cat").count()) === 7);
    check("selo 'Demonstrativo' em todas as capas", (await page.locator(".poster__badge").count()) === 24);
    check("imagens das vitrines com lazy loading", await page.evaluate(() => [...document.querySelectorAll(".poster img")].every((i) => i.loading === "lazy")));

    const trilho = page.locator('[data-rail="filmes"] .rail__track');
    await trilho.scrollIntoViewIfNeeded();
    check("seta 'anterior' desabilitada no início", await page.locator('[data-rail="filmes"] [data-dir="-1"]').isDisabled());
    await page.click('[data-rail="filmes"] [data-dir="1"]');
    await page.waitForTimeout(900);
    check("seta 'próximo' rola o carrossel", (await trilho.evaluate((t) => t.scrollLeft)) > 100);
    await page.click('[data-chips="filmes"] .chip[data-v="Ação"]');
    await page.waitForTimeout(200);
    check("filtro 'Ação' mostra 2 filmes", (await page.locator('[data-rail="filmes"] .poster').count()) === 2);
    await page.click('[data-chips="filmes"] .chip[data-v=""]');
    check("filtro 'Todos' restaura 12", (await page.locator('[data-rail="filmes"] .poster').count()) === 12);

    await page.locator("#canais-destaque").scrollIntoViewIfNeeded();
    check("canais em destaque: só espaços de exemplo, nenhum canal real", (await page.locator(".logo-tile").count()) === (await page.locator(".logo-tile--demo").count()) && (await page.locator(".logo-tile img").count()) === 0);
    check("canais em destaque: aviso 'exemplo de layout'", await page.locator(".channels__demo").isVisible());
    await page.click('#canais-chips .chip[data-v="Esportes"]');
    check("filtro de canais por categoria", (await page.locator(".logo-tile:visible").count()) === (await page.locator('.logo-tile[data-cat="esportes"]').count()));
    await page.click('#canais-chips .chip[data-v=""]');

    console.log("  — planos: 5 TVs × 4 períodos");
    await page.locator("#planos").scrollIntoViewIfNeeded();
    check("aviso 'pendente de validação' visível", await page.locator("#planos-status").isVisible());
    let tabelaOk = true, destaqueOk = true, detalhe = "";
    for (const n of [1, 2, 3, 4, 5]) {
      await page.click(`label[for=tvs-${n}]`);
      await page.waitForTimeout(80);
      const cards = await page.locator(".plan").evaluateAll((cs) => cs.map((c) => ({
        nome: c.querySelector(".plan__name").textContent,
        preco: c.querySelector(".plan__price").textContent.replace("R$", "").trim(),
        best: c.classList.contains("plan--best"),
        save: c.querySelector(".plan__save").textContent,
      })));
      PERIODOS.forEach((p, i) => {
        const c = cards.find((x) => x.nome === p);
        const esperado = brl(TABELA[n][i]);
        if (!c || c.preco !== esperado) { tabelaOk = false; detalhe += `${n}TV ${p}: ${c && c.preco} ≠ ${esperado}; `; }
        const econ = TABELA[n][0] * [1, 3, 6, 12][i] - TABELA[n][i];
        if (econ > 0 && !c.save.replace(/\u00a0/g, " ").includes(brl(econ))) { tabelaOk = false; detalhe += `${n}TV ${p}: economia "${c.save}"; `; }
      });
      const best = cards.filter((c) => c.best);
      if (best.length !== 1 || best[0].nome !== "Anual") destaqueOk = false;
      const telas = await page.locator(".tv-screen.is-on").count();
      if (telas !== n) { tabelaOk = false; detalhe += `${n}TV: ${telas} telas acesas; `; }
    }
    check("20 preços e economias idênticos à tabela", tabelaOk, detalhe);
    check("'Melhor custo-benefício' calculado (Anual) em todas as quantidades", destaqueOk);

    await page.click(`label[for=tvs-3]`);
    const url0 = page.url();
    await page.locator(".plan--best .btn").click();
    await page.waitForTimeout(150);
    check("Assinar → aviso de checkout desativado", (await toastTexto(page)).includes("Checkout desativado"));
    check("Assinar não navega para fora", page.url() === url0);

    await page.locator("#indique").scrollIntoViewIfNeeded();
    check("regras da promoção abertas no computador", await page.locator("#ref-regras").evaluate((d) => d.open));
    await page.click(".ref__btn");
    await page.waitForTimeout(150);
    check("botão de indicação usa a mensagem oficial",
      (await toastTexto(page)).includes("Olá! Sou cliente GMAX e quero participar da promoção de indicação. Como faço para indicar um amigo?"));

    check("seção de avaliações: aviso de seção preparada (sem dados fictícios)", (await page.locator(".reviews__empty").count()) === 1 && (await page.locator(".review").count()) === 0);

    await page.locator("#duvidas").scrollIntoViewIfNeeded();
    const q = page.locator(".faq__q").first();
    await q.click();
    check("FAQ abre e atualiza aria-expanded", (await q.getAttribute("aria-expanded")) === "true");
    check("resposta aberta acessível (não inert)", !(await page.locator(".faq__a").first().evaluate((a) => a.inert)));
    await page.click('#faq-chips .chip[data-v="Indicações"]');
    check("filtro de tema mostra só 'Indicações'", (await page.locator(".faq__group:visible").count()) === 1);
    check("FAQ de economia derivado da tabela", (await page.locator("#faq-economia").textContent()).replace(/\u00a0/g, " ").includes("R$ 120,00"));

    check("botão flutuante do WhatsApp visível no computador", await page.locator(".wa-float").isVisible());
    check("dataLayer vazio sem consentimento (LGPD)", (await page.evaluate(() => window.dataLayer.length)) === 0);
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(400);
    check("aviso de cookies aparece após rolar", await page.locator("#consent").isVisible());
    await page.click('[data-consent="sim"]');
    await page.click('#faq-chips .chip[data-v="Teste"]');
    check("após aceitar, eventos vão para o dataLayer", (await page.evaluate(() => window.dataLayer.length)) > 0);

    const esperados = ["select_tvs", "begin_checkout", "whatsapp_click", "referral_click", "faq_open", "filtro_vitrine", "rail_nav", "view_plans"];
    const faltando = esperados.filter((e) => !eventos.includes(e));
    check("eventos de conversão disparados", faltando.length === 0, "faltando: " + faltando.join(", "));
    check("sem erros no console", erros.length === 0, erros.join(" | "));
    await ctx.close();
  }

  console.log("\n▶ Celular (iPhone 13)");
  {
    const { ctx, page, erros } = await pagina(browser, devices["iPhone 13"], null);
    check("faixa de capas no hero do celular", (await page.locator("#hero-band img").count()) > 0);
    check("parede do computador NÃO carregada no celular", (await page.locator("#hero-cols img").count()) === 0);
    check("botões principais visíveis na primeira tela", await page.locator(".hero .hero__actions .btn--primary").isVisible() && (await page.locator(".hero .hero__actions .btn--primary").boundingBox()).y < 844);
    check("aviso de cookies não aparece antes de rolar", !(await page.locator("#consent").isVisible()));
    check("barra fixa escondida no topo", !(await page.locator("#mobile-bar").evaluate((b) => b.classList.contains("is-visible"))));

    await page.click("#menu-toggle");
    check("menu móvel abre", await page.locator("#menu-mobile").isVisible());
    await page.keyboard.press("Escape");
    check("Esc fecha o menu", !(await page.locator("#menu-mobile").isVisible()));

    await page.locator("#conteudo").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    check("cookies e barra fixa não se sobrepõem", await page.evaluate(() => {
      const c = document.getElementById("consent"), b = document.getElementById("mobile-bar");
      if (c.hidden) return true;
      const bb = b.getBoundingClientRect();
      return bb.top >= window.innerHeight - 2; // barra fora da tela enquanto o aviso está aberto
    }));
    await page.click('[data-consent="nao"]');
    await page.waitForTimeout(500);
    check("barra fixa aparece após responder aos cookies", await page.locator("#mobile-bar").evaluate((b) => b.classList.contains("is-visible")));

    await page.locator("#planos").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    check("barra fixa some sobre os planos (sem CTA duplicado)", !(await page.locator("#mobile-bar").evaluate((b) => b.classList.contains("is-visible"))));
    check("no celular, o melhor custo-benefício aparece primeiro", await page.evaluate(() => {
      const cs = [...document.querySelectorAll(".plan")].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      return cs[0].classList.contains("plan--best");
    }));
    check("regras da promoção recolhidas no celular", !(await page.locator("#ref-regras").evaluate((d) => d.open)));
    check("botão flutuante oculto no celular", !(await page.locator(".wa-float").isVisible()));

    const trilho = page.locator('[data-rail="series"] .rail__track');
    await trilho.scrollIntoViewIfNeeded();
    const box = await trilho.boundingBox();
    await page.mouse.move(box.x + box.width - 30, box.y + 100);
    await trilho.evaluate((t) => t.scrollBy({ left: 300 }));
    await page.waitForTimeout(400);
    check("carrossel rola horizontalmente (toque/scroll)", (await trilho.evaluate((t) => t.scrollLeft)) > 0);
    check("sem erros no console", erros.length === 0, erros.join(" | "));
    await ctx.close();
  }

  console.log("\n▶ Movimento reduzido");
  {
    const { ctx, page, erros } = await pagina(browser, { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }, "nao");
    check("parede do hero parada", await page.evaluate(() => getComputedStyle(document.querySelector(".hero__col")).animationName === "none"));
    check("conteúdo visível sem animação de entrada", await page.evaluate(() => [...document.querySelectorAll(".reveal")].length === 0));
    check("sem erros no console", erros.length === 0, erros.join(" | "));
    await ctx.close();
  }

  console.log("\n▶ Samsung Internet (emulação: user-agent + viewport, motor Chromium)");
  {
    const ua = "Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36";
    const { ctx, page, erros } = await pagina(browser, { userAgent: ua, viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, "nao");
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    check("360px sem rolagem horizontal", sw <= 360);
    check("planos renderizados", (await page.locator(".plan").count()) === 4);
    check("sem erros no console", erros.length === 0, erros.join(" | "));
    await ctx.close();
  }

  await browser.close();
  console.log(`\nResultado: ${ok} aprovados, ${falhas} falharam\n`);
  process.exit(falhas ? 1 : 0);
})();
