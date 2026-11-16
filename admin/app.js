import { configurado, sb, sesion, h, vaciar, $, confirmar } from "./nucleo.js";
import { pantallaAcceso, pantallaNuevaClave, pantallaSinAcceso, estructura, vistaDashboard, vistaEntradas, vistaEntrada, vistaBloque, vistaMedios, vistaUsuarios, limpiar, contexto } from "./vistas.js";

const raiz = $("#raiz");
let marco = null, recuperando = false, escuchando = false;

async function salir() {
  limpiar(); await sb.auth.signOut();
  sesion.usuario = sesion.perfil = null; mostrarAcceso();
}
const mostrarAcceso = (mensaje) => pantallaAcceso(raiz, { alIngresar: entrar, mensaje });

async function entrar() {
  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) { mostrarAcceso(); return; }
  sesion.usuario = user;
  const { data: perfil } = await sb.from("admin_profiles").select("user_id,email,role,active").eq("user_id", user.id).maybeSingle();
  if (!perfil || !perfil.active) {
    pantallaSinAcceso(raiz, "Tu cuenta existe, pero todavía no tiene permiso para usar el panel. Pide al superadministrador que te dé acceso.", salir);
    return;
  }
  sesion.perfil = perfil;
  marco = estructura(raiz, { alSalir: salir });
  if (!escuchando) { addEventListener("hashchange", dibujar); document.addEventListener("click", protegerSalida, true); escuchando = true; }
  if (!location.hash) history.replaceState(null, "", "#/");
  dibujar();
}

// Si hay cambios sin guardar, pregunta antes de cambiar de pantalla
async function protegerSalida(ev) {
  const a = ev.target.closest?.('a[href^="#/"]');
  if (!a || !contexto.sucio) return;
  ev.preventDefault(); ev.stopImmediatePropagation();
  if (await confirmar({ titulo: "Cambios sin guardar", texto: "Si sales ahora perderás los cambios que no guardaste como borrador.", ok: "Salir sin guardar", peligro: true })) { contexto.sucio = false; location.hash = a.getAttribute("href"); }
}

async function dibujar() {
  if (!sesion.perfil || !marco) return;
  limpiar();
  const [ruta, qs] = (location.hash || "#/").split("?");
  const params = new URLSearchParams(qs || "");
  // Cada pantalla se dibuja en su propio contenedor: si el usuario cambia de sección mientras otra aún carga,
  // la que quedó atrás escribe en un nodo descartado y no pisa a la actual.
  const cont = h("div", { class: "vista-actual" });
  marco.contenido.replaceChildren(cont);
  marco.marcarActivo(ruta);
  let m;
  try {
    if (ruta === "#/" || ruta === "#") await vistaDashboard(cont);
    else if ((m = ruta.match(/^#\/entradas\/(protocolo|consulta)$/))) await vistaEntradas(cont, m[1], params);
    else if ((m = ruta.match(/^#\/entrada\/([0-9a-f-]{36})$/))) await vistaEntrada(cont, m[1]);
    else if ((m = ruta.match(/^#\/sitio\/([a-z_]+)$/))) await vistaBloque(cont, m[1], params);
    else if (ruta === "#/medios") await vistaMedios(cont);
    else if (ruta === "#/usuarios") await vistaUsuarios(cont);
    else { vaciar(cont).append(h("h1", {}, "Página no encontrada"), h("a", { class: "btn", href: "#/" }, "Ir al dashboard")); }
  } catch (e) {
    console.error(e);
    vaciar(cont).append(h("h1", {}, "No se pudo cargar"), h("p", { class: "ayuda" }, e?.code === "42501" || e?.status === 401 ? "Tu sesión expiró o no tienes permiso. Vuelve a entrar." : "Revisa tu conexión e inténtalo de nuevo."),
      h("button", { class: "btn btn--primario", type: "button", onclick: dibujar }, "Reintentar"));
  }
  scrollTo(0, 0);
}

async function arrancar() {
  if (!configurado) {
    raiz.append(h("main", { class: "acceso" }, h("div", { class: "acceso__marco" }, h("h1", {}, "Falta conectar ", h("em", {}, "Supabase")),
      h("p", { class: "acceso__sub" }, "Abre cms-config.js en la raíz del sitio y escribe la URL y la clave pública (anon) de tu proyecto. Los pasos están en docs/CMS.md."))));
    return;
  }
  sb.auth.onAuthStateChange((evento) => {
    if (evento === "PASSWORD_RECOVERY") { recuperando = true; pantallaNuevaClave(raiz, { alTerminar: () => { recuperando = false; entrar(); } }); }
    if (evento === "SIGNED_OUT" && !sesion.perfil) mostrarAcceso();
  });
  const { data: { session } } = await sb.auth.getSession();
  if (recuperando) return;
  if (session) await entrar(); else mostrarAcceso();
}
arrancar();
