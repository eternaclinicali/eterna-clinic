/* Panel de Eterna Clinic · núcleo: conexión, ayudas de interfaz y llamadas al servidor.
   Todo lo que viene de la base de datos se pinta con textContent / h(): nunca se inserta como HTML. */
const cfg = window.ETERNA_CMS || {};
export const configurado = Boolean(cfg.url && cfg.key);
export const sb = configurado
  ? window.supabase.createClient(cfg.url, cfg.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" } })
  : null;
export const urlStorage = (ruta) => `${cfg.url}/storage/v1/object/public/media/${ruta}`;
export const origenCms = configurado ? new URL(cfg.url).origin : "";

export const sesion = { usuario: null, perfil: null };
export const esSuper = () => sesion.perfil?.role === "superadmin";

// ───────── Construcción de DOM ─────────
export function h(tag, props = {}, ...hijos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "dataset") Object.assign(el.dataset, v);
    else if (k in el && k !== "for" && k !== "list") { try { el[k] = v; } catch { el.setAttribute(k, v); } }
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of hijos.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}
export const vaciar = (el) => { while (el.firstChild) el.firstChild.remove(); return el; };
// Vacía el contenedor y le pone hijos, ignorando null/false (Node.append(null) escribiría la palabra "null").
export const montar = (el, ...hijos) => { vaciar(el); hijos.flat(Infinity).forEach((c) => c != null && c !== false && el.append(c.nodeType ? c : document.createTextNode(String(c)))); return el; };
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function slugify(t) {
  return String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}
export const fecha = (iso) => iso ? new Date(iso).toLocaleString("es-CO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
export const igual = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

// ───────── Avisos ─────────
let zonaAvisos;
export function aviso(texto, tipo = "ok") {
  zonaAvisos ??= document.body.appendChild(h("div", { class: "avisos", role: "status", "aria-live": "polite" }));
  const a = h("div", { class: `aviso aviso--${tipo}` }, texto);
  zonaAvisos.append(a);
  setTimeout(() => a.remove(), tipo === "error" ? 7000 : 3500);
}

// ───────── Ventanas ─────────
export function ventana({ titulo, cuerpo, acciones = [], ancha = false }) {
  const previo = document.activeElement;
  const fondo = h("div", { class: "velo" });
  const caja = h("div", { class: `ventana${ancha ? " ventana--ancha" : ""}`, role: "dialog", "aria-modal": "true", "aria-label": titulo, tabindex: "-1" },
    h("header", { class: "ventana__cab" }, h("h2", {}, titulo), h("button", { class: "btn-icono", type: "button", "aria-label": "Cerrar", onclick: () => cerrar() }, "×")),
    h("div", { class: "ventana__cuerpo" }, cuerpo),
    acciones.length ? h("footer", { class: "ventana__pie" }, acciones) : null);
  fondo.append(caja);
  const cerrar = (valor) => { document.removeEventListener("keydown", teclas, true); fondo.remove(); previo?.focus?.(); resolver?.(valor); };
  let resolver;
  const teclas = (e) => {
    if (e.key === "Escape") { e.stopPropagation(); cerrar(); }
    if (e.key === "Tab") {
      const f = $$('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', caja).filter((x) => !x.disabled && x.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
      else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
    }
  };
  document.addEventListener("keydown", teclas, true);
  document.body.append(fondo);
  (caja.querySelector("input,textarea,select") || caja.querySelector(".btn--primario") || caja).focus();
  const promesa = new Promise((r) => (resolver = r));
  return { cerrar, promesa, caja };
}

export function confirmar({ titulo, texto, ok = "Confirmar", peligro = false, entrada = null }) {
  let campo = null;
  const cuerpo = [h("p", {}, texto)];
  if (entrada) { campo = h("input", { type: "text", placeholder: entrada.placeholder || "", "aria-label": entrada.etiqueta, autocomplete: "off" }); cuerpo.push(h("label", { class: "campo" }, h("span", {}, entrada.etiqueta), campo)); }
  const v = ventana({ titulo, cuerpo, acciones: [
    h("button", { class: "btn", type: "button", onclick: () => v.cerrar(false) }, "Cancelar"),
    h("button", { class: `btn ${peligro ? "btn--peligro" : "btn--primario"}`, type: "button", onclick: () => v.cerrar(campo ? campo.value : true) }, ok),
  ] });
  return v.promesa.then((r) => r || false);
}

// ───────── Errores legibles ─────────
export function mensajeError(e) {
  const m = String(e?.message || e || "");
  if (e?.code === "23505" || /duplicate key/i.test(m)) return "Ya existe un elemento con esa dirección (slug). Elige otra.";
  if (e?.code === "23514" || /violates check constraint/i.test(m)) return "Algún valor no es válido (la dirección solo admite minúsculas, números y guiones).";
  if (e?.code === "42501" || /permission denied|row-level security/i.test(m)) return "No tienes permiso para hacer esto.";
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.";
  if (/Invalid login credentials/i.test(m)) return "Correo o contraseña incorrectos.";
  if (/Email not confirmed/i.test(m)) return "Aún no has confirmado tu correo. Revisa tu bandeja de entrada.";
  if (/rate limit|too many/i.test(m)) return "Demasiados intentos. Espera unos minutos.";
  // Los mensajes que escribimos en las funciones SQL ya están en español y son seguros de mostrar.
  if (e?.code === "P0001" && m) return m;
  return "No se pudo completar la acción. Inténtalo de nuevo.";
}

export async function rpc(nombre, args = {}) {
  const { data, error } = await sb.rpc(nombre, args);
  if (error) throw error;
  return data;
}
export async function leer(consulta) {
  const { data, error } = await consulta;
  if (error) throw error;
  return data;
}
export async function seguro(fn, exito) {
  try { const r = await fn(); if (exito) aviso(exito); return r; }
  catch (e) { aviso(mensajeError(e), "error"); return undefined; }
}

// ───────── Imágenes: validar, redimensionar y convertir a WebP antes de subir ─────────
const TIPOS = ["image/jpeg", "image/png", "image/webp"];
export async function prepararImagen(archivo) {
  if (!TIPOS.includes(archivo.type)) throw new Error("Solo se aceptan imágenes JPG, PNG o WebP.");
  if (archivo.size > 15 * 1024 * 1024) throw new Error("La imagen pesa más de 15 MB.");
  const bmp = await createImageBitmap(archivo).catch(() => { throw new Error("No se pudo leer la imagen."); });
  if (bmp.width < 600 || bmp.height < 400) throw new Error("La imagen es muy pequeña (mínimo 600 × 400 px).");
  const k = Math.min(1, 1600 / bmp.width);
  const w = Math.round(bmp.width * k), hgt = Math.round(bmp.height * k);   // se respeta la proporción: nunca se deforma
  const lienzo = document.createElement("canvas"); lienzo.width = w; lienzo.height = hgt;
  lienzo.getContext("2d").drawImage(bmp, 0, 0, w, hgt);
  let blob;
  for (const q of [0.84, 0.74, 0.62]) {
    blob = await new Promise((r) => lienzo.toBlob(r, "image/webp", q));
    if (blob && blob.size <= 1.9 * 1024 * 1024) break;
  }
  if (!blob || blob.type !== "image/webp") throw new Error("Tu navegador no pudo convertir la imagen a WebP.");
  if (blob.size > 2 * 1024 * 1024) throw new Error("La imagen sigue pesando más de 2 MB tras optimizarla. Usa una más pequeña.");
  return { blob, width: w, height: hgt };
}
