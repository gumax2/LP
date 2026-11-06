#!/usr/bin/env node
/*
 * Gera uma prévia em ARQUIVO ÚNICO (CSS, JS, fontes e imagens embutidos).
 * Útil para enviar o protótipo para aprovação ou abrir com duplo clique.
 *
 * Uso:   node tools/build-preview.mjs
 * Saída: dist/gmax-prototipo.html           (documento completo)
 *        dist/gmax-prototipo.fragmento.html (sem <html>/<head>, para hospedagem de prévia)
 *
 * Não é o artefato de produção: em produção, publique os arquivos separados
 * (melhor cache e CSP sem 'unsafe-inline').
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(join(raiz, p), "utf8");
const dataUri = (p, mime) => `data:${mime};base64,${readFileSync(join(raiz, p)).toString("base64")}`;

let css = ler("assets/css/main.css").replace(/url\("\.\.\/fonts\/([^"]+)"\)/g, (_, f) => `url("${dataUri("assets/fonts/" + f, "font/woff2")}")`);
let catalogo = ler("data/catalogo.js").replace(/"(assets\/img\/catalogo\/[^"]+\.svg)"/g, (_, p) => `"${dataUri(p, "image/svg+xml")}"`);
const scripts = [ler("data/config.js"), ler("data/planos.js"), catalogo, ler("data/catalogo-oficial.js"), ler("data/avaliacoes.js"), ler("assets/js/app.js")]
  .map((s) => `<script>\n${s.replace(/<\/script/gi, () => "<\\/script")}\n</script>`).join("\n");

let html = ler("index.html")
  .replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*>/, "")
  .replace(/\s*<link rel="preload"[^>]*>/g, "")
  .replace(/\s*<script src="[^"]+" defer><\/script>/g, "")
  .replace(/<link rel="stylesheet" href="assets\/css\/main.css">/, () => `<style>\n${css}\n</style>`)
  .replace("</body>", () => `${scripts}\n</body>`);

mkdirSync(join(raiz, "dist"), { recursive: true });
writeFileSync(join(raiz, "dist/gmax-prototipo.html"), html);

// Fragmento: conteúdo do <head> útil + <body>, sem o esqueleto do documento.
const titulo = "<title>Protótipo GMAX</title>";
const estilo = html.match(/<style>[\s\S]*?<\/style>/)[0];
const corpo = html.match(/<body>([\s\S]*)<\/body>/)[1];
const fragmento = `${titulo}\n<meta name="claude:viewport-fit-sides" content="cover">\n${estilo}\n${corpo}`;
writeFileSync(join(raiz, "dist/gmax-prototipo.fragmento.html"), fragmento);

console.log(`dist/gmax-prototipo.html (${Math.round(html.length / 1024)} KB)`);
