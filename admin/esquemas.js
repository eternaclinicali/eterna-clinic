/* Qué se puede editar en cada bloque del sitio y cómo se llama en pantalla.
   Los campos reales salen del contenido migrado (site_content); aquí solo se les da nombre y tipo. */
export const BLOQUES = {
  inicio:           { titulo: "Página de inicio",  pagina: "/",             descripcion: "Portada, servicios, “¿Qué quieres recuperar?” y presentación de los médicos." },
  detox:            { titulo: "Detox ERA",          pagina: "/detox-era/",   descripcion: "Página del programa Detox ERA." },
  nosotros:         { titulo: "Sobre nosotros",     pagina: "/nosotros/",    descripcion: "Historia de los médicos fundadores." },
  consultas_pagina: { titulo: "Portada de Consultas",  pagina: "/consultas/",  descripcion: "Título, imagen e introducción de la página Consultas." },
  protocolos_pagina:{ titulo: "Portada de Protocolos", pagina: "/protocolos/", descripcion: "Título, imagen e introducción de la página Protocolos." },
  ajustes:          { titulo: "Ajustes del sitio",  pagina: "/",             descripcion: "Contacto, WhatsApp, redes sociales, pie de página, botones y textos que se repiten en todo el sitio." },
};

const ETIQUETAS = {
  titulo1: "Título · primera línea", titulo2: "Título · segunda línea (en dorado)", pregunta: "Frase bajo el título", portada_img: "Imagen de portada", portada_alt: "Descripción de la imagen de portada",
  seo_titulo: "Título para Google", seo_descripcion: "Descripción para Google", whatsapp: "Número de WhatsApp", telefono: "Teléfono (como se muestra)", email: "Correo electrónico",
  instagram: "Instagram (enlace)", facebook: "Facebook (enlace)", tiktok: "TikTok (enlace)", catalogo: "Catálogo de WhatsApp (enlace)", politica_url: "Política de privacidad (enlace)", terminos_url: "Términos y condiciones (enlace)",
  boton_reserva: "Botón de reserva (barra superior e inferior)", cta_titulo: "Cierre de página · título", cta_texto: "Cierre de página · texto", cta_boton: "Cierre de página · botón",
  lema: "Lema del pie de página", pie_descripcion: "Descripción en el pie de página", direccion_corta: "Dirección corta (pie)", direccion: "Dirección completa (contacto)", horario_corto: "Horario corto", horario: "Horario completo",
  donde_corto: "Lugar corto (fichas)", contacto_titulo: "Título de la sección Contacto", nota_pie: "Nota legal del pie (déjala vacía para ocultarla)",
  mostrar_boletin: "Mostrar formulario del boletín", mostrar_mapa: "Mostrar mapa", mostrar_recuperar: "Mostrar “¿Qué quieres recuperar?”", mostrar_nosotros: "Mostrar presentación de los médicos", mostrar_contacto: "Mostrar sección Contacto",
  boton_principal: "Botón principal de la portada", boton_secundario: "Botón secundario de la portada", bajada: "Texto de presentación", foto: "Foto", foto_alt: "Descripción de la foto", cita: "Frase destacada",
  ficha_titulo: "Título de la ficha", ideal: "“Ideal para”", etiqueta: "Etiqueta sobre el título", titulo_lista: "Título del listado", intro_lista: "Introducción del listado",
};
const GRUPOS = { portada: "Portada", servicios: "Servicios", servicio1: "Servicio 1", servicio2: "Servicio 2", servicio3: "Servicio 3", recuperar: "¿Qué quieres recuperar?", nosotros: "Presentación de los médicos", cifra1: "Cifra 1", cifra2: "Cifra 2",
  cta: "Cierre de página", seo: "Buscadores (SEO)", mostrar: "Secciones visibles", p1: "Texto", p2: "Texto", p3: "Texto", p4: "Texto" };

const prettify = (k) => k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

