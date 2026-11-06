/*
 * Biblioteca de otimização de imagens (pôsteres e logotipos oficiais).
 * Usada por tools/otimizar-imagens.mjs e tools/importar-catalogo.mjs.
 */
import { mkdirSync, copyFileSync } from "node:fs";
import { join, extname, relative } from "node:path";
import sharp from "sharp";

// Pôster 2:3. Larguras cobrem do celular (1x) ao computador (2x).
export const POSTER = { larguras: [180, 270, 360, 540], qualidade: { avif: 50, webp: 72, jpg: 78 } };
// Logotipos: exibidos em cartões de ~160 px; 320 px cobre telas 2x.
export const LOGO = { larguras: [160, 320] };

const caminhoWeb = (raizWeb, p) => relative(raizWeb, p).split("\\").join("/");

/** Gera AVIF/WebP/JPG em várias larguras, preservando a proporção original. */
export async function otimizarPoster(arquivo, { saida, raizWeb, tipo, id, avisar = console.warn }) {
  const destino = join(saida, tipo);
  mkdirSync(destino, { recursive: true });
  const meta = await sharp(arquivo).metadata();
  if (Math.abs(meta.width / meta.height - 2 / 3) > 0.04) {
    avisar(`${tipo}/${id}: proporção ${meta.width}×${meta.height} não é 2:3. Será preservada (sem corte).`);
  }
  if (meta.width < 360) avisar(`${tipo}/${id}: resolução baixa (${meta.width}px). Peça o arquivo em alta resolução.`);
  const larguras = POSTER.larguras.filter((w) => w <= meta.width);
  if (!larguras.length) larguras.push(meta.width);

  const srcset = { avif: [], webp: [], jpg: [] };
  for (const w of larguras) {
    const base = sharp(arquivo).rotate().resize({ width: w, withoutEnlargement: true });
    for (const [fmt, opts] of [["avif", { quality: POSTER.qualidade.avif, effort: 5 }], ["webp", { quality: POSTER.qualidade.webp }], ["jpg", { quality: POSTER.qualidade.jpg, mozjpeg: true }]]) {
      const out = join(destino, `${id}-${w}.${fmt}`);
      await base.clone().toFormat(fmt === "jpg" ? "jpeg" : fmt, opts).toFile(out);
      srcset[fmt].push(`${caminhoWeb(raizWeb, out)} ${w}w`);
    }
  }
  const padrao = larguras.includes(360) ? 360 : larguras[larguras.length - 1];
  return {
    imagem: caminhoWeb(raizWeb, join(destino, `${id}-${padrao}.jpg`)),
    largura: meta.width, altura: meta.height,
    fontes: { avif: srcset.avif.join(", "), webp: srcset.webp.join(", "), jpg: srcset.jpg.join(", ") },
  };
}

/** SVG oficial é mantido como recebido; PNG/JPG/WebP viram WebP + PNG em 2 larguras. */
export async function otimizarLogo(arquivo, { saida, raizWeb, id }) {
  const destino = join(saida, "canais");
  mkdirSync(destino, { recursive: true });
  if (extname(arquivo).toLowerCase() === ".svg") {
    const out = join(destino, `${id}.svg`);
    copyFileSync(arquivo, out);
    return { logo: caminhoWeb(raizWeb, out) };
  }
  const srcset = { webp: [], png: [] };
  for (const w of LOGO.larguras) {
    const base = sharp(arquivo).resize({ width: w, withoutEnlargement: true });
    const webp = join(destino, `${id}-${w}.webp`), png = join(destino, `${id}-${w}.png`);
    await base.clone().webp({ quality: 85, alphaQuality: 90 }).toFile(webp);
    await base.clone().png({ compressionLevel: 9, palette: true }).toFile(png);
    srcset.webp.push(`${caminhoWeb(raizWeb, webp)} ${w}w`);
    srcset.png.push(`${caminhoWeb(raizWeb, png)} ${w}w`);
  }
  return { logo: caminhoWeb(raizWeb, join(destino, `${id}-160.png`)), logoFontes: { webp: srcset.webp.join(", "), png: srcset.png.join(", ") } };
}
