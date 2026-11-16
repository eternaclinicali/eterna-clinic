"""Genera todas las páginas del sitio de Eterna Clinic a partir de los datos de abajo.

Uso: python scripts/generar.py  (desde la carpeta del proyecto)
"""
import json
from html import escape
from html.parser import HTMLParser
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
RESERVA = "Hola, vi su página web y quiero reservar una cita en Eterna Clinic."

SERVICIOS = [
    {
        "slug": "detox-era", "nombre": "Detox ERA", "img": "detox-era",
        "resumen": "El gran inicio. La verdadera puerta de entrada a tu bienestar.",
    },
    {
        "slug": "consultas", "nombre": "Consultas", "img": "sueros",
        "resumen": "Consulta médica, Eterna en Casa y Eterna Travel: tu médico, donde estés.",
    },
    {
        "slug": "protocolos", "nombre": "Protocolos", "img": "capelli-casco",
        "resumen": "Seis programas biorreguladores personalizados, porque no existen dos historias iguales.",
    },
]

CONSULTAS = [
    {
        "slug": "consulta-medica", "nombre": "Consulta médica", "img": "consulta-sillon",
        "duracion": "2 horas", "modalidad": "Presencial o virtual",
        "resumen": "Un enfoque integral que te ayuda a sanar desde la raíz, recuperar la vitalidad de tu cuerpo y prevenir enfermedades o los primeros signos de envejecimiento.",
        "pregunta": "Sana y previene desde el origen de tu enfermedad.",
        "texto": [
            "Sana y previene desde el origen de tu enfermedad, y recupera el bienestar y la vitalidad que tu cuerpo necesita.",
            "Ya sea que busques tratar una enfermedad, detener las primeras alarmas biológicas del envejecimiento o saber cómo te encuentras actualmente, es el momento de solicitar una cita.",
            "La medicina biorreguladora, el deseo de hacer cambios en ti y tu nuevo estilo de vida son el camino para tu bienestar de hoy y de mañana.",
        ],
    },
    {
        "slug": "eterna-en-casa", "nombre": "Eterna en Casa", "img": "eterna-en-casa",
        "duracion": "2 horas", "modalidad": "Presencial, en tu hogar",
        "resumen": "La atención médica que necesitas, en el lugar donde mejor te sientes, adaptada a tu tiempo y a tu estilo de vida.",
        "pregunta": "Llegar a casa es una de las mejores sensaciones del mundo.",
        "texto": [
            "Seamos honestos: llegar a casa es una de las mejores sensaciones del mundo. Sabemos que tu agenda es exigente y tu tiempo es oro; por eso, cuando se trata de tu salud, tu hogar es el mejor espacio para sanar.",
            "Llevamos la excelencia médica a tu lugar seguro. Te presentamos Eterna en Casa.",
            "Olvida el tráfico y la falta de tiempo: brindamos medicina biorreguladora personalizada en la comodidad de tu espacio.",
        ],
    },
    {
        "slug": "eterna-travel", "nombre": "Eterna Travel", "img": "eterna-travel",
        "duracion": "2 horas", "modalidad": "Virtual",
        "resumen": "Porque una emergencia de salud no debería interrumpir tu viaje ni tu trabajo. Lleva contigo a tu médico de confianza.",
        "pregunta": "Una crisis de salud lejos de casa.",
        "texto": [
            "Que un imprevisto no detenga tu ritmo laboral ni arruine tu viaje; tu agenda no puede detenerse. Una intoxicación alimentaria, un proceso viral o cualquier evento inesperado de salud son situaciones que realmente no quisieras cargar en tu maleta.",
            "Ten a tu médico de confianza en el lugar donde te encuentres, con un enfoque biorregulador. Recupera tu salud y bienestar, y sigue disfrutando del mundo.",
        ],
    },
]

PROTOCOLOS = [
    {
        "slug": "reset", "nombre": "Reset", "img": "reset", "duracion": "2 horas", "modalidad": "Presencial o virtual",
        "resumen": "¿Y si el problema no fuera tu falta de disciplina, sino un cuerpo que necesita equilibrio? Cuando tu metabolismo y tus hormonas trabajan a tu favor, todo cambia.",
        "pregunta": "¿Y si el problema no fuera tu falta de disciplina, sino un cuerpo que necesita equilibrio?",
        "texto": [
            "Si tuvieras la oportunidad de verte con el cuerpo que deseas, sentirte enérgico y disfrutar plenamente de tu alimentación de forma sostenible, ¿la tomarías?",
            "Lo has intentado todo, pero la lucha continúa. Es hora de preguntarse: ¿por qué mi esfuerzo no es suficiente?",
            "Reprogramar tu metabolismo, estabilizar tu salud hormonal, mejorar la ansiedad, el sueño y los saboteadores antojos que inflaman y desequilibran tu flora intestinal. Revitalicemos tu cuerpo para lograr ejercitarte y romper el ciclo de comida y frustración.",
            "¡Sí, es posible!",
        ],
    },
    {
        "slug": "capelli", "nombre": "Capelli", "img": "capelli", "duracion": "1:30 horas", "modalidad": "Presencial",
        "resumen": "La caída, el adelgazamiento y un cuero cabelludo más visible no siempre son genéticos: son signos de envejecimiento acelerado que se pueden frenar.",
        "pregunta": "¿Pasaste por una crisis de salud y tu cabello te pasó la factura?",
        "texto": [
            "El cuerpo priorizó la vida y es momento de recuperarlo. Esa pérdida capilar, el cabello más delgado y el cuero cabelludo más visible no son solo genética, sino un signo de envejecimiento acelerado que hay que frenar. ¿Harías algo al respecto?",
            "¡Por supuesto! Y vamos a hacerlo juntos desde la medicina biorreguladora y ortomolecular.",
            "Es momento de recuperarlo: frenar la caída y mejorar el crecimiento y la densidad capilar.",
            "¡Porque el pelo es vida y la vida hay que cuidarla!",
        ],
    },
    {
        "slug": "calma-zen", "nombre": "Calma Zen", "img": "calma-zen", "duracion": "1:30 horas", "modalidad": "Presencial",
        "resumen": "Cuando la mente libra una batalla, el cuerpo también lo siente. Calma Zen ayuda a regular la respuesta inflamatoria, estabilizar el cortisol y liberar la tensión.",
        "pregunta": "¿Por qué en momentos de estrés, si este es mental, el cuerpo duele?",
        "texto": [
            "En momentos donde la mente lucha una batalla, el cuerpo también: migrañas, tensión muscular, dificultad para dormir, sensación de cansancio y esa punzada incómoda en el pecho. ¿La reconoces?",
            "Todos atravesamos situaciones realmente retadoras; consumen nuestra energía y nos desequilibran biológicamente.",
            "Calma Zen te ayuda en momentos de crisis a regular la respuesta inflamatoria, estabilizar los niveles de cortisol y liberar la tensión muscular. Comer y dormir mejor te ayudará a despejar esa bruma mental y así tomar mejores decisiones.",
        ],
    },
    {
        "slug": "dioses", "nombre": "Dioses", "img": "dioses", "duracion": "1 hora", "modalidad": "Presencial",
        "resumen": "Un abordaje biorregulador personalizado que ayuda a recuperar el rendimiento de tu energía sexual, el deseo profundo y la fluidez en cada encuentro.",
        "pregunta": "¿Qué hacer cuando la chispa no está vibrante?",
        "texto": [
            "A veces el deseo y la capacidad vital se desvanecen; tu energía sexual y tu centro de placer entran en desconexión. No siempre somos los mismos ni siempre nos sentimos igual.",
            "El tratamiento Dioses es un protocolo biorregulador personalizado diseñado para recuperar ese performance de tu capacidad sexual.",
            "Y si es tu noche de bodas o tu luna de miel, no la vas a olvidar jamás.",
        ],
    },
    {
        "slug": "codigo-ambar", "nombre": "Código Ámbar", "img": "codigo-ambar", "duracion": "1:30 horas", "modalidad": "Presencial",
        "resumen": "Así como la resina se transforma en ámbar, preservar tu salud celular, nutrir, fortalecer y desacelerar el paso del tiempo es nuestra prioridad.",
        "pregunta": "El tiempo otorga valor a tu historia.",
        "texto": [
            "El tiempo otorga valor a tu historia, y la belleza es un destello que trasciende con los años. Cultivarla requiere de una guía experta que fortalezca su luminosidad, hidratación y firmeza.",
            "Así como la resina se transforma en su versión más radiante, el ámbar, nuestra prioridad es preservar tu salud celular.",
            "Entendemos que no existen dos historias ni dos pieles iguales; por eso, tu tratamiento es tan único como tú.",
            "Pide tu cita y contemos tu propia historia.",
        ],
    },
    {
        "slug": "elite-club", "nombre": "Elite Club", "img": "elite-club", "duracion": "1:30 horas", "modalidad": "Presencial",
        "resumen": "Un programa biorregulador diseñado para optimizar el metabolismo del atleta, mejorar la oxigenación y la recuperación celular, y prevenir la fatiga.",
        "pregunta": "¿Y qué pasaría si esa pasión tuviera fecha de caducidad?",
        "texto": [
            "Esa satisfacción cuando elevas tu cuerpo a su máximo potencial y compruebas que sí puedes lograrlo. En ese instante, cada kilómetro y cada esfuerzo cobran sentido.",
            "¿Y qué pasaría si esa pasión tuviera fecha de caducidad o tuviese que interrumpirse?",
            "Maximiza tu energía vital, recárgate celularmente y previene la fatiga, los residuos metabólicos, la inflamación o el sobreesfuerzo.",
            "Elite es un programa para acompañarte en todas las fases de tu entrenamiento y recuperación con medicina biorreguladora y ortomolecular.",
        ],
    },
]

