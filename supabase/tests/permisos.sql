\set ON_ERROR_STOP 0
create function pg_temp.sesion(uid text, rol text) returns void language plpgsql as $f$ begin perform set_config('request.jwt.claim.sub', uid, false); execute 'set role ' || rol; end $f$;
create function pg_temp.espera_error(etq text, q text) returns void language plpgsql as $f$
begin execute q; raise notice 'FALLO  % (se permitió)', etq;
exception when others then raise notice 'PASA   % -> %', etq, left(sqlerrm, 70); end $f$;
create function pg_temp.espera_ok(etq text, q text) returns void language plpgsql as $f$
begin execute q; raise notice 'PASA   %', etq;
exception when others then raise notice 'FALLO  % -> %', etq, sqlerrm; end $f$;
create function pg_temp.cuenta(etq text, q text, esperado int) returns void language plpgsql as $f$
declare n int; begin execute 'select count(*) from (' || q || ') x' into n;
 if n = esperado then raise notice 'PASA   % (%)', etq, n; else raise notice 'FALLO  % (esperado %, hay %)', etq, esperado, n; end if; end $f$;

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a1','super@x.co'),('00000000-0000-0000-0000-0000000000b2','editor@x.co'),('00000000-0000-0000-0000-0000000000c3','ajeno@x.co');
select public.crear_primer_superadmin('super@x.co');
select pg_temp.espera_error('crear_primer_superadmin dos veces', $q$select public.crear_primer_superadmin('editor@x.co')$q$);
insert into public.site_content (key, published) values ('inicio', '{"t":"a"}'), ('ajustes', null);
insert into public.entries (kind, slug, sort, status, published) values ('protocolo','reset',0,'publicado','{"nombre":"Reset","img":"/img/reset.webp"}'), ('protocolo','oculto',1,'borrador','{"nombre":"Oculto"}');
insert into public.drafts values ('entrada', (select id::text from public.entries where slug='reset'), '{"nombre":"Reset BORRADOR SECRETO"}', now(), null);

-- Visitante anónimo
select pg_temp.sesion('', 'anon');
select pg_temp.cuenta('anon ve solo publicados', 'select * from public.entries', 1);
select pg_temp.cuenta('anon ve site_content publicado', 'select * from public.site_content', 1);
select pg_temp.espera_error('anon NO lee drafts', 'select * from public.drafts');
select pg_temp.espera_error('anon NO lee revisiones', 'select * from public.content_revisions');
select pg_temp.espera_error('anon NO lee admin_profiles', 'select * from public.admin_profiles');
select pg_temp.espera_error('anon NO inserta entries', $q$insert into public.entries(kind,slug) values ('protocolo','x')$q$);
select pg_temp.espera_error('anon NO actualiza entries', $q$update public.entries set status='publicado'$q$);
select pg_temp.espera_error('anon NO guarda borrador', $q$select public.guardar_borrador('sitio','inicio','{}')$q$);
select pg_temp.espera_error('anon NO publica', $q$select public.publicar('sitio','inicio')$q$);
select pg_temp.espera_error('anon NO agrega admin', $q$select public.agregar_admin('x@x.co','superadmin')$q$);
reset role;

-- Usuario autenticado SIN perfil (p. ej. si alguien lograra registrarse)
select pg_temp.sesion('00000000-0000-0000-0000-0000000000c3', 'authenticated');
select pg_temp.cuenta('ajeno ve solo publicados', 'select * from public.entries', 1);
select pg_temp.cuenta('ajeno NO ve borradores', 'select * from public.drafts', 0);
select pg_temp.espera_error('ajeno NO guarda borrador', $q$select public.guardar_borrador('sitio','inicio','{"a":1}')$q$);
select pg_temp.espera_error('ajeno NO se auto-asigna rol', $q$insert into public.admin_profiles(user_id,email,role) values ('00000000-0000-0000-0000-0000000000c3','ajeno@x.co','superadmin')$q$);
select pg_temp.espera_error('ajeno NO usa agregar_admin', $q$select public.agregar_admin('ajeno@x.co','superadmin')$q$);
select pg_temp.espera_error('ajeno NO sube media', $q$insert into public.media_assets(url,created_by) values ('/x',  '00000000-0000-0000-0000-0000000000c3')$q$);
reset role;

