# Eterna Clinic · Panel de contenido (CMS)

Panel privado en `/admin` para editar textos, fotos, protocolos y consultas sin tocar código ni volver a desplegar.
Costo: **$0** (Supabase plan gratuito + el hosting que ya tienes). No usa ningún servicio de pago ni IA.

## Cómo funciona (en corto)

- El sitio sigue siendo HTML estático (lo genera `scripts/generar.py`). **No se reconstruyó nada.**
- Al abrir una página, `cms.js` pide a Supabase solo lo **publicado** y actualiza textos, fotos y tarjetas. Si Supabase no responde o no está configurado, se ve el contenido del HTML, igual que antes.
- Protocolos/consultas nuevos: su URL (`/protocolos/<nombre>/`) se sirve con una plantilla (`/_cms/…`) que `cms.js` rellena. Las URL existentes no cambian.
- Los **borradores** viven en una tabla que solo leen administradores. Publicar copia el borrador a lo público y guarda la versión anterior en el historial (20 por elemento).
- Roles: **superadministrador** (publica, ordena, archiva, elimina, administra usuarios) y **editor** (crea y edita borradores). Se aplican en el servidor con RLS y funciones SQL; ocultar botones es solo comodidad.

## Puesta en marcha (una sola vez, ~15 min, sin tarjeta)

1. Crea una cuenta gratis en supabase.com y un proyecto (región cercana, p. ej. São Paulo). Anota una contraseña de base de datos en tu gestor de contraseñas.
2. **SQL Editor** → pega y ejecuta `supabase/migrations/0001_cms.sql` (crea tablas, permisos, funciones y el bucket de imágenes). Luego ejecuta `supabase/seed.sql` (carga el contenido actual del sitio; se puede repetir sin duplicar).
3. **Authentication → Providers → Email**: deja email/contraseña activo y **desactiva “Allow new users to sign up”**. (Aunque alguien lograra registrarse, no tendría permisos: las políticas lo bloquean.)
4. **Authentication → URL Configuration**: Site URL = tu dominio; en *Redirect URLs* agrega `https://TU-DOMINIO/admin/` y `https://eternaclinic-cali.vercel.app/admin/`.
5. **Authentication → Users → Add user** (o *Invite user*) con el correo del primer administrador. Luego, en el SQL Editor: `select public.crear_primer_superadmin('correo@ejemplo.com');`
6. **Project Settings → API**: copia *Project URL* y la clave **anon public** en `cms-config.js`. **Nunca** pongas la clave `service_role` en el sitio.
7. Despliega (`vercel deploy --prod` o git push). Entra a `/admin/`.

Más usuarios: invítalos en *Authentication → Users → Invite user*, y en el panel → **Usuarios** dales el rol.

## Uso diario

- **Protocolos / Consultas**: crear, editar, duplicar, reordenar (↑↓), despublicar, archivar, eliminar. Eterna Travel y Eterna en Casa son consultas.
- **Página de inicio, Detox ERA, Sobre nosotros, portadas de Consultas/Protocolos, Ajustes del sitio**: textos, fotos, botones, enlaces, WhatsApp, redes, SEO y secciones visibles.
- En cada editor: **Guardar borrador** (Ctrl+S) → mira la **vista previa** (clic en cualquier texto o foto para ir a su campo) → **Publicar**. El editor guarda; el superadministrador publica.
- **Historial** → *Restaurar como borrador* → revisar → Publicar.
- **Biblioteca multimedia**: sube JPG/PNG/WebP (se convierte a WebP, máx. 1600 px, ≤ 2 MB, sin deformar). No deja borrar una imagen en uso.
- “Ver en el sitio” solo aparece en lo ya publicado.

## Límites del plan gratuito de Supabase (verifica los vigentes en supabase.com/pricing)

Verificado en supabase.com/pricing (nov-2026): base de datos 500 MB, Storage 1 GB (archivos de hasta 50 MB), 5 GB de egress, 50 000 usuarios activos/mes, 2 proyectos activos. El contenido de este sitio son kilobytes de texto y ~20 fotos WebP, así que sobra; el consumo real lo da la transferencia de imágenes. Para cuidarla, las fotos se suben optimizadas y se sirven con caché de 1 año.

