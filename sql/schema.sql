-- ============================================================
-- Esquema para "El Recetario" — copia y pega esto entero en
-- Supabase → SQL Editor → New query → Run
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists recetas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text not null default 'Sin categoría',
  tiempo_prep text,
  tiempo_coccion text,
  raciones text,
  ingredientes jsonb not null default '[]'::jsonb,
  pasos jsonb not null default '[]'::jsonb,
  notas text,
  foto_principal text,
  fotos_extra jsonb not null default '[]'::jsonb,
  favorita boolean not null default false,
  creado_por uuid references auth.users(id) on delete set null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- Row Level Security: solo usuarios que han iniciado sesión
-- (es decir, solo las cuentas que tú crees a mano en Supabase)
-- pueden ver o tocar las recetas. Nadie sin login puede entrar.
alter table recetas enable row level security;

create policy "ver recetas si has iniciado sesión"
  on recetas for select
  using (auth.role() = 'authenticated');

create policy "crear recetas si has iniciado sesión"
  on recetas for insert
  with check (auth.role() = 'authenticated');

create policy "editar recetas si has iniciado sesión"
  on recetas for update
  using (auth.role() = 'authenticated');

create policy "borrar recetas si has iniciado sesión"
  on recetas for delete
  using (auth.role() = 'authenticated');

-- Mantiene "actualizado_en" al día automáticamente en cada edición
create or replace function actualizar_fecha_edicion()
returns trigger as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_actualizar_fecha on recetas;
create trigger trg_actualizar_fecha
before update on recetas
for each row execute function actualizar_fecha_edicion();

-- Índice para que ordenar/buscar por título sea rápido
create index if not exists idx_recetas_titulo on recetas (titulo);
create index if not exists idx_recetas_categoria on recetas (categoria);