CAMINOS = [
    ("Energía", "reset"), ("Peso", "reset"), ("Cabello", "capelli"), ("Piel", "codigo-ambar"),
    ("Calma", "calma-zen"), ("Sueño", "calma-zen"), ("Deseo", "dioses"), ("Rendimiento", "elite-club"),
    ("Depurar mi cuerpo", "detox-era"), ("Saber cómo estoy", "consulta-medica"),
]

ICONOS = """<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs><linearGradient id="oro-trazo" x1="0" x2="1"><stop offset="0" stop-color="#e9d6a8"/><stop offset=".5" stop-color="#b89b64"/><stop offset="1" stop-color="#8a6f3c"/></linearGradient></defs>
  <symbol id="i-infinito" viewBox="0 0 52 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M26 12c-4.5-6-8-9-12.5-9a9 9 0 0 0 0 18C18 21 21.5 18 26 12s8-9 12.5-9a9 9 0 0 1 0 18C34 21 30.5 18 26 12Z"/></symbol>
  <symbol id="i-whatsapp" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z"/></symbol>
  <symbol id="i-instagram" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".7" fill="currentColor"/></g></symbol>
  <symbol id="i-facebook" viewBox="0 0 24 24"><path fill="currentColor" d="M13.5 21v-7.3H16l.4-2.9h-2.9V9c0-.8.3-1.4 1.4-1.4h1.6V5.1c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2H8v2.9h2.4V21h3.1Z"/></symbol>
  <symbol id="i-tiktok" viewBox="0 0 24 24"><path fill="currentColor" d="M16.6 3c.3 2.1 1.6 3.6 3.6 3.9v3a7 7 0 0 1-3.6-1.1v6.4a5.8 5.8 0 1 1-5-5.7v3.1a2.7 2.7 0 1 0 1.9 2.6V3h3.1Z"/></symbol>
  <symbol id="i-reloj" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></g></symbol>
  <symbol id="i-lugar" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></g></symbol>
  <symbol id="i-flecha" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-5-5 5 5-5 5"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="m8 12.3 2.6 2.6L16 9.5"/></g></symbol>
</svg>"""

NAV = [("Inicio", "/"), ("Detox ERA", "/detox-era/"), ("Consultas", "/consultas/"), ("Protocolos", "/protocolos/"), ("Nosotros", "/nosotros/")]




def A(campo, html=False):
    """Marca un texto como editable desde el panel: data-cms = texto plano, data-cms-html = admite <em> y <br>."""
    return f'data-cms{"-html" if html else ""}="{campo}"'


def AT(*pares):
    """Marca atributos editables: AT(("inicio.portada_img", "src"))."""
    return 'data-cms-attr="' + " ".join(f"{c}:{a}" for c, a in pares) + '"'


def VIS(campo):
    """Sección que se puede ocultar desde el panel."""
    return f'data-cms-vis="{campo}"'


def icono(nombre):
    return f'<svg class="icono" aria-hidden="true"><use href="#i-{nombre}"/></svg>'


def etiqueta(texto, campo=None):
    t = f"<span {A(campo)}>{texto}</span>" if campo else texto
    return f'<span class="etiqueta"><svg aria-hidden="true"><use href="#i-infinito"/></svg>{t}</span>'


def boton_whatsapp(texto, mensaje, clase="boton--oro", campo=None, extra=""):
    t = f"<span {A(campo)}>{texto}</span>" if campo else texto
    extra = f" {extra}" if extra else ""
    return f'<a class="boton {clase}" data-mensaje="{escape(mensaje)}" href="https://wa.me/573117467618"{extra}>{icono("whatsapp")}{t}</a>'




def mensaje_de(nombre):
    return f"Hola, vi su página web y quiero reservar {nombre} en Eterna Clinic."


def partir_nombre(nombre, padre_nombre):
    """Título de dos líneas de las páginas de detalle (el JS del sitio repite esta misma regla)."""
    partes = nombre.split(" ", 1)
    l1, l2 = (partes[0], partes[1]) if len(partes) == 2 else (nombre, "")
    if not l2:
        l1, l2 = ("Protocolo" if padre_nombre == "Protocolos" else padre_nombre), nombre
    return l1, l2


