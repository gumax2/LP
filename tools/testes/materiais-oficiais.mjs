#!/usr/bin/env node
/*
 * Teste de ponta a ponta do fluxo de materiais oficiais, numa CÓPIA TEMPORÁRIA do site.
 * Usa somente imagens geradas aqui (nenhum material de terceiros).
 *
 * Verifica:
 *  1. otimizar-imagens.mjs gera AVIF/WebP/JPG (pôster) e WebP/PNG (logotipo);
 *  2. a página exibe item oficial COM licença, usando AVIF e srcset;
 *  3. a página esconde item SEM licença, com licença VENCIDA ou NÃO disponível no serviço;
 *  4. a grade de canais mostra o logotipo autorizado;
 *  5. validar-catalogo.mjs acusa os itens irregulares.
 *
 * Uso: node tools/testes/materiais-oficiais.mjs
 */
import { cpSync, mkdirSync, readFileSync, writeFileSync, mkdtempSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync, spawn } from "node:child_process";
import { createRequire } from "node:module";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const raiz = join(dirname(fileURLToPath(import.meta.url)), "../..");
const tmp = mkdtempSync(join(process.env.TMPDIR || tmpdir(), "gmax-materiais-"));
let ok = 0, falhas = 0;
const check = (n, c, x) => { if (c) { ok++; console.log("  ✔ " + n); } else { falhas++; console.log("  ✘ " + n + (x ? " → " + x : "")); } };

// 1. cópia do site
for (const p of ["index.html", "assets", "data", "tools"]) cpSync(join(raiz, p), join(tmp, p), { recursive: true });
cpSync(join(raiz, "node_modules"), join(tmp, "node_modules"), { recursive: true });

