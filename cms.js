/* Eterna Clinic · carga del contenido publicado desde Supabase (solo lectura, clave pública).
   El HTML ya trae el contenido original: este script solo lo actualiza con lo que se haya publicado en el panel.
   Sin configuración (cms-config.js vacío) no hace nada y el sitio funciona igual que antes.
   En el panel (/admin) la página se abre dentro de un iframe del mismo origen con ?cms-preview=1 para ver borradores. */
(() => {
  const cfg = window.ETERNA_CMS || {};
  const vista = new URLSearchParams(location.search).has("cms-preview") && window.parent !== window;
  const conectado = Boolean(cfg.url && cfg.key);
  if (!vista && !conectado) return;

  const CLAVE_CACHE = "eterna-cms-1";
  const SECCION = { protocolo: "protocolos", consulta: "consultas" };
  const PADRE = { protocolo: "Protocolos", consulta: "Consultas" };
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const icono = (n) => `<svg class="icono" aria-hidden="true"><use href="#i-${n}"/></svg>`;

  // ───────── Seguridad: solo se aceptan enlaces e imágenes de orígenes conocidos; el HTML se limpia ─────────
  const origenCms = conectado ? new URL(cfg.url).origin : "";
  function urlEnlace(u) {
    u = String(u ?? "").trim();
    if (!u) return "";
    if (/^(\/(?!\/)|#)/.test(u)) return u;
    try { return ["https:", "http:", "mailto:", "tel:"].includes(new URL(u).protocol) ? u : ""; } catch { return ""; }
  }
  function urlImagen(u) {
    u = String(u ?? "").trim();
    if (/^\/(?!\/)/.test(u)) return u;
    try { return new URL(u).origin === origenCms ? u : ""; } catch { return ""; }   // solo imágenes del propio Supabase (Storage)
  }
  function sanear(h) {
    const t = document.createElement("template"); t.innerHTML = String(h ?? "");
    const salida = document.createElement("div");
    (function recorrer(origen, destino) {
      origen.childNodes.forEach((n) => {
        if (n.nodeType === 3) destino.append(n.textContent);
        else if (n.nodeType === 1) {
          if (n.tagName === "EM" || n.tagName === "STRONG") { const c = document.createElement(n.tagName.toLowerCase()); recorrer(n, c); destino.append(c); }
          else if (n.tagName === "BR") destino.append(document.createElement("br"));
          else recorrer(n, destino);
        }
      });
    })(t.content, salida);
    return salida.innerHTML;
  }

  // ───────── Bloques de texto (site_content) ─────────
  const valor = (bloques, campo) => { const [b, ...r] = campo.split("."); return bloques?.[b]?.[r.join(".")]; };

  function aplicarBloques(bloques) {
    if (!bloques) return;
    $$("[data-cms]").forEach((el) => {
      const v = valor(bloques, el.dataset.cms);
      if (typeof v !== "string") return;
      el.textContent = v;
      if (el.hasAttribute("data-cms-mail")) el.href = urlEnlace("mailto:" + v.trim());
    });
    $$("[data-cms-html]").forEach((el) => { const v = valor(bloques, el.dataset.cmsHtml); if (typeof v === "string") el.innerHTML = sanear(v); });
    $$("[data-cms-attr]").forEach((el) => {
      el.dataset.cmsAttr.split(/\s+/).forEach((par) => {
        const [campo, attr] = par.split(":");
        let v = valor(bloques, campo);
        if (typeof v !== "string") return;
        if (attr === "src") v = urlImagen(v);
        else if (attr === "href") v = urlEnlace(v);
        if (v === "" && attr !== "alt") return;
        el.setAttribute(attr, v);
        if (el.name === "cms-whatsapp" && /^\d{8,15}$/.test(v) && window.eternaWhatsApp) window.eternaWhatsApp(v);
      });
    });
    $$("[data-cms-vis]").forEach((el) => {
      const v = valor(bloques, el.dataset.cmsVis);
      if (v === undefined) return;
      el.style.display = v === false || v === "false" ? "none" : "";
    });
    $$("h1[aria-label]").forEach((h) => { const t = $$(".linea", h).map((l) => l.textContent.trim()).join(" "); if (t) h.setAttribute("aria-label", t); });
    sincronizarSeo();
  }

  function sincronizarSeo() {
    const descripcion = document.querySelector('meta[name="description"]')?.content;
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", document.title);
    if (descripcion) document.querySelector('meta[property="og:description"]')?.setAttribute("content", descripcion);
  }

  // ───────── Protocolos y consultas (entries) ─────────
  const normalizar = (e) => ({ kind: e.kind, slug: e.slug, sort: e.sort ?? 0, d: e.published || e.data || {} });

  function tarjetaHTML(e, i) {
    const d = e.d, url = `/${SECCION[e.kind]}/${e.slug}/`;
    return `<a class="tarjeta revelar visible" style="--d:${i}" href="${esc(url)}"><div class="tarjeta__foto"><img src="${esc(urlImagen(d.img))}" alt="" loading="lazy" decoding="async"><span class="tarjeta__chip">${icono("lugar")}${esc(d.modalidad)}</span></div><div class="tarjeta__cuerpo"><h3>${esc(d.nombre)}</h3><p>${esc(d.resumen)}</p><div class="tarjeta__pie"><span>${icono("reloj")} ${esc(d.duracion)}</span><span class="ver">Ver más ${icono("flecha")}</span></div></div></a>`;
  }

  function partirNombre(nombre, kind) {
    const i = nombre.indexOf(" ");
    let [l1, l2] = i > 0 ? [nombre.slice(0, i), nombre.slice(i + 1)] : [nombre, ""];
    if (!l2) { l1 = kind === "protocolo" ? "Protocolo" : PADRE[kind]; l2 = nombre; }
    return [l1, l2];
  }

  const mensajeReserva = (n) => `Hola, vi su página web y quiero reservar ${n} en Eterna Clinic.`;

  function aplicarEntradas(lista, completo) {
    const entradas = lista.map(normalizar);
    const porRuta = new Map(entradas.map((e) => [`/${SECCION[e.kind]}/${e.slug}/`, e]));

    // Tarjetas sueltas (p. ej. “Sigue tu camino” en Detox ERA): se actualizan en su sitio
    $$("a.tarjeta").forEach((a) => {
      const e = porRuta.get(a.getAttribute("href"));
      if (!e) { if (completo && /^\/(protocolos|consultas)\/[^/]+\/$/.test(a.getAttribute("href"))) a.style.display = "none"; return; }
      a.style.display = "";
      const d = e.d, img = a.querySelector(".tarjeta__foto img"), chip = a.querySelector(".tarjeta__chip");
      if (img && urlImagen(d.img)) img.src = urlImagen(d.img);
      if (chip) chip.innerHTML = icono("lugar") + esc(d.modalidad);
      a.querySelector("h3") && (a.querySelector("h3").textContent = d.nombre);
      a.querySelector(".tarjeta__cuerpo p") && (a.querySelector(".tarjeta__cuerpo p").textContent = d.resumen);
      const dur = a.querySelector(".tarjeta__pie span"); if (dur) dur.innerHTML = icono("reloj") + " " + esc(d.duracion);
    });

    // Listados: si cambió el conjunto o el orden, se vuelven a dibujar
    $$("[data-e-lista]").forEach((cont) => {
      const kind = cont.dataset.eLista, excluir = cont.dataset.excluir;
      const deseadas = entradas.filter((e) => e.kind === kind && e.slug !== excluir).sort((a, b) => a.sort - b.sort);
      const actuales = $$("a.tarjeta", cont).map((a) => a.getAttribute("href"));
      const nuevas = deseadas.map((e) => `/${SECCION[kind]}/${e.slug}/`);
      if (completo && JSON.stringify(actuales) !== JSON.stringify(nuevas)) cont.innerHTML = deseadas.map(tarjetaHTML).join("\n");
      if (cont.classList.contains("tarjetas")) cont.classList.toggle("tarjetas--tres", nuevas.length === 3);
    });

    // “¿Qué quieres recuperar?” en la portada
    const brujula = window.eternaCaminos;
    if (brujula) {
      brujula.caminos.forEach((c) => {
        const e = porRuta.get(c.url); if (!e) return;
        Object.assign(c, { nombre: e.d.nombre, img: urlImagen(e.d.img) || c.img, texto: e.d.pregunta, duracion: e.d.duracion, modalidad: e.d.modalidad });
      });
      brujula.mostrar(Number(document.querySelector("#opciones .opcion[aria-pressed='true']")?.dataset.i || 0), false);
    }

    const main = document.querySelector("main[data-e-kind]");
    if (main) detalle(main, entradas, completo);
    window.eternaConectarWhatsApp?.();
  }

  function noDisponible(main) {
    const kind = main.dataset.eKind;
    main.innerHTML = `<section class="seccion"><div class="contenedor" style="padding-block:clamp(4rem,12vw,8rem);max-width:640px"><h1 class="titulo" style="font-size:clamp(2rem,6vw,3.2rem)">Este contenido <em>no está disponible</em></h1><p class="intro" style="margin:1.2rem 0 2rem">Es posible que haya cambiado de dirección o que ya no esté publicado.</p><a class="boton boton--oro" href="/${SECCION[kind]}/">Ver ${PADRE[kind].toLowerCase()}</a></div></section>`;
    main.removeAttribute("data-e-plantilla");
  }

  function detalle(main, entradas, completo) {
    const kind = main.dataset.eKind;
    // En la plantilla el slug real sale de la URL. Se guarda la primera vez porque la marca de plantilla se quita después
    // y la página se pinta más de una vez (caché y luego datos frescos).
    if (main.hasAttribute("data-e-plantilla")) main.dataset.eSlug = (vista ? new URLSearchParams(location.search).get("slug") : location.pathname.split("/").filter(Boolean)[1]) || "";
    const slug = main.dataset.eSlug;
    const e = entradas.find((x) => x.kind === kind && x.slug === slug);
    if (!e) { if (completo) noDisponible(main); return; }
    const d = e.d, [l1, l2] = partirNombre(d.nombre, kind);
    const set = (sel, fn) => $$(sel, main).forEach(fn);
    set('[data-e="linea1"]', (el) => (el.textContent = l1));
    set('[data-e="linea2"]', (el) => (el.textContent = l2));
    set("h1[aria-label]", (el) => el.setAttribute("aria-label", `${l1} ${l2}`));
    set('[data-e="nombre"]', (el) => (el.textContent = d.nombre));
    set('[data-e="pregunta"]', (el) => (el.textContent = d.pregunta));
    set('[data-e="duracion"]', (el) => (el.textContent = d.duracion));
    set('[data-e="modalidad"]', (el) => (el.textContent = d.modalidad));
    set(".migas [aria-current]", (el) => (el.textContent = d.nombre));
    set(".ficha", (el) => el.setAttribute("aria-label", `Datos de ${d.nombre}`));
    set("[data-e-img]", (el) => { const u = urlImagen(d.img); if (u) el.src = u; el.alt = d.nombre; });
    set("[data-e-texto]", (el) => {
      const t = Array.isArray(d.texto) ? d.texto : [];
      el.innerHTML = t.map((p, i) => `<p${i === t.length - 1 && t.length > 2 ? ' class="destacado"' : ""}>${esc(p)}</p>`).join("");
    });
    set("[data-e-reserva]", (el) => {
      el.dataset.mensaje = mensajeReserva(d.nombre);
      if (el.dataset.eReserva === "etiqueta") { const s = el.querySelector("span"); (s || el).lastChild.textContent = `Reservar ${d.nombre}`; }
    });
    // SEO de la página
    document.title = (d.seo_titulo || "").trim() || `${d.nombre} | Eterna Clinic, medicina biorreguladora en Cali`;
    const descripcion = (d.seo_descripcion || "").trim() || d.resumen || "";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.append(meta); }
    meta.content = descripcion;
    document.querySelector('meta[property="og:image"]')?.setAttribute("content", urlImagen(d.img) || "");
    sincronizarSeo();
    if (!vista) {
      document.querySelector('meta[name="robots"]')?.remove();
      let can = document.querySelector('link[rel="canonical"]');
      if (!can) { can = document.createElement("link"); can.rel = "canonical"; document.head.append(can); }
      can.href = `${location.origin}/${SECCION[kind]}/${slug}/`;
    }
    main.removeAttribute("data-e-plantilla");
  }

  // ───────── Carga ─────────
  async function pedir(ruta) {
    const r = await fetch(`${cfg.url}/rest/v1/${ruta}`, { headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` } });
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
  }
  const leerCache = () => { try { return JSON.parse(localStorage.getItem(CLAVE_CACHE)); } catch { return null; } };
  const guardarCache = (c) => { try { localStorage.setItem(CLAVE_CACHE, JSON.stringify(c)); } catch {} };

  function aplicar(datos, completo) {
    const bloques = {};
    datos.bloques.forEach((b) => (bloques[b.key] = b.published));
    aplicarBloques(bloques);
    aplicarEntradas(datos.entradas, completo);
  }

  async function iniciar() {
    const cache = leerCache();
    if (cache) aplicar(cache, !vista);
    try {
      const [bloques, entradas] = await Promise.all([
        pedir("site_content?select=key,published&published=not.is.null"),
        pedir("entries?select=kind,slug,sort,published&status=eq.publicado&order=sort.asc"),
      ]);
      const datos = { bloques, entradas };
      aplicar(datos, !vista);
      guardarCache(datos);
    } catch {
      const main = document.querySelector("main[data-e-plantilla]");
      if (main && !cache) noDisponible(main);
    }
  }

  // ───────── Vista previa dentro del panel (mismo origen, nunca visible para visitantes) ─────────
  function iniciarVista() {
    const estilo = document.createElement("style");
    estilo.textContent = "[data-cms],[data-cms-html],[data-e],[data-e-texto],[data-e-img],[data-cms-attr]{cursor:pointer}[data-cms]:hover,[data-cms-html]:hover,[data-e]:hover,[data-e-texto]:hover,[data-e-img]:hover,[data-cms-attr]:hover{outline:2px dashed #b89b64;outline-offset:3px}.entrada{display:none!important}main[data-e-plantilla]{visibility:visible!important}";
    document.head.append(estilo);
    document.addEventListener("click", (ev) => {
      const el = ev.target.closest("[data-cms],[data-cms-html],[data-e],[data-e-texto],[data-e-img],[data-cms-attr]");
      if (el) {
        const campo = el.dataset.cms || el.dataset.cmsHtml || (el.dataset.cmsAttr || "").split(/\s+/)[0].split(":")[0] || (el.hasAttribute("data-e-texto") ? "e:texto" : el.hasAttribute("data-e-img") ? "e:img" : "e:" + el.dataset.e);
        parent.postMessage({ tipo: "eterna-cms-clic", campo }, location.origin);
      }
      if (ev.target.closest("a")) ev.preventDefault();
    }, true);
    addEventListener("message", (ev) => {
      if (ev.origin !== location.origin || ev.source !== parent || !ev.data || ev.data.tipo !== "eterna-cms-vista") return;
      if (ev.data.bloques) aplicarBloques(ev.data.bloques);
      if (ev.data.entrada) aplicarEntradas([ev.data.entrada], false);
    });
    parent.postMessage({ tipo: "eterna-cms-listo" }, location.origin);
  }

  if (vista) iniciarVista();
  if (conectado) iniciar();
})();
