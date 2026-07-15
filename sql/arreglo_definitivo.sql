-- ============================================================
-- SOLUCIÓN DEFINITIVA — pega esto entero en Supabase → SQL Editor
-- → New query → Run. Da igual qué scripts hayas ejecutado antes,
-- este limpia cualquier política previa (tenga el nombre que tenga)
-- y deja la tabla "recetas" y el almacén de fotos correctamente
-- configurados desde cero.
-- ============================================================

-- 1) Limpiar TODAS las políticas existentes en la tabla "recetas",
--    sea cual sea su nombre (por si algún intento anterior no se
--    borró bien).
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where tablename = 'recetas' loop
    execute format('drop policy %I on recetas', pol.policyname);
  end loop;
end $$;

alter table recetas enable row level security;

create policy "recetas_select" on recetas for select
  using (auth.uid() is not null);
create policy "recetas_insert" on recetas for insert
  with check (auth.uid() is not null);
create policy "recetas_update" on recetas for update
  using (auth.uid() is not null);
create policy "recetas_delete" on recetas for delete
  using (auth.uid() is not null);

-- 2) Limpiar cualquier política previa sobre el almacén de fotos
--    que mencione nuestro bucket, y volver a crearlas bien.
do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where tablename = 'objects' and schemaname = 'storage'
      and (qual like '%fotos-recetas%' or with_check like '%fotos-recetas%')
  loop
    execute format('drop policy %I on storage.objects', pol.policyname);
  end loop;
end $$;

create policy "fotos_select" on storage.objects for select
  using (bucket_id = 'fotos-recetas');
create policy "fotos_insert" on storage.objects for insert
  with check (bucket_id = 'fotos-recetas' and auth.uid() is not null);
create policy "fotos_update" on storage.objects for update
  using (bucket_id = 'fotos-recetas' and auth.uid() is not null);
create policy "fotos_delete" on storage.objects for delete
  using (bucket_id = 'fotos-recetas' and auth.uid() is not null);

-- 3) Comprobación — deberías ver 4 filas para "recetas" y 4 para
--    "objects", todas con auth.uid() en la columna qual/with_check.
select tablename, policyname, cmd from pg_policies
where tablename in ('recetas', 'objects')
order by tablename, cmd;