def arco(img, alt, retraso=".2s", prioridad=False, attrs=""):
    carga = 'fetchpriority="high"' if prioridad else 'loading="lazy" decoding="async"'
    return f"""<figure class="arco" style="--retraso:{retraso}">
          <div class="arco__foto"><img src="/img/{img}.webp" alt="{escape(alt)}" {carga} {attrs}></div>
          <svg class="infinito" viewBox="0 0 520 220" aria-hidden="true">
            <path class="trazo" id="lazo" pathLength="1" d="M260 110C215 50 175 20 130 20a90 90 0 0 0 0 180c45 0 85-30 130-90s85-90 130-90a90 90 0 0 1 0 180c-45 0-85-30-130-90Z"/>
            <circle class="chispa" r="4.5"><animateMotion dur="9s" repeatCount="indefinite"><mpath href="#lazo"/></animateMotion></circle>
          </svg>
        </figure>"""


def tarjeta(item, url, i):
    return f"""<a class="tarjeta revelar" style="--d:{i}" href="{url}">
          <div class="tarjeta__foto"><img src="/img/{item['img']}.webp" alt="" loading="lazy" decoding="async"><span class="tarjeta__chip">{icono('lugar')}{item['modalidad']}</span></div>
          <div class="tarjeta__cuerpo">
            <h3>{item['nombre']}</h3>
            <p>{item['resumen']}</p>
            <div class="tarjeta__pie"><span>{icono('reloj')} {item['duracion']}</span><span class="ver">Ver más {icono('flecha')}</span></div>
          </div>
        </a>"""


def llamado(titulo, texto, mensaje=RESERVA, k="ajustes.cta", extra=""):
    return f"""<section class="seccion" aria-label="Reserva">
      <div class="llamado revelar">
        <div class="contenedor">
          <span class="llamado__logo"><img src="/img/logo-eterna.webp" alt="" width="44" height="44" loading="lazy"></span>
          <h2 {A(k + '_titulo', True)}>{titulo}</h2>
          <p {A(k + '_texto')}>{texto}</p>
          {boton_whatsapp('Reserva por WhatsApp', mensaje, campo='ajustes.cta_boton', extra=extra)}
        </div>
      </div>
    </section>"""


def pagina(ruta, titulo, descripcion, contenido, actual, imagen="recepcion-eterna", extra_head="", bloque=None, noindex=False, main_attrs=""):
    nav = "\n        ".join(
        f'<a href="{u}"{" aria-current=\"page\"" if u == actual else ""}>{n}</a>' for n, u in NAV[1:]
    )
    menu = "\n    ".join(f'<a href="{u}">{n}</a>' for n, u in NAV)
    ta = f" {A(bloque + '.seo_titulo')}" if bloque else ""
    da = f" {AT((bloque + '.seo_descripcion', 'content'))}" if bloque else ""
    robots = '  <meta name="robots" content="noindex">\n' if noindex else ""
    reservar = boton_whatsapp("Reserva ahora", RESERVA, campo="ajustes.boton_reserva")
    html = f"""<!doctype html>
<html lang="es-CO">
<head>
  <meta charset="utf-8">
  <script>document.documentElement.classList.add("js");try{{if(sessionStorage.getItem("eterna-entrada"))document.documentElement.classList.add("sin-entrada")}}catch(e){{}}</script>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="color-scheme" content="light">
{robots}  <title{ta}>{escape(titulo)}</title>
  <meta name="description" content="{escape(descripcion)}"{da}>
  <meta name="cms-whatsapp" content="573117467618" {AT(('ajustes.whatsapp', 'content'))}>
  <meta name="theme-color" content="#B6E3E5">
  <meta property="og:type" content="website">
  <meta property="og:title" content="{escape(titulo)}">
  <meta property="og:description" content="{escape(descripcion)}">
  <meta property="og:image" content="/img/{imagen}.webp">
  <link rel="icon" href="/img/icono-eterna.webp">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/estilos.css">
{extra_head}</head>
<body>
  <div class="entrada" aria-hidden="true"><img src="/img/logo-eterna.webp" alt="" width="180" height="184"></div>
  {ICONOS}

  <a class="saltar" href="#contenido">Saltar al contenido</a>

  <header class="encabezado" id="encabezado">
    <div class="contenedor encabezado__fila">
      <a class="marca" href="/" aria-label="Eterna Clinic, inicio">
        <span class="marca__sello"><img src="/img/logo-eterna.webp" alt="" width="28" height="28"></span>
        <span class="marca__texto" aria-hidden="true"><strong>ETERNA</strong><span>Clinic</span></span>
      </a>
      <nav class="navegacion" aria-label="Secciones">
        {nav}
      </nav>
      {reservar}
      <button class="menu-boton" type="button" aria-expanded="false" aria-controls="menu-movil" aria-label="Abrir menú"><span></span></button>
    </div>
  </header>

  <nav class="menu-movil" id="menu-movil" aria-label="Menú">
    {menu}
    {reservar}
  </nav>

  <main id="contenido"{main_attrs}>
{contenido}
  </main>

  <footer class="pie">
    <div class="contenedor">
      <p class="pie__lema" {A('ajustes.lema', True)}>Tu esencia, <em>por siempre.</em></p>
      <div class="pie__rejilla">
        <div>
          <a class="marca" href="/"><span class="marca__sello"><img src="/img/logo-eterna.webp" alt="" width="28" height="28" loading="lazy"></span><span class="marca__texto"><strong>ETERNA</strong><span>Clinic</span></span></a>
          <p style="margin-top:1.2rem;max-width:34ch" {A('ajustes.pie_descripcion')}>Medicina biorreguladora y ortomolecular para el antienvejecimiento, la salud y la belleza.</p>
        </div>
        <div>
          <h3>Servicios</h3>
          <p><a href="/detox-era/">Detox ERA</a></p>
          <p><a href="/consultas/">Consultas</a></p>
          <p><a href="/protocolos/">Protocolos</a></p>
          <p><a href="/nosotros/">Sobre nosotros</a></p>
        </div>
        <div>
          <h3>Visítanos</h3>
          <p {A('ajustes.direccion_corta')}>Centro Comercial Jardín Plaza, Cali</p>
          <p {A('ajustes.horario_corto')}>Lunes a sábado, 9 a. m. a 6 p. m.</p>
          <p><a {A('ajustes.email')} data-cms-mail href="mailto:info.eternaclinic@gmail.com">info.eternaclinic@gmail.com</a></p>
          <p><a {A('ajustes.telefono')} data-mensaje="{escape(RESERVA)}" href="https://wa.me/573117467618">+57 311 746 7618</a></p>
        </div>
        <div>
          <h3>Nuestras redes</h3>
          <div class="redes">
            <a href="https://www.instagram.com/eterna.clinic/" {AT(('ajustes.instagram', 'href'))} target="_blank" rel="noopener" aria-label="Instagram">{icono('instagram')}</a>
            <a href="https://www.facebook.com/share/18i548Q7aD/" {AT(('ajustes.facebook', 'href'))} target="_blank" rel="noopener" aria-label="Facebook">{icono('facebook')}</a>
            <a href="https://www.tiktok.com/@eterna.clinic.bio" {AT(('ajustes.tiktok', 'href'))} target="_blank" rel="noopener" aria-label="TikTok">{icono('tiktok')}</a>
            <a data-mensaje="{escape(RESERVA)}" href="https://wa.me/573117467618" aria-label="WhatsApp">{icono('whatsapp')}</a>
          </div>
        </div>
      </div>
      <div class="pie__legal">
        <span>© Eterna Clinic S.A.S. Todos los derechos reservados.</span>
        <a href="https://eternaclinic16.wixsite.com/eternaclinic/politicadeprivacidad" {AT(('ajustes.politica_url', 'href'))} target="_blank" rel="noopener">Política de privacidad</a>
        <a href="https://eternaclinic16.wixsite.com/eternaclinic/terminosycondiciones" {AT(('ajustes.terminos_url', 'href'))} target="_blank" rel="noopener">Términos y condiciones</a>
        <span {A('ajustes.nota_pie')}>Propuesta de sitio web en versión de demostración.</span>
      </div>
    </div>
  </footer>

  <a class="burbuja" data-mensaje="{escape(RESERVA)}" href="https://wa.me/573117467618" aria-label="Escríbenos por WhatsApp">{icono('whatsapp')}</a>
  <div class="barra" id="barra">{reservar}</div>

  <script src="/cms-config.js"></script>
  <script src="/sitio.js" defer></script>
  <script src="/cms.js" defer></script>
</body>
</html>
"""
    destino = RAIZ / ruta
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(html, encoding="utf-8")


