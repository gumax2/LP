/*
 * Catálogo das vitrines: filmes, séries, categorias e canais em destaque.
 *
 * REGRA DE EXIBIÇÃO (aplicada pela página e por `npm run validar`)
 * Um item OFICIAL (título real, pôster ou logotipo de terceiros) só aparece se tiver:
 *   autorizado: true
 *   licenca: {
 *     tipo: "contrato-distribuicao" | "kit-divulgacao" | "autorizacao-escrita",
 *     titular: "Quem concedeu o direito (estúdio, distribuidora, canal)",
 *     documento: "Referência interna do contrato/e-mail (não publique o documento)",
 *     disponivelNoServico: true,   // a GMAX oferece este título/canal legalmente
 *     validoAte: "AAAA-MM-DD"      // opcional; vencida → o item some sozinho
 *   }
 * Itens `ilustrativo: true` são artes próprias da GMAX (selo "Demonstrativo").
 *
 * COMO TROCAR UMA ILUSTRAÇÃO POR UM PÔSTER OFICIAL
 * 1. Salve o arquivo autorizado em materiais/recebidos/filmes/<id>.jpg (ou series/).
 * 2. Rode `npm run imagens`: gera AVIF/WebP/JPG em 4 tamanhos.
 * 3. Substitua o item: título real, campos de imagem gerados, `ilustrativo: false`
 *    e o bloco `licenca`. Remova `arte`.
 * 4. Rode `npm run validar`.
 *
 * Exemplo de item oficial (MODELO, não é um título real):
 * { id: "nome-do-filme", titulo: "Nome do Filme", genero: "Drama",
 *   imagem: "assets/img/oficial/filmes/nome-do-filme-360.jpg", largura: 1000, altura: 1500,
 *   fontes: { avif: "… 180w, … 360w", webp: "…", jpg: "…" },
 *   ilustrativo: false, autorizado: true,
 *   licenca: { tipo: "contrato-distribuicao", titular: "Distribuidora X", documento: "Contrato 2026/014", disponivelNoServico: true } }
 */
