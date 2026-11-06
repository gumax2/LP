/*
 * Tabela comercial do protótipo.
 *
 * ATENÇÃO: estes valores são a REFERÊNCIA HISTÓRICA enviada em 06/11/2026.
 * A fonte oficial é a configuração comercial do site em produção.
 * Antes da integração, substituir por esses dados, sem alterar nada, e
 * mudar `status` para "validada". Enquanto o status não for "validada",
 * a página mostra o aviso "Preços pendentes de validação".
 *
 * Fonte única dos preços: cartões, economia, valor mensal equivalente,
 * destaque de melhor custo-benefício, hero e FAQ são calculados daqui.
 * Nunca escreva preço direto no HTML.
 */
window.GMAX_PLANOS = Object.freeze({
  status: "pendente-validacao", // "pendente-validacao" | "validada"
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
  tvsPadrao: 1,
});