def portada_interna(migas, etiq, linea1, linea2, pregunta, meta, acciones, img, alt, c=None):
    c = c or {}
    migas_html = ' <span aria-hidden="true">/</span> '.join(
        f'<a href="{u}">{n}</a>' if u else f'<span aria-current="page">{n}</span>' for n, u in migas
    )
    meta_html = f'<div class="meta anima" style="--n:1">{"".join(f"<span>{m}</span>" for m in meta)}</div>' if meta else ""
    return f"""    <section class="portada portada--interna" aria-labelledby="titulo-pagina">
      <div class="contenedor portada__rejilla">
        <div>
          <nav class="migas anima" aria-label="Ruta">{migas_html}</nav>
          <span class="anima">{etiqueta(etiq)}</span>
          <h1 id="titulo-pagina" aria-label="{escape(linea1 + ' ' + linea2)}">
            <span class="linea" aria-hidden="true"><span style="--i:0" {c.get('l1', '')}>{linea1}</span></span>
            <span class="linea" aria-hidden="true"><span class="cursiva" style="--i:1" {c.get('l2', '')}>{linea2}</span></span>
          </h1>
          <p class="portada__pregunta anima" {c.get('p', '')}>{pregunta}</p>
          {meta_html}
          <div class="portada__acciones anima" style="--n:2">{acciones}</div>
        </div>
        {arco(img, alt, attrs=c.get('img', ''))}
      </div>
    </section>"""


def campos_pagina(k):
    """Atributos editables de la portada interna de una página con bloque propio."""
    return {"l1": A(f"{k}.titulo1"), "l2": A(f"{k}.titulo2"), "p": A(f"{k}.pregunta"),
            "img": AT((f"{k}.portada_img", "src"), (f"{k}.portada_alt", "alt"))}


def pagina_detalle(item, padre_nombre, padre_url, hermanos, plantilla=False):
    kind = "protocolo" if padre_url == "/protocolos/" else "consulta"
    acciones = boton_whatsapp(f"Reservar {item['nombre']}", mensaje_de(item["nombre"]), extra='data-e-reserva="etiqueta"')
    linea1, linea2 = partir_nombre(item["nombre"], padre_nombre)
    parrafos = "\n            ".join(
        f'<p class="destacado">{p}</p>' if i == len(item["texto"]) - 1 and len(item["texto"]) > 2 else f"<p>{p}</p>"
        for i, p in enumerate(item["texto"])
    )
    otros = "\n        ".join(
        tarjeta(h, f"{padre_url}{h['slug']}/", i) for i, h in enumerate(x for x in hermanos if x["slug"] != item["slug"])
    ) if not plantilla else ""
    c = {"l1": 'data-e="linea1"', "l2": 'data-e="linea2"', "p": 'data-e="pregunta"', "img": "data-e-img"}
    meta = [f"{icono('reloj')}<span data-e=\"duracion\">{item['duracion']}</span>", f"{icono('lugar')}<span data-e=\"modalidad\">{item['modalidad']}</span>"]
    contenido = f"""{portada_interna([("Inicio", "/"), (padre_nombre, padre_url), (item['nombre'], None)], padre_nombre, linea1, linea2, item['pregunta'], meta, acciones, item['img'], item['nombre'], c)}

    <section class="seccion" aria-labelledby="titulo-detalle" style="padding-top:clamp(2rem,6vw,4rem)">
      <div class="contenedor detalle">
        <div class="detalle__texto revelar">
          {etiqueta('En qué consiste')}
          <h2 id="titulo-detalle" class="titulo" style="margin:1rem 0 1.6rem" data-e="nombre">{item['nombre']}</h2>
          <div data-e-texto>
            {parrafos}
          </div>
        </div>
        <aside class="ficha revelar" style="--d:1" aria-label="Datos de {escape(item['nombre'])}">
          <h2>Reserva tu cita</h2>
          <dl>
            <div><dt>Duración</dt><dd data-e="duracion">{item['duracion']}</dd></div>
            <div><dt>Modalidad</dt><dd data-e="modalidad">{item['modalidad']}</dd></div>
            <div><dt>Dónde</dt><dd {A('ajustes.donde_corto')}>C.C. Jardín Plaza, Cali</dd></div>
          </dl>
          {boton_whatsapp(f"Reservar {item['nombre']}", mensaje_de(item['nombre']), extra='data-e-reserva="etiqueta"')}
        </aside>
      </div>
    </section>

    <section class="seccion otros" aria-labelledby="titulo-otros">
      <div class="contenedor">
        <div class="cabecera revelar">
          {etiqueta(f'Otros en {padre_nombre}')}
          <h2 id="titulo-otros" class="titulo">También te puede <em>interesar</em></h2>
        </div>
        <div class="carrusel" data-e-lista="{kind}" data-excluir="{item['slug']}">
        {otros}
        </div>
      </div>
    </section>

{llamado('Tu esencia, <em>por siempre</em>', 'Escríbenos y agenda tu valoración. Te acompañamos en cada paso.', mensaje_de(item['nombre']), extra='data-e-reserva="mensaje"')}"""
    atributos = f' data-e-kind="{kind}" data-e-slug="{item["slug"]}"' + (" data-e-plantilla" if plantilla else "")
    ruta = f"_cms/{kind}/index.html" if plantilla else f"{padre_url.strip('/')}/{item['slug']}/index.html"
    pagina(ruta, f"{item['nombre']} | Eterna Clinic, medicina biorreguladora en Cali", item["resumen"], contenido, padre_url, item["img"],
           noindex=plantilla, main_attrs=atributos)


