-- Ejecuta esto en Supabase → SQL Editor → New query → Run.
-- Corrige el error "new row violates row-level security policy"
-- cambiando la forma de comprobar si hay sesión iniciada.

drop policy if exists "ver recetas si has iniciado sesión" on recetas;
drop policy if exists "crear recetas si has iniciado sesión" on recetas;
drop policy if exists "editar recetas si has iniciado sesión" on recetas;
drop policy if exists "borrar recetas si has iniciado sesión" on recetas;

create policy "ver recetas si has iniciado sesión"
  on recetas for select
  using (auth.uid() is not null);

create policy "crear recetas si has iniciado sesión"
  on recetas for insert
  with check (auth.uid() is not null);

create policy "editar recetas si has iniciado sesión"
  on recetas for update
  using (auth.uid() is not null);

create policy "borrar recetas si has iniciado sesión"
  on recetas for delete
  using (auth.uid() is not null);