/** Describe un campo a partir de su nombre y valor actual. */
export function describir(bloque, campo, valor) {
  const k = campo;
  let tipo = "texto";
  if (typeof valor === "boolean") tipo = "bool";
  else if (/(^|_)img$|^foto$/.test(k)) tipo = "imagen";
  else if (/(^|_)alt$|^foto_alt$/.test(k)) tipo = "alt";
  else if (/^(instagram|facebook|tiktok|catalogo)$|_url$/.test(k)) tipo = "url";
  else if (k === "whatsapp") tipo = "whatsapp";
  else if (k === "email") tipo = "email";
  else if (/<(em|br)>/.test(String(valor)) || /(^|_)titulo$|^lema$|^direccion$/.test(k)) tipo = "html";
  else if (String(valor).length > 90) tipo = "largo";
  const trozos = k.split("_");
  const base = k.replace(/\d+_(img|resumen)$/, "");
  let etiqueta = ETIQUETAS[k];
  if (!etiqueta) {
    const m = k.match(/^(servicio\d)_(img|resumen)$/);
    if (m) etiqueta = m[2] === "img" ? "Imagen" : "Descripción";
    else if (/^cifra\d_numero$/.test(k)) etiqueta = "Número";
    else if (/^cifra\d_texto$/.test(k)) etiqueta = "Texto";
    else if (/^p\d$/.test(k)) etiqueta = `Párrafo ${k.slice(1)}`;
    else if (k.endsWith("_etiqueta")) etiqueta = "Etiqueta sobre el título";
    else if (k.endsWith("_titulo")) etiqueta = "Título";
    else if (k.endsWith("_intro")) etiqueta = "Introducción";
    else if (k.endsWith("_texto")) etiqueta = "Texto";
    else if (k.endsWith("_img") ) etiqueta = "Imagen";
    else if (k.endsWith("_alt")) etiqueta = "Descripción de la imagen";
    else if (k === "titulo") etiqueta = "Título";
    else etiqueta = prettify(k);
  }
  const grupoClave = /^servicio\d_/.test(k) ? k.split("_")[0] : /^cifra\d_/.test(k) ? k.split("_")[0] : /^p\d$/.test(k) ? "p1" : trozos.length > 1 ? trozos[0] : (k.startsWith("seo") ? "seo" : "general");
  const grupo = k.startsWith("seo_") ? "Buscadores (SEO)" : k.startsWith("cta_") ? "Cierre de página" : GRUPOS[grupoClave] || (grupoClave === "general" ? "Contenido" : prettify(grupoClave));
  return { campo: k, tipo, etiqueta, grupo };
}

export const ESTADOS = { publicado: "Publicado", borrador: "Borrador", archivado: "Archivado" };

/** Campos de protocolos y consultas (los mismos del diseño actual; no se inventan campos clínicos). */
export const CAMPOS_ENTRADA = [
  { campo: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true, max: 60, ayuda: "Aparece en el título de la página y en las tarjetas." },
  { campo: "img", etiqueta: "Imagen principal", tipo: "imagen", requerido: true, ayuda: "Se usa en la portada de la página y en la tarjeta. Mejor horizontal, de 1440 px de ancho." },
  { campo: "duracion", etiqueta: "Duración", tipo: "texto", requerido: true, max: 30, ayuda: "Ejemplo: 1:30 horas" },
  { campo: "modalidad", etiqueta: "Modalidad", tipo: "texto", requerido: true, max: 40, ayuda: "Ejemplo: Presencial o virtual" },
  { campo: "resumen", etiqueta: "Descripción corta (tarjeta)", tipo: "largo", requerido: true, max: 300, ayuda: "Se muestra en las tarjetas del listado." },
  { campo: "pregunta", etiqueta: "Frase bajo el título", tipo: "largo", requerido: true, max: 200 },
  { campo: "texto", etiqueta: "Descripción completa", tipo: "parrafos", ayuda: "Cada párrafo va por separado. El último se resalta cuando hay más de dos." },
  { campo: "seo_titulo", etiqueta: "Título para Google", tipo: "texto", max: 70, ayuda: "Opcional. Si lo dejas vacío se usa “Nombre | Eterna Clinic…”." },
  { campo: "seo_descripcion", etiqueta: "Descripción para Google", tipo: "largo", max: 170, ayuda: "Opcional. Si la dejas vacía se usa la descripción corta." },
];
export const ENTRADAS = {
  protocolo: { plural: "Protocolos", singular: "protocolo", seccion: "protocolos", nuevo: "Nuevo protocolo" },
  consulta:  { plural: "Consultas",  singular: "consulta",  seccion: "consultas",  nuevo: "Nueva consulta" },
};
export const entradaVacia = (nombre) => ({ nombre, img: "/img/recepcion-eterna.webp", duracion: "", modalidad: "", resumen: "", pregunta: "", texto: [""], seo_titulo: "", seo_descripcion: "" });
