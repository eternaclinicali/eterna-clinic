-- Eterna Clinic CMS · esquema, permisos (RLS) y funciones. Idempotente: se puede ejecutar más de una vez.
-- Modelo: el contenido PÚBLICO (publicado) vive en `entries` y `site_content`; los BORRADORES viven aparte en `drafts`,
-- que solo leen los administradores. Así un borrador nunca puede filtrarse por una consulta pública.
-- Nada se escribe directo en las tablas: todo pasa por funciones (RPC) que validan el rol en el servidor.

-- ───────── Tablas ─────────
create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  role text not null check (role in ('superadmin', 'editor')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.entries (               -- protocolos y consultas (Eterna en Casa y Eterna Travel son consultas)
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('protocolo', 'consulta')),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 60),
  sort integer not null default 0,
  status text not null default 'borrador' check (status in ('borrador', 'publicado', 'archivado')),
  published jsonb check (published is null or jsonb_typeof(published) = 'object'),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, slug)
);
create index if not exists entries_lista on public.entries (kind, status, sort);

create table if not exists public.site_content (          -- bloques de texto de cada página y ajustes generales (clave fija)
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  published jsonb check (published is null or jsonb_typeof(published) = 'object'),
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.drafts (                -- solo administradores
  scope text not null check (scope in ('entrada', 'sitio')),
  ref text not null,                                       -- id de la entrada o clave de site_content
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  primary key (scope, ref)
);

create table if not exists public.content_revisions (     -- historial: cada publicación guarda una versión (solo JSON, las fotos son referencias)
  id bigint generated always as identity primary key,
  scope text not null check (scope in ('entrada', 'sitio')),
  ref text not null,
  data jsonb not null,
  nota text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists revisions_ref on public.content_revisions (scope, ref, created_at desc);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,                                -- ruta pública: /img/x.webp (sitio) o URL de Storage
  storage_path text unique,                                -- null si la imagen viene del sitio original
  alt text not null default '',
  width integer, height integer, bytes integer, mime text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ───────── Funciones de rol ─────────
create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.admin_profiles where user_id = auth.uid() and active) $$;

create or replace function public.es_superadmin() returns boolean
language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.admin_profiles where user_id = auth.uid() and active and role = 'superadmin') $$;

create or replace function public.exigir_admin() returns void language plpgsql stable security definer set search_path = '' as
$$ begin if not public.es_admin() then raise exception 'No autorizado' using errcode = '42501'; end if; end $$;

create or replace function public.exigir_superadmin() returns void language plpgsql stable security definer set search_path = '' as
$$ begin if not public.es_superadmin() then raise exception 'Solo el superadministrador puede hacer esto' using errcode = '42501'; end if; end $$;

-- Rechaza contenido con etiquetas peligrosas o tamaño excesivo (defensa en profundidad; el sitio además sanea al mostrar).
create or replace function public.validar_contenido(p jsonb) returns void language plpgsql immutable set search_path = '' as
$$ begin
  if p is null or jsonb_typeof(p) <> 'object' then raise exception 'Contenido inválido'; end if;
  if pg_column_size(p) > 60000 then raise exception 'El contenido es demasiado grande'; end if;
  if p::text ~* '<\s*(script|iframe|object|embed|style|link|meta|svg)|javascript:|data:text/html' then
    raise exception 'El contenido incluye código no permitido';
  end if;
end $$;

-- ───────── Permisos de tablas (todo cerrado, luego se abre lo mínimo) ─────────
alter table public.admin_profiles enable row level security;
alter table public.entries enable row level security;
alter table public.site_content enable row level security;
alter table public.drafts enable row level security;
alter table public.content_revisions enable row level security;
alter table public.media_assets enable row level security;

revoke all on public.admin_profiles, public.entries, public.site_content, public.drafts, public.content_revisions, public.media_assets from anon, authenticated;
grant select on public.entries, public.site_content to anon, authenticated;
grant select on public.admin_profiles, public.drafts, public.content_revisions to authenticated;
grant select, insert, update on public.media_assets to authenticated;