-- Editor
select pg_temp.sesion('00000000-0000-0000-0000-0000000000a1', 'authenticated');
select public.agregar_admin('editor@x.co','editor');
reset role;
select pg_temp.sesion('00000000-0000-0000-0000-0000000000b2', 'authenticated');
select pg_temp.cuenta('editor ve todas las entradas', 'select * from public.entries', 2);
select pg_temp.cuenta('editor ve borradores', 'select * from public.drafts', 1);
select pg_temp.cuenta('editor solo ve su propio perfil', 'select * from public.admin_profiles', 1);
select pg_temp.espera_ok('editor guarda borrador', $q$select public.guardar_borrador('entrada',(select id::text from public.entries where slug='reset'),'{"nombre":"Reset v2"}')$q$);
select pg_temp.espera_ok('editor crea entrada', $q$select public.crear_entrada('protocolo','nuevo-protocolo','{"nombre":"Nuevo"}')$q$);
select pg_temp.espera_ok('editor duplica', $q$select public.duplicar_entrada((select id from public.entries where slug='reset'))$q$);
select pg_temp.espera_error('editor NO publica', $q$select public.publicar('sitio','inicio')$q$);
select pg_temp.espera_error('editor NO archiva', $q$select public.cambiar_estado((select id from public.entries where slug='reset'),'archivado')$q$);
select pg_temp.espera_error('editor NO elimina', $q$select public.eliminar_entrada((select id from public.entries where slug='reset'))$q$);
select pg_temp.espera_error('editor NO reordena', $q$select public.reordenar_entradas('protocolo', array[]::uuid[])$q$);
select pg_temp.espera_error('editor NO sube su rol (directo)', $q$update public.admin_profiles set role='superadmin' where user_id='00000000-0000-0000-0000-0000000000b2'$q$);
select pg_temp.espera_error('editor NO sube su rol (rpc)', $q$select public.cambiar_admin('00000000-0000-0000-0000-0000000000b2','superadmin',true)$q$);
select pg_temp.espera_error('editor NO publica directo en entries', $q$update public.entries set status='publicado'$q$);
select pg_temp.espera_error('editor NO inserta directo en entries', $q$insert into public.entries(kind,slug) values ('protocolo','z')$q$);
select pg_temp.espera_error('editor NO escribe en drafts directo', $q$update public.drafts set data='{}'$q$);
select pg_temp.espera_error('contenido con <script> rechazado', $q$select public.guardar_borrador('sitio','inicio','{"t":"<script>alert(1)</script>"}')$q$);
select pg_temp.espera_error('contenido con javascript: rechazado', $q$select public.guardar_borrador('sitio','inicio','{"u":"javascript:alert(1)"}')$q$);
select pg_temp.espera_error('slug inválido rechazado', $q$select public.crear_entrada('protocolo','Mal Slug!','{"nombre":"x"}')$q$);
select pg_temp.espera_error('slug repetido rechazado', $q$select public.crear_entrada('protocolo','reset','{"nombre":"x"}')$q$);
reset role;

-- Anon sigue sin ver nada nuevo
select pg_temp.sesion('', 'anon');
select pg_temp.cuenta('anon sigue viendo 1 publicado tras las ediciones', 'select * from public.entries', 1);
select pg_temp.cuenta('anon: el publicado conserva el texto viejo', $q$select * from public.entries where published->>'nombre'='Reset'$q$, 1);
reset role;

-- Superadmin
select pg_temp.sesion('00000000-0000-0000-0000-0000000000a1', 'authenticated');
select pg_temp.espera_ok('super publica entrada', $q$select public.publicar('entrada',(select id::text from public.entries where slug='reset'),'prueba')$q$);
select pg_temp.cuenta('revisión creada', 'select * from public.content_revisions', 1);
select pg_temp.espera_ok('super restaura revisión', $q$select public.restaurar_revision((select max(id) from public.content_revisions))$q$);
select pg_temp.espera_error('super NO cambia su propio rol', $q$select public.cambiar_admin('00000000-0000-0000-0000-0000000000a1','editor',true)$q$);
select pg_temp.espera_ok('super archiva', $q$select public.cambiar_estado((select id from public.entries where slug='oculto'),'archivado')$q$);
select pg_temp.espera_error('estado inválido', $q$select public.cambiar_estado((select id from public.entries where slug='oculto'),'publicado')$q$);
select pg_temp.espera_ok('super reordena', $q$select public.reordenar_entradas('protocolo', array[(select id from public.entries where slug='oculto'),(select id from public.entries where slug='reset')])$q$);
select pg_temp.espera_ok('super sube media a', $q$insert into public.media_assets(url,storage_path,created_by) values ('https://x.supabase.co/storage/v1/object/public/media/a.webp','a.webp','00000000-0000-0000-0000-0000000000a1')$q$);
select pg_temp.espera_ok('super sube media b', $q$insert into public.media_assets(url,storage_path,created_by) values ('https://x/b.webp','b.webp','00000000-0000-0000-0000-0000000000a1')$q$);
select pg_temp.espera_ok('super borra media sin uso', $q$select public.eliminar_media((select id from public.media_assets where storage_path='b.webp'))$q$);
select pg_temp.espera_ok('super guarda borrador con imagen', $q$select public.guardar_borrador('sitio','inicio','{"img":"https://x.supabase.co/storage/v1/object/public/media/a.webp"}')$q$);
select pg_temp.espera_error('NO borra media en uso (borrador)', $q$select public.eliminar_media((select id from public.media_assets where storage_path='a.webp'))$q$);
select pg_temp.espera_ok('registra imagen original', $q$insert into public.media_assets(url,storage_path,created_by) values ('/img/reset.webp',null,'00000000-0000-0000-0000-0000000000a1')$q$);
select pg_temp.espera_error('NO borra imagen original del sitio', $q$select public.eliminar_media((select id from public.media_assets where url='/img/reset.webp'))$q$);
select pg_temp.cuenta('media_uso encuentra el uso', $q$select * from public.media_uso('https://x.supabase.co/storage/v1/object/public/media/a.webp')$q$, 1);
select pg_temp.espera_ok('super elimina entrada', $q$select public.eliminar_entrada((select id from public.entries where slug='oculto'))$q$);
reset role;
select pg_temp.sesion('00000000-0000-0000-0000-0000000000c3', 'authenticated');
select pg_temp.espera_error('crear_primer_superadmin no invocable desde la web', $q$select public.crear_primer_superadmin('ajeno@x.co')$q$);
reset role;
