import { sb, sesion, esSuper, h, vaciar, montar, $, $$, slugify, fecha, igual, aviso, ventana, confirmar, rpc, leer, seguro, mensajeError, prepararImagen, urlStorage, origenCms } from "./nucleo.js";
import { BLOQUES, ENTRADAS, CAMPOS_ENTRADA, ESTADOS, describir, entradaVacia } from "./esquemas.js";

export const contexto = { sucio: false };   // true mientras haya cambios sin guardar en un editor
const ir = (ruta) => { location.hash = ruta; };
const chip = (texto, clase = "gris") => h("span", { class: `chip chip--${clase}` }, texto);
const esqueleto = () => h("div", { class: "esqueleto", "aria-hidden": "true" }, h("i"), h("i"), h("i"));
const hoy = (iso) => (iso ? fecha(iso) : "—");

// ───────── Datos ─────────
async function entradasDe(kind) {
  const filas = await leer(sb.from("entries").select("id,kind,slug,sort,status,published,published_at,updated_at").eq("kind", kind).order("sort", { ascending: true }));
  const borradores = await leer(sb.from("drafts").select("ref,data,updated_at").eq("scope", "entrada").in("ref", filas.map((f) => f.id)));
  const mapa = new Map(borradores.map((b) => [b.ref, b]));
  return filas.map((f) => ({ ...f, borrador: mapa.get(f.id)?.data ?? null, borrador_en: mapa.get(f.id)?.updated_at ?? null }));
}
async function bloquesTodos() {
  const filas = await leer(sb.from("site_content").select("key,published,published_at,updated_at"));
  const bs = await leer(sb.from("drafts").select("ref,data,updated_at").eq("scope", "sitio"));
  const mapa = new Map(bs.map((b) => [b.ref, b]));
  return filas.map((f) => ({ ...f, borrador: mapa.get(f.key)?.data ?? null, borrador_en: mapa.get(f.key)?.updated_at ?? null }));
}
const pendiente = (x) => x.borrador && !igual(x.borrador, x.published);
const datosVista = (e) => e.borrador || e.published || {};

// ───────── Acceso ─────────
export function pantallaAcceso(raiz, { alIngresar, mensaje }) {
  vaciar(raiz);
  const error = h("p", { class: "form__error", role: "alert" }, mensaje || "");
  const correo = h("input", { id: "a-correo", type: "email", autocomplete: "username", required: true });
  const clave = h("input", { id: "a-clave", type: "password", autocomplete: "current-password", required: true });
  const boton = h("button", { class: "btn btn--primario btn--ancho", type: "submit" }, "Entrar");
  const olvide = h("button", { class: "enlace-btn", type: "button", onclick: async () => {
    if (!correo.value.trim()) { error.textContent = "Escribe tu correo arriba y vuelve a pulsar “¿Olvidaste tu contraseña?”."; correo.focus(); return; }
    const { error: e } = await sb.auth.resetPasswordForEmail(correo.value.trim(), { redirectTo: `${location.origin}/admin/` });
    error.textContent = e ? mensajeError(e) : "Si ese correo tiene acceso, te enviamos un enlace para crear una contraseña nueva.";
  } }, "¿Olvidaste tu contraseña?");
  const form = h("form", { class: "acceso__form", novalidate: true, onsubmit: async (ev) => {
    ev.preventDefault(); error.textContent = "";
    if (!correo.value.trim() || !clave.value) { error.textContent = "Escribe tu correo y tu contraseña."; return; }
    boton.disabled = true; boton.textContent = "Entrando…";
    const { error: e } = await sb.auth.signInWithPassword({ email: correo.value.trim(), password: clave.value });
    boton.disabled = false; boton.textContent = "Entrar";
    if (e) { error.textContent = mensajeError(e); clave.value = ""; clave.focus(); return; }
    clave.value = ""; alIngresar();
  } },
    h("label", { class: "campo", for: "a-correo" }, h("span", {}, "Correo"), correo),
    h("label", { class: "campo", for: "a-clave" }, h("span", {}, "Contraseña"), clave),
    error, boton, olvide);
  raiz.append(h("main", { class: "acceso" },
    h("div", { class: "acceso__marco" },
      h("img", { class: "acceso__logo", src: "/img/logo-eterna.webp", alt: "", width: 72, height: 74 }),
      h("h1", {}, "Panel de ", h("em", {}, "Eterna Clinic")),
      h("p", { class: "acceso__sub" }, "Acceso para el equipo autorizado."),
      form)));
  correo.focus();
}

export function pantallaNuevaClave(raiz, { alTerminar }) {
  vaciar(raiz);
  const error = h("p", { class: "form__error", role: "alert" });
  const a = h("input", { id: "n-1", type: "password", autocomplete: "new-password", minlength: 10, required: true });
  const b = h("input", { id: "n-2", type: "password", autocomplete: "new-password", minlength: 10, required: true });
  raiz.append(h("main", { class: "acceso" }, h("div", { class: "acceso__marco" },
    h("img", { class: "acceso__logo", src: "/img/logo-eterna.webp", alt: "", width: 72, height: 74 }),
    h("h1", {}, "Crea tu ", h("em", {}, "contraseña")),
    h("p", { class: "acceso__sub" }, "Mínimo 10 caracteres."),
    h("form", { class: "acceso__form", novalidate: true, onsubmit: async (ev) => {
      ev.preventDefault(); error.textContent = "";
      if (a.value.length < 10) { error.textContent = "La contraseña debe tener al menos 10 caracteres."; return; }
      if (a.value !== b.value) { error.textContent = "Las dos contraseñas no coinciden."; return; }
      const { error: e } = await sb.auth.updateUser({ password: a.value });
      if (e) { error.textContent = mensajeError(e); return; }
      aviso("Contraseña actualizada"); alTerminar();
    } },
      h("label", { class: "campo", for: "n-1" }, h("span", {}, "Contraseña nueva"), a),
      h("label", { class: "campo", for: "n-2" }, h("span", {}, "Repite la contraseña"), b),
      error, h("button", { class: "btn btn--primario btn--ancho", type: "submit" }, "Guardar contraseña")))));
  a.focus();
}

export function pantallaSinAcceso(raiz, texto, alSalir) {
  vaciar(raiz);
  raiz.append(h("main", { class: "acceso" }, h("div", { class: "acceso__marco" },
    h("img", { class: "acceso__logo", src: "/img/logo-eterna.webp", alt: "", width: 72, height: 74 }),
    h("h1", {}, "Sin ", h("em", {}, "acceso")), h("p", { class: "acceso__sub" }, texto),
    h("button", { class: "btn btn--primario btn--ancho", type: "button", onclick: alSalir }, "Cerrar sesión"))));
}

