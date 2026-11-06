#!/usr/bin/env node
/*
 * Gera as capas ILUSTRATIVAS (SVG, 2:3) do catálogo a partir de data/catalogo.js.
 * As artes são 100% originais e geradas por código — nenhuma imagem de terceiros.
 *
 * Uso:  node tools/gerar-ilustracoes.mjs
 * Saída: assets/img/catalogo/<id>.svg  (somente itens com `arte`)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ctx = { window: {} };
vm.runInNewContext(readFileSync(join(raiz, "data/catalogo.js"), "utf8"), ctx);
const catalogo = ctx.window.GMAX_CATALOGO;

const W = 400, H = 600;

/* PRNG determinístico: a mesma arte é gerada sempre para o mesmo id. */
function semente(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const f = (n) => Math.round(n * 10) / 10;
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function estrelas(r, n, cor, ymax = H * 0.6) {
  let s = "";
  for (let i = 0; i < n; i++) {
    s += `<circle cx="${f(r() * W)}" cy="${f(r() * ymax)}" r="${f(r() * 1.4 + 0.3)}" fill="${cor}" opacity="${f(r() * 0.7 + 0.2)}"/>`;
  }
  return s;
}

const motivos = {
  orbita(r, [, , c]) {
    const cx = f(120 + r() * 160), cy = f(170 + r() * 80), rad = f(90 + r() * 40);
    return `${estrelas(r, 70, "#fff")}
      <circle cx="${cx}" cy="${cy}" r="${rad * 1.9}" fill="url(#glow)" opacity=".5"/>
      <circle cx="${cx}" cy="${cy}" r="${rad}" fill="url(#planeta)"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rad * 1.7}" ry="${rad * 0.32}" fill="none" stroke="${c}" stroke-width="2.5" opacity=".7" transform="rotate(-16 ${cx} ${cy})"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rad * 2.05}" ry="${rad * 0.42}" fill="none" stroke="${c}" stroke-width="1" opacity=".35" transform="rotate(-16 ${cx} ${cy})"/>`;
  },
  montanha(r, [a, b, c]) {
    const sol = `<circle cx="${f(110 + r() * 180)}" cy="${f(190 + r() * 40)}" r="58" fill="${c}" opacity=".9"/>`;
    let camadas = "";
    for (let k = 0; k < 4; k++) {
      const base = 300 + k * 55;
      let d = `M0 ${H} L0 ${base}`;
      for (let x = 0; x <= W; x += 50) d += ` L${x} ${f(base - r() * (110 - k * 18))}`;
      d += ` L${W} ${H} Z`;
      camadas += `<path d="${d}" fill="${k % 2 ? b : a}" opacity="${f(0.55 + k * 0.15)}"/>`;
    }
    return `${estrelas(r, 30, "#fff", 200)}${sol}${camadas}`;
  },
  cidade(r, [a, , c]) {
    let s = `${estrelas(r, 40, "#fff", 260)}<circle cx="${f(80 + r() * 240)}" cy="120" r="34" fill="${c}" opacity=".85"/>`;
    let x = -10;
    while (x < W) {
      const w = 34 + r() * 46, h = 160 + r() * 260, y = H - h;
      s += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${a}" stroke="${c}" stroke-opacity=".18"/>`;
      for (let wy = y + 12; wy < H - 20; wy += 18) {
        for (let wx = x + 7; wx < x + w - 8; wx += 12) {
          if (r() > 0.68) s += `<rect x="${f(wx)}" y="${f(wy)}" width="5" height="8" fill="${c}" opacity="${f(0.35 + r() * 0.6)}"/>`;
        }
      }
      x += w + 4;
    }
    return s;
  },
  onda(r, [, b, c]) {
    let s = `<circle cx="${f(100 + r() * 200)}" cy="150" r="70" fill="${c}" opacity=".18"/><circle cx="${f(100 + r() * 200)}" cy="150" r="40" fill="${c}" opacity=".55"/>`;
    for (let k = 0; k < 6; k++) {
      const y0 = 300 + k * 45, amp = 14 + r() * 22, per = 120 + r() * 120, fase = r() * 6;
      let d = `M0 ${H} L0 ${y0}`;
      for (let x = 0; x <= W; x += 10) d += ` L${x} ${f(y0 + Math.sin(x / per * Math.PI * 2 + fase) * amp)}`;
      d += ` L${W} ${H} Z`;
      s += `<path d="${d}" fill="${b}" opacity="${f(0.35 + k * 0.1)}" stroke="${c}" stroke-opacity="${f(0.5 - k * 0.07)}" stroke-width="1.5"/>`;
    }
    return s;
  },
  geometria(r, [, , c]) {
    let s = "";
    const cx = 200, cy = 250;
    for (let k = 9; k > 0; k--) {
      const t = k * 26, rot = f(k * (8 + r() * 6));
      s += `<rect x="${cx - t}" y="${cy - t}" width="${t * 2}" height="${t * 2}" fill="none" stroke="${c}" stroke-width="${k % 3 === 0 ? 3 : 1.2}" opacity="${f(0.15 + (9 - k) * 0.08)}" transform="rotate(${rot} ${cx} ${cy})"/>`;
    }
    s += `<circle cx="${cx}" cy="${cy}" r="18" fill="${c}"/>`;
    for (let i = 0; i < 14; i++) s += `<line x1="${f(r() * W)}" y1="${f(r() * H)}" x2="${f(r() * W)}" y2="${f(r() * H)}" stroke="${c}" stroke-opacity=".12"/>`;
    return s;
  },
  floresta(r, [a, b, c]) {
    let s = `${estrelas(r, 60, "#fff", 280)}<circle cx="${f(240 + r() * 80)}" cy="130" r="44" fill="${c}" opacity=".9"/><circle cx="${f(255 + r() * 80)}" cy="118" r="40" fill="${a}"/>`;
    for (let k = 0; k < 3; k++) {
      const base = 380 + k * 70;
      for (let x = -20; x < W + 20; x += 22 + r() * 18) {
        const h = 90 + r() * 120 - k * 10, w = 26 + r() * 20;
        s += `<polygon points="${f(x)},${f(base - h)} ${f(x - w / 2)},${base + 40} ${f(x + w / 2)},${base + 40}" fill="${k === 2 ? "#000" : b}" opacity="${f(0.55 + k * 0.2)}"/>`;
      }
    }
    return s + `<rect x="0" y="${H - 80}" width="${W}" height="80" fill="#000" opacity=".8"/>`;
  },
  neon(r, [, , c]) {
    let s = `<defs><filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs>`;
    const anel = (k, filtro) => {
      const t = 50 + k * 34;
      return `<rect x="${200 - t * 0.7}" y="${250 - t}" width="${t * 1.4}" height="${t * 2}" rx="${t * 0.7}" fill="none" stroke="${c}" stroke-width="${filtro ? 8 : 2.5}" opacity="${f(filtro ? 0.5 : 0.95 - k * 0.18)}"${filtro ? ' filter="url(#blur)"' : ""}/>`;
    };
    for (let k = 0; k < 4; k++) s += anel(k, true) + anel(k, false);
    for (let i = 0; i < 26; i++) s += `<rect x="${f(r() * W)}" y="${f(380 + r() * 200)}" width="${f(2 + r() * 30)}" height="2" fill="${c}" opacity="${f(r() * 0.6)}"/>`;
    return s;
  },
  deserto(r, [a, b, c]) {
    const cy = 260;
    let s = `<circle cx="200" cy="${cy}" r="120" fill="${c}"/>`;
    for (let k = 0; k < 7; k++) s += `<rect x="60" y="${cy + 18 + k * 15}" width="280" height="${3 + k * 1.2}" fill="${a}"/>`;
    for (let k = 0; k < 4; k++) {
      const y0 = 360 + k * 50;
      s += `<path d="M0 ${H} L0 ${y0} Q ${f(80 + r() * 120)} ${f(y0 - 50 - r() * 40)} ${f(200 + r() * 60)} ${y0 + 10} T ${W} ${f(y0 - 20)} L${W} ${H} Z" fill="${k % 2 ? a : b}" opacity="${f(0.75 + k * 0.08)}"/>`;
    }
    return s;
  },
  farol(r, [a, b, c]) {
    let s = `${estrelas(r, 50, "#fff", 300)}
      <polygon points="232,190 ${W + 40},90 ${W + 40},300" fill="url(#feixe)"/>
      <polygon points="168,190 -40,120 -40,270" fill="url(#feixe2)"/>
      <polygon points="186,200 214,200 226,460 174,460" fill="#e5e7eb" opacity=".9"/>
      <rect x="180" y="250" width="40" height="22" fill="${b}" opacity=".9"/><rect x="178" y="330" width="44" height="22" fill="${b}" opacity=".9"/>
      <rect x="182" y="168" width="36" height="32" fill="${c}"/><polygon points="176,168 224,168 200,146" fill="${b}"/>`;
    for (let k = 0; k < 4; k++) {
      const y0 = 455 + k * 38;
      let d = `M0 ${H} L0 ${y0}`;
      for (let x = 0; x <= W; x += 10) d += ` L${x} ${f(y0 + Math.sin(x / 40 + k + r()) * 6)}`;
      s += `<path d="${d} L${W} ${H} Z" fill="${a}" opacity="${f(0.6 + k * 0.1)}"/>`;
    }
    return s;
  },
  retrato(r, [a, b, c]) {
    const cx = f(180 + r() * 40);
    return `<circle cx="${cx}" cy="230" r="170" fill="url(#glow)" opacity=".55"/>
      <circle cx="${cx}" cy="225" r="78" fill="${b}"/>
      <path d="M${cx - 150} ${H} C ${cx - 140} 390, ${cx - 70} 340, ${cx} 340 C ${cx + 70} 340, ${cx + 140} 390, ${cx + 150} ${H} Z" fill="${b}"/>
      <path d="M${cx + 50} 168 A 78 78 0 0 1 ${cx + 52} 285" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" opacity=".9"/>
      <path d="M${cx + 70} 352 C ${cx + 118} 370, ${cx + 140} 420, ${cx + 148} 520" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity=".7"/>
      ${estrelas(r, 25, c, 560)}<rect width="${W}" height="${H}" fill="${a}" opacity=".08"/>`;
  },
};

function quebrarTitulo(t) {
  const palavras = t.toUpperCase().split(" ");
  if (t.length <= 12 || palavras.length === 1) return [palavras.join(" ")];
  let melhor = [t.toUpperCase()], dif = Infinity;
  for (let i = 1; i < palavras.length; i++) {
    const l1 = palavras.slice(0, i).join(" "), l2 = palavras.slice(i).join(" ");
    const d = Math.abs(l1.length - l2.length);
    if (d < dif) { dif = d; melhor = [l1, l2]; }
  }
  return melhor;
}

function poster(item) {
  const r = semente(item.id);
  const [a, b, c] = item.arte.cores;
  const desenho = motivos[item.arte.motivo](r, item.arte.cores);
  const linhas = quebrarTitulo(item.titulo);
  const maior = Math.max(...linhas.map((l) => l.length));
  const tam = Math.min(54, Math.floor(340 / (maior * 0.66)));
  const y0 = H - 46 - (linhas.length - 1) * tam * 1.02;
  const titulo = linhas
    .map((l, i) => `<text x="${W / 2}" y="${f(y0 + i * tam * 1.02)}" text-anchor="middle" font-size="${tam}">${esc(l)}</text>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(item.titulo)} (ilustração)">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
  <radialGradient id="glow"><stop offset="0" stop-color="${c}" stop-opacity=".55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>
  <radialGradient id="planeta" cx=".35" cy=".3"><stop offset="0" stop-color="${c}"/><stop offset=".55" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>
  <linearGradient id="feixe" x1="0" x2="1"><stop offset="0" stop-color="${c}" stop-opacity=".55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient>
  <linearGradient id="feixe2" x1="1" x2="0"><stop offset="0" stop-color="${c}" stop-opacity=".35"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient>
  <linearGradient id="base" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${desenho}
<rect width="${W}" height="${H}" fill="url(#base)"/>
<text x="${W / 2}" y="${f(y0 - tam - 4)}" text-anchor="middle" font-family="Inter, 'Segoe UI', Arial, sans-serif" font-size="15" font-weight="600" letter-spacing="4" fill="${c}">${esc(item.genero.toUpperCase())}</text>
<g font-family="Sora, 'Segoe UI', Arial, sans-serif" font-weight="700" fill="#fff" letter-spacing="1">${titulo}</g>
</svg>
`;
}

const destino = join(raiz, "assets/img/catalogo");
mkdirSync(destino, { recursive: true });
let n = 0;
for (const lista of [catalogo.filmes, catalogo.series]) {
  for (const item of lista) {
    if (!item.arte) continue;
    writeFileSync(join(destino, `${item.id}.svg`), poster(item).replace(/\n\s+/g, "\n"));
    n++;
  }
}
console.log(`${n} ilustrações geradas em assets/img/catalogo/`);
