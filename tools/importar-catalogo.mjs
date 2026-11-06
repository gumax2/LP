#!/usr/bin/env node
/*
 * Importa títulos, pôsteres e logotipos AUTORIZADOS a partir de uma planilha.
 *
 * 1. Copie modelos/cadastro-catalogo.csv para materiais/cadastro.csv e preencha
 *    (Excel ou Google Planilhas → salvar como CSV; separador ; ou , ).
 * 2. Coloque os arquivos oficiais em materiais/recebidos/ (nome = coluna "arquivo").
 * 3. Rode: npm run importar
 *
 * Saída pública:  data/catalogo-oficial.js  (somente o que a página precisa)
 *                 assets/img/oficial/...    (AVIF/WebP/JPG ou WebP/PNG/SVG)
 * Saída privada:  materiais/relatorio-importacao.txt
 *
 * PRIVACIDADE: o texto da coluna "documento_de_autorizacao" NUNCA vai para o site.
 * No arquivo público fica apenas um código de registro (LIC-xxxxxxxx) que permite
 * localizar a linha da planilha internamente.
 *
 * Linhas rejeitadas (licença incompleta, vencida, conteúdo não disponível no
 * serviço, arquivo ausente, categoria inválida) não entram no site.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import vm from "node:vm";
import { otimizarPoster, otimizarLogo } from "./lib/imagens.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (n, p) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : p; };
const PLANILHA = arg("--planilha", join(raiz, "materiais/cadastro.csv"));
const ARQUIVOS = arg("--arquivos", join(raiz, "materiais/recebidos"));
const SAIDA_JS = join(raiz, "data/catalogo-oficial.js");
const hoje = new Date().toISOString().slice(0, 10);

const TIPOS = { filme: "filmes", serie: "series", série: "series", canal: "canais" };
const LICENCAS = ["contrato-distribuicao", "kit-divulgacao", "autorizacao-escrita"];

/* CSV simples com aspas, separador ; ou , (detectado pelo cabeçalho) */
function lerCsv(texto) {
  texto = texto.replace(/^﻿/, "");
  const sep = (texto.split("\n")[0].match(/;/g) || []).length >= (texto.split("\n")[0].match(/,/g) || []).length ? ";" : ",";
  const linhas = [];
  let campo = "", linha = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) { linha.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo); campo = "";
      if (linha.some((x) => x.trim() !== "")) linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  linha.push(campo);
  if (linha.some((x) => x.trim() !== "")) linhas.push(linha);
  const cab = linhas.shift().map((h) => h.trim().toLowerCase());
  return linhas.map((l, n) => Object.fromEntries(cab.map((h, i) => [h, (l[i] || "").trim()]).concat([["_linha", n + 2]])));
}

if (!existsSync(PLANILHA)) {
  console.log(`Planilha não encontrada: ${PLANILHA}`);
  console.log("Copie modelos/cadastro-catalogo.csv para materiais/cadastro.csv e preencha.");
  process.exit(1);
}

// categorias válidas para canais
const ctx = { window: {} };
vm.runInNewContext(readFileSync(join(raiz, "data/catalogo.js"), "utf8"), ctx);
const categorias = new Set((ctx.window.GMAX_CATALOGO.canais || []).map((c) => c.id));

const saida = { filmes: [], series: [], canais: [] };
const relatorio = [`Importação de ${PLANILHA} em ${new Date().toISOString()}`, ""];
const ids = new Set();
let aceitos = 0, rejeitados = 0;

for (const r of lerCsv(readFileSync(PLANILHA, "utf8"))) {
  const rot = `linha ${r._linha} (${r.id || "sem id"})`;
  if (/^exemplo-/.test(r.id)) continue;
  const problemas = [];
  const tipo = TIPOS[(r.tipo || "").toLowerCase()];
  const id = (r.id || "").toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (!tipo) problemas.push(`tipo inválido "${r.tipo}" (use filme, serie ou canal)`);
  if (!id) problemas.push("id vazio");
  if (ids.has(id)) problemas.push("id repetido");
  if (!r.titulo) problemas.push("título vazio");
  if (!r.titular_do_direito) problemas.push("titular do direito não informado");
  if (!LICENCAS.includes(r.tipo_de_licenca)) problemas.push(`tipo de licença inválido "${r.tipo_de_licenca}"`);
  if (!r.documento_de_autorizacao) problemas.push("documento de autorização não informado");
  if (!/^(sim|s|yes|true)$/i.test(r.disponivel_no_servico)) problemas.push("disponibilidade no serviço não confirmada (coluna disponivel_no_servico = sim)");
  if (r.valido_ate && !/^\d{4}-\d{2}-\d{2}$/.test(r.valido_ate)) problemas.push(`data inválida "${r.valido_ate}" (use AAAA-MM-DD)`);
  if (r.valido_ate && r.valido_ate < hoje) problemas.push(`licença vencida em ${r.valido_ate}`);
  if (tipo === "canais" && !categorias.has(r.genero_ou_categoria)) problemas.push(`categoria "${r.genero_ou_categoria}" inválida`);
  const arquivo = join(ARQUIVOS, tipo || "", r.arquivo || "");
  if (!r.arquivo || !existsSync(arquivo)) problemas.push(`arquivo não encontrado: ${tipo}/${r.arquivo}`);

  if (problemas.length) {
    rejeitados++;
    relatorio.push(`REJEITADO ${rot}: ${problemas.join("; ")}`);
    continue;
  }
  ids.add(id);
  const registro = "LIC-" + createHash("sha256").update(`${id}|${r.titular_do_direito}|${r.documento_de_autorizacao}`).digest("hex").slice(0, 8).toUpperCase();
  const licenca = { tipo: r.tipo_de_licenca, titular: r.titular_do_direito, registro, disponivelNoServico: true };
  if (r.valido_ate) licenca.validoAte = r.valido_ate;
  const avisos = [];
  const opts = { saida: join(raiz, "assets/img/oficial"), raizWeb: raiz, tipo, id, avisar: (m) => avisos.push(m) };

  if (tipo === "canais") {
    saida.canais.push({ id, nome: r.titulo, categoria: r.genero_ou_categoria, ...(await otimizarLogo(arquivo, opts)), autorizado: true, licenca });
  } else {
    saida[tipo].push({ id, titulo: r.titulo, genero: r.genero_ou_categoria || "Outros", ...(await otimizarPoster(arquivo, opts)), ilustrativo: false, autorizado: true, licenca });
  }
  aceitos++;
  relatorio.push(`ACEITO    ${rot}: ${tipo}/${id} → ${registro}${avisos.length ? " | avisos: " + avisos.join("; ") : ""}`);
}

const js = `/*
 * GERADO por tools/importar-catalogo.mjs em ${hoje}. NÃO edite à mão:
 * altere materiais/cadastro.csv e rode "npm run importar".
 * Contém somente títulos, pôsteres e logotipos com autorização registrada.
 */
window.GMAX_CATALOGO_OFICIAL = Object.freeze(${JSON.stringify(saida, null, 2)});
`;
writeFileSync(SAIDA_JS, js);
mkdirSync(join(raiz, "materiais"), { recursive: true });
relatorio.push("", `Total: ${aceitos} aceito(s), ${rejeitados} rejeitado(s).`);
writeFileSync(join(raiz, "materiais/relatorio-importacao.txt"), relatorio.join("\n") + "\n");
console.log(relatorio.slice(2).join("\n"));
console.log(`\nArquivo público atualizado: data/catalogo-oficial.js. Próximo passo: npm run validar`);
process.exit(0);
