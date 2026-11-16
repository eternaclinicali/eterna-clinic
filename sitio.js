let WHATSAPP = "573117467618";
const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;
const enlaceWhatsApp = (mensaje) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`;

function conectarWhatsApp() {
  document.querySelectorAll("[data-mensaje]").forEach((a) => {
    a.href = enlaceWhatsApp(a.dataset.mensaje);
    a.target = "_blank";
    a.rel = "noopener";
  });
}

// El panel puede cambiar el número; cms.js llama a estas dos funciones
window.eternaWhatsApp = (numero) => { WHATSAPP = numero; conectarWhatsApp(); };
window.eternaConectarWhatsApp = () => conectarWhatsApp();

function recordarEntrada() {
  try { sessionStorage.setItem("eterna-entrada", "1"); } catch {}
}

function prepararMenu() {
  const boton = document.querySelector(".menu-boton");
  const menu = document.getElementById("menu-movil");
  const alternar = (abrir) => {
    boton.setAttribute("aria-expanded", abrir);
    boton.setAttribute("aria-label", abrir ? "Cerrar menú" : "Abrir menú");
    menu.classList.toggle("abierto", abrir);
    document.body.style.overflow = abrir ? "hidden" : "";
  };
  boton.addEventListener("click", () => alternar(boton.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) alternar(false); });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("abierto")) { alternar(false); boton.focus(); }
  });
}

function vigilarScroll() {
  const encabezado = document.getElementById("encabezado");
  const barra = document.getElementById("barra");
  const portada = document.querySelector(".portada");
  const marcar = () => encabezado.classList.toggle("con-fondo", scrollY > 20);
  addEventListener("scroll", marcar, { passive: true });
  marcar();
  if (portada) new IntersectionObserver(([e]) => barra.classList.toggle("visible", !e.isIntersecting), { rootMargin: "-90px 0px 0px 0px" }).observe(portada);
}

function revelarAlDesplazar() {
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("visible");
      observador.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".revelar, .cortina").forEach((el) => observador.observe(el));
}

function prepararBrujula() {
  const opciones = document.getElementById("opciones");
  if (!opciones) return;
  const respuesta = document.getElementById("respuesta");
  const caminos = JSON.parse(document.getElementById("caminos").textContent);
  const mostrar = (i, animar = true) => {
    const c = caminos[i];
    opciones.querySelectorAll(".opcion").forEach((b) => b.setAttribute("aria-pressed", b.dataset.i == i));
    respuesta.innerHTML = `
      <img src="${c.img}" alt="" loading="lazy" decoding="async">
      <div>
        <span class="etiqueta">Tu camino sugerido</span>
        <h3>Para <em>${c.etiqueta.toLowerCase()}</em>: ${c.nombre}</h3>
        <p>${c.texto}</p>
        <div class="meta"><span>${c.duracion}</span><span>${c.modalidad}</span></div>
        <div class="respuesta__acciones">
          <a class="boton boton--oro" href="${enlaceWhatsApp(`Hola, quiero recuperar ${c.etiqueta.toLowerCase()} y me interesa ${c.nombre}. ¿Me ayudan a agendar?`)}" target="_blank" rel="noopener">Agendar ${c.nombre}</a>
          <a class="boton boton--linea" href="${c.url}">Ver ${c.nombre}</a>
        </div>
      </div>`;
    if (!animar) return;
    respuesta.classList.remove("cambio");
    void respuesta.offsetWidth;
    respuesta.classList.add("cambio");
  };
  opciones.addEventListener("click", (e) => {
    const b = e.target.closest(".opcion");
    if (b) mostrar(Number(b.dataset.i));
  });
  window.eternaCaminos = { caminos, mostrar };
  mostrar(0, false);
}

function prepararBoletin() {
  const form = document.getElementById("boletin");
  if (!form) return;
  const error = document.getElementById("b-error");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const telefono = document.getElementById("b-telefono").value.trim();
    const promos = document.getElementById("b-promos");
    const politica = document.getElementById("b-politica");
    const ok = telefono && promos.checked && politica.checked;
    error.classList.toggle("visible", !ok);
    if (!ok) {
      (!telefono ? document.getElementById("b-telefono") : !promos.checked ? promos : politica).focus();
      return;
    }
    const nombre = document.getElementById("b-nombre").value.trim();
    const correo = document.getElementById("b-correo").value.trim();
    const mensaje = [
      "Hola, quiero suscribirme al boletín de Eterna Clinic.",
      nombre && `Nombre: ${nombre}`,
      `Teléfono: ${telefono}`,
      correo && `Email: ${correo}`,
      "Acepto recibir información y la política de privacidad.",
    ].filter(Boolean).join("\n");
    window.open(enlaceWhatsApp(mensaje), "_blank", "noopener");
  });
}

recordarEntrada();
conectarWhatsApp();
prepararMenu();
vigilarScroll();
revelarAlDesplazar();
prepararBrujula();
prepararBoletin();
