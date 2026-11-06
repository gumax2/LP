#!/usr/bin/env node
/*
 * Otimiza os MATERIAIS OFICIAIS AUTORIZADOS para as vitrines.
 *
 * Entrada (não versionada; ver .gitignore):
 *   materiais/recebidos/filmes/<id>.(jpg|png|webp)   pôsteres verticais
 *   materiais/recebidos/series/<id>.(jpg|png|webp)   pôsteres verticais
 *   materiais/recebidos/canais/<id>.(svg|png|webp)   logotipos (fundo transparente)
 *   O nome do arquivo (<id>) deve ser igual ao `id` do item em data/catalogo.js.
 *
 * Saída:
 *   assets/img/oficial/<tipo>/<id>-<largura>.(avif|webp|jpg|png)
 *   e um trecho pronto para colar em data/catalogo.js (impresso no terminal
 *   e salvo em materiais/catalogo-gerado.json).
 *
 * Uso:  npm run imagens            (ou: node tools/otimizar-imagens.mjs)
 *       npm run imagens -- --entrada <pasta> --saida <pasta>
 *
 * Este script NÃO verifica direitos: ele só processa o que já foi autorizado.
 * Antes de rodar, confirme a licença de cada arquivo (docs/MATERIAIS.md).
 */
import { readdirSync, mkdirSync, writeFileSync, copyFileSync, existsSync, statSync } from "node:fs";
import { join, extname, basename, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (nome, padrao) => { const i = process.argv.indexOf(nome); return i > 0 ? process.argv[i + 1] : padrao; };
const ENTRADA = arg("--entrada", join(raiz, "materiais/recebidos"));
const SAIDA = arg("--saida", join(raiz, "assets/img/oficial"));
const RAIZ_WEB = arg("--raiz-web", raiz); // caminhos no catálogo ficam relativos a esta pasta

// Pôster 2:3. Larguras cobrem do celular (1x) ao computador (2x).
const POSTER = { larguras: [180, 270, 360, 540], qualidade: { avif: 50, webp: 72, jpg: 78 } };
// Logotipos: exibidos em cartões de ~160 px; 320 px cobre telas 2x.
const LOGO = { larguras: [160, 320] };

const IMAGEM = /\.(jpe?g|png|webp|avif|tiff?)$/i;
const web = (p) => relative(RAIZ_WEB, p).split("\\").join("/");

async function poster(arquivo, tipo, id) {
  const destino = join(SAIDA, tipo);
  mkdirSync(destino, { recursive: true });
  const meta = await sharp(arquivo).metadata();
  const proporcao = meta.width / meta.height;
  if (Math.abs(proporcao - 2 / 3) > 0.04) {
    console.warn(`  ! ${tipo}/${id}: proporção ${meta.width}×${meta.height} não é 2:3. Será preservada (sem corte).`);
  }
  const larguras = POSTER.larguras.filter((w) => w <= meta.width);
  if (!larguras.length) larguras.push(meta.width);
  if (meta.width < 360) console.warn(`  ! ${tipo}/${id}: resolução baixa (${meta.width}px). Peça o arquivo em alta resolução.`);

  const srcset = { avif: [], webp: [], jpg: [] };
  for (const w of larguras) {
    const base = sharp(arquivo).rotate().resize({ width: w, withoutEnlargement: true });
    for (const [fmt, opts] of [["avif", { quality: POSTER.qualidade.avif, effort: 5 }], ["webp", { quality: POSTER.qualidade.webp }], ["jpg", { quality: POSTER.qualidade.jpg, mozjpeg: true }]]) {
      const out = join(destino, `${id}-${w}.${fmt}`);
      await base.clone().toFormat(fmt === "jpg" ? "jpeg" : fmt, opts).toFile(out);
      srcset[fmt].push(`${web(out)} ${w}w`);
    }
  }
  const padrao = larguras.includes(360) ? 360 : larguras[larguras.length - 1];
  return {
    imagem: web(join(destino, `${id}-${padrao}.jpg`)),
    largura: meta.width, altura: meta.height,
    fontes: { avif: srcset.avif.join(", "), webp: srcset.webp.join(", "), jpg: srcset.jpg.join(", ") },
  };
}

async function logo(arquivo, id) {
  const destino = join(SAIDA, "canais");
  mkdirSync(destino, { recursive: true });
  if (extname(arquivo).toLowerCase() === ".svg") {
    // SVG oficial: mantido como recebido (vetorial, nítido em qualquer tela).
    const out = join(destino, `${id}.svg`);
    copyFileSync(arquivo, out);
    return { logo: web(out) };
  }
  const srcset = { webp: [], png: [] };
  for (const w of LOGO.larguras) {
    const base = sharp(arquivo).resize({ width: w, withoutEnlargement: true });
    const webp = join(destino, `${id}-${w}.webp`), png = join(destino, `${id}-${w}.png`);
    await base.clone().webp({ quality: 85, alphaQuality: 90 }).toFile(webp);
    await base.clone().png({ compressionLevel: 9, palette: true }).toFile(png);
    srcset.webp.push(`${web(webp)} ${w}w`);
    srcset.png.push(`${web(png)} ${w}w`);
  }
  return { logo: web(join(destino, `${id}-160.png`)), logoFontes: { webp: srcset.webp.join(", "), png: srcset.png.join(", ") } };
}

const resultado = { filmes: {}, series: {}, canais: {} };
let total = 0;
for (const tipo of ["filmes", "series", "canais"]) {
  const pasta = join(ENTRADA, tipo);
  if (!existsSync(pasta)) continue;
  for (const nome of readdirSync(pasta).sort()) {
    const arquivo = join(pasta, nome);
    if (!statSync(arquivo).isFile()) continue;
    const id = basename(nome, extname(nome)).toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (tipo === "canais" ? !(IMAGEM.test(nome) || /\.svg$/i.test(nome)) : !IMAGEM.test(nome)) continue;
    resultado[tipo][id] = tipo === "canais" ? await logo(arquivo, id) : await poster(arquivo, tipo, id);
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
console.log("Campos de imagem prontos em materiais/catalogo-gerado.json. Copie-os para data/catalogo.js");
console.log("junto com os dados da licença de cada item e rode: npm run validar");