def pagina_inicio():
    caminos = []
    todos = {p["slug"]: (p, f"/protocolos/{p['slug']}/") for p in PROTOCOLOS}
    todos["consulta-medica"] = (CONSULTAS[0], "/consultas/consulta-medica/")
    todos["detox-era"] = ({"nombre": "Detox ERA", "img": "detox-era", "duracion": "Programa", "modalidad": "Presencial",
                           "pregunta": "El gran inicio: depura la memoria celular y prepara a tu cuerpo para volver a comenzar."}, "/detox-era/")
    for etiqueta_camino, slug in CAMINOS:
        item, url = todos[slug]
        caminos.append({"etiqueta": etiqueta_camino, "nombre": item["nombre"], "img": f"/img/{item['img']}.webp",
                        "texto": item["pregunta"], "duracion": item["duracion"], "modalidad": item["modalidad"], "url": url})
    opciones = "".join(f'<button type="button" class="opcion" aria-pressed="{str(i == 0).lower()}" data-i="{i}">{c[0]}</button>' for i, c in enumerate(CAMINOS))
    servicios = "\n        ".join(
        f"""<a class="servicio revelar" style="--d:{i}" href="/{s['slug']}/">
          <img src="/img/{s['img']}.webp" alt="" loading="lazy" decoding="async" {AT((f'inicio.servicio{i + 1}_img', 'src'))}>
          <span class="servicio__numero" aria-hidden="true">{i + 1}</span>
          <div class="servicio__cuerpo">
            <h3>{s['nombre']}</h3>
            <p {A(f'inicio.servicio{i + 1}_resumen')}>{s['resumen']}</p>
            <span class="servicio__ir"><span>{icono('flecha')}</span>Conocer {s['nombre']}</span>
          </div>
        </a>""" for i, s in enumerate(SERVICIOS)
    )
    contenido = f"""    <section class="portada" aria-labelledby="titulo-portada" style="--retraso:1.6s">
      <div class="contenedor portada__rejilla">
        <div>
          <span class="anima">{etiqueta('Medicina biorreguladora personalizada', 'inicio.etiqueta')}</span>
          <h1 id="titulo-portada" aria-label="Tu esencia, por siempre">
            <span class="linea" aria-hidden="true"><span style="--i:0" {A('inicio.titulo1')}>Tu esencia,</span></span>
            <span class="linea" aria-hidden="true"><span class="cursiva" style="--i:1" {A('inicio.titulo2')}>por siempre</span></span>
          </h1>
          <p class="portada__bajada anima" {A('inicio.bajada')}>Somos una clínica de medicina biorreguladora y ortomolecular dedicada al antienvejecimiento, la salud y la belleza. Nuestro enfoque personalizado nos distingue: tratamientos diseñados específicamente para cada persona.</p>
          <div class="portada__acciones anima" style="--n:1">
            {boton_whatsapp('Reserva tu consulta', RESERVA, campo='inicio.boton_principal')}
            <a class="boton boton--linea" href="#servicios" {A('inicio.boton_secundario')}>Ver servicios</a>
          </div>
          <div class="portada__datos anima" style="--n:2">
            <span>{icono('lugar')}<span {A('ajustes.donde_corto')}>C.C. Jardín Plaza, Cali</span></span>
            <span>{icono('reloj')}<span {A('ajustes.horario_corto')}>Lunes a sábado, 9 a. m. a 6 p. m.</span></span>
          </div>
        </div>
        {arco('recepcion-eterna', 'Recepción de Eterna Clinic con sofá blanco, vela y detalles dorados', '1.6s', True, attrs=AT(('inicio.portada_img', 'src'), ('inicio.portada_alt', 'alt')))}
      </div>
    </section>

    <section class="seccion" id="servicios" aria-labelledby="titulo-servicios">
      <div class="contenedor">
        <div class="cabecera revelar">
          {etiqueta('Nuestros servicios', 'inicio.servicios_etiqueta')}
          <h2 id="titulo-servicios" class="titulo" {A('inicio.servicios_titulo', True)}>Tres caminos hacia <em>tu bienestar</em></h2>
          <p class="intro" {A('inicio.servicios_intro')}>Empieza por el gran inicio, elige la consulta que mejor se adapta a tu vida o encuentra el protocolo hecho para lo que quieres recuperar.</p>
        </div>
        <div class="servicios">
        {servicios}
        </div>
      </div>
    </section>

    <section class="seccion" id="recuperar" aria-labelledby="titulo-recuperar" style="padding-top:0" {VIS('inicio.mostrar_recuperar')}>
      <div class="brujula">
        <div class="contenedor" style="padding-block:clamp(3.5rem,8vw,6rem)">
          <div class="cabecera revelar" style="margin-bottom:0">
            {etiqueta('Empieza aquí', 'inicio.recuperar_etiqueta')}
            <h2 id="titulo-recuperar" class="titulo" {A('inicio.recuperar_titulo', True)}>¿Qué quieres <em>recuperar?</em></h2>
            <p class="intro" {A('inicio.recuperar_intro')}>Elige lo que más resuena contigo y te mostramos el camino. La valoración médica define tu protocolo final.</p>
          </div>
          <div class="opciones" role="group" aria-label="Lo que quieres recuperar" id="opciones">{opciones}</div>
          <div class="respuesta" id="respuesta" aria-live="polite"></div>
          <script type="application/json" id="caminos">{json.dumps(caminos, ensure_ascii=False)}</script>
        </div>
      </div>
    </section>

    <section class="seccion" aria-labelledby="titulo-nosotros" style="padding-top:0" {VIS('inicio.mostrar_nosotros')}>
      <div class="contenedor historia">
        <div class="historia__foto"><img class="cortina" src="/img/medicos-eterna.webp" alt="Los dos médicos fundadores de Eterna Clinic en la recepción" loading="lazy" decoding="async" {AT(('inicio.nosotros_img', 'src'), ('inicio.nosotros_alt', 'alt'))}></div>
        <div class="revelar">
          {etiqueta('Sobre nosotros', 'inicio.nosotros_etiqueta')}
          <h2 id="titulo-nosotros" class="titulo" style="margin-top:1rem" {A('inicio.nosotros_titulo', True)}>Dos médicos, <em>una misma convicción</em></h2>
          <p class="intro" style="margin-top:1.2rem" {A('inicio.nosotros_texto')}>Con nuestra experiencia de más de 20 años entre los dos podemos decir que, con conocimiento, respeto y ciencia, sí es posible sanar. Nos especializamos en medicina personalizada para la salud, la calidad de vida y la belleza.</p>
          <div class="cifras">
            <div><strong {A('inicio.cifra1_numero')}>+20</strong><span {A('inicio.cifra1_texto')}>años de experiencia entre los dos</span></div>
            <div><strong {A('inicio.cifra2_numero')}>2</strong><span {A('inicio.cifra2_texto')}>médicos, un mismo propósito</span></div>
          </div>
          <a class="enlace" href="/nosotros/" style="margin-top:1.6rem">Conoce nuestra historia {icono('flecha')}</a>
        </div>
      </div>
    </section>

{seccion_contacto()}"""
    pagina("index.html", "Eterna Clinic | Medicina biorreguladora personalizada en Cali",
           "Eterna Clinic: medicina biorreguladora y ortomolecular para el antienvejecimiento, la salud y la belleza en el C.C. Jardín Plaza, Cali.",
           contenido, "/", extra_head=f'  <link rel="preload" as="image" href="/img/recepcion-eterna.webp">\n  <script type="application/ld+json">{json.dumps(DATOS_ESTRUCTURADOS, ensure_ascii=False)}</script>\n',
           bloque="inicio")