window.GMAX_CATALOGO = Object.freeze({
  filmes: [
    { id: "horizonte-de-vidro", titulo: "Horizonte de Vidro", genero: "Ficção", imagem: "assets/img/catalogo/horizonte-de-vidro.svg", ilustrativo: true, autorizado: true, arte: { motivo: "orbita", cores: ["#0b1a3a", "#071026", "#5eead4"] } },
    { id: "a-ultima-mare", titulo: "A Última Maré", genero: "Drama", imagem: "assets/img/catalogo/a-ultima-mare.svg", ilustrativo: true, autorizado: true, arte: { motivo: "onda", cores: ["#0c2a4a", "#04121f", "#7dd3fc"] } },
    { id: "rota-31", titulo: "Rota 31", genero: "Ação", imagem: "assets/img/catalogo/rota-31.svg", ilustrativo: true, autorizado: true, arte: { motivo: "deserto", cores: ["#3a1410", "#120607", "#fb923c"] } },
    { id: "cidade-sem-sono", titulo: "Cidade Sem Sono", genero: "Suspense", imagem: "assets/img/catalogo/cidade-sem-sono.svg", ilustrativo: true, autorizado: true, arte: { motivo: "cidade", cores: ["#140f2e", "#05040f", "#a78bfa"] } },
    { id: "o-farol-do-norte", titulo: "O Farol do Norte", genero: "Aventura", imagem: "assets/img/catalogo/o-farol-do-norte.svg", ilustrativo: true, autorizado: true, arte: { motivo: "farol", cores: ["#0f2f3d", "#06141b", "#fde68a"] } },
    { id: "quarto-minguante", titulo: "Quarto Minguante", genero: "Terror", imagem: "assets/img/catalogo/quarto-minguante.svg", ilustrativo: true, autorizado: true, arte: { motivo: "floresta", cores: ["#0d1714", "#030605", "#e2e8f0"] } },
    { id: "doce-caos", titulo: "Doce Caos", genero: "Comédia", imagem: "assets/img/catalogo/doce-caos.svg", ilustrativo: true, autorizado: true, arte: { motivo: "geometria", cores: ["#3b0d33", "#14040f", "#f9a8d4"] } },
    { id: "noite-de-neon", titulo: "Noite de Néon", genero: "Ação", imagem: "assets/img/catalogo/noite-de-neon.svg", ilustrativo: true, autorizado: true, arte: { motivo: "neon", cores: ["#0a0f2c", "#03040d", "#22d3ee"] } },
    { id: "raizes-do-cerrado", titulo: "Raízes do Cerrado", genero: "Drama", imagem: "assets/img/catalogo/raizes-do-cerrado.svg", ilustrativo: true, autorizado: true, arte: { motivo: "montanha", cores: ["#3a2a12", "#120c05", "#fcd34d"] } },
    { id: "expresso-aurora", titulo: "Expresso Aurora", genero: "Romance", imagem: "assets/img/catalogo/expresso-aurora.svg", ilustrativo: true, autorizado: true, arte: { motivo: "retrato", cores: ["#2a1036", "#0b0412", "#fda4af"] } },
    { id: "orbita-baixa", titulo: "Órbita Baixa", genero: "Ficção", imagem: "assets/img/catalogo/orbita-baixa.svg", ilustrativo: true, autorizado: true, arte: { motivo: "orbita", cores: ["#2b1240", "#08030f", "#c4b5fd"] } },
    { id: "areia-vermelha", titulo: "Areia Vermelha", genero: "Aventura", imagem: "assets/img/catalogo/areia-vermelha.svg", ilustrativo: true, autorizado: true, arte: { motivo: "deserto", cores: ["#40200a", "#140903", "#fdba74"] } },
  ],
  series: [
    { id: "codigo-ciano", titulo: "Código Ciano", genero: "Suspense", imagem: "assets/img/catalogo/codigo-ciano.svg", ilustrativo: true, autorizado: true, arte: { motivo: "neon", cores: ["#062a33", "#020c10", "#67e8f9"] } },
    { id: "casa-azul", titulo: "Casa Azul", genero: "Drama", imagem: "assets/img/catalogo/casa-azul.svg", ilustrativo: true, autorizado: true, arte: { motivo: "retrato", cores: ["#0e2348", "#040a18", "#93c5fd"] } },
    { id: "sinal-fraco", titulo: "Sinal Fraco", genero: "Mistério", imagem: "assets/img/catalogo/sinal-fraco.svg", ilustrativo: true, autorizado: true, arte: { motivo: "onda", cores: ["#1c1f2e", "#07080d", "#cbd5e1"] } },
    { id: "os-cartografos", titulo: "Os Cartógrafos", genero: "Aventura", imagem: "assets/img/catalogo/os-cartografos.svg", ilustrativo: true, autorizado: true, arte: { motivo: "montanha", cores: ["#0f3326", "#04110b", "#86efac"] } },
    { id: "turno-da-noite", titulo: "Turno da Noite", genero: "Comédia", imagem: "assets/img/catalogo/turno-da-noite.svg", ilustrativo: true, autorizado: true, arte: { motivo: "cidade", cores: ["#2d1b05", "#0d0802", "#fcd34d"] } },
    { id: "estacao-zero", titulo: "Estação Zero", genero: "Ficção", imagem: "assets/img/catalogo/estacao-zero.svg", ilustrativo: true, autorizado: true, arte: { motivo: "geometria", cores: ["#08263a", "#020b12", "#38bdf8"] } },
    { id: "mare-alta", titulo: "Maré Alta", genero: "Drama", imagem: "assets/img/catalogo/mare-alta.svg", ilustrativo: true, autorizado: true, arte: { motivo: "farol", cores: ["#132a4a", "#050c17", "#bae6fd"] } },
    { id: "planeta-vivo", titulo: "Planeta Vivo", genero: "Documentário", imagem: "assets/img/catalogo/planeta-vivo.svg", ilustrativo: true, autorizado: true, arte: { motivo: "floresta", cores: ["#0f2e1a", "#041008", "#bbf7d0"] } },
    { id: "bairro-alto", titulo: "Bairro Alto", genero: "Comédia", imagem: "assets/img/catalogo/bairro-alto.svg", ilustrativo: true, autorizado: true, arte: { motivo: "geometria", cores: ["#3a1a0a", "#120804", "#fdba74"] } },
    { id: "ecos-do-vale", titulo: "Ecos do Vale", genero: "Mistério", imagem: "assets/img/catalogo/ecos-do-vale.svg", ilustrativo: true, autorizado: true, arte: { motivo: "montanha", cores: ["#1e1b3a", "#070611", "#c7d2fe"] } },
    { id: "fronteira-sul", titulo: "Fronteira Sul", genero: "Ação", imagem: "assets/img/catalogo/fronteira-sul.svg", ilustrativo: true, autorizado: true, arte: { motivo: "deserto", cores: ["#3b1212", "#120404", "#fca5a5"] } },
    { id: "satelite", titulo: "Satélite", genero: "Ficção", imagem: "assets/img/catalogo/satelite.svg", ilustrativo: true, autorizado: true, arte: { motivo: "orbita", cores: ["#06283a", "#020a10", "#7dd3fc"] } },
  ],
  // Categorias de canais: sem grade, sem "ao vivo" e sem nome de emissora até haver dados reais.
  canais: [
    { id: "esportes", nome: "Esportes", descricao: "Campeonatos, debates e programas esportivos.", icone: "esportes", tom: "#22d3ee" },
    { id: "noticias", nome: "Notícias", descricao: "Jornalismo nacional e internacional.", icone: "noticias", tom: "#60a5fa" },
    { id: "filmes", nome: "Filmes", descricao: "Canais dedicados ao cinema.", icone: "filmes", tom: "#a78bfa" },
    { id: "series", nome: "Séries", descricao: "Séries e maratonas.", icone: "series", tom: "#f472b6" },
    { id: "infantil", nome: "Infantil", descricao: "Programação para crianças.", icone: "infantil", tom: "#fbbf24" },
    { id: "entretenimento", nome: "Entretenimento", descricao: "Variedades, reality e talk shows.", icone: "entretenimento", tom: "#fb923c" },
    { id: "documentarios", nome: "Documentários", descricao: "Natureza, história e ciência.", icone: "documentarios", tom: "#4ade80" },
  ],
  /*
   * Canais em destaque (logotipos oficiais). VAZIO até haver autorização dos titulares.
   * Modelo: { id: "canal-x", nome: "Canal X", categoria: "esportes",
   *           logo: "assets/img/oficial/canais/canal-x.svg", autorizado: true,
   *           licenca: { tipo: "autorizacao-escrita", titular: "…", documento: "…", disponivelNoServico: true } }
   * `categoria` deve ser um `id` da lista `canais` acima.
   */
  destaques: [],
});