// ───────── Estructura: menú lateral y barra ─────────
const MENU = [
  ["#/", "Dashboard"],
  ["#/sitio/inicio", "Página de inicio"],
  ["#/entradas/consulta", "Consultas"],
  ["#/entradas/protocolo", "Protocolos"],
  ["#/sitio/detox", "Detox ERA"],
  ["#/sitio/nosotros", "Sobre nosotros"],
  ["#/medios", "Biblioteca multimedia"],
  ["#/sitio/ajustes", "Ajustes del sitio"],
];
export function estructura(raiz, { alSalir }) {
  vaciar(raiz);
  const menu = MENU.concat(esSuper() ? [["#/usuarios", "Usuarios"]] : []);
  const nav = h("nav", { class: "nav", id: "nav", "aria-label": "Secciones del panel" }, menu.map(([href, txt]) => h("a", { href }, txt)));
  const abrir = h("button", { class: "btn-icono barra__menu", type: "button", "aria-expanded": "false", "aria-controls": "lateral", "aria-label": "Abrir menú", onclick: () => alternar() }, h("span"));
  const lateral = h("aside", { class: "lateral", id: "lateral" },
    h("a", { class: "lateral__marca", href: "#/" }, h("img", { src: "/img/logo-eterna.webp", alt: "", width: 34, height: 35 }), h("span", {}, h("strong", {}, "ETERNA"), h("small", {}, "Panel de contenido"))), nav,
    h("a", { class: "lateral__sitio", href: "/", target: "_blank", rel: "noopener" }, "Ver el sitio ↗"));
  const alternar = (v) => { const a = v ?? !lateral.classList.contains("abierto"); lateral.classList.toggle("abierto", a); abrir.setAttribute("aria-expanded", a); abrir.setAttribute("aria-label", a ? "Cerrar menú" : "Abrir menú"); };
  lateral.addEventListener("click", (e) => { if (e.target.closest("a")) alternar(false); });
  const contenido = h("main", { class: "principal", id: "contenido", tabindex: "-1" });
  raiz.append(h("div", { class: "app" }, lateral,
    h("div", { class: "cuerpo" },
      h("header", { class: "barra" }, abrir, h("span", { class: "barra__espacio" }),
        h("span", { class: "barra__usuario" }, sesion.usuario.email, " ", chip(esSuper() ? "Superadministrador" : "Editor", esSuper() ? "ok" : "gris")),
        h("button", { class: "btn btn--suave", type: "button", onclick: alSalir }, "Cerrar sesión")),
      contenido)));
  return { contenido, marcarActivo: (hash) => $$("a", nav).forEach((a) => { const act = hash === a.getAttribute("href") || (a.getAttribute("href") !== "#/" && hash.startsWith(a.getAttribute("href"))); act ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"); }) };
}

const titulo = (texto, ...acciones) => h("div", { class: "pagina__cab" }, h("h1", {}, texto), h("div", { class: "pagina__acciones" }, acciones));

// ───────── Dashboard ─────────
export async function vistaDashboard(cont) {
  vaciar(cont); cont.append(titulo("Dashboard"), esqueleto());
  const [protos, consultas, bloques, medios] = await Promise.all([entradasDe("protocolo"), entradasDe("consulta"), bloquesTodos(), leer(sb.from("media_assets").select("id"))]);
  const todas = [...protos.map((e) => ({ ...e, tipo: "protocolo" })), ...consultas.map((e) => ({ ...e, tipo: "consulta" }))];
  const cuenta = (l, f) => l.filter(f).length;
  const dato = (n, txt, href) => h("a", { class: "dato", href }, h("strong", {}, String(n)), h("span", {}, txt));
  const pend = [...todas.filter((e) => e.status !== "archivado" && (pendiente(e) || e.status === "borrador")).map((e) => ({ nombre: datosVista(e).nombre || e.slug, tipo: ENTRADAS[e.tipo].singular, href: `#/entrada/${e.id}`, nota: e.status === "borrador" && !e.published ? "Nuevo, sin publicar" : e.status === "borrador" ? "Despublicado" : "Cambios sin publicar" })),
    ...bloques.filter(pendiente).map((b) => ({ nombre: BLOQUES[b.key]?.titulo || b.key, tipo: "página", href: `#/sitio/${b.key}`, nota: "Cambios sin publicar" }))];
  const buscador = h("input", { type: "search", id: "buscar", placeholder: "Buscar protocolos, consultas o páginas…", "aria-label": "Buscar contenido" });
  const resultados = h("ul", { class: "lista-simple", id: "resultados" });
  const indice = [...todas.map((e) => ({ t: datosVista(e).nombre || e.slug, tipo: ENTRADAS[e.tipo].singular, href: `#/entrada/${e.id}`, estado: ESTADOS[e.status] })), ...bloques.map((b) => ({ t: BLOQUES[b.key]?.titulo || b.key, tipo: "página", href: `#/sitio/${b.key}`, estado: "" }))];
  const pintar = () => {
    const q = buscador.value.trim().toLowerCase(); vaciar(resultados);
    const r = q ? indice.filter((i) => i.t.toLowerCase().includes(q)) : [];
    if (q && !r.length) resultados.append(h("li", { class: "vacio" }, "No encontramos nada con ese nombre."));
    r.forEach((i) => resultados.append(h("li", {}, h("a", { href: i.href }, i.t), h("small", {}, `${i.tipo}${i.estado ? " · " + i.estado : ""}`))));
  };
  buscador.addEventListener("input", pintar);
  const buscarEn = (slug) => todas.find((e) => e.slug === slug);
  const rapida = (txt, href, sub) => h("a", { class: "rapida", href }, h("strong", {}, txt), h("span", {}, sub));
  montar(cont, titulo("Dashboard"),
    h("div", { class: "datos" },
      dato(cuenta(protos, (e) => e.status === "publicado"), "protocolos publicados", "#/entradas/protocolo"),
      dato(cuenta(consultas, (e) => e.status === "publicado"), "consultas publicadas", "#/entradas/consulta"),
      dato(pend.length, "con cambios pendientes", "#/"),
      dato(medios.length, "imágenes en la biblioteca", "#/medios")),
    h("section", { class: "bloque" }, h("h2", {}, "Buscar"), buscador, resultados),
    h("section", { class: "bloque" }, h("h2", {}, "Accesos rápidos"),
      h("div", { class: "rapidas" },
        rapida("Nuevo protocolo", "#/entradas/protocolo?nuevo=1", "Crear y publicar un protocolo"),
        buscarEn("eterna-travel") && rapida("Eterna Travel", `#/entrada/${buscarEn("eterna-travel").id}`, "Fotos, textos y botones"),
        buscarEn("eterna-en-casa") && rapida("Eterna en Casa", `#/entrada/${buscarEn("eterna-en-casa").id}`, "Fotos, textos y botones"),
        rapida("Textos de inicio", "#/sitio/inicio", "Portada, servicios y presentación"),
        rapida("Biblioteca multimedia", "#/medios", "Subir y reemplazar fotografías"))),
    h("section", { class: "bloque" }, h("h2", {}, "Pendientes de publicar"),
      pend.length ? h("ul", { class: "lista-simple" }, pend.map((p) => h("li", {}, h("a", { href: p.href }, p.nombre), h("small", {}, `${p.tipo} · ${p.nota}`)))) : h("p", { class: "vacio" }, "Todo lo que editaste ya está publicado.")),
    esSuper() ? h("section", { class: "bloque" }, h("h2", {}, "Copia de seguridad"),
      h("p", { class: "ayuda" }, "Descarga todo el contenido (publicado, borradores e historial) en un archivo. Guárdalo en un lugar seguro, por ejemplo cada mes o antes de cambios grandes."),
      h("button", { class: "btn", type: "button", onclick: respaldo }, "Descargar copia (JSON)")) : null);
}

async function respaldo() {
  await seguro(async () => {
    const t = async (n, cols = "*") => leer(sb.from(n).select(cols));
    const datos = { generado: new Date().toISOString(), version: 1, entries: await t("entries"), site_content: await t("site_content"), drafts: await t("drafts"), content_revisions: await t("content_revisions"), media_assets: await t("media_assets") };
    const a = h("a", { href: URL.createObjectURL(new Blob([JSON.stringify(datos, null, 1)], { type: "application/json" })), download: `eterna-respaldo-${new Date().toISOString().slice(0, 10)}.json` });
    document.body.append(a); a.click(); a.remove();
  }, "Copia descargada");
}

// ───────── Campos de formulario ─────────
let contadorId = 0;
function campo({ id, etiqueta, ayuda, control, max }) {
  const idc = id || `c${++contadorId}`;
  control.id = idc;
  const cuenta = max ? h("small", { class: "campo__cuenta", "aria-hidden": "true" }) : null;
  if (cuenta) { const upd = () => (cuenta.textContent = `${control.value.length}/${max}`); control.addEventListener("input", upd); upd(); }
  return h("div", { class: "campo" }, h("label", { for: idc }, h("span", {}, etiqueta), cuenta), control, ayuda ? h("small", { class: "campo__ayuda" }, ayuda) : null);
}

function controlTexto(def, valor, cambio) {
  const largo = def.tipo === "largo" || def.tipo === "html";
  const c = h(largo ? "textarea" : "input", largo ? { rows: def.tipo === "html" ? 2 : 3 } : { type: def.tipo === "email" ? "email" : def.tipo === "url" ? "url" : def.tipo === "whatsapp" ? "text" : "text", inputmode: def.tipo === "whatsapp" ? "numeric" : null });
  if (def.max) c.maxLength = def.max;
  c.value = valor ?? "";
  c.addEventListener("input", () => cambio(c.value));
  return c;
}

function controlImagen(valor, alt, cambio, { conAlt = false } = {}) {
  const mini = h("img", { class: "imagen-campo__mini", src: valor || "", alt: "" });
  const nombre = h("small", { class: "imagen-campo__ruta" }, valor || "Sin imagen");
  const boton = h("button", { class: "btn", type: "button", onclick: async () => {
    const r = await selectorImagen(); if (!r) return;
    mini.src = r.url; nombre.textContent = r.url; cambio(r.url, r.alt);
  } }, "Cambiar imagen");
  boton.dataset.foco = "1";
  return h("div", { class: "imagen-campo" }, mini, h("div", {}, boton, nombre));
}

function controlParrafos(lista, cambio) {
  const caja = h("div", { class: "parrafos" });
  let datos = lista.length ? [...lista] : [""];
  const pintar = () => {
    vaciar(caja);
    datos.forEach((p, i) => {
      const t = h("textarea", { rows: 4, "aria-label": `Párrafo ${i + 1}` }); t.value = p;
      t.addEventListener("input", () => { datos[i] = t.value; cambio([...datos]); });
      caja.append(h("div", { class: "parrafo" }, t, h("div", { class: "parrafo__acc" },
        h("button", { class: "btn-icono", type: "button", "aria-label": `Subir párrafo ${i + 1}`, disabled: i === 0, onclick: () => { [datos[i - 1], datos[i]] = [datos[i], datos[i - 1]]; cambio([...datos]); pintar(); } }, "↑"),
        h("button", { class: "btn-icono", type: "button", "aria-label": `Bajar párrafo ${i + 1}`, disabled: i === datos.length - 1, onclick: () => { [datos[i + 1], datos[i]] = [datos[i], datos[i + 1]]; cambio([...datos]); pintar(); } }, "↓"),
        h("button", { class: "btn-icono btn-icono--peligro", type: "button", "aria-label": `Quitar párrafo ${i + 1}`, disabled: datos.length === 1, onclick: () => { datos.splice(i, 1); cambio([...datos]); pintar(); } }, "×"))));
    });
    caja.append(h("button", { class: "btn btn--suave", type: "button", onclick: () => { datos.push(""); cambio([...datos]); pintar(); caja.querySelectorAll("textarea").item(datos.length - 1).focus(); } }, "+ Añadir párrafo"));
  };
  pintar();
  return caja;
}

// ───────── Panel de vista previa (iframe del mismo sitio, solo dentro del panel) ─────────
function panelVista({ url, mensaje, alClic }) {
  const marco = h("iframe", { class: "vista__marco", src: url, title: "Vista previa de la página" });
  const caja = h("section", { class: "vista", "aria-label": "Vista previa" },
    h("div", { class: "vista__barra" }, h("strong", {}, "Vista previa"),
      h("span", { class: "vista__modos" },
        h("button", { class: "btn btn--suave", type: "button", "aria-pressed": "true", onclick: (e) => modo(e, false) }, "Escritorio"),
        h("button", { class: "btn btn--suave", type: "button", "aria-pressed": "false", onclick: (e) => modo(e, true) }, "Celular"))),
    h("p", { class: "ayuda ayuda--vista" }, "Haz clic en un texto o foto de la página para editarlo."), marco);
  function modo(e, movil) { caja.classList.toggle("vista--movil", movil); $$(".vista__modos button", caja).forEach((b) => b.setAttribute("aria-pressed", String(b === e.currentTarget))); }
  let listo = false, t;
  const enviar = () => { if (listo) marco.contentWindow.postMessage({ tipo: "eterna-cms-vista", ...mensaje() }, location.origin); };
  const programar = () => { clearTimeout(t); t = setTimeout(enviar, 120); };
  const escuchar = (ev) => {
    if (ev.origin !== location.origin || ev.source !== marco.contentWindow || !ev.data) return;
    if (ev.data.tipo === "eterna-cms-listo") { listo = true; enviar(); }
    if (ev.data.tipo === "eterna-cms-clic") alClic?.(String(ev.data.campo || ""));
  };
  addEventListener("message", escuchar);
  return { caja, actualizar: programar, destruir: () => removeEventListener("message", escuchar) };
}

let limpiezas = [];
export const limpiar = () => { limpiezas.forEach((f) => f()); limpiezas = []; contexto.sucio = false; };
addEventListener("beforeunload", (e) => { if (contexto.sucio) { e.preventDefault(); e.returnValue = ""; } });

function enfocar(id) {
  const el = document.getElementById(id); if (!el) return;
  el.scrollIntoView({ block: "center", behavior: "smooth" });
  (el.matches("input,textarea") ? el : el.querySelector("[data-foco],textarea,input"))?.focus({ preventScroll: true });
  el.closest(".campo,.imagen-campo")?.classList.add("destello"); setTimeout(() => el.closest(".campo,.imagen-campo")?.classList.remove("destello"), 1400);
}

// ───────── Listado de protocolos / consultas ─────────
export async function vistaEntradas(cont, kind, parametros) {
  const def = ENTRADAS[kind];
  montar(cont, titulo(def.plural), esqueleto());
  const lista = await entradasDe(kind);
  const recargar = () => vistaEntradas(cont, kind, new URLSearchParams());
  const accion = async (fn, ok) => { if (await seguro(fn, ok) !== undefined) recargar(); };
  const nueva = () => {
    const nombre = h("input", { type: "text", maxLength: 60, "aria-label": "Nombre", placeholder: "Ejemplo: Renueva" });
    const slug = h("input", { type: "text", maxLength: 60, "aria-label": "Dirección web", placeholder: "renueva" });
    let tocado = false; slug.addEventListener("input", () => (tocado = true));
    nombre.addEventListener("input", () => { if (!tocado) slug.value = slugify(nombre.value); });
    const v = ventana({ titulo: def.nuevo, cuerpo: [
      h("label", { class: "campo" }, h("span", {}, "Nombre"), nombre),
      h("label", { class: "campo" }, h("span", {}, "Dirección web"), slug, h("small", { class: "campo__ayuda" }, `Quedará en /${def.seccion}/${slug.value || "…"}/ y no se podrá cambiar después de publicar.`))],
    acciones: [h("button", { class: "btn", type: "button", onclick: () => v.cerrar() }, "Cancelar"),
      h("button", { class: "btn btn--primario", type: "button", onclick: async () => {
        const s = slugify(slug.value); if (!nombre.value.trim() || !s) { aviso("Escribe el nombre y la dirección web.", "error"); return; }
        const id = await seguro(() => rpc("crear_entrada", { p_kind: kind, p_slug: s, p_data: entradaVacia(nombre.value.trim()) }));
        if (id) { v.cerrar(); ir(`#/entrada/${id}`); }
      } }, "Crear borrador")] });
  };
  const mover = (i, d) => { const ids = lista.map((e) => e.id); [ids[i], ids[i + d]] = [ids[i + d], ids[i]]; accion(() => rpc("reordenar_entradas", { p_kind: kind, p_ids: ids }), "Orden actualizado"); };
  const filas = lista.map((e, i) => {
    const d = datosVista(e), cambios = pendiente(e);
    const btn = (txt, fn, clase = "") => h("button", { class: `btn btn--suave ${clase}`, type: "button", onclick: fn }, txt);
    return h("li", { class: `fila${e.status === "archivado" ? " fila--apagada" : ""}` },
      h("img", { class: "fila__img", src: d.img || "", alt: "", loading: "lazy" }),
      h("div", { class: "fila__texto" }, h("a", { class: "fila__titulo", href: `#/entrada/${e.id}` }, d.nombre || e.slug),
        h("small", {}, `/${def.seccion}/${e.slug}/ · Modificado ${hoy(e.borrador_en || e.updated_at)}`),
        h("span", { class: "fila__chips" }, chip(ESTADOS[e.status], e.status === "publicado" ? "ok" : e.status === "borrador" ? "aviso" : "gris"), cambios && e.published ? chip("Cambios sin publicar", "aviso") : null)),
      h("div", { class: "fila__orden" }, esSuper() ? [h("button", { class: "btn-icono", type: "button", "aria-label": `Subir ${d.nombre}`, disabled: i === 0, onclick: () => mover(i, -1) }, "↑"), h("button", { class: "btn-icono", type: "button", "aria-label": `Bajar ${d.nombre}`, disabled: i === lista.length - 1, onclick: () => mover(i, 1) }, "↓")] : null),
      h("div", { class: "fila__acciones" },
        h("a", { class: "btn btn--suave", href: `#/entrada/${e.id}` }, "Editar"),
        btn("Duplicar", () => accion(async () => { const id = await rpc("duplicar_entrada", { p_id: e.id }); ir(`#/entrada/${id}`); }, "Copia creada")),
        esSuper() && e.status === "publicado" ? btn("Despublicar", async () => { if (await confirmar({ titulo: "Despublicar", texto: `“${d.nombre}” dejará de verse en el sitio. Su dirección mostrará “contenido no disponible”.`, ok: "Despublicar" })) accion(() => rpc("cambiar_estado", { p_id: e.id, p_estado: "borrador" }), "Despublicado"); }) : null,
        esSuper() && e.status !== "archivado" ? btn("Archivar", () => accion(() => rpc("cambiar_estado", { p_id: e.id, p_estado: "archivado" }), "Archivado")) : null,
        esSuper() && e.status === "archivado" ? btn("Desarchivar", () => accion(() => rpc("cambiar_estado", { p_id: e.id, p_estado: "borrador" }), "Pasó a borrador")) : null,
        esSuper() ? btn("Eliminar", async () => {
          const ok = await confirmar({ titulo: "Eliminar para siempre", peligro: true, ok: "Eliminar", texto: `Se borrará “${d.nombre}” con su borrador e historial. ${e.published ? "Estaba publicado: su dirección dejará de funcionar. " : ""}No se puede deshacer. Para confirmar escribe el nombre de la dirección:`, entrada: { etiqueta: `Escribe “${e.slug}”`, placeholder: e.slug } });
          if (ok === e.slug) accion(() => rpc("eliminar_entrada", { p_id: e.id }), "Eliminado"); else if (ok) aviso("No coincide; no se eliminó nada.", "error");
        }, "btn--peligro-suave") : null));
  });
  montar(cont, titulo(def.plural, h("button", { class: "btn btn--primario", type: "button", onclick: nueva }, `+ ${def.nuevo}`)),
    h("p", { class: "ayuda" }, esSuper() ? "Lo que publiques aparece al instante en el sitio, con el mismo diseño. El orden de esta lista es el orden del sitio." : "Puedes crear y editar borradores. El superadministrador revisa y publica."),
    lista.length ? h("ul", { class: "filas" }, filas) : h("p", { class: "vacio" }, `Aún no hay ${def.plural.toLowerCase()}. Crea el primero con el botón de arriba.`));
  if (parametros?.get("nuevo")) { history.replaceState(null, "", `#/entradas/${kind}`); nueva(); }
}

// ───────── Editor de un protocolo / consulta ─────────
export async function vistaEntrada(cont, id) {
  montar(cont, esqueleto());
  const e = (await leer(sb.from("entries").select("id,kind,slug,sort,status,published,published_at,updated_at").eq("id", id)))[0];
  if (!e) { montar(cont, titulo("No encontrado"), h("p", { class: "vacio" }, "Ese elemento no existe o fue eliminado."), h("a", { class: "btn", href: "#/" }, "Volver")); return; }
  const dr = (await leer(sb.from("drafts").select("data,updated_at").eq("scope", "entrada").eq("ref", id)))[0];
  const def = ENTRADAS[e.kind];
  let datos = structuredClone(dr?.data || e.published || entradaVacia(e.slug));
  let guardado = structuredClone(datos), publicado = e.published, estado = e.status;
  const estadoTxt = h("span", { class: "barra-editor__estado", role: "status" });
  const botGuardar = h("button", { class: "btn btn--primario", type: "button", onclick: () => guardar() }, "Guardar borrador");
  const botPublicar = esSuper() ? h("button", { class: "btn btn--oro", type: "button", onclick: () => publicarAhora() }, estado === "publicado" ? "Publicar cambios" : "Publicar") : null;
  const vista = panelVista({
    url: `/_cms/${e.kind}/index.html?cms-preview=1&slug=${encodeURIComponent(e.slug)}`,
    mensaje: () => ({ entrada: { kind: e.kind, slug: e.slug, sort: e.sort, data: datos } }),
    alClic: (c) => { const m = { "e:linea1": "nombre", "e:linea2": "nombre", "e:nombre": "nombre", "e:pregunta": "pregunta", "e:duracion": "duracion", "e:modalidad": "modalidad", "e:texto": "texto", "e:img": "img" }[c]; if (m) enfocar(`f-${m}`); },
  });
  limpiezas.push(vista.destruir);
  const marcar = () => {
    const sucio = !igual(datos, guardado); contexto.sucio = sucio;
    const sinPublicar = publicado && !igual(guardado, publicado);
    estadoTxt.textContent = sucio ? "Hay cambios sin guardar" : estado !== "publicado" ? (publicado ? "Despublicado" : "Borrador, aún sin publicar") : sinPublicar ? "Guardado · hay cambios sin publicar" : "Publicado y al día";
    estadoTxt.dataset.estado = sucio ? "sucio" : sinPublicar || estado !== "publicado" ? "pendiente" : "ok";
    botGuardar.disabled = !sucio;
  };
  const cambio = (k, v) => { datos[k] = v; marcar(); vista.actualizar(); };
  const form = h("form", { class: "editor__form", novalidate: true, onsubmit: (ev) => { ev.preventDefault(); guardar(); } });
  CAMPOS_ENTRADA.forEach((def2) => {
    let ctl;
    if (def2.tipo === "imagen") { ctl = controlImagen(datos.img, "", (u) => cambio("img", u)); form.append(h("div", { class: "campo", id: "f-img" }, h("span", { class: "campo__t" }, def2.etiqueta), ctl, h("small", { class: "campo__ayuda" }, def2.ayuda))); return; }
    if (def2.tipo === "parrafos") { ctl = controlParrafos(datos.texto || [], (v) => cambio("texto", v)); form.append(h("div", { class: "campo", id: "f-texto" }, h("span", { class: "campo__t" }, def2.etiqueta), ctl, h("small", { class: "campo__ayuda" }, def2.ayuda))); return; }
    ctl = controlTexto(def2, datos[def2.campo], (v) => cambio(def2.campo, v));
    form.append(campo({ id: `f-${def2.campo}`, etiqueta: def2.etiqueta + (def2.requerido ? " *" : ""), ayuda: def2.ayuda, control: ctl, max: def2.max }));
  });
  async function guardar() {
    if (!String(datos.nombre || "").trim()) { aviso("Escribe el nombre antes de guardar.", "error"); enfocar("f-nombre"); return false; }
    const ok = await seguro(() => rpc("guardar_borrador", { p_scope: "entrada", p_ref: id, p_data: datos }));
    if (ok === undefined) return false;
    guardado = structuredClone(datos); marcar(); aviso("Borrador guardado"); return true;
  }
  function faltantes() {
    const f = CAMPOS_ENTRADA.filter((c) => c.requerido && !String(datos[c.campo] || "").trim()).map((c) => c.etiqueta);
    if (!(datos.texto || []).some((p) => String(p).trim())) f.push("Descripción completa");
    return f;
  }
  async function publicarAhora() {
    const f = faltantes(); if (f.length) { aviso(`Antes de publicar completa: ${f.join(", ")}.`, "error"); return; }
    const nota = h("input", { type: "text", maxLength: 120, placeholder: "Ejemplo: corregí la duración", "aria-label": "Nota del cambio" });
    const v = ventana({ titulo: "Publicar en el sitio", cuerpo: [h("p", {}, estado === "publicado" ? "Los cambios se verán de inmediato en el sitio. La versión actual queda guardada en el historial." : `“${datos.nombre}” aparecerá en /${def.seccion}/ y tendrá su propia página.`), h("label", { class: "campo" }, h("span", {}, "Nota (opcional)"), nota)],
      acciones: [h("button", { class: "btn", type: "button", onclick: () => v.cerrar(false) }, "Cancelar"), h("button", { class: "btn btn--oro", type: "button", onclick: () => v.cerrar(true) }, "Publicar ahora")] });
    if (!(await v.promesa)) return;
    if (!igual(datos, guardado) && !(await guardar())) return;
    if (await seguro(() => rpc("publicar", { p_scope: "entrada", p_ref: id, p_nota: nota.value.trim() || null }), "Publicado en el sitio") === undefined) return;
    publicado = structuredClone(datos); estado = "publicado"; botPublicar.textContent = "Publicar cambios"; marcar();
  }
  async function historial() {
    const revs = await seguro(() => leer(sb.from("content_revisions").select("id,created_at,nota,data").eq("scope", "entrada").eq("ref", id).order("created_at", { ascending: false })));
    if (!revs) return;
    const cuerpo = revs.length ? h("ul", { class: "lista-simple" }, revs.map((r) => h("li", {}, h("span", {}, h("strong", {}, fecha(r.created_at)), r.nota ? ` · ${r.nota}` : "", h("br"), h("small", {}, r.data.nombre || "")),
      h("button", { class: "btn btn--suave", type: "button", onclick: async () => {
        if (contexto.sucio && !(await confirmar({ titulo: "Restaurar versión", texto: "Tienes cambios sin guardar; se reemplazarán por esta versión.", ok: "Restaurar" }))) return;
        if (await seguro(() => rpc("restaurar_revision", { p_id: r.id }), "Versión cargada como borrador. Revísala y publícala si es correcta.") !== undefined) { v.cerrar(); contexto.sucio = false; vistaEntrada(cont, id); }
      } }, "Restaurar como borrador")))) : h("p", { class: "vacio" }, "Aún no hay versiones: se crean cada vez que se publica.");
    const v = ventana({ titulo: "Historial de versiones", cuerpo: cuerpo, ancha: true });
  }
  montar(cont, 
    titulo(datos.nombre || e.slug, h("button", { class: "btn", type: "button", onclick: historial }, "Historial"), estado === "publicado" ? h("a", { class: "btn", href: `/${def.seccion}/${e.slug}/`, target: "_blank", rel: "noopener" }, "Ver en el sitio ↗") : null),
    h("p", { class: "migas-panel" }, h("a", { href: `#/entradas/${e.kind}` }, def.plural), " / ", e.slug),
    h("div", { class: "barra-editor" }, estadoTxt, h("span", { class: "barra-editor__acc" }, botGuardar, botPublicar, esSuper() ? null : h("small", {}, "El superadministrador publica."))),
    h("div", { class: "editor" }, form, vista.caja));
  marcar();
  addEventListener("keydown", atajo); limpiezas.push(() => removeEventListener("keydown", atajo));
  function atajo(ev) { if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "s") { ev.preventDefault(); if (!botGuardar.disabled) guardar(); } }
}

// ───────── Editor de bloques de página (textos, imágenes, ajustes) ─────────
export async function vistaBloque(cont, clave, parametros) {
  const meta = BLOQUES[clave];
  if (!meta) { montar(cont, titulo("No encontrado")); return; }
  montar(cont, titulo(meta.titulo), esqueleto());
  const fila = (await leer(sb.from("site_content").select("key,published,published_at,updated_at").eq("key", clave)))[0];
  if (!fila) { montar(cont, titulo(meta.titulo), h("p", { class: "vacio" }, "Este bloque aún no se cargó en la base de datos. Ejecuta supabase/seed.sql (ver docs/CMS.md).")); return; }
  const dr = (await leer(sb.from("drafts").select("data,updated_at").eq("scope", "sitio").eq("ref", clave)))[0];
  let datos = structuredClone(dr?.data || fila.published || {}), guardado = structuredClone(datos), publicado = fila.published;
  const estadoTxt = h("span", { class: "barra-editor__estado", role: "status" });
  const botGuardar = h("button", { class: "btn btn--primario", type: "button", onclick: () => guardar() }, "Guardar borrador");
  const botPublicar = esSuper() ? h("button", { class: "btn btn--oro", type: "button", onclick: () => publicarAhora() }, "Publicar cambios") : null;
  const vista = panelVista({ url: `${meta.pagina}?cms-preview=1`, mensaje: () => ({ bloques: { [clave]: datos } }),
    alClic: (c) => { const [b, ...r] = c.split("."); const campoNombre = r.join("."); if (!campoNombre || c.startsWith("e:")) return; if (b === clave) enfocar(`f-${campoNombre}`); else if (BLOQUES[b]) ir(`#/sitio/${b}?foco=${campoNombre}`); } });
  limpiezas.push(vista.destruir);
  const marcar = () => {
    const sucio = !igual(datos, guardado); contexto.sucio = sucio;
    const sinPublicar = !igual(guardado, publicado);
    estadoTxt.textContent = sucio ? "Hay cambios sin guardar" : sinPublicar ? "Guardado · hay cambios sin publicar" : "Publicado y al día";
    estadoTxt.dataset.estado = sucio ? "sucio" : sinPublicar ? "pendiente" : "ok"; botGuardar.disabled = !sucio;
  };
  const cambio = (k, v) => { datos[k] = v; marcar(); vista.actualizar(); };
  const claves = [...new Set([...Object.keys(datos), ...Object.keys(publicado || {})])];
  const grupos = new Map();
  claves.forEach((k) => { const d = describir(clave, k, datos[k] ?? publicado?.[k]); if (d.tipo === "alt") return; (grupos.get(d.grupo) || grupos.set(d.grupo, []).get(d.grupo)).push(d); });
  const form = h("form", { class: "editor__form", novalidate: true, onsubmit: (ev) => { ev.preventDefault(); guardar(); } });
  grupos.forEach((campos, nombre) => {
    const fs = h("fieldset", { class: "grupo" }, h("legend", {}, nombre));
    campos.forEach((d) => {
      const valor = datos[d.campo];
      if (d.tipo === "bool") { const c = h("input", { type: "checkbox", id: `f-${d.campo}`, checked: valor !== false }); c.addEventListener("change", () => cambio(d.campo, c.checked)); fs.append(h("label", { class: "interruptor", for: `f-${d.campo}` }, c, h("span", {}, d.etiqueta))); return; }
      if (d.tipo === "imagen") {
        const altClave = d.campo.replace(/img$/, "alt").replace(/^foto$/, "foto_alt"), tieneAlt = altClave in datos;
        const ctl = controlImagen(valor, datos[altClave], (u, alt) => { cambio(d.campo, u); if (tieneAlt && alt) { datos[altClave] = alt; const i = document.getElementById(`f-${altClave}`); if (i) i.value = alt; marcar(); } });
        fs.append(h("div", { class: "campo", id: `f-${d.campo}` }, h("span", { class: "campo__t" }, d.etiqueta), ctl));
        if (tieneAlt) fs.append(campo({ id: `f-${altClave}`, etiqueta: "Descripción de la imagen (para accesibilidad)", control: controlTexto({ tipo: "texto" }, datos[altClave], (v) => cambio(altClave, v)) }));
        return;
      }
      fs.append(campo({ id: `f-${d.campo}`, etiqueta: d.etiqueta, ayuda: d.tipo === "html" ? "Para la parte dorada en cursiva escribe <em>así</em>. También puedes usar <br> para un salto de línea." : d.tipo === "whatsapp" ? "Solo números con el indicativo del país. Ejemplo: 573117467618" : d.tipo === "url" ? "Enlace completo, empezando por https://" : null, control: controlTexto(d, valor, (v) => cambio(d.campo, v)) }));
    });
    form.append(fs);
  });
  async function guardar() {
    const wa = datos.whatsapp; if (wa !== undefined && !/^\d{8,15}$/.test(String(wa))) { aviso("El número de WhatsApp debe tener solo números (8 a 15 dígitos).", "error"); enfocar("f-whatsapp"); return false; }
    const mal = Object.entries(datos).find(([k, v]) => describir(clave, k, v).tipo === "url" && v && !/^(https?:\/\/|mailto:|\/)/.test(String(v)));
    if (mal) { aviso(`El enlace “${describir(clave, mal[0], mal[1]).etiqueta}” debe empezar por https://`, "error"); enfocar(`f-${mal[0]}`); return false; }
    if (await seguro(() => rpc("guardar_borrador", { p_scope: "sitio", p_ref: clave, p_data: datos })) === undefined) return false;
    guardado = structuredClone(datos); marcar(); aviso("Borrador guardado"); return true;
  }
  async function publicarAhora() {
    const v = ventana({ titulo: "Publicar en el sitio", cuerpo: [h("p", {}, `Los cambios de “${meta.titulo}” se verán de inmediato. La versión actual queda guardada en el historial.`)],
      acciones: [h("button", { class: "btn", type: "button", onclick: () => v.cerrar(false) }, "Cancelar"), h("button", { class: "btn btn--oro", type: "button", onclick: () => v.cerrar(true) }, "Publicar ahora")] });
    if (!(await v.promesa)) return;
    if (!igual(datos, guardado) && !(await guardar())) return;
    if (await seguro(() => rpc("publicar", { p_scope: "sitio", p_ref: clave, p_nota: null }), "Publicado en el sitio") === undefined) return;
    publicado = structuredClone(datos); marcar();
  }
  async function historial() {
    const revs = await seguro(() => leer(sb.from("content_revisions").select("id,created_at,nota").eq("scope", "sitio").eq("ref", clave).order("created_at", { ascending: false })));
    if (!revs) return;
    const v = ventana({ titulo: "Historial de versiones", ancha: true, cuerpo: revs.length ? h("ul", { class: "lista-simple" }, revs.map((r) => h("li", {}, h("span", {}, h("strong", {}, fecha(r.created_at)), r.nota ? ` · ${r.nota}` : ""),
      h("button", { class: "btn btn--suave", type: "button", onclick: async () => {
        if (contexto.sucio && !(await confirmar({ titulo: "Restaurar versión", texto: "Tienes cambios sin guardar; se reemplazarán por esta versión.", ok: "Restaurar" }))) return;
        if (await seguro(() => rpc("restaurar_revision", { p_id: r.id }), "Versión cargada como borrador. Revísala y publícala si es correcta.") !== undefined) { v.cerrar(); contexto.sucio = false; vistaBloque(cont, clave, new URLSearchParams()); }
      } }, "Restaurar como borrador")))) : h("p", { class: "vacio" }, "Aún no hay versiones.") });
  }
  montar(cont, titulo(meta.titulo, h("button", { class: "btn", type: "button", onclick: historial }, "Historial")), h("p", { class: "ayuda" }, meta.descripcion),
    h("div", { class: "barra-editor" }, estadoTxt, h("span", { class: "barra-editor__acc" }, botGuardar, botPublicar, esSuper() ? null : h("small", {}, "El superadministrador publica."))),
    h("div", { class: "editor" }, form, vista.caja));
  marcar();
  addEventListener("keydown", atajo); limpiezas.push(() => removeEventListener("keydown", atajo));
  function atajo(ev) { if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "s") { ev.preventDefault(); if (!botGuardar.disabled) guardar(); } }
  const foco = parametros?.get("foco"); if (foco) setTimeout(() => enfocar(`f-${foco}`), 400);
}

// ───────── Biblioteca multimedia ─────────
const kb = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

async function subir(archivo, alt) {
  const { blob, width, height } = await prepararImagen(archivo);
  const ruta = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.webp`;
  const { error } = await sb.storage.from("media").upload(ruta, blob, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (error) throw error;
  const fila = { url: urlStorage(ruta), storage_path: ruta, alt, width, height, bytes: blob.size, mime: "image/webp", created_by: sesion.usuario.id };
  const { data, error: e2 } = await sb.from("media_assets").insert(fila).select().single();
  if (e2) { await sb.storage.from("media").remove([ruta]); throw e2; }
  return data;
}

function dialogoSubida() {
  return new Promise((resolver) => {
    const archivo = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp", "aria-label": "Archivo de imagen" });
    const alt = h("input", { type: "text", maxLength: 140, placeholder: "Ejemplo: Recepción de Eterna Clinic con sofá blanco", "aria-label": "Descripción de la imagen" });
    const info = h("p", { class: "ayuda" }, "JPG, PNG o WebP. Se optimiza solo (WebP, máximo 1600 px de ancho) sin deformarla.");
    const subirBtn = h("button", { class: "btn btn--primario", type: "button", onclick: async () => {
      if (!archivo.files[0]) { aviso("Elige una imagen.", "error"); return; }
      if (!alt.value.trim()) { aviso("Escribe una descripción breve de la imagen (accesibilidad).", "error"); alt.focus(); return; }
      subirBtn.disabled = true; subirBtn.textContent = "Subiendo…";
      try { const m = await subir(archivo.files[0], alt.value.trim()); aviso("Imagen subida"); v.cerrar(m); }
      catch (e) { aviso(e.message && !e.code ? e.message : mensajeError(e), "error"); subirBtn.disabled = false; subirBtn.textContent = "Subir"; }
    } }, "Subir");
    const v = ventana({ titulo: "Subir imagen", cuerpo: [info, h("label", { class: "campo" }, h("span", {}, "Archivo"), archivo), h("label", { class: "campo" }, h("span", {}, "Descripción (alt)"), alt)],
      acciones: [h("button", { class: "btn", type: "button", onclick: () => v.cerrar(null) }, "Cancelar"), subirBtn] });
    v.promesa.then((r) => resolver(r || null));
  });
}

async function cuadriculaMedios({ alElegir }) {
  const todos = await leer(sb.from("media_assets").select("id,url,storage_path,alt,width,height,bytes,created_at").order("created_at", { ascending: false }));
  const buscar = h("input", { type: "search", placeholder: "Buscar por descripción o nombre…", "aria-label": "Buscar imágenes" });
  const rej = h("ul", { class: "rejilla-medios" });
  const caja = h("div", {}, h("div", { class: "medios__barra" }, buscar, h("button", { class: "btn btn--primario", type: "button", onclick: async () => { const m = await dialogoSubida(); if (m) { todos.unshift(m); pintar(); } } }, "+ Subir imagen")), rej);
  async function uso(m) {
    const filas = await seguro(() => rpc("media_uso", { p_url: m.url })); if (!filas) return;
    ventana({ titulo: "¿Dónde se usa?", cuerpo: filas.length ? h("ul", { class: "lista-simple" }, filas.map((f) => h("li", {}, h("a", { href: f.scope === "entrada" ? `#/entrada/${f.ref}` : `#/sitio/${f.ref}`, onclick: () => document.querySelector(".velo")?.remove() }, BLOQUES[f.titulo]?.titulo || f.titulo), h("small", {}, `${f.scope === "entrada" ? "protocolo o consulta" : "página"} · ${f.estado}`)))) : h("p", { class: "vacio" }, "Esta imagen no está en uso.") });
  }
  async function borrar(m) {
    if (!(await confirmar({ titulo: "Eliminar imagen", texto: "Se eliminará del almacenamiento. Si está en uso en contenido publicado o en un borrador, el sistema lo impedirá.", ok: "Eliminar", peligro: true }))) return;
    const ruta = await seguro(() => rpc("eliminar_media", { p_id: m.id })); if (!ruta) return;
    await sb.storage.from("media").remove([ruta]); todos.splice(todos.indexOf(m), 1); pintar(); aviso("Imagen eliminada");
  }
  function pintar() {
    vaciar(rej); const q = buscar.value.trim().toLowerCase();
    const lista = todos.filter((m) => !q || m.alt.toLowerCase().includes(q) || m.url.toLowerCase().includes(q));
    if (!lista.length) rej.append(h("li", { class: "vacio" }, q ? "No hay imágenes con ese texto." : "Aún no hay imágenes."));
    lista.forEach((m) => {
      const alt = h("input", { type: "text", value: m.alt, maxLength: 140, "aria-label": `Descripción de ${m.alt}` });
      alt.addEventListener("change", async () => { if (await seguro(async () => { const { error } = await sb.from("media_assets").update({ alt: alt.value.trim() }).eq("id", m.id); if (error) throw error; m.alt = alt.value.trim(); }, "Descripción guardada") === undefined) alt.value = m.alt; });
      rej.append(h("li", { class: "medio" },
        alElegir ? h("button", { class: "medio__img", type: "button", "aria-label": `Elegir ${m.alt}`, onclick: () => alElegir(m) }, h("img", { src: m.url, alt: "", loading: "lazy" })) : h("div", { class: "medio__img" }, h("img", { src: m.url, alt: "", loading: "lazy" })),
        h("small", {}, `${m.width ? `${m.width}×${m.height} · ` : ""}${m.bytes ? kb(m.bytes) : ""}${m.storage_path ? "" : " · del sitio"}`),
        alElegir ? h("span", { class: "medio__alt" }, m.alt) : [alt, h("div", { class: "medio__acc" }, h("button", { class: "btn btn--suave", type: "button", onclick: () => uso(m) }, "¿Dónde se usa?"), m.storage_path ? h("button", { class: "btn btn--suave btn--peligro-suave", type: "button", onclick: () => borrar(m) }, "Eliminar") : null)]));
    });
  }
  buscar.addEventListener("input", pintar); pintar();
  return caja;
}

