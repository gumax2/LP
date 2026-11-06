#!/usr/bin/env node
/*
 * Otimiza arquivos soltos de materiais oficiais AUTORIZADOS (uso avulso).
 * Para o fluxo completo com planilha, prefira: npm run importar
 *
 * Entrada (não versionada): materiais/recebidos/{filmes,series,canais}/<id>.<ext>
 * Saída:   assets/img/oficial/<tipo>/<id>-<largura>.(avif|webp|jpg|png)
 *          + materiais/catalogo-gerado.json com os campos de imagem
 *
 * Uso:  npm run imagens [-- --entrada <pasta> --saida <pasta> --raiz-web <pasta>]
 * Este script NÃO verifica direitos: processa só o que já foi autorizado.
 */
import { readdirSync, mkdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, extname, basename, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { otimizarPoster, otimizarLogo } from "./lib/imagens.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (nome, padrao) => { const i = process.argv.indexOf(nome); return i > 0 ? process.argv[i + 1] : padrao; };
const ENTRADA = arg("--entrada", join(raiz, "materiais/recebidos"));
const SAIDA = arg("--saida", join(raiz, "assets/img/oficial"));
const RAIZ_WEB = arg("--raiz-web", raiz);
const IMAGEM = /\.(jpe?g|png|webp|avif|tiff?)$/i;

const resultado = { filmes: {}, series: {}, canais: {} };
let total = 0;
for (const tipo of ["filmes", "series", "canais"]) {
  const pasta = join(ENTRADA, tipo);
  if (!existsSync(pasta)) continue;
  for (const nome of readdirSync(pasta).sort()) {
    const arquivo = join(pasta, nome);
    if (!statSync(arquivo).isFile()) continue;
    if (!(IMAGEM.test(nome) || (tipo === "canais" && /\.svg$/i.test(nome)))) continue;
    const id = basename(nome, extname(nome)).toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const opts = { saida: SAIDA, raizWeb: RAIZ_WEB, tipo, id, avisar: (m) => console.warn("  ! " + m) };
    resultado[tipo][id] = tipo === "canais" ? await otimizarLogo(arquivo, opts) : await otimizarPoster(arquivo, opts);
    total++;
    console.log(`  ✔ ${tipo}/${id}`);
  }
}

if (!total) {
  console.log(`Nenhum material encontrado em ${relative(raiz, ENTRADA) || ENTRADA}/{filmes,series,canais}/.`);
  console.log("Coloque ali somente arquivos com autorização comercial confirmada (ver docs/MATERIAIS.md).");
  process.exit(0);
}
mkdirSync(join(raiz, "materiais"), { recursive: true });
writeFileSync(join(raiz, "materiais/catalogo-gerado.json"), JSON.stringify(resultado, null, 2));
console.log(`\n${total} arquivo(s) otimizado(s) em ${relative(raiz, SAIDA)}/.`);
console.log("Campos de imagem em materiais/catalogo-gerado.json. Para o fluxo completo, use: npm run importar");
