-- Ejecuta esto en Supabase → SQL Editor → New query → Run.
-- El bucket "fotos-recetas" ya está marcado como público para LEER,
-- pero también necesita permiso explícito para SUBIR/editar/borrar
-- fotos, que es justo lo que falta y provoca el error al guardar
-- una receta con foto.

create policy "cualquiera puede ver las fotos"
  on storage.objects for select
  using (bucket_id = 'fotos-recetas');

create policy "subir fotos si has iniciado sesión"
  on storage.objects for insert
  with check (bucket_id = 'fotos-recetas' and auth.uid() is not null);

create policy "editar fotos si has iniciado sesión"
  on storage.objects for update
  using (bucket_id = 'fotos-recetas' and auth.uid() is not null);

create policy "borrar fotos si has iniciado sesión"
  on storage.objects for delete
  using (bucket_id = 'fotos-recetas' and auth.uid() is not null);