def seccion_contacto():
    return f"""    <section class="seccion" id="contacto" aria-labelledby="titulo-contacto" style="padding-top:0" {VIS('inicio.mostrar_contacto')}>
      <div class="contenedor">
        <div class="cabecera revelar">
          {etiqueta('Contacto')}
          <h2 id="titulo-contacto" class="titulo" {A('ajustes.contacto_titulo', True)}>Te esperamos <em>en Jardín Plaza</em></h2>
        </div>
        <div class="contacto">
          <div class="contacto__panel revelar">
            <div><h3>Dirección</h3><p {A('ajustes.direccion', True)}>Centro Comercial Jardín Plaza<br>Cra. 98 #16-200, Cali, Colombia</p></div>
            <div><h3>Horario</h3><p {A('ajustes.horario')}>Lunes a sábado, 9:00 a. m. a 6:00 p. m.</p></div>
            <div><h3>Contacto</h3>
              <p><a {A('ajustes.telefono')} data-mensaje="{escape(RESERVA)}" href="https://wa.me/573117467618">+57 311 746 7618</a></p>
              <p><a {A('ajustes.email')} data-cms-mail href="mailto:info.eternaclinic@gmail.com">info.eternaclinic@gmail.com</a></p>
            </div>
            <div><h3>Nuestras redes</h3>
              <div class="redes-grandes" style="margin-top:.7rem">
                <a href="https://wa.me/c/573117467618" {AT(('ajustes.catalogo', 'href'))} target="_blank" rel="noopener" aria-label="Catálogo de WhatsApp">{icono('whatsapp')}</a>
                <a href="https://www.instagram.com/eterna.clinic/" {AT(('ajustes.instagram', 'href'))} target="_blank" rel="noopener" aria-label="Instagram">{icono('instagram')}</a>
                <a href="https://www.tiktok.com/@eterna.clinic.bio" {AT(('ajustes.tiktok', 'href'))} target="_blank" rel="noopener" aria-label="TikTok">{icono('tiktok')}</a>
                <a href="https://www.facebook.com/share/18i548Q7aD/" {AT(('ajustes.facebook', 'href'))} target="_blank" rel="noopener" aria-label="Facebook">{icono('facebook')}</a>
              </div>
            </div>
          </div>

          <form class="boletin revelar" id="boletin" style="--d:1" novalidate {VIS('ajustes.mostrar_boletin')}>
            <h3>Suscríbete a <em class="cursiva">nuestro boletín</em></h3>
            <p class="intro" style="font-size:.98rem">Recibe recomendaciones médicas, novedades y contenido de valor por WhatsApp. Prometemos comunicaciones responsables y puedes cancelar tu suscripción en cualquier momento.</p>
            <div class="campo"><label for="b-nombre">Nombre</label><input id="b-nombre" type="text" autocomplete="name"></div>
            <div class="campo"><label for="b-telefono">Teléfono *</label><input id="b-telefono" type="tel" autocomplete="tel" inputmode="tel" required aria-describedby="b-error"></div>
            <div class="campo"><label for="b-correo">Email</label><input id="b-correo" type="email" autocomplete="email"></div>
            <label class="casilla"><input type="checkbox" id="b-promos" required>Estoy de acuerdo en recibir información y promociones de Eterna Clinic *</label>
            <label class="casilla"><input type="checkbox" id="b-politica" required><span>He leído y estoy de acuerdo con la <a href="https://eternaclinic16.wixsite.com/eternaclinic/politicadeprivacidad" {AT(('ajustes.politica_url', 'href'))} target="_blank" rel="noopener">política de privacidad</a> *</span></label>
            <p class="error" id="b-error" role="alert">Escribe tu teléfono y acepta las dos casillas para suscribirte.</p>
            <button class="boton boton--tinta" type="submit">{icono('whatsapp')}Suscribirme</button>
            <p class="legal">En cumplimiento de la Ley 1581 de 2012, informamos que los datos personales y de salud que usted proporcione serán tratados por ETERNA CLINIC S.A.S., con la finalidad de gestionar citas médicas presenciales o virtuales y brindar servicios de salud. Usted puede ejercer sus derechos enviando una solicitud a info.eternaclinic@gmail.com.</p>
          </form>

          <div class="mapa revelar" {VIS('ajustes.mostrar_mapa')}>
            <iframe title="Mapa de Eterna Clinic en el C.C. Jardín Plaza, Cali" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps?q=Eterna+Clinic,+Centro+Comercial+Jard%C3%ADn+Plaza,+Cali&output=embed"></iframe>
          </div>
        </div>
      </div>
    </section>"""


def pagina_detox():
    contenido = f"""{portada_interna([("Inicio", "/"), ("Detox ERA", None)], 'Detox ERA', 'El gran', 'inicio', 'Esta es la verdadera puerta de entrada a tu bienestar.', [], boton_whatsapp('Reservar Detox ERA', mensaje_de('Detox ERA')), 'detox-era', 'Medicamentos biorreguladores y suplementos del programa Detox ERA', campos_pagina('detox'))}

    <section class="seccion" aria-labelledby="titulo-detox" style="padding-top:clamp(2rem,6vw,4rem)">
      <div class="contenedor detalle">
        <div class="detalle__texto revelar">
          {etiqueta('Por qué empezar aquí', 'detox.etiqueta')}
          <h2 id="titulo-detox" class="titulo" style="margin:1rem 0 1.6rem" {A('detox.titulo', True)}>Volver a <em>comenzar</em></h2>
          <p {A('detox.p1')}>Cualquier tratamiento tendrá más oportunidad de éxito si se inicia depurando la memoria celular de enfermedades previas, células inflamadas, obesidad y hormonas desreguladas.</p>
          <p {A('detox.p2')}>Elimina células envejecidas, químicos y tóxicos.</p>
          <p {A('detox.p3')}>Dale la bienvenida a tu bienestar y belleza con la capacidad celular de volver a comenzar.</p>
          <p class="destacado" {A('detox.p4')}>Todos tenemos una segunda oportunidad, y vamos a hacerlo juntos.</p>
        </div>
        <aside class="ficha revelar" style="--d:1" aria-label="Datos de Detox ERA">
          <h2 {A('detox.ficha_titulo')}>El gran inicio</h2>
          <dl>
            <div><dt>Ideal para</dt><dd {A('detox.ideal')}>Empezar cualquier tratamiento</dd></div>
            <div><dt>Dónde</dt><dd {A('ajustes.donde_corto')}>C.C. Jardín Plaza, Cali</dd></div>
          </dl>
          {boton_whatsapp('Reservar Detox ERA', mensaje_de('Detox ERA'))}
        </aside>
      </div>
    </section>

    <section class="seccion otros" aria-labelledby="titulo-siguiente">
      <div class="contenedor">
        <div class="cabecera revelar">
          {etiqueta('Después del gran inicio')}
          <h2 id="titulo-siguiente" class="titulo">Sigue tu <em>camino</em></h2>
        </div>
        <div class="tarjetas">
        {tarjeta({**CONSULTAS[0]}, '/consultas/consulta-medica/', 0)}
        {tarjeta({**PROTOCOLOS[0]}, '/protocolos/reset/', 1)}
        {tarjeta({**PROTOCOLOS[4]}, '/protocolos/codigo-ambar/', 2)}
        </div>
      </div>
    </section>

{llamado('Todos tenemos una <em>segunda oportunidad</em>', 'Reserva Detox ERA y empecemos juntos.', mensaje_de('Detox ERA'), k='detox.cta')}"""
    pagina("detox-era/index.html", "Detox ERA, el gran inicio | Eterna Clinic Cali",
           "Detox ERA: la puerta de entrada a tu bienestar. Depura la memoria celular y elimina células envejecidas, químicos y tóxicos.",
           contenido, "/detox-era/", "detox-era", bloque="detox")


