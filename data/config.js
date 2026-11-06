/*
 * GMAX — configuração central da landing page.
 *
 * Nada aqui é segredo: este arquivo é público (vai para o navegador).
 * NUNCA coloque tokens, chaves de API ou credenciais de pagamento neste arquivo.
 */
window.GMAX_CONFIG = Object.freeze({
  /*
   * true  → protótipo: nenhum botão de contratação ou WhatsApp sai da página;
   *         os cliques mostram um aviso e registram o evento no console.
   * false → produção: botões usam os links abaixo.
   */
  modoPrototipo: true,

  whatsapp: {
    numero: "5531990029545",          // formato internacional, só dígitos
    exibicao: "(31) 99002-9545",
  },

  playStore: "https://play.google.com/store/apps/details?id=br.com.gmax.player",

  /*
   * Links de checkout por plano, no formato "<tvs>-<periodo>".
   * PENDENTE: preencher com os links do checkout atual, sem alterá-los,
   * somente após a confirmação da tabela vigente.
   * Plano sem link → o botão leva ao WhatsApp com o plano já escrito na mensagem.
   */
  checkout: {
    // "1-mensal": "https://…",
  },

  /* Medição: só dispara depois do consentimento do visitante (LGPD). */
  analytics: {
    exigirConsentimento: true,
    depurarNoConsole: true,
  },
});