**Pausa por inactividad:** los proyectos gratuitos se **pausan tras ~1 semana sin actividad**. Con visitas al sitio hay actividad (cada visita consulta la base). Si el sitio quedara sin tráfico, entra a `/admin` al menos una vez por semana o restaura el proyecto desde el panel de Supabase (los datos se conservan un tiempo tras la pausa). Plan B incorporado: si Supabase no responde, el sitio muestra el contenido original del HTML.

## Copia de seguridad y salida

- Panel → Dashboard → **Descargar copia (JSON)**: todo el contenido, borradores e historial. Hazla mensual y antes de cambios grandes; guarda el archivo fuera del proyecto.
- Las fotos originales del sitio están en `/img` (repositorio). Las subidas desde el panel están en Supabase Storage (bucket `media`); la copia JSON guarda sus URL.
- Para regenerar el HTML estático con lo publicado (SEO máximo / respaldo sin Supabase): `python scripts/generar.py` produce las páginas con el contenido del código; si editaste en el panel y quieres que el HTML las refleje, copia los textos publicados a `generar.py` (el JSON de copia los incluye).

## Despliegue

**Vercel (actual):** nada especial. `vercel.json` ya tiene los rewrites de protocolos/consultas nuevos y las cabeceras de seguridad (`/admin` con CSP, sin indexar, sin iframes). `.vercelignore` deja fuera `supabase/`, `docs/`, `scripts/` y `data/`.

**Hostinger (futuro):** el sitio es **estático** → sirve un plan de hosting compartido con Apache; no necesitas Node ni funciones (confirma con Hostinger que el plan que elijas incluya Apache y `.htaccess`). Sube todo el contenido de la carpeta (incluido `.htaccess`, que replica los rewrites y cabeceras). Comprar solo el dominio **no** incluye hosting. Pasos: apuntar el dominio, subir archivos, agregar el dominio nuevo a *Redirect URLs* y *Site URL* en Supabase. Supabase sigue igual (es independiente del hosting).
Verifica que tu plan tenga `mod_rewrite` y `mod_headers` (confírmalo con Hostinger antes de migrar). Si las cabeceras no se aplicaran, el panel igual lleva su CSP en una etiqueta `<meta>`.

## Seguridad (qué está protegido y cómo)

- RLS activo en todas las tablas. El visitante (clave anon) solo lee lo **publicado**; `drafts`, `content_revisions`, `admin_profiles` y `media_assets` solo las leen administradores activos.
- Ninguna tabla de contenido admite escritura directa: solo funciones `security definer` que validan el rol, el contenido (tamaño, etiquetas peligrosas) y los estados.
- Un usuario no puede cambiar su propio rol ni desactivarse; siempre queda al menos un superadministrador. Crear el primer superadministrador solo se puede desde el SQL Editor.
- El sitio sanea todo lo que muestra desde la base (solo `<em>`, `<strong>`, `<br>`; enlaces `http(s)/mailto/tel`; imágenes solo del sitio o de tu Storage).
- Storage: lectura pública de imágenes; subir/cambiar/borrar solo administradores; tipos JPG/PNG/WebP, 2 MB.
- El panel no se indexa, no se puede incrustar y lleva CSP estricta; `supabase-js` va **incluido localmente** (`admin/vendor`, v2.45.4) en vez de cargarse de un CDN.
- La clave `anon` es pública por diseño; lo que protege es RLS. Nunca uses `service_role` en el navegador.
- Este CMS no guarda datos de pacientes ni información clínica: solo el contenido público del sitio. El formulario de boletín sigue enviando por WhatsApp, sin almacenar nada.

## Pruebas incluidas

`supabase/tests/permisos.sql` (con `shim-local.sql`, que simula `auth`/`storage` de Supabase): 55 comprobaciones de roles y RLS contra un Postgres local (visitante, usuario sin perfil, editor, superadmin). Ejecutar con Docker: `docker run -d --name pg -e POSTGRES_PASSWORD=x postgres:16-alpine`, luego `psql -f shim-local.sql`, `0001_cms.sql` y `permisos.sql`; las líneas deben decir `PASA`.

## Mantenimiento del contenido inicial

`scripts/generar.py` sigue generando el HTML y, de paso, `supabase/seed.sql` y `contenido-inicial.json` a partir de los atributos `data-cms`. Para hacer editable un texto nuevo: agrega `data-cms="bloque.campo"` (o `data-cms-html`, `data-cms-attr`, `data-cms-vis`) al elemento en `generar.py`, regenera y vuelve a ejecutar `seed.sql`: agrega los campos nuevos sin pisar nada de lo ya existente ni lo que editaste en el panel.