export async function vistaMedios(cont) {
  montar(cont, titulo("Biblioteca multimedia"), esqueleto());
  const c = await cuadriculaMedios({});
  montar(cont, titulo("Biblioteca multimedia"), h("p", { class: "ayuda" }, "Sube fotografías nuevas y elige cuál usar en cada protocolo, consulta o página. Las imágenes originales del sitio no se eliminan desde aquí."), c);
}

async function selectorImagen() {
  const caja = h("div", {}, h("p", { class: "ayuda" }, "Cargando…"));
  const v = ventana({ titulo: "Elegir imagen", cuerpo: caja, ancha: true });
  try {
    const c = await cuadriculaMedios({ alElegir: (m) => v.cerrar(m) });
    vaciar(caja).append(c);
  } catch (e) { vaciar(caja).append(h("p", { class: "form__error" }, mensajeError(e))); }
  return v.promesa;
}

// ───────── Usuarios ─────────
export async function vistaUsuarios(cont) {
  if (!esSuper()) { montar(cont, titulo("Usuarios"), h("p", { class: "vacio" }, "Solo el superadministrador administra usuarios.")); return; }
  montar(cont, titulo("Usuarios"), esqueleto());
  const perfiles = await leer(sb.from("admin_profiles").select("user_id,email,role,active,created_at").order("created_at", { ascending: true }));
  const recargar = () => vistaUsuarios(cont);
  const filas = perfiles.map((p) => {
    const yo = p.user_id === sesion.usuario.id;
    const rol = h("select", { "aria-label": `Rol de ${p.email}`, disabled: yo }, h("option", { value: "editor" }, "Editor"), h("option", { value: "superadmin" }, "Superadministrador")); rol.value = p.role;
    const act = h("input", { type: "checkbox", checked: p.active, disabled: yo, "aria-label": `Activo: ${p.email}` });
    return h("li", { class: "fila fila--usuario" }, h("div", { class: "fila__texto" }, h("strong", {}, p.email, yo ? " (tú)" : ""), h("small", {}, `Desde ${hoy(p.created_at)}`)),
      rol, h("label", { class: "interruptor" }, act, h("span", {}, "Activo")),
      yo ? h("small", {}, "No puedes cambiar tu propio rol") : h("button", { class: "btn btn--suave", type: "button", onclick: async () => { if (await seguro(() => rpc("cambiar_admin", { p_user: p.user_id, p_rol: rol.value, p_activo: act.checked }), "Usuario actualizado") !== undefined) recargar(); } }, "Guardar"));
  });
  const correo = h("input", { type: "email", placeholder: "correo@ejemplo.com", "aria-label": "Correo del nuevo usuario", autocomplete: "off" });
  const rolNuevo = h("select", { "aria-label": "Rol" }, h("option", { value: "editor" }, "Editor"), h("option", { value: "superadmin" }, "Superadministrador"));
  montar(cont, titulo("Usuarios"),
    h("p", { class: "ayuda" }, "Los editores crean y editan borradores. Solo los superadministradores publican y administran usuarios. No hay registro público: cada persona debe ser invitada."),
    h("ul", { class: "filas" }, filas),
    h("section", { class: "bloque" }, h("h2", {}, "Dar acceso a una persona"),
      h("ol", { class: "pasos" }, h("li", {}, "En Supabase → Authentication → Users → Invite user, invita a su correo. Ella recibe el enlace y crea su contraseña."), h("li", {}, "Vuelve aquí, escribe el mismo correo y elige su rol.")),
      h("div", { class: "agregar" }, correo, rolNuevo, h("button", { class: "btn btn--primario", type: "button", onclick: async () => { if (!correo.value.trim()) { aviso("Escribe el correo.", "error"); return; } if (await seguro(() => rpc("agregar_admin", { p_email: correo.value.trim(), p_rol: rolNuevo.value }), "Acceso concedido") !== undefined) recargar(); } }, "Dar acceso"))));
}
