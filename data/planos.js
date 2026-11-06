/*
 * Tabela comercial — VALORES DE REFERÊNCIA (enviados em 06/11/2026).
 * Confirmar a tabela vigente antes de integrar o checkout.
 *
 * Fonte única dos preços: os cartões, a economia e o valor mensal equivalente
 * são calculados a partir daqui. Nunca escreva preço direto no HTML.
 */
window.GMAX_PLANOS = Object.freeze({
  status: "referencia", // "referencia" | "confirmada"
  periodos: [
    { id: "mensal",     nome: "Mensal",     meses: 1 },
    { id: "trimestral", nome: "Trimestral", meses: 3 },
    { id: "semestral",  nome: "Semestral",  meses: 6 },
    { id: "anual",      nome: "Anual",      meses: 12 },
  ],
  // preços totais por quantidade de TVs, na ordem dos períodos acima
  precos: {
    1: [35, 95, 175, 300],
    2: [70, 185, 340, 580],
    3: [90, 240, 435, 735],
    4: [120, 315, 560, 940],
    5: [150, 390, 685, 1125],
  },
  padrao: { tvs: 1, destaque: "anual" },
});
