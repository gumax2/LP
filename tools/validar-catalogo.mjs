#!/usr/bin/env node
/*
 * Valida data/catalogo.js antes de qualquer publicação.
 *
 * ERRO (bloqueia): item oficial sem licença completa, licença vencida,
 *                  título não disponível no serviço, arquivo de imagem ausente,
 *                  canal com categoria inexistente, id duplicado.
 * AVISO:           ilustrações demonstrativas ainda presentes, pôster sem
 *                  dimensões declaradas, pôster fora da proporção 2:3.
 *
 * Uso: npm run validar      (código de saída 1 se houver erro)
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ctx = { window: {} };
vm.runInNewContext(readFileSync(join(raiz, "data/catalogo.js"), "utf8"), ctx);
const arqOficial = join(raiz, "data/catalogo-oficial.js");
if (existsSync(arqOficial)) vm.runInNewContext(readFileSync(arqOficial, "utf8"), ctx);
const B = ctx.window.GMAX_CATALOGO, O = ctx.window.GMAX_CATALOGO_OFICIAL || {};
// mesma junção feita pela página: oficiais primeiro
const C = {
  filmes: (O.filmes || []).concat(B.filmes || []),
  series: (O.series || []).concat(B.series || []),
  canais: B.canais || [],
  destaques: (O.canais || []).concat(B.destaques || []),
};

const erros = [], avisos = [];
const hoje = new Date().toISOString().slice(0, 10);
const TIPOS = ["contrato-distribuicao", "kit-divulgacao", "autorizacao-escrita"];

function arquivos(item) {
  const lista = [item.imagem, item.logo].filter(Boolean);
  for (const f of Object.values(item.fontes || {}).concat(Object.values(item.logoFontes || {}))) {
    String(f).split(",").forEach((parte) => { const p = parte.trim().split(/\s+/)[0]; if (p) lista.push(p); });
  }
  return lista;
}

function validarLicenca(rotulo, item) {
  const l = item.licenca;
  if (!l) return erros.push(`${rotulo}: item oficial sem bloco "licenca".`);
  if (!TIPOS.includes(l.tipo)) erros.push(`${rotulo}: licenca.tipo inválido (${l.tipo}).`);
  if (!l.titular) erros.push(`${rotulo}: licenca.titular não informado.`);
  if (!l.documento && !l.registro) erros.push(`${rotulo}: licenca.documento (ou registro) não informado.`);
  if (l.disponivelNoServico !== true) erros.push(`${rotulo}: disponibilidade no serviço não confirmada (licenca.disponivelNoServico).`);
  if (l.validoAte && l.validoAte < hoje) erros.push(`${rotulo}: licença vencida em ${l.validoAte}.`);
}

const ids = new Set();
let oficiais = 0, ilustrativos = 0;
for (const tipo of ["filmes", "series"]) {
  for (const item of C[tipo] || []) {
    const rotulo = `${tipo}/${item.id}`;
    if (ids.has(item.id)) erros.push(`${rotulo}: id duplicado.`);
    ids.add(item.id);
    if (item.autorizado !== true) { avisos.push(`${rotulo}: autorizado != true (não será exibido).`); continue; }
    if (item.ilustrativo === true) { ilustrativos++; }
    else {
      oficiais++;
      validarLicenca(rotulo, item);
      if (!item.largura || !item.altura) avisos.push(`${rotulo}: declare largura/altura do original para evitar deslocamento de layout.`);
      else if (Math.abs(item.largura / item.altura - 2 / 3) > 0.04) avisos.push(`${rotulo}: proporção ${item.largura}×${item.altura} diferente de 2:3.`);
      if (!item.fontes || !item.fontes.avif) avisos.push(`${rotulo}: sem versões AVIF/WebP (rode npm run imagens).`);
    }
    for (const f of arquivos(item)) if (!existsSync(join(raiz, f))) erros.push(`${rotulo}: arquivo não encontrado: ${f}`);
  }
}

const categorias = new Set((C.canais || []).map((c) => c.id));
for (const canal of C.destaques || []) {
  const rotulo = `canais/${canal.id}`;
  if (ids.has(canal.id)) erros.push(`${rotulo}: id duplicado.`);
  ids.add(canal.id);
  if (canal.autorizado !== true) { avisos.push(`${rotulo}: autorizado != true (não será exibido).`); continue; }
  oficiais++;
  validarLicenca(rotulo, canal);
  if (!categorias.has(canal.categoria)) erros.push(`${rotulo}: categoria "${canal.categoria}" não existe em "canais".`);
  if (!canal.logo) erros.push(`${rotulo}: logotipo não informado.`);
  for (const f of arquivos(canal)) if (!existsSync(join(raiz, f))) erros.push(`${rotulo}: arquivo não encontrado: ${f}`);
}

const ctxCfg = { window: {} };
vm.runInNewContext(readFileSync(join(raiz, "data/config.js"), "utf8"), ctxCfg);
const vit = ctxCfg.window.GMAX_CONFIG.vitrines || {};
if (ilustrativos) {
  avisos.push(vit.permitirDemonstrativas === false
    ? `${ilustrativos} capa(s) de exemplo no catálogo, OCULTAS no site pela configuração (vitrines.permitirDemonstrativas: false).`
    : `${ilustrativos} capa(s) de exemplo VISÍVEIS no site (selo "Exemplo"). Para ocultar: vitrines.permitirDemonstrativas: false.`);
}
for (const tipo of ["filmes", "series"]) {
  const n = C[tipo].filter((i) => i.autorizado === true && i.ilustrativo !== true).length;
  if (vit.permitirDemonstrativas === false && n < (vit.minimoTitulos || 1)) avisos.push(`Vitrine de ${tipo}: ${n} título(s) oficial(is), mínimo ${vit.minimoTitulos}. A vitrine fica oculta até atingir o mínimo.`);
}
if (!(C.destaques || []).length) avisos.push("Nenhum canal em destaque cadastrado. A seção de logotipos fica oculta no site.");

console.log(`Catálogo: ${oficiais} item(ns) oficial(is), ${ilustrativos} demonstrativo(s).`);
avisos.forEach((a) => console.log("  aviso: " + a));
erros.forEach((e) => console.log("  ERRO:  " + e));
console.log(erros.length ? `\n✘ ${erros.length} erro(s). Não publique.` : "\n✔ Nenhum erro bloqueante.");
process.exit(erros.length ? 1 : 0);