// 2. "materiais recebidos" de teste (gerados aqui)
const svgPoster = (t, c) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1500"><rect width="1000" height="1500" fill="${c}"/><text x="500" y="1300" font-size="90" text-anchor="middle" fill="#fff" font-family="Arial">${t}</text></svg>`);
const svgLogo = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="240"><text x="320" y="150" font-size="110" text-anchor="middle" fill="#0b3d91" font-family="Arial" font-weight="bold">TESTE</text></svg>`);
for (const d of ["filmes", "canais"]) mkdirSync(join(tmp, "materiais/recebidos", d), { recursive: true });
await sharp(svgPoster("TESTE OK", "#1d4ed8")).png().toFile(join(tmp, "materiais/recebidos/filmes/teste-licenciado.png"));
await sharp(svgPoster("SEM LICENCA", "#7f1d1d")).png().toFile(join(tmp, "materiais/recebidos/filmes/teste-sem-licenca.png"));
await sharp(svgLogo).png().toFile(join(tmp, "materiais/recebidos/canais/canal-teste.png"));

console.log("\n▶ Otimização");
execFileSync("node", [join(tmp, "tools/otimizar-imagens.mjs")], { cwd: tmp, stdio: "pipe" });
const gerado = JSON.parse(readFileSync(join(tmp, "materiais/catalogo-gerado.json"), "utf8"));
const f = gerado.filmes["teste-licenciado"];
check("pôster: 4 larguras × AVIF/WebP/JPG", f && f.fontes.avif.split(",").length === 4 && f.fontes.webp && f.fontes.jpg);
const kb = (p) => Math.round(statSync(join(tmp, p)).size / 1024);
const avif360 = "assets/img/oficial/filmes/teste-licenciado-360.avif", jpg360 = "assets/img/oficial/filmes/teste-licenciado-360.jpg";
check(`AVIF 360px menor que JPG 360px (${kb(avif360)} KB vs ${kb(jpg360)} KB)`, statSync(join(tmp, avif360)).size < statSync(join(tmp, jpg360)).size);
check("logotipo: WebP + PNG em 2 larguras", gerado.canais["canal-teste"] && gerado.canais["canal-teste"].logoFontes.webp.split(",").length === 2);

// 3. catálogo de teste: 1 válido, 3 irregulares, 1 canal válido
const lic = { tipo: "autorizacao-escrita", titular: "GMAX (teste)", documento: "TESTE-001", disponivelNoServico: true };
const s = gerado.filmes["teste-sem-licenca"];
const itens = [
  { id: "teste-licenciado", titulo: "Título Licenciado (teste)", genero: "Teste", ...f, ilustrativo: false, autorizado: true, licenca: lic },
  { id: "teste-sem-licenca", titulo: "Sem Licença (teste)", genero: "Teste", ...s, ilustrativo: false, autorizado: true },
  { id: "teste-vencido", titulo: "Licença Vencida (teste)", genero: "Teste", ...s, ilustrativo: false, autorizado: true, licenca: { ...lic, validoAte: "2020-01-01" } },
  { id: "teste-indisponivel", titulo: "Indisponível (teste)", genero: "Teste", ...s, ilustrativo: false, autorizado: true, licenca: { ...lic, disponivelNoServico: false } },
];
const destaques = [{ id: "canal-teste", nome: "Canal Teste", categoria: "esportes", ...gerado.canais["canal-teste"], autorizado: true, licenca: lic }];
let cat = readFileSync(join(tmp, "data/catalogo.js"), "utf8");
cat = cat.replace("filmes: [", "filmes: [\n" + itens.map((i) => JSON.stringify(i) + ",").join("\n"));
cat = cat.replace("destaques: [],", "destaques: " + JSON.stringify(destaques) + ",");
writeFileSync(join(tmp, "data/catalogo.js"), cat);

console.log("\n▶ Validador");
let saida = "", codigo = 0;
try { saida = execFileSync("node", [join(tmp, "tools/validar-catalogo.mjs")], { cwd: tmp, encoding: "utf8" }); }
catch (e) { saida = e.stdout; codigo = e.status; }
check("bloqueia a publicação (código 1)", codigo === 1);
check("acusa item sem licença", saida.includes('filmes/teste-sem-licenca: item oficial sem bloco "licenca"'));
check("acusa licença vencida", saida.includes("filmes/teste-vencido: licença vencida"));
check("acusa título não disponível no serviço", saida.includes("filmes/teste-indisponivel: disponibilidade no serviço não confirmada"));
check("não acusa o item licenciado", !saida.includes("ERRO:  filmes/teste-licenciado"));

console.log("\n▶ Página");
const servidor = spawn("python3", ["-m", "http.server", "8799"], { cwd: tmp, stdio: "ignore" });
const configOriginal = readFileSync(join(tmp, "data/config.js"), "utf8");
await new Promise((r) => setTimeout(r, 900));
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.route("**/*", (r) => r.continue()); // desativa o cache HTTP: o teste altera arquivos entre carregamentos
const erros = [];
page.on("pageerror", (e) => erros.push(e.message));
// Opção B (padrão): 1 título oficial é menos que o mínimo (8) → vitrine continua oculta
await page.goto("http://localhost:8799/", { waitUntil: "networkidle" });
check("opção B: vitrine oculta abaixo do mínimo de títulos autorizados", await page.locator('[data-rail="filmes"]').isHidden());
check("opção B: canal autorizado aparece na grade de logotipos", (await page.locator(".logo-tile:not(.logo-tile--demo)").count()) === 1);
// Mínimo reduzido para 1 → a vitrine aparece só com o oficial (sem exemplos)
writeFileSync(join(tmp, "data/config.js"), configOriginal.replace(/minimoTitulos: \d+,/, "minimoTitulos: 1,"));
await page.goto("http://localhost:8799/", { waitUntil: "networkidle" });
check("com o mínimo atingido, só títulos oficiais aparecem (nenhum exemplo)", (await page.locator('[data-rail="filmes"] .poster').count()) === 1);
const titulos = await page.locator('[data-rail="filmes"] .poster__t').allTextContents();
check("exibe o título licenciado", titulos.includes("Título Licenciado (teste)"));
check("esconde sem licença, vencido e indisponível", !titulos.some((t) => /Sem Licença|Vencida|Indisponível/.test(t)));
const poster = page.locator('[data-rail="filmes"] .poster').filter({ hasText: "Título Licenciado" });
check("pôster oficial sem selo 'Demonstrativo'", (await poster.locator(".poster__badge").count()) === 0);
await poster.scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
const src = await poster.locator("img").evaluate((i) => i.currentSrc);
check("navegador escolhe AVIF via srcset", src.endsWith(".avif"), src);
check("proporção original aplicada", (await poster.locator(".poster__frame").evaluate((e) => e.style.aspectRatio)).includes("1000 / 1500"));
check("grade de canais com 1 logotipo autorizado, sem espaços de exemplo", (await page.locator(".logo-tile").count()) === 1 && (await page.locator(".logo-tile--demo").count()) === 0);
check("sem erros no console", erros.length === 0, erros.join(" | "));

console.log("\n▶ Importação pela planilha (npm run importar)");
const csv = [
  "tipo;id;titulo;genero_ou_categoria;arquivo;titular_do_direito;tipo_de_licenca;documento_de_autorizacao;valido_ate;disponivel_no_servico;observacoes",
  "filme;exemplo-filme;EXEMPLO;Drama;x.jpg;X;contrato-distribuicao;Y;;sim;ignorado",
  'filme;planilha-ok;"Título da Planilha (teste)";Drama;teste-licenciado.png;GMAX (teste);autorizacao-escrita;"Contrato SIGILOSO 123";2099-12-31;sim;',
  "filme;planilha-sem-doc;Sem Documento;Drama;teste-licenciado.png;GMAX (teste);autorizacao-escrita;;;sim;",
  "filme;planilha-vencida;Vencida;Drama;teste-licenciado.png;GMAX (teste);autorizacao-escrita;Doc 1;2020-01-01;sim;",
  "filme;planilha-indisp;Indisponível;Drama;teste-licenciado.png;GMAX (teste);autorizacao-escrita;Doc 2;;nao;",
  "canal;canal-planilha;Canal da Planilha (teste);esportes;canal-teste.png;GMAX (teste);kit-divulgacao;Manual 2026;;sim;",
  "canal;canal-cat-errada;Canal Errado;novelas;canal-teste.png;GMAX (teste);kit-divulgacao;Manual;;sim;",
].join("\r\n");
writeFileSync(join(tmp, "materiais/cadastro.csv"), csv);
const saidaImp = execFileSync("node", [join(tmp, "tools/importar-catalogo.mjs")], { cwd: tmp, encoding: "utf8" });
const pub = readFileSync(join(tmp, "data/catalogo-oficial.js"), "utf8");
const ctxO = { window: {} };
(await import("node:vm")).runInNewContext(pub, ctxO);
const O = ctxO.window.GMAX_CATALOGO_OFICIAL;
check("aceita o título e o canal com licença completa", O.filmes.length === 1 && O.filmes[0].id === "planilha-ok" && O.canais.length === 1);
check("rejeita sem documento, vencido, indisponível e categoria inválida", (saidaImp.match(/REJEITADO/g) || []).length === 4);
check("ignora as linhas de exemplo do modelo", !pub.includes("exemplo-filme"));
check("texto do documento de autorização NÃO vai para o arquivo público", !pub.includes("SIGILOSO") && /LIC-[0-9A-F]{8}/.test(pub));
check("pôster importado com AVIF/WebP/JPG", !!(O.filmes[0].fontes && O.filmes[0].fontes.avif && O.filmes[0].fontes.webp && O.filmes[0].fontes.jpg));
await page.goto("http://localhost:8799/", { waitUntil: "networkidle" });
check("página exibe o título importado", (await page.locator('[data-rail="filmes"] .poster__t').allTextContents()).includes("Título da Planilha (teste)"));
check("página exibe o canal importado", (await page.locator(".logo-tile__n").allTextContents()).includes("Canal da Planilha (teste)"));
let codigoV = 0;
try { execFileSync("node", [join(tmp, "tools/validar-catalogo.mjs")], { cwd: tmp, encoding: "utf8" }); } catch (e) { codigoV = e.status; }
check("validador continua bloqueando os itens irregulares inseridos à mão", codigoV === 1);

await browser.close();
servidor.kill();

console.log(`\nResultado: ${ok} aprovados, ${falhas} falharam (cópia temporária: ${tmp})\n`);
process.exit(falhas ? 1 : 0);