drop policy if exists entries_publico on public.entries;
create policy entries_publico on public.entries for select to anon, authenticated using (status = 'publicado');
drop policy if exists entries_admin on public.entries;
create policy entries_admin on public.entries for select to authenticated using (public.es_admin());

drop policy if exists site_publico on public.site_content;
create policy site_publico on public.site_content for select to anon, authenticated using (published is not null);
drop policy if exists site_admin on public.site_content;
create policy site_admin on public.site_content for select to authenticated using (public.es_admin());

drop policy if exists drafts_admin on public.drafts;
create policy drafts_admin on public.drafts for select to authenticated using (public.es_admin());
drop policy if exists revisiones_admin on public.content_revisions;
create policy revisiones_admin on public.content_revisions for select to authenticated using (public.es_admin());

drop policy if exists perfiles_ver on public.admin_profiles;
create policy perfiles_ver on public.admin_profiles for select to authenticated using (user_id = auth.uid() or public.es_superadmin());

drop policy if exists media_ver on public.media_assets;
create policy media_ver on public.media_assets for select to authenticated using (public.es_admin());
drop policy if exists media_crear on public.media_assets;
create policy media_crear on public.media_assets for insert to authenticated with check (public.es_admin() and created_by = auth.uid());
drop policy if exists media_alt on public.media_assets;
create policy media_alt on public.media_assets for update to authenticated using (public.es_admin()) with check (public.es_admin());