def pagina_listado(slug, nombre, linea1, linea2, pregunta, img, items, intro):
    k = f"{slug}_pagina"
    tarjetas = "\n        ".join(tarjeta(x, f"/{slug}/{x['slug']}/", i) for i, x in enumerate(items))
    clase = "tarjetas tarjetas--tres" if len(items) == 3 else "tarjetas"
    kind = "protocolo" if slug == "protocolos" else "consulta"
    contenido = f"""{portada_interna([("Inicio", "/"), (nombre, None)], nombre, linea1, linea2, pregunta, [], f'<a class="boton boton--oro" href="#lista">Ver {nombre.lower()}</a>' + boton_whatsapp('Reservar', RESERVA, 'boton--linea'), img, nombre, campos_pagina(k))}

    <section class="seccion" id="lista" aria-labelledby="titulo-lista" style="padding-top:clamp(2rem,6vw,4rem)">
      <div class="contenedor">
        <div class="cabecera revelar">
          {etiqueta(nombre)}
          <h2 id="titulo-lista" class="titulo" {A(k + '.titulo_lista', True)}>{intro[0]}</h2>
          <p class="intro" {A(k + '.intro_lista')}>{intro[1]}</p>
        </div>
        <div class="{clase}" data-e-lista="{kind}">
        {tarjetas}
        </div>
      </div>
    </section>

{llamado('Tu esencia, <em>por siempre</em>', 'Escríbenos y agenda tu valoración. Te acompañamos en cada paso.')}"""
    pagina(f"{slug}/index.html", f"{nombre} | Eterna Clinic, medicina biorreguladora en Cali", intro[1], contenido, f"/{slug}/", img, bloque=k)
    for x in items:
        pagina_detalle(x, nombre, f"/{slug}/", items)
    # Plantilla para protocolos/consultas creados desde el panel (el rewrite del hosting la sirve para /<seccion>/<slug>/)
    pagina_detalle({"slug": "plantilla", "nombre": "", "img": img, "duracion": "", "modalidad": "", "resumen": "", "pregunta": "", "texto": []},
                   nombre, f"/{slug}/", [], plantilla=True)


def pagina_nosotros():
    contenido = f"""{portada_interna([("Inicio", "/"), ("Sobre nosotros", None)], 'Sobre nosotros', 'Medicina', 'con alma', 'Con conocimiento, respeto y ciencia, sí es posible sanar.', [], boton_whatsapp('Reserva tu consulta', RESERVA), 'muro-eterna', 'Pared de la clínica con el nombre Eterna', campos_pagina('nosotros'))}

    <section class="seccion" aria-labelledby="titulo-historia" style="padding-top:clamp(2rem,6vw,4rem)">
      <div class="contenedor historia">
        <div class="historia__foto"><img class="cortina" src="/img/medicos-eterna.webp" alt="Los dos médicos fundadores de Eterna Clinic en la recepción" loading="lazy" decoding="async" {AT(('nosotros.foto', 'src'), ('nosotros.foto_alt', 'alt'))}></div>
        <div class="revelar">
          {etiqueta('Nuestra historia', 'nosotros.etiqueta')}
          <h2 id="titulo-historia" class="titulo" style="margin-top:1rem" {A('nosotros.titulo', True)}>Dos médicos, <em>una misma convicción</em></h2>
          <p class="intro" style="margin-top:1.2rem" {A('nosotros.p1')}>Una niña que siempre creyó que estar sanos es el logro de un equilibrio físico, mental y espiritual se convirtió en doctora. Inició en el camino de la medicina estética muchos años antes de la biorregulación, y por eso le encanta escuchar cuando sus pacientes le dicen que tiene unas manos suaves y que sus procedimientos no duelen.</p>
          <p class="intro" {A('nosotros.p2')}>Y aunque dijo desde la carrera de medicina que no se casaría con un médico, se enamoró de uno. Uno que por mucho tiempo creyó que la medicina alopática convencional no requería de otras herramientas, pero con experiencias personales la vida le enseñó que necesitaba la biorregulación en sus manos y en su corazón para convertirse en el gran médico que es hoy.</p>
          <p class="intro" {A('nosotros.p3')}>Con nuestra experiencia de más de 20 años entre los dos podemos decir que, con conocimiento, respeto y ciencia, sí es posible sanar. Nos especializamos en medicina personalizada para la salud, la calidad de vida y la belleza.</p>
          <blockquote {A('nosotros.cita')}>¡Bienvenidos!</blockquote>
          <div class="cifras">
            <div><strong {A('nosotros.cifra1_numero')}>+20</strong><span {A('nosotros.cifra1_texto')}>años de experiencia entre los dos</span></div>
            <div><strong {A('nosotros.cifra2_numero')}>2</strong><span {A('nosotros.cifra2_texto')}>médicos, un mismo propósito</span></div>
          </div>
        </div>
      </div>
    </section>

{llamado('Bienvenidos a <em>Eterna</em>', 'Agenda tu consulta y conozcamos tu historia.', k='nosotros.cta')}"""
    pagina("nosotros/index.html", "Sobre nosotros | Eterna Clinic Cali",
           "La historia de los dos médicos detrás de Eterna Clinic: más de 20 años de experiencia en medicina estética y biorreguladora.",
           contenido, "/nosotros/", "medicos-eterna", bloque="nosotros")


