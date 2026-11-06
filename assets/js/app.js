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
    (filhos || []).forEach(function (f) { if (f) n.appendChild(f); });
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

  var brl = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  var brl2 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function dinheiro(v) { return Number.isInteger(v) ? brl.format(v) : brl2.format(v); }

  function storage(chave, valor) {
    try {
      if (valor === undefined) return window.localStorage.getItem(chave);
      window.localStorage.setItem(chave, valor);
    } catch (e) { return null; }
  }

  /* ------------------------------------------------------------------ */
  /* Medição (LGPD: só envia após consentimento)                         */
  /* ------------------------------------------------------------------ */
  var analytics = CONFIG.analytics || {};
  var consentimento = storage("gmax_consent"); // "sim" | "nao" | null
  window.dataLayer = window.dataLayer || [];

  function track(evento, params) {
    var dados = Object.assign({ event: evento }, params || {});
    if (analytics.depurarNoConsole) console.info("[GMAX evento]", evento, params || {});
    if (analytics.exigirConsentimento && consentimento !== "sim") return;
    window.dataLayer.push(dados);
    if (typeof window.fbq === "function") window.fbq("trackCustom", evento, params || {});
  }
  window.GMAX_TRACK = track;

  function iniciarConsentimento() {
    var caixa = $("#consent");
    if (!caixa || !analytics.exigirConsentimento || consentimento) return;
    // aparece só depois que o visitante começa a rolar (ou após 8 s),
    // para não cobrir a primeira tela e os botões principais
    var mostrado = false;
    function mostrar() {
      if (mostrado) return;
      mostrado = true;
      caixa.hidden = false;
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
    if (detalhe) t.appendChild(el("code", { text: detalhe }));
    t.hidden = false;
    t.style.animation = "none"; void t.offsetWidth; t.style.animation = "";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 4200);
  }

  /* ------------------------------------------------------------------ */
  /* WhatsApp e contratação                                              */
  /* ------------------------------------------------------------------ */
  function linkWhatsApp(mensagem) {
    var numero = (CONFIG.whatsapp && CONFIG.whatsapp.numero || "").replace(/\D/g, "");
    return "https://wa.me/" + numero + "?text=" + encodeURIComponent(mensagem);
  }

  function abrirWhatsApp(mensagem, origem) {
    track("whatsapp_click", { origem: origem });
    if (CONFIG.modoPrototipo) {
      aviso("Demonstração: WhatsApp", "Mensagem: “" + mensagem + "”");
      return;
    }
    window.open(linkWhatsApp(mensagem), "_blank", "noopener");
  }

  function contratar(plano) {
    var chave = plano.tvs + "-" + plano.periodo.id;
    var params = { plano: chave, valor: plano.total, moeda: "BRL", tvs: plano.tvs, meses: plano.periodo.meses };
    track("begin_checkout", params);
    if (CONFIG.modoPrototipo) {
      aviso("Checkout desativado no protótipo", plano.periodo.nome + " · " + plano.tvs + (plano.tvs > 1 ? " TVs" : " TV") + " · R$ " + dinheiro(plano.total));
      return;
    }
    var url = CONFIG.checkout && CONFIG.checkout[chave];
    if (url && /^https:\/\//.test(url)) { window.location.href = url; return; }
    // Sem link cadastrado: nunca deixa o visitante sem saída.
    abrirWhatsApp("Olá! Quero assinar o plano " + plano.periodo.nome + " para " + plano.tvs + (plano.tvs > 1 ? " TVs" : " TV") + " (R$ " + dinheiro(plano.total) + ").", "plano_sem_link");
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
  /* Cabeçalho, menu e navegação                                         */
  /* ------------------------------------------------------------------ */
  function iniciarCabecalho() {
    var header = $(".site-header");
    var barra = $("#mobile-bar");
    var hero = $(".hero");
    var planos = $("#planos");
    var tick = false;

    function atualizar() {
      tick = false;
      var y = window.scrollY;
      header.classList.toggle("is-solid", y > 24);
      if (barra && hero) {
        var passouHero = y > hero.offsetTop + hero.offsetHeight - 120;
        var r = planos.getBoundingClientRect();
        var vendoPlanos = r.top < window.innerHeight * 0.6 && r.bottom > window.innerHeight * 0.4;
        barra.classList.toggle("is-visible", passouHero && !vendoPlanos);
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
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) fechar(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) fechar(true); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 960 && !menu.hidden) fechar(false); });

    // destaca o link da seção visível
    var links = $$(".nav__list a");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (l) { l.classList.toggle("is-active", l.getAttribute("href") === "#" + en.target.id); });
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
  /* Hero: parede de capas                                               */
  /* ------------------------------------------------------------------ */
  function iniciarHero() {
    var alvo = $("#hero-cols");
    if (!alvo) return;
    var capas = (CATALOGO.filmes || []).concat(CATALOGO.series || []).filter(function (i) { return i.autorizado === true; });
    if (!capas.length) return;
    var colunas = 4, porColuna = 6;
    for (var c = 0; c < colunas; c++) {
      var col = el("div", { class: "hero__col" });
      var itens = [];
      for (var k = 0; k < porColuna; k++) itens.push(capas[(c * 5 + k * 3) % capas.length]);
      // duplica a sequência para o loop contínuo
      itens.concat(itens).forEach(function (item) {
        col.appendChild(el("img", { src: item.imagem, alt: "", width: "400", height: "600", decoding: "async", loading: c < 2 ? "eager" : "lazy" }));
      });
      alvo.appendChild(col);
    }
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
    this.track.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; self.atualizar(); }); } }, { passive: true });
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

  function cartaoCapa(item) {
    var frame = el("div", { class: "poster__frame" }, [
      el("img", { src: item.imagem, alt: item.ilustrativo ? "Capa ilustrativa de " + item.titulo : "Capa de " + item.titulo, width: "400", height: "600", loading: "lazy", decoding: "async" }),
    ]);
    if (item.ilustrativo) frame.appendChild(el("span", { class: "poster__badge", text: "Ilustração" }));
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
      icone("c-" + cat.icone, "cat__ico"),
      el("h4", { class: "cat__n", text: cat.nome }),
      el("p", { class: "cat__d", text: cat.descricao }),
    ]);
    if (/^#[0-9a-f]{3,8}$/i.test(cat.tom || "")) card.style.setProperty("--tom", cat.tom);
    return el("li", null, [card]);
  }

  function animarEntrada(raiz) {
    if (reduzMovimento || !("IntersectionObserver" in window)) return;
    // só anima o que ainda está abaixo da dobra: a primeira tela fica sempre completa
    if (raiz.getBoundingClientRect().top < window.innerHeight) return;
    raiz.classList.add("will-animate");
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      raiz.classList.add("is-in");
      io.disconnect();
      setTimeout(function () { raiz.classList.remove("will-animate", "is-in"); }, 1600);
    }, { threshold: 0.2 });
    io.observe(raiz);
  }

  function iniciarVitrines() {
    ["filmes", "series"].forEach(function (tipo) {
      var raiz = $('.rail[data-rail="' + tipo + '"]');
      if (!raiz) return;
      var itens = (CATALOGO[tipo] || []).filter(function (i) { return i.autorizado === true; });
      var car = new Carrossel(raiz);
      function render(genero) {
        var lista = genero ? itens.filter(function (i) { return i.genero === genero; }) : itens;
        if (!lista.length) { car.preencher([el("li", { class: "rail__empty", text: "Nenhum título nesta categoria por enquanto." })]); return; }
        car.preencher(lista.map(cartaoCapa));
        if (!reduzMovimento) {
          car.raiz.classList.remove("is-in");
          car.raiz.classList.add("will-animate");
          requestAnimationFrame(function () { requestAnimationFrame(function () { car.raiz.classList.add("is-in"); }); });
          setTimeout(function () { car.raiz.classList.remove("will-animate", "is-in"); }, 1400);
        }
      }
      car.preencher(itens.map(cartaoCapa));
      animarEntrada(raiz);

      // filtros por gênero, gerados a partir dos dados
      var chips = $('[data-chips="' + tipo + '"]');
      if (chips && itens.length) {
        var generos = itens.reduce(function (acc, i) { if (acc.indexOf(i.genero) < 0) acc.push(i.genero); return acc; }, []).sort();
        [""].concat(generos).forEach(function (g) {
          chips.appendChild(el("button", { class: "chip", type: "button", "aria-pressed": g === "" ? "true" : "false", "data-g": g, text: g || "Todos" }));
        });
        chips.addEventListener("click", function (e) {
          var b = e.target.closest(".chip");
          if (!b || b.getAttribute("aria-pressed") === "true") return;
          $$(".chip", chips).forEach(function (c) { c.setAttribute("aria-pressed", String(c === b)); });
          render(b.getAttribute("data-g"));
          track("filtro_vitrine", { vitrine: tipo, genero: b.getAttribute("data-g") || "todos" });
        });
      }
    });

    var raizCanais = $('.rail[data-rail="canais"]');
    if (raizCanais) {
      var car = new Carrossel(raizCanais);
      car.preencher((CATALOGO.canais || []).map(cartaoCategoria));
      animarEntrada(raizCanais);
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
        porMes: total / p.meses,
        economia: economia,
        economiaPct: semDesconto ? Math.round((economia / semDesconto) * 100) : 0,
      };
    });
  }

  function iniciarPlanos() {
    var grade = $("#plan-grid"), seletor = $("#tv-picker"), telas = $("#tv-screens");
    if (!grade || !PLANOS) return;
    var qtds = Object.keys(PLANOS.precos).map(Number).sort(function (a, b) { return a - b; });
    var tvsAtual = PLANOS.padrao.tvs;
    var cartoes = {};

    qtds.forEach(function (n) {
      var id = "tvs-" + n;
      seletor.appendChild(el("div", { class: "tv-opt" }, [
        el("input", { type: "radio", name: "tvs", id: id, value: String(n) }),
        el("label", { for: id }, [document.createTextNode(String(n)), el("span", { class: "sr-only", text: n > 1 ? " TVs" : " TV" })]),
      ]));
      telas.appendChild(el("span", { class: "tv-screen" }));
    });
    var radioPadrao = $("#tvs-" + tvsAtual);
    if (radioPadrao) radioPadrao.checked = true;

    PLANOS.periodos.forEach(function (p) {
      var destaque = p.id === PLANOS.padrao.destaque;
      var refs = {
        val: el("span", { class: "plan__val" }),
        eq: el("p", { class: "plan__eq" }),
        save: el("span", { class: "plan__save" }),
        tvs: el("span"),
        btn: el("button", { class: "btn btn--block " + (destaque ? "btn--primary" : "btn--ghost"), type: "button", text: "Assinar " + p.nome }),
      };
      var art = el("article", { class: "plan" + (destaque ? " plan--best" : ""), "aria-label": "Plano " + p.nome }, [
        destaque ? el("span", { class: "plan__flag", text: "Maior economia" }) : null,
        el("div", { class: "plan__head" }, [
          el("h3", { class: "plan__name", text: p.nome }),
          el("span", { class: "plan__period", text: p.meses === 1 ? "1 mês" : p.meses + " meses" }),
        ]),
        el("div", null, [
          el("p", { class: "plan__price" }, [el("span", { class: "plan__cur", text: "R$" }), refs.val]),
          refs.eq,
        ]),
        refs.save,
        el("ul", { class: "plan__list" }, [
          el("li", null, [icone("i-tv"), refs.tvs]),
          el("li", null, [icone("i-cal"), el("span", { text: "Acesso por " + (p.meses === 1 ? "1 mês" : p.meses + " meses") })]),
          el("li", null, [icone("i-chat"), el("span", { text: "Suporte pelo WhatsApp" })]),
        ]),
        refs.btn,
      ]);
      refs.art = art;
      cartoes[p.id] = refs;
      grade.appendChild(art);
    });

    function render(tvs, animar) {
      tvsAtual = tvs;
      $$(".tv-screen", telas).forEach(function (t, i) { t.classList.toggle("is-on", i < tvs); });
      calcularPlanos(tvs).forEach(function (pl) {
        var r = cartoes[pl.periodo.id];
        r.val.textContent = dinheiro(pl.total);
        r.eq.textContent = "";
        if (pl.periodo.meses === 1) {
          r.eq.appendChild(document.createTextNode("Pago mês a mês"));
        } else {
          r.eq.appendChild(document.createTextNode("Equivale a "));
          r.eq.appendChild(el("strong", { text: "R$ " + brl2.format(pl.porMes) + "/mês" }));
        }
        if (pl.economia > 0) {
          r.save.className = "plan__save";
          r.save.textContent = "Economize R$ " + dinheiro(pl.economia) + " (" + pl.economiaPct + "%)";
        } else {
          r.save.className = "plan__save plan__save--none";
          r.save.textContent = "Sem desconto por período";
        }
        r.tvs.textContent = "Para " + tvs + (tvs > 1 ? " TVs" : " TV");
        r.btn.onclick = function () { contratar(pl); };
        r.btn.setAttribute("aria-label", "Assinar plano " + pl.periodo.nome + " para " + tvs + (tvs > 1 ? " TVs" : " TV") + ", R$ " + dinheiro(pl.total));
        if (animar && !reduzMovimento) {
          r.art.classList.remove("is-updating"); void r.art.offsetWidth; r.art.classList.add("is-updating");
        }
      });
    }

    seletor.addEventListener("change", function (e) {
      var n = Number(e.target.value);
      render(n, true);
      track("select_tvs", { tvs: n });
    });
    render(tvsAtual, false);

    // "view_plans" uma vez, quando a seção aparece
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { track("view_plans", {}); io.disconnect(); }
      }, { threshold: 0.35 });
      io.observe($("#planos"));
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
      var id = "faq-a-" + i;
      a.id = id;
      a.setAttribute("role", "region");
      a.setAttribute("aria-labelledby", "faq-q-" + i);
      q.id = "faq-q-" + i;
      q.setAttribute("aria-controls", id);
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
  }

  /* ------------------------------------------------------------------ */
  /* Revelação suave ao rolar (somente abaixo da dobra)                   */
  /* ------------------------------------------------------------------ */
  function iniciarRevelacao() {
    if (reduzMovimento || !("IntersectionObserver" in window)) return;
    var alvos = $$(".section-head, .plan-grid, .step, .app__visual, .app__copy, .faq__group, .cta-final__in");
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        x.target.classList.add("is-in");
        io.unobserve(x.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    alvos.forEach(function (n, i) {
      if (n.getBoundingClientRect().top < window.innerHeight) return;
      if (n.classList.contains("step")) n.style.transitionDelay = (i % 4) * 80 + "ms";
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
    iniciarFaq();
    iniciarRevelacao();
    iniciarConsentimento();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