-- ───────── Contenido: guardar, crear, publicar ─────────
create or replace function public.guardar_borrador(p_scope text, p_ref text, p_data jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.exigir_admin();
  perform public.validar_contenido(p_data);
  if p_scope = 'entrada' then
    if not exists (select 1 from public.entries where id = p_ref::uuid) then raise exception 'La entrada no existe'; end if;
  elsif p_scope = 'sitio' then
    if not exists (select 1 from public.site_content where key = p_ref) then raise exception 'Bloque desconocido'; end if;
  else raise exception 'Ámbito inválido'; end if;
  insert into public.drafts (scope, ref, data, updated_by) values (p_scope, p_ref, p_data, auth.uid())
  on conflict (scope, ref) do update set data = excluded.data, updated_at = now(), updated_by = auth.uid();
  if p_scope = 'entrada' then update public.entries set updated_at = now() where id = p_ref::uuid; end if;
end $$;

create or replace function public.crear_entrada(p_kind text, p_slug text, p_data jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform public.exigir_admin();
  perform public.validar_contenido(p_data);
  insert into public.entries (kind, slug, sort, status)
  values (p_kind, p_slug, coalesce((select max(sort) + 1 from public.entries where kind = p_kind), 0), 'borrador')
  returning id into v_id;
  insert into public.drafts (scope, ref, data, updated_by) values ('entrada', v_id::text, p_data, auth.uid());
  return v_id;
end $$;

create or replace function public.duplicar_entrada(p_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare e public.entries; d jsonb; v_slug text; n int := 1;
begin
  perform public.exigir_admin();
  select * into e from public.entries where id = p_id;
  if not found then raise exception 'La entrada no existe'; end if;
  select data into d from public.drafts where scope = 'entrada' and ref = p_id::text;
  d := coalesce(d, e.published);
  v_slug := left(e.slug, 50) || '-copia';
  while exists (select 1 from public.entries where kind = e.kind and slug = v_slug) loop
    n := n + 1; v_slug := left(e.slug, 48) || '-copia-' || n;
  end loop;
  d := jsonb_set(d, '{nombre}', to_jsonb((d->>'nombre') || ' (copia)'));
  return public.crear_entrada(e.kind, v_slug, d);
end $$;

create or replace function public.publicar(p_scope text, p_ref text, p_nota text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare v jsonb;
begin
  perform public.exigir_superadmin();
  select data into v from public.drafts where scope = p_scope and ref = p_ref;
  if v is null then raise exception 'No hay borrador para publicar'; end if;
  perform public.validar_contenido(v);
  if p_scope = 'entrada' then
    update public.entries set published = v, status = 'publicado', published_at = now(), updated_at = now() where id = p_ref::uuid;
  elsif p_scope = 'sitio' then
    update public.site_content set published = v, published_at = now(), updated_at = now() where key = p_ref;
  else raise exception 'Ámbito inválido'; end if;
  if not found then raise exception 'No existe'; end if;
  insert into public.content_revisions (scope, ref, data, nota, created_by) values (p_scope, p_ref, v, left(p_nota, 200), auth.uid());
  delete from public.content_revisions where scope = p_scope and ref = p_ref and id not in
    (select id from public.content_revisions where scope = p_scope and ref = p_ref order by created_at desc, id desc limit 20);
end $$;

create or replace function public.restaurar_revision(p_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.content_revisions;
begin
  perform public.exigir_admin();
  select * into r from public.content_revisions where id = p_id;
  if not found then raise exception 'La versión no existe'; end if;
  insert into public.drafts (scope, ref, data, updated_by) values (r.scope, r.ref, r.data, auth.uid())
  on conflict (scope, ref) do update set data = excluded.data, updated_at = now(), updated_by = auth.uid();
end $$;

create or replace function public.cambiar_estado(p_id uuid, p_estado text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.exigir_superadmin();
  if p_estado not in ('borrador', 'archivado') then raise exception 'Estado inválido (para publicar usa publicar)'; end if;
  update public.entries set status = p_estado, updated_at = now() where id = p_id;
  if not found then raise exception 'La entrada no existe'; end if;
end $$;

create or replace function public.reordenar_entradas(p_kind text, p_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.exigir_superadmin();
  update public.entries e set sort = o.pos - 1, updated_at = now()
  from unnest(p_ids) with ordinality as o(id, pos) where e.id = o.id and e.kind = p_kind;
end $$;

create or replace function public.eliminar_entrada(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.exigir_superadmin();
  delete from public.entries where id = p_id;
  if not found then raise exception 'La entrada no existe'; end if;
  delete from public.drafts where scope = 'entrada' and ref = p_id::text;
  delete from public.content_revisions where scope = 'entrada' and ref = p_id::text;
end $$;

-- ───────── Multimedia ─────────
create or replace function public.media_uso(p_url text) returns table (scope text, ref text, titulo text, estado text)
language sql stable security definer set search_path = '' as $$
  select 'entrada'::text, e.id::text, coalesce(e.published->>'nombre', e.slug), 'publicado'::text
    from public.entries e
   where public.es_admin() and e.published is not null and position(p_url in e.published::text) > 0
  union all
  select 'entrada', d.ref, coalesce(d.data->>'nombre', d.ref), 'borrador'
    from public.drafts d where public.es_admin() and d.scope = 'entrada' and position(p_url in d.data::text) > 0
  union all
  select 'sitio', s.key, s.key, 'publicado' from public.site_content s
   where public.es_admin() and s.published is not null and position(p_url in s.published::text) > 0
  union all
  select 'sitio', d.ref, d.ref, 'borrador' from public.drafts d
   where public.es_admin() and d.scope = 'sitio' and position(p_url in d.data::text) > 0
$$;

create or replace function public.eliminar_media(p_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare m public.media_assets;
begin
  perform public.exigir_admin();
  select * into m from public.media_assets where id = p_id;
  if not found then raise exception 'La imagen no existe'; end if;
  if m.storage_path is null then raise exception 'Las imágenes originales del sitio no se eliminan desde el panel'; end if;
  if exists (select 1 from public.media_uso(m.url)) then raise exception 'La imagen está en uso; reemplázala primero en el contenido'; end if;
  delete from public.media_assets where id = p_id;
  return m.storage_path;   -- el panel borra después el archivo de Storage
end $$;

-- ───────── Usuarios (solo superadministrador) ─────────
create or replace function public.agregar_admin(p_email text, p_rol text) returns void
language plpgsql security definer set search_path = '' as $$
declare u auth.users;
begin
  perform public.exigir_superadmin();
  if p_rol not in ('superadmin', 'editor') then raise exception 'Rol inválido'; end if;
  select * into u from auth.users where lower(email) = lower(trim(p_email));
  if not found then raise exception 'Ese correo aún no tiene cuenta. Invítalo primero desde Supabase → Authentication → Users → Invite user.'; end if;
  insert into public.admin_profiles (user_id, email, role) values (u.id, u.email, p_rol)
  on conflict (user_id) do update set role = excluded.role, active = true;
end $$;

create or replace function public.cambiar_admin(p_user uuid, p_rol text, p_activo boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.exigir_superadmin();
  if p_user = auth.uid() then raise exception 'No puedes cambiar tu propio rol ni desactivarte'; end if;
  if p_rol not in ('superadmin', 'editor') then raise exception 'Rol inválido'; end if;
  update public.admin_profiles set role = p_rol, active = p_activo where user_id = p_user;
  if not found then raise exception 'El usuario no existe'; end if;
  if not exists (select 1 from public.admin_profiles where role = 'superadmin' and active) then
    raise exception 'Debe quedar al menos un superadministrador activo';
  end if;
end $$;

-- Primer superadministrador: se ejecuta UNA vez desde el SQL Editor (no es invocable desde la web).
create or replace function public.crear_primer_superadmin(p_email text) returns void
language plpgsql security definer set search_path = '' as $$
declare u auth.users;
begin
  if exists (select 1 from public.admin_profiles where role = 'superadmin') then raise exception 'Ya existe un superadministrador'; end if;
  select * into u from auth.users where lower(email) = lower(trim(p_email));
  if not found then raise exception 'Primero crea o invita a ese usuario en Authentication → Users'; end if;
  insert into public.admin_profiles (user_id, email, role) values (u.id, u.email, 'superadmin');
end $$;

-- Permisos de ejecución: nada para anónimos; solo usuarios con sesión (cada función valida el rol por dentro).
do $$ declare f text; begin
  foreach f in array array[
    'es_admin()', 'es_superadmin()', 'exigir_admin()', 'exigir_superadmin()', 'validar_contenido(jsonb)',
    'guardar_borrador(text,text,jsonb)', 'crear_entrada(text,text,jsonb)', 'duplicar_entrada(uuid)', 'publicar(text,text,text)',
    'restaurar_revision(bigint)', 'cambiar_estado(uuid,text)', 'reordenar_entradas(text,uuid[])', 'eliminar_entrada(uuid)',
    'media_uso(text)', 'eliminar_media(uuid)', 'agregar_admin(text,text)', 'cambiar_admin(uuid,text,boolean)', 'crear_primer_superadmin(text)'
  ] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
  end loop;
  foreach f in array array[
    'es_admin()', 'es_superadmin()', 'guardar_borrador(text,text,jsonb)', 'crear_entrada(text,text,jsonb)', 'duplicar_entrada(uuid)', 'publicar(text,text,text)',
    'restaurar_revision(bigint)', 'cambiar_estado(uuid,text)', 'reordenar_entradas(text,uuid[])', 'eliminar_entrada(uuid)',
    'media_uso(text)', 'eliminar_media(uuid)', 'agregar_admin(text,text)', 'cambiar_admin(uuid,text,boolean)'
  ] loop
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
  -- las políticas RLS evalúan es_admin()/es_superadmin() también para visitantes (devuelven false)
  grant execute on function public.es_admin() to anon;
  grant execute on function public.es_superadmin() to anon;
end $$;

-- ───────── Storage: bucket público de imágenes; solo administradores escriben ─────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png'];

drop policy if exists media_leer on storage.objects;
create policy media_leer on storage.objects for select to authenticated using (bucket_id = 'media' and public.es_admin());
drop policy if exists media_subir on storage.objects;
create policy media_subir on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.es_admin());
drop policy if exists media_cambiar on storage.objects;
create policy media_cambiar on storage.objects for update to authenticated using (bucket_id = 'media' and public.es_admin());
drop policy if exists media_borrar on storage.objects;
create policy media_borrar on storage.objects for delete to authenticated using (bucket_id = 'media' and public.es_admin());