DATOS_ESTRUCTURADOS = {
    "@context": "https://schema.org", "@type": "MedicalClinic", "name": "Eterna Clinic", "legalName": "ETERNA CLINIC S.A.S.",
    "slogan": "Tu esencia, por siempre",
    "description": "Clínica de medicina biorreguladora y ortomolecular dedicada al antienvejecimiento, la salud y la belleza.",
    "image": "/img/recepcion-eterna.webp", "telephone": "+57 311 746 7618", "email": "info.eternaclinic@gmail.com",
    "address": {"@type": "PostalAddress", "streetAddress": "Centro Comercial Jardín Plaza, Cra. 98 #16-200", "addressLocality": "Cali", "addressRegion": "Valle del Cauca", "addressCountry": "CO"},
    "openingHoursSpecification": [{"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], "opens": "09:00", "closes": "18:00"}],
    "sameAs": ["https://www.instagram.com/eterna.clinic/", "https://www.tiktok.com/@eterna.clinic.bio", "https://www.facebook.com/share/18i548Q7aD/"],
}


# ───────── Contenido editable: se lee del HTML ya generado (una sola fuente de verdad) ─────────
class _Extractor(HTMLParser):
    def __init__(self, bloques):
        super().__init__(convert_charrefs=True)
        self.bloques, self.captura, self.vistos = bloques, None, {}

    def _guardar(self, campo, valor):
        bloque, _, nombre = campo.partition(".")
        if campo in self.vistos and self.vistos[campo] != valor:
            print(f"AVISO: el campo {campo} tiene dos valores distintos:\n  {self.vistos[campo]!r}\n  {valor!r}")
            return
        self.vistos[campo] = valor
        self.bloques.setdefault(bloque, {})[nombre] = valor

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        for par in a.get("data-cms-attr", "").split():
            campo, _, atributo = par.partition(":")
            self._guardar(campo, a.get(atributo, ""))
        if "data-cms-vis" in a:
            self._guardar(a["data-cms-vis"], True)
        if self.captura:
            if tag == self.captura["tag"]:
                self.captura["profundidad"] += 1
            if self.captura["html"] and tag in ("em", "br"):
                self.captura["buf"].append(f"<{tag}>")
            return
        campo, es_html = (a["data-cms"], False) if "data-cms" in a else ((a["data-cms-html"], True) if "data-cms-html" in a else (None, False))
        if campo:
            self.captura = {"campo": campo, "html": es_html, "tag": tag, "profundidad": 0, "buf": []}

    def handle_endtag(self, tag):
        c = self.captura
        if not c:
            return
        if tag == c["tag"]:
            if c["profundidad"] == 0:
                texto = "".join(c["buf"]).strip()
                self._guardar(c["campo"], texto)
                self.captura = None
            else:
                c["profundidad"] -= 1
        elif c["html"] and tag == "em":
            c["buf"].append("</em>")

    def handle_data(self, data):
        if self.captura:
            self.captura["buf"].append(escape(data, quote=False) if self.captura["html"] else data)


def extraer_contenido():
    bloques = {}
    for ruta in sorted(RAIZ.rglob("index.html")):
        if any(p in ruta.parts for p in ("admin", "supabase", "node_modules")):
            continue
        _Extractor(bloques).feed(ruta.read_text(encoding="utf-8"))
    return bloques


def datos_entrada(item):
    return {"nombre": item["nombre"], "img": f"/img/{item['img']}.webp", "duracion": item["duracion"], "modalidad": item["modalidad"],
            "resumen": item["resumen"], "pregunta": item["pregunta"], "texto": item["texto"], "seo_titulo": "", "seo_descripcion": ""}


def escribir_semilla():
    """Genera supabase/seed.sql: el contenido ACTUAL del sitio, listo para cargar (idempotente: no pisa lo que ya exista)."""
    bloques = extraer_contenido()
    entradas = [{"kind": "protocolo", "slug": p["slug"], "sort": i, "data": datos_entrada(p)} for i, p in enumerate(PROTOCOLOS)] + \
               [{"kind": "consulta", "slug": c["slug"], "sort": i, "data": datos_entrada(c)} for i, c in enumerate(CONSULTAS)]
    imagenes = []
    try:
        from PIL import Image
    except ImportError:
        Image = None
    for f in sorted((RAIZ / "img").glob("*.webp")):
        w = h = None
        if Image:
            with Image.open(f) as im:
                w, h = im.size
        imagenes.append({"url": f"/img/{f.name}", "alt": f.stem.replace("-", " "), "width": w, "height": h, "bytes": f.stat().st_size})
    carga = json.dumps({"bloques": bloques, "entradas": entradas, "imagenes": imagenes}, ensure_ascii=False)
    sql = f"""-- Contenido inicial de Eterna Clinic (generado por scripts/generar.py; no editar a mano).
-- Idempotente: si una fila ya existe NO se toca, así que volver a ejecutarlo no pisa lo que editaste en el panel.
do $semilla$
declare r jsonb; v_id uuid; carga jsonb := $json${carga}$json$::jsonb; b record;
begin
  for b in select key, value from jsonb_each(carga->'bloques') loop
    -- agrega campos nuevos; lo que ya existe (y lo editado en el panel) prevalece
    insert into public.site_content (key, published, published_at) values (b.key, b.value, now())
      on conflict (key) do update set published = excluded.published || coalesce(public.site_content.published, '{{}}'::jsonb);
    insert into public.drafts (scope, ref, data) values ('sitio', b.key, b.value)
      on conflict (scope, ref) do update set data = excluded.data || public.drafts.data;
    insert into public.content_revisions (scope, ref, data, nota)
      select 'sitio', b.key, b.value, 'Versión inicial (contenido original del sitio)'
       where not exists (select 1 from public.content_revisions where scope = 'sitio' and ref = b.key);
  end loop;
  for r in select * from jsonb_array_elements(carga->'entradas') loop
    v_id := null;
    insert into public.entries (kind, slug, sort, status, published, published_at)
    values (r->>'kind', r->>'slug', (r->>'sort')::int, 'publicado', r->'data', now())
    on conflict (kind, slug) do nothing returning id into v_id;
    if v_id is not null then
      insert into public.drafts (scope, ref, data) values ('entrada', v_id::text, r->'data') on conflict (scope, ref) do nothing;
      insert into public.content_revisions (scope, ref, data, nota) values ('entrada', v_id::text, r->'data', 'Versión inicial (contenido original del sitio)');
    end if;
  end loop;
  for r in select * from jsonb_array_elements(carga->'imagenes') loop
    insert into public.media_assets (url, alt, width, height, bytes, mime)
    values (r->>'url', r->>'alt', (r->>'width')::int, (r->>'height')::int, (r->>'bytes')::int, 'image/webp')
    on conflict (url) do nothing;
  end loop;
end $semilla$;
"""
    destino = RAIZ / "supabase" / "seed.sql"
    destino.parent.mkdir(exist_ok=True)
    destino.write_text(sql, encoding="utf-8")
    (RAIZ / "supabase" / "contenido-inicial.json").write_text(json.dumps({"bloques": bloques, "entradas": entradas}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Semilla: {sum(len(v) for v in bloques.values())} campos en {len(bloques)} bloques, {len(entradas)} entradas, {len(imagenes)} imágenes")


if __name__ == "__main__":
    pagina_inicio()
    pagina_detox()
    pagina_listado("consultas", "Consultas", "Tu médico,", "donde estés",
                   "La atención que necesitas: en la clínica, en tu casa o de viaje.", "sueros", CONSULTAS,
                   ("Elige tu <em>consulta</em>", "Cada consulta es un espacio de dos horas para escucharte, buscar el origen de lo que te pasa y diseñar tu plan."))
    pagina_listado("protocolos", "Protocolos", "Seis caminos,", "una historia",
                   "Programas biorreguladores personalizados, porque no existen dos cuerpos ni dos historias iguales.", "capelli-casco", PROTOCOLOS,
                   ("Encuentra <em>tu protocolo</em>", "Metabolismo, cabello, estrés, energía sexual, piel y deporte: cada protocolo se diseña para ti."))
    pagina_nosotros()
    escribir_semilla()
