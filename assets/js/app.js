/*
 * GMAX — comportamento da landing page.
 * JavaScript puro, sem dependências. Todo texto vindo de dados é inserido
 * com textContent / atributos (nunca innerHTML), para evitar XSS.
 */
(function () {
  "use strict";

  var CONFIG = window.GMAX_CONFIG || {};
  var PLANOS = window.GMAX_PLANOS;
  var CATALOGO = window.GMAX_CATALOGO || {};
  var AVALIACOES = window.GMAX_AVALIACOES || [];
  var reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ */
  /* Utilidades                                                          */
  /* ------------------------------------------------------------------ */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function el(tag, attrs, filhos) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") n.textContent = attrs[k];
        else if (k === "class") n.className = attrs[k];
        else n.setAttribute(k, attrs[k]);
      });
    }
    (filhos || []).forEach(function (f) {
      if (f) n.appendChild(typeof f === "string" ? document.createTextNode(f) : f);
    });
    return n;
  }

  var SVG_NS = "http://www.w3.org/2000/svg";
  function icone(id, classe) {
    var s = document.createElementNS(SVG_NS, "svg");
    s.setAttribute("viewBox", id.indexOf("c-") === 0 ? "0 0 48 48" : "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("class", classe || "ico");
    var u = document.createElementNS(SVG_NS, "use");
    u.setAttribute("href", "#" + id);
    s.appendChild(u);
    return s;
  }

  var fmt2 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function reais(v) { return "R$\u00a0" + fmt2.format(v); } // espaço não separável: "R$" nunca fica sozinho na linha
  function tvsTexto(n) { return n + (n > 1 ? " TVs" : " TV"); }
  function mesesTexto(n) { return n === 1 ? "1 mês" : n + " meses"; }

  function storage(chave, valor) {
    try {
      if (valor === undefined) return window.localStorage.getItem(chave);
      window.localStorage.setItem(chave, valor);
    } catch (e) { return null; }
  }

  /*
   * Regra única de exibição de conteúdo de terceiros.
   * Arte própria (ilustrativo) → basta autorizado: true.
   * Título/pôster/logotipo oficial → licença completa, disponível no serviço e não vencida.
   */
  var HOJE = new Date().toISOString().slice(0, 10);
  function podeExibir(item) {
    if (!item || item.autorizado !== true) return false;
    if (item.ilustrativo === true) return true;
    var l = item.licenca;
    return !!(l && l.titular && l.documento && l.disponivelNoServico === true && (!l.validoAte || l.validoAte >= HOJE));
  }

  var VITRINES = CONFIG.vitrines || { permitirDemonstrativas: true, minimoTitulos: 1 };
  function exibivelNaVitrine(item) {
    return podeExibir(item) && (VITRINES.permitirDemonstrativas !== false || item.ilustrativo !== true);
  }

  /* Pausa animações contínuas quando o elemento sai da tela (economia de CPU/bateria). */
  function pausarForaDaTela(no) {
    if (!no || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (en) {
      no.classList.toggle("is-paused", !en[0].isIntersecting);
    }).observe(no);
  }

  /* ------------------------------------------------------------------ */
  /* Medição (LGPD: só envia após consentimento)                         */
  /* ------------------------------------------------------------------ */
  var analytics = CONFIG.analytics || {};
  var consentimento = storage("gmax_consent"); // "sim" | "nao" | null
  window.dataLayer = window.dataLayer || [];

  function track(evento, params) {
    if (analytics.depurarNoConsole) console.info("[GMAX evento]", evento, params || {});
    if (analytics.exigirConsentimento && consentimento !== "sim") return;
    window.dataLayer.push(Object.assign({ event: evento }, params || {}));
    if (typeof window.fbq === "function") window.fbq("trackCustom", evento, params || {});
  }
  window.GMAX_TRACK = track;

  function iniciarConsentimento() {
    var caixa = $("#consent");
    if (!caixa || !analytics.exigirConsentimento || consentimento) return;
    // Aparece só depois que o visitante começa a rolar (ou após 8 s),
    // para não cobrir a primeira tela nem os botões principais.
    var mostrado = false;
    function mostrar() {
      if (mostrado) return;
      mostrado = true;
      caixa.hidden = false;
      document.body.classList.add("has-consent");
      window.removeEventListener("scroll", aoRolar);
    }
    function aoRolar() { if (window.scrollY > 320) mostrar(); }
    window.addEventListener("scroll", aoRolar, { passive: true });
    setTimeout(mostrar, 8000);
    caixa.addEventListener("click", function (e) {
      var b = e.target.closest("[data-consent]");
      if (!b) return;
      consentimento = b.getAttribute("data-consent");
      storage("gmax_consent", consentimento);
      caixa.hidden = true;
      document.body.classList.remove("has-consent");
      track("consent_update", { consentimento: consentimento });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Avisos (toast)                                                      */
  /* ------------------------------------------------------------------ */
  var toastTimer;
  function aviso(titulo, detalhe) {
    var t = $("#toast");
    if (!t) return;
    t.textContent = "";
    t.appendChild(el("strong", { text: titulo }));
    if (detalhe) t.appendChild(el("span", { class: "toast__d", text: detalhe }));
    t.hidden = false;
    t.classList.remove("is-in"); void t.offsetWidth; t.classList.add("is-in");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 4500);
  }

  /* ------------------------------------------------------------------ */
  /* WhatsApp e contratação                                              */
  /* ------------------------------------------------------------------ */
  function linkWhatsApp(mensagem) {
    var numero = String(CONFIG.whatsapp && CONFIG.whatsapp.numero || "").replace(/\D/g, "");
    return "https://wa.me/" + numero + "?text=" + encodeURIComponent(mensagem);
  }

  function abrirWhatsApp(mensagem, origem) {
    track("whatsapp_click", { origem: origem });
    if (CONFIG.modoPrototipo) {
      aviso("Demonstração: WhatsApp " + (CONFIG.whatsapp ? CONFIG.whatsapp.exibicao : ""), "Mensagem: “" + mensagem + "”");
      return;
    }
    window.open(linkWhatsApp(mensagem), "_blank", "noopener");
  }

  function contratar(plano) {
    var chave = plano.tvs + "-" + plano.periodo.id;
    track("begin_checkout", { plano: chave, valor: plano.total, moeda: "BRL", tvs: plano.tvs, meses: plano.periodo.meses });
    var resumo = plano.periodo.nome + " · " + tvsTexto(plano.tvs) + " · " + reais(plano.total);
    if (CONFIG.modoPrototipo) {
      aviso("Checkout desativado no protótipo", resumo);
      return;
    }
    var url = CONFIG.checkout && CONFIG.checkout[chave];
    if (url && /^https:\/\//.test(url)) { window.location.href = url; return; }
    // Sem link cadastrado: nunca deixa o visitante sem saída.
    abrirWhatsApp("Olá! Tenho interesse no plano " + plano.periodo.nome + " para " + tvsTexto(plano.tvs) + " (" + reais(plano.total) + ").", "plano_sem_link");
  }

  function iniciarCliques() {
    document.addEventListener("click", function (e) {
      var wa = e.target.closest("[data-wa]");
      if (wa) {
        e.preventDefault();
        if (wa.hasAttribute("data-track-extra")) track(wa.getAttribute("data-track-extra"), { origem: wa.getAttribute("data-origem") });
        abrirWhatsApp(wa.getAttribute("data-wa"), wa.getAttribute("data-origem") || "desconhecida");
        return;
      }
      var tr = e.target.closest("[data-track]");
      if (tr) track(tr.getAttribute("data-track"), { local: tr.getAttribute("data-local") });
      var pend = e.target.closest("[data-pendente]");
      if (pend) { e.preventDefault(); aviso("Conteúdo pendente", "Este link será ligado à página oficial antes da publicação."); }
    });
    $$("[data-wa-exibicao]").forEach(function (n) { if (CONFIG.whatsapp) n.textContent = CONFIG.whatsapp.exibicao; });
  }

  /* ------------------------------------------------------------------ */
  /* Cabeçalho, menu, barra móvel                                        */
  /* ------------------------------------------------------------------ */
  function iniciarCabecalho() {
    var header = $(".site-header");
    var barra = $("#mobile-bar");
    var hero = $(".hero");
    // a barra some onde a página já oferece o mesmo botão (evita CTA duplicado)
    var zonasSemBarra = $$("#planos, #indique, .cta-final");
    var tick = false;

    function atualizar() {
      tick = false;
      var y = window.scrollY, vh = window.innerHeight;
      header.classList.toggle("is-solid", y > 24);
      if (barra && hero) {
        var passouHero = y > hero.offsetTop + hero.offsetHeight - 120;
        var emZona = zonasSemBarra.some(function (z) {
          var r = z.getBoundingClientRect();
          return r.top < vh * 0.7 && r.bottom > vh * 0.3;
        });
        barra.classList.toggle("is-visible", passouHero && !emZona);
      }
    }
    window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(atualizar); } }, { passive: true });
    atualizar();

    var botao = $("#menu-toggle");
    var menu = $("#menu-mobile");
    function fechar(focar) {
      botao.setAttribute("aria-expanded", "false");
      botao.setAttribute("aria-label", "Abrir menu");
      menu.hidden = true;
      if (focar) botao.focus();
    }
    botao.addEventListener("click", function () {
      var abrir = botao.getAttribute("aria-expanded") !== "true";
      botao.setAttribute("aria-expanded", String(abrir));
      botao.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
      menu.hidden = !abrir;
      if (abrir) { var a = $("a", menu); if (a) a.focus(); }
    });
    menu.addEventListener("click", function (e) { if (e.target.closest("a, button")) fechar(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) fechar(true); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 960 && !menu.hidden) fechar(false); });

    var links = $$(".nav__list a");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (l) {
            var ativo = l.getAttribute("href") === "#" + en.target.id;
            l.classList.toggle("is-active", ativo);
            if (ativo) l.setAttribute("aria-current", "true"); else l.removeAttribute("aria-current");
          });
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      links.forEach(function (l) { var s = $(l.getAttribute("href")); if (s) io.observe(s); });
    }

    var barraProto = $("#proto-bar");
    if (barraProto) {
      if (!CONFIG.modoPrototipo || storage("gmax_proto_bar") === "fechado") barraProto.hidden = true;
      $("#proto-close").addEventListener("click", function () { barraProto.hidden = true; storage("gmax_proto_bar", "fechado"); });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Hero: parede de capas (computador) e faixa de capas (celular)       */
  /* ------------------------------------------------------------------ */
  function capasAutorizadas() {
    return (CATALOGO.filmes || []).concat(CATALOGO.series || []).filter(exibivelNaVitrine);
  }

  function iniciarHero() {
    var capas = capasAutorizadas();
    if (!capas.length) return;
    var desktop = window.matchMedia("(min-width: 768px)");

    function montarParede() {
      var alvo = $("#hero-cols");
      if (!alvo || alvo.childElementCount) return;
      for (var c = 0; c < 3; c++) {
        var col = el("div", { class: "hero__col" });
        var itens = [];
        for (var k = 0; k < 5; k++) itens.push(capas[(c * 7 + k * 3) % capas.length]);
        itens.concat(itens).forEach(function (item, i) {
          // as capas visíveis no topo carregam já (podem ser o LCP); o restante, sob demanda
          col.appendChild(el("img", { src: item.imagem, alt: "", width: "400", height: "600", decoding: "async", loading: i < 3 ? "eager" : "lazy" }));
        });
        alvo.appendChild(col);
      }
      pausarForaDaTela($(".hero__wall"));
    }

    function montarFaixa() {
      var alvo = $("#hero-band");
      if (!alvo || alvo.childElementCount) return;
      var trilho = el("div", { class: "hero__band-track" });
      var itens = capas.slice(0, 10);
      itens.concat(itens).forEach(function (item, i) {
        trilho.appendChild(el("img", { src: item.imagem, alt: "", width: "400", height: "600", decoding: "async", loading: "lazy" }));
      });
      alvo.appendChild(trilho);
      pausarForaDaTela(alvo);
    }

    // só carrega as imagens da versão que está sendo exibida
    function escolher() { if (desktop.matches) montarParede(); else montarFaixa(); }
    escolher();
    if (desktop.addEventListener) desktop.addEventListener("change", escolher);
  }

  /* ------------------------------------------------------------------ */
  /* Carrossel reutilizável                                              */
  /* ------------------------------------------------------------------ */
  function Carrossel(raiz) {
    this.raiz = raiz;
    this.track = $(".rail__track", raiz);
    this.prev = $('.rail__btn[data-dir="-1"]', raiz);
    this.next = $('.rail__btn[data-dir="1"]', raiz);
    this.barra = $(".rail__progress span", raiz);
    var self = this, tick = false;

    raiz.addEventListener("click", function (e) {
      var b = e.target.closest(".rail__btn");
      if (!b) return;
      var dir = Number(b.getAttribute("data-dir"));
      self.track.scrollBy({ left: dir * self.track.clientWidth * 0.85, behavior: reduzMovimento ? "auto" : "smooth" });
      track("rail_nav", { vitrine: raiz.getAttribute("data-rail"), direcao: dir > 0 ? "proximo" : "anterior" });
    });
    this.track.addEventListener("scroll", function () {
      if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; self.atualizar(); }); }
    }, { passive: true });
    window.addEventListener("resize", function () { self.atualizar(); });
  }
  Carrossel.prototype.atualizar = function () {
    var t = this.track, max = t.scrollWidth - t.clientWidth, x = t.scrollLeft;
    var inicio = x <= 4, fim = x >= max - 4;
    if (this.prev) this.prev.disabled = inicio;
    if (this.next) this.next.disabled = fim || max <= 0;
    this.raiz.classList.toggle("is-scrolled", !inicio);
    this.raiz.classList.toggle("at-end", fim);
    if (this.barra) {
      var vis = max > 0 ? t.clientWidth / t.scrollWidth : 1;
      this.barra.style.width = (vis * 100) + "%";
      this.barra.style.transform = "translateX(" + (max > 0 ? (x / max) * ((1 - vis) / vis) * 100 : 0) + "%)";
    }
  };
  Carrossel.prototype.preencher = function (nos) {
    var t = this.track;
    t.textContent = "";
    nos.forEach(function (n, i) { n.style.setProperty("--i", Math.min(i, 8)); t.appendChild(n); });
    t.scrollLeft = 0;
    this.atualizar();
  };
  Carrossel.prototype.animar = function () {
    if (reduzMovimento) return;
    var r = this.raiz;
    r.classList.remove("is-in");
    r.classList.add("will-animate");
    requestAnimationFrame(function () { requestAnimationFrame(function () { r.classList.add("is-in"); }); });
    setTimeout(function () { r.classList.remove("will-animate", "is-in"); }, 1400);
  };

  // Largura exibida da capa em cada tela (o navegador escolhe o arquivo certo do srcset).
  var TAMANHOS_CAPA = "(min-width: 768px) 210px, 38vw";

  function imagemCapa(item) {
    var f = item.fontes || {};
    var img = el("img", {
      src: item.imagem,
      alt: (item.ilustrativo ? "Capa demonstrativa: " : "Pôster de ") + item.titulo,
      width: String(item.largura || 400), height: String(item.altura || 600),
      loading: "lazy", decoding: "async",
    });
    if (f.jpg) { img.setAttribute("srcset", f.jpg); img.setAttribute("sizes", TAMANHOS_CAPA); }
    if (!f.avif && !f.webp) return img;
    // Materiais oficiais: AVIF → WebP → JPG, cada um em vários tamanhos
    return el("picture", null, [
      f.avif ? el("source", { type: "image/avif", srcset: f.avif, sizes: TAMANHOS_CAPA }) : null,
      f.webp ? el("source", { type: "image/webp", srcset: f.webp, sizes: TAMANHOS_CAPA }) : null,
      img,
    ]);
  }

  function cartaoCapa(item) {
    var frame = el("div", { class: "poster__frame" }, [imagemCapa(item)]);
    // preserva a proporção original do pôster oficial (sem cortar)
    if (item.largura && item.altura) frame.style.aspectRatio = item.largura + " / " + item.altura;
    if (item.ilustrativo) frame.appendChild(el("span", { class: "poster__badge", text: "Demonstrativo" }));
    return el("li", null, [
      el("figure", { class: "poster" }, [
        frame,
        el("figcaption", { class: "poster__cap" }, [
          el("span", { class: "poster__t", text: item.titulo }),
          el("span", { class: "poster__g", text: item.genero }),
        ]),
      ]),
    ]);
  }

  function cartaoCategoria(cat) {
    var card = el("div", { class: "cat" }, [
      icone("c-" + cat.icone, "cat__bg"),
      el("span", { class: "cat__ico-wrap" }, [icone("c-" + cat.icone, "cat__ico")]),
      el("h4", { class: "cat__n", text: cat.nome }),
      el("p", { class: "cat__d", text: cat.descricao }),
    ]);
    if (/^#[0-9a-f]{3,8}$/i.test(cat.tom || "")) card.style.setProperty("--tom", cat.tom);
    return el("li", null, [card]);
  }

  function animarAoEntrar(car) {
    if (reduzMovimento || !("IntersectionObserver" in window)) return;
    if (car.raiz.getBoundingClientRect().top < window.innerHeight) return; // primeira tela sempre completa
    car.raiz.classList.add("will-animate");
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      car.raiz.classList.add("is-in");
      setTimeout(function () { car.raiz.classList.remove("will-animate", "is-in"); }, 1600);
    }, { threshold: 0.2 });
    io.observe(car.raiz);
  }

  function filtros(container, valores, rotuloTodos, aoEscolher) {
    [""].concat(valores).forEach(function (v) {
      container.appendChild(el("button", { class: "chip", type: "button", "aria-pressed": v === "" ? "true" : "false", "data-v": v, text: v || rotuloTodos }));
    });
    container.addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (!b || b.getAttribute("aria-pressed") === "true") return;
      $$(".chip", container).forEach(function (c) { c.setAttribute("aria-pressed", String(c === b)); });
      aoEscolher(b.getAttribute("data-v"));
    });
  }

  function iniciarVitrines() {
    ["filmes", "series"].forEach(function (tipo) {
      var raiz = $('.rail[data-rail="' + tipo + '"]');
      if (!raiz) return;
      var itens = (CATALOGO[tipo] || []).filter(exibivelNaVitrine);
      if (itens.length < (VITRINES.minimoTitulos || 1)) { raiz.hidden = true; return; }
      var car = new Carrossel(raiz);
      car.preencher(itens.map(cartaoCapa));
      animarAoEntrar(car);

      var chips = $('[data-chips="' + tipo + '"]');
      if (!chips || !itens.length) return;
      var generos = itens.reduce(function (acc, i) { if (acc.indexOf(i.genero) < 0) acc.push(i.genero); return acc; }, []).sort();
      filtros(chips, generos, "Todos", function (g) {
        var lista = g ? itens.filter(function (i) { return i.genero === g; }) : itens;
        car.preencher(lista.length ? lista.map(cartaoCapa) : [el("li", { class: "rail__empty", text: "Nenhum título nesta categoria por enquanto." })]);
        car.animar();
        track("filtro_vitrine", { vitrine: tipo, genero: g || "todos" });
      });
    });

    var raizCanais = $('.rail[data-rail="canais"]');
    if (raizCanais) {
      var car = new Carrossel(raizCanais);
      car.preencher((CATALOGO.canais || []).map(cartaoCategoria));
      animarAoEntrar(car);
    }
    iniciarCanaisDestaque();

    // o aviso de capas demonstrativas só aparece se houver alguma na tela
    var aviso = $(".disclaimer");
    if (aviso) aviso.hidden = !$(".poster__badge");
  }

  /* Canais em destaque: logotipos oficiais em cartões padronizados, por categoria. */
  function iniciarCanaisDestaque() {
    var secao = $("#canais-destaque"), grade = $("#logo-grid"), chips = $("#canais-chips");
    if (!secao || !grade) return;
    var categorias = CATALOGO.canais || [];
    var porId = {};
    categorias.forEach(function (c) { porId[c.id] = c; });
    var canais = (CATALOGO.destaques || []).filter(function (c) { return podeExibir(c) && porId[c.categoria]; });
    var demonstracao = false;

    if (!canais.length) {
      if (!CONFIG.modoPrototipo) return; // sem logotipos autorizados, a seção não existe no site
      // Protótipo: mostra só o LAYOUT, com espaços reservados neutros (nenhum canal real).
      demonstracao = true;
      canais = categorias.map(function (c) { return { id: "ex-" + c.id, categoria: c.id }; })
        .concat(categorias.slice(0, 3).map(function (c) { return { id: "ex2-" + c.id, categoria: c.id }; }));
      $(".channels__demo", secao).hidden = false;
    }

    function tile(canal) {
      var cat = porId[canal.categoria];
      var caixa = el("span", { class: "logo-tile__img" });
      if (demonstracao) {
        caixa.appendChild(icone("c-" + cat.icone, "logo-tile__ph"));
        caixa.appendChild(el("span", { class: "logo-tile__phl", text: "Logotipo oficial" }));
      } else {
        var img = el("img", { src: canal.logo, alt: "Logotipo " + canal.nome, loading: "lazy", decoding: "async", width: "160", height: "90" });
        var lf = canal.logoFontes;
        if (lf && lf.png) { img.setAttribute("srcset", lf.png); img.setAttribute("sizes", "160px"); }
        caixa.appendChild(lf && lf.webp ? el("picture", null, [el("source", { type: "image/webp", srcset: lf.webp, sizes: "160px" }), img]) : img);
      }
      var li = el("li", { class: "logo-tile" + (demonstracao ? " logo-tile--demo" : ""), "data-cat": canal.categoria }, [
        caixa,
        el("span", { class: "logo-tile__n", text: demonstracao ? "Nome do canal" : canal.nome }),
        el("span", { class: "logo-tile__c", text: cat.nome }),
      ]);
      if (/^#[0-9a-f]{3,8}$/i.test(cat.tom || "")) li.style.setProperty("--tom", cat.tom);
      return li;
    }
    canais.forEach(function (c) { grade.appendChild(tile(c)); });
    secao.hidden = false;

    if (chips) {
      var usadas = categorias.filter(function (c) { return canais.some(function (x) { return x.categoria === c.id; }); });
      filtros(chips, usadas.map(function (c) { return c.nome; }), "Todas", function (nome) {
        var cat = usadas.filter(function (c) { return c.nome === nome; })[0];
        $$(".logo-tile", grade).forEach(function (t) { t.hidden = !!cat && t.getAttribute("data-cat") !== cat.id; });
        track("filtro_canais", { categoria: nome || "todas" });
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Planos                                                              */
  /* ------------------------------------------------------------------ */
  function calcularPlanos(tvs) {
    var precos = PLANOS.precos[tvs];
    var mensal = precos[0];
    return PLANOS.periodos.map(function (p, i) {
      var total = precos[i];
      var semDesconto = mensal * p.meses;
      var economia = Math.max(0, semDesconto - total);
      return {
        tvs: tvs, periodo: p, total: total,
        porMes: Math.round((total / p.meses) * 100) / 100,
        economia: economia,
        economiaPct: semDesconto ? Math.round((economia / semDesconto) * 100) : 0,
      };
    });
  }

  /* Melhor custo-benefício = maior % de economia (calculado, não fixo). */
  function melhorPlano(lista) {
    return lista.reduce(function (m, p) { return p.economiaPct > m.economiaPct ? p : m; }, lista[0]);
  }

  function preco(v) {
    var partes = fmt2.format(v).split(",");
    return [el("span", { class: "plan__cur", text: "R$" }), el("span", { class: "plan__val", text: partes[0] }), el("span", { class: "plan__cents", text: "," + partes[1] })];
  }

  function iniciarPlanos() {
    var grade = $("#plan-grid"), seletor = $("#tv-picker"), telas = $("#tv-screens");
    if (!grade || !PLANOS) return;

    var status = $("#planos-status");
    if (status && PLANOS.status !== "validada") {
      status.hidden = false;
      status.appendChild(el("span", { class: "pending", text: "pendente de validação" }));
      status.appendChild(document.createTextNode(" Valores de referência. Serão conferidos com a configuração atual do site antes da publicação."));
    }

    var qtds = Object.keys(PLANOS.precos).map(Number).sort(function (a, b) { return a - b; });
    var tvsAtual = PLANOS.tvsPadrao || qtds[0];
    var cartoes = {};

    qtds.forEach(function (n) {
      var id = "tvs-" + n;
      seletor.appendChild(el("div", { class: "tv-opt" }, [
        el("input", { type: "radio", name: "tvs", id: id, value: String(n) }),
        el("label", { for: id }, [String(n), el("span", { class: "sr-only", text: n > 1 ? " TVs" : " TV" })]),
      ]));
      telas.appendChild(el("span", { class: "tv-screen" }));
    });
    var radio = $("#tvs-" + tvsAtual);
    if (radio) radio.checked = true;

    PLANOS.periodos.forEach(function (p) {
      var r = {
        flag: el("span", { class: "plan__flag", text: "Melhor custo-benefício" }),
        price: el("p", { class: "plan__price" }),
        per: el("p", { class: "plan__per" }),
        eq: el("p", { class: "plan__eq" }),
        save: el("span", { class: "plan__save" }),
        tvs: el("span"),
        btn: el("button", { class: "btn btn--block btn--ghost", type: "button", text: "Assinar " + p.nome }),
      };
      r.art = el("article", { class: "plan", "aria-label": "Plano " + p.nome }, [
        r.flag,
        el("div", { class: "plan__head" }, [
          el("h3", { class: "plan__name", text: p.nome }),
          el("span", { class: "plan__period", text: mesesTexto(p.meses) }),
        ]),
        el("div", { class: "plan__pricebox" }, [r.price, r.per, r.eq]),
        r.save,
        el("ul", { class: "plan__list" }, [
          el("li", null, [icone("i-tv"), r.tvs]),
          el("li", null, [icone("i-cal"), el("span", { text: "Acesso por " + mesesTexto(p.meses) })]),
          el("li", null, [icone("i-chat"), el("span", { text: "Atendimento pelo WhatsApp" })]),
        ]),
        r.btn,
      ]);
      cartoes[p.id] = r;
      grade.appendChild(r.art);
    });

    function render(tvs, animar) {
      tvsAtual = tvs;
      $$(".tv-screen", telas).forEach(function (t, i) { t.classList.toggle("is-on", i < tvs); });
      var lista = calcularPlanos(tvs), melhor = melhorPlano(lista);
      lista.forEach(function (pl) {
        var r = cartoes[pl.periodo.id], destaque = pl === melhor && pl.economia > 0;
        r.art.classList.toggle("plan--best", destaque);
        r.flag.hidden = !destaque;
        r.btn.className = "btn btn--block " + (destaque ? "btn--primary" : "btn--ghost");
        r.price.textContent = "";
        preco(pl.total).forEach(function (n) { r.price.appendChild(n); });
        r.per.textContent = "por " + mesesTexto(pl.periodo.meses) + " · " + tvsTexto(tvs);
        r.eq.textContent = pl.periodo.meses === 1
          ? "Base para o cálculo da economia"
          : "Equivale a " + reais(pl.porMes) + "/mês, em pagamento único";
        if (pl.economia > 0) {
          r.save.className = "plan__save";
          r.save.textContent = "Economia de " + reais(pl.economia) + " (" + pl.economiaPct + "%)";
        } else {
          r.save.className = "plan__save plan__save--none";
          r.save.textContent = "Pagamento mês a mês";
        }
        r.tvs.textContent = "Para " + tvsTexto(tvs);
        r.btn.onclick = function () { contratar(pl); };
        r.btn.setAttribute("aria-label", "Assinar plano " + pl.periodo.nome + " para " + tvsTexto(tvs) + ", " + reais(pl.total) + " por " + mesesTexto(pl.periodo.meses));
        if (animar && !reduzMovimento) { r.art.classList.remove("is-updating"); void r.art.offsetWidth; r.art.classList.add("is-updating"); }
      });
    }

    seletor.addEventListener("change", function (e) {
      var n = Number(e.target.value);
      render(n, true);
      track("select_tvs", { tvs: n });
    });
    render(tvsAtual, false);

    // Textos derivados da tabela (hero e FAQ): mudam sozinhos com os preços oficiais.
    var base = calcularPlanos(qtds[0]), menor = melhorPlano(base), mensal = base[0];
    var heroPreco = $("#hero-preco");
    if (heroPreco && menor.economia > 0) {
      heroPreco.appendChild(document.createTextNode("No plano " + menor.periodo.nome.toLowerCase() + " de " + tvsTexto(qtds[0]) + ", equivale a "));
      heroPreco.appendChild(el("strong", { text: reais(menor.porMes) + "/mês" }));
      heroPreco.appendChild(document.createTextNode("."));
    }
    var faq = $("#faq-economia");
    if (faq && menor.economia > 0) {
      faq.textContent = "O valor equivalente por mês fica menor. Com " + tvsTexto(qtds[0]) + ", o mensal custa " + reais(mensal.total) +
        " e o " + menor.periodo.nome.toLowerCase() + " sai por " + reais(menor.total) + " (" + reais(menor.porMes) + "/mês em pagamento único), uma economia de " +
        reais(menor.economia) + " no período.";
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { track("view_plans", {}); io.disconnect(); }
      }, { threshold: 0.35 });
      io.observe($("#planos"));
    }
  }

  /* ------------------------------------------------------------------ */
  /* Indicações                                                          */
  /* ------------------------------------------------------------------ */
  function iniciarIndicacoes() {
    var regras = $("#ref-regras");
    if (!regras) return;
    // regras abertas no computador; recolhidas no celular para não alongar a página
    if (window.matchMedia("(min-width: 768px)").matches) regras.open = true;
    regras.addEventListener("toggle", function () { if (regras.open) track("referral_rules_open", {}); });
    pausarForaDaTela($(".ref__art"));
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { track("view_referral", {}); io.disconnect(); }
      }, { threshold: 0.4 });
      io.observe($("#indique"));
    }
  }

  /* ------------------------------------------------------------------ */
  /* Avaliações (somente reais e autorizadas)                            */
  /* ------------------------------------------------------------------ */
  function iniciarAvaliacoes() {
    var secao = $("#avaliacoes"), lista = $("#reviews");
    if (!secao || !lista) return;
    var validas = AVALIACOES.filter(function (a) { return a && a.autorizado === true && a.texto && a.nome; });
    if (validas.length) {
      validas.forEach(function (a) {
        var rodape = el("figcaption", { class: "review__by" }, [
          el("strong", { text: a.nome }),
          a.cidade ? el("span", { text: a.cidade }) : null,
        ]);
        if (a.fonte) {
          var fonte = /^https:\/\//.test(a.link || "")
            ? el("a", { href: a.link, target: "_blank", rel: "noopener noreferrer nofollow", text: "via " + a.fonte })
            : el("span", { text: "via " + a.fonte });
          rodape.appendChild(fonte);
        }
        lista.appendChild(el("figure", { class: "review" }, [el("blockquote", null, [el("p", { text: a.texto })]), rodape]));
      });
      secao.hidden = false;
    } else if (CONFIG.modoPrototipo) {
      lista.appendChild(el("div", { class: "reviews__empty" }, [
        el("span", { class: "pending", text: "seção preparada" }),
        el("p", { text: "Esta seção só é publicada com avaliações reais e autorizadas pelos clientes. Sem avaliações cadastradas, ela fica oculta no site." }),
      ]));
      secao.hidden = false;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Perguntas frequentes                                                */
  /* ------------------------------------------------------------------ */
  function iniciarFaq() {
    var raiz = $("#faq");
    if (!raiz) return;
    $$(".faq__item", raiz).forEach(function (item, i) {
      var q = $(".faq__q", item), a = $(".faq__a", item);
      a.id = "faq-a-" + i;
      q.id = "faq-q-" + i;
      a.setAttribute("role", "region");
      a.setAttribute("aria-labelledby", q.id);
      q.setAttribute("aria-controls", a.id);
      a.inert = true;
    });
    raiz.addEventListener("click", function (e) {
      var q = e.target.closest(".faq__q");
      if (!q) return;
      var item = q.closest(".faq__item"), abrir = q.getAttribute("aria-expanded") !== "true";
      q.setAttribute("aria-expanded", String(abrir));
      item.classList.toggle("is-open", abrir);
      $(".faq__a", item).inert = !abrir;
      if (abrir) track("faq_open", { pergunta: q.textContent.trim() });
    });

    var chips = $("#faq-chips"), grupos = $$(".faq__group", raiz);
    if (chips && grupos.length) {
      var temas = grupos.map(function (g) { return g.getAttribute("data-tema"); });
      filtros(chips, temas, "Todas", function (tema) {
        grupos.forEach(function (g) { g.hidden = !!tema && g.getAttribute("data-tema") !== tema; });
        raiz.classList.toggle("is-filtered", !!tema);
        track("faq_filtro", { tema: tema || "todas" });
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Revelação suave ao rolar (somente abaixo da dobra)                   */
  /* ------------------------------------------------------------------ */
  function iniciarRevelacao() {
    if (reduzMovimento || !("IntersectionObserver" in window)) return;
    var alvos = $$(".benefit, .section-head, .plan-grid, .ref, .step, .app__visual, .app__copy, .faq-col, .cta-final__in");
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        x.target.classList.add("is-in");
        io.unobserve(x.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    alvos.forEach(function (n) {
      if (n.getBoundingClientRect().top < window.innerHeight) return;
      if (n.classList.contains("step") || n.classList.contains("benefit")) {
        n.style.transitionDelay = (Array.prototype.indexOf.call(n.parentNode.children, n) % 4) * 80 + "ms";
      }
      n.classList.add("reveal");
      io.observe(n);
    });
  }

  /* ------------------------------------------------------------------ */
  function iniciar() {
    var ano = $("#ano");
    if (ano) ano.textContent = String(new Date().getFullYear());
    iniciarCliques();
    iniciarCabecalho();
    iniciarHero();
    iniciarVitrines();
    iniciarPlanos();
    iniciarIndicacoes();
    iniciarAvaliacoes();
    iniciarFaq();
    iniciarRevelacao();
    iniciarConsentimento();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
