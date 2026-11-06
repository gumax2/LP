/*
 * Avaliações de clientes.
 *
 * Somente avaliações REAIS, com autorização por escrito do cliente.
 * Sem avaliações aqui, a seção não aparece no site
 * (no modo protótipo, aparece um aviso de seção preparada).
 *
 * Formato:
 * {
 *   nome: "Maria S.",                 // como o cliente autorizou ser identificado
 *   cidade: "Belo Horizonte/MG",      // opcional
 *   texto: "…",                       // texto literal, sem edição de sentido
 *   fonte: "WhatsApp" | "Google" | "Instagram",
 *   link: "https://…",                // opcional: avaliação pública original
 *   data: "2026-10",                  // mês/ano
 *   autorizado: true                  // obrigatório
 * }
 */
window.GMAX_AVALIACOES = Object.freeze([]);
