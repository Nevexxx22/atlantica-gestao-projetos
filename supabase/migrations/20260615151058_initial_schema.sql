-- =============================================================
-- Gestão de Obras — schema inicial
-- Multi-tenancy por organização (empresa) + RLS
-- =============================================================

-- Extensões úteis
create extension if not exists "pgcrypto";

-- =============================================================
-- ORGANIZAÇÕES E MEMBROS
-- =============================================================

create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

create type public.org_role as enum ('owner', 'admin', 'member');

create table public.organization_members (
  org_id      uuid not null references public.organizations (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        public.org_role not null default 'member',
  created_at  timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index organization_members_user_id_idx on public.organization_members (user_id);

-- =============================================================
-- FUNÇÃO HELPER PARA RLS
-- Roda como definer para evitar recursão de RLS na própria tabela
-- de membros, e indexada por (user_id, org_id).
-- =============================================================

create or replace function public.is_org_member(_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.org_id = _org_id
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_org_admin(_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.org_id = _org_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin')
  );
$$;

-- =============================================================
-- CONFIGURAÇÕES: TIPOS DE EQUIPE / EQUIPES / MEMBROS
-- =============================================================

create table public.team_types (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  name        text not null,
  color       text not null default '#3b82f6',
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index team_types_org_id_idx on public.team_types (org_id);

create table public.teams (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  type_id     uuid references public.team_types (id) on delete set null,
  name        text not null,
  color       text not null default '#3b82f6',
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index teams_org_id_idx on public.teams (org_id);
create index teams_type_id_idx on public.teams (type_id);

create table public.team_members (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  team_id     uuid not null references public.teams (id) on delete cascade,
  name        text not null,
  role        text,
  phone       text,
  email       text,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index team_members_org_id_idx on public.team_members (org_id);
create index team_members_team_id_idx on public.team_members (team_id);

-- =============================================================
-- BIBLIOTECA DE ETAPAS (stage templates)
-- =============================================================

create table public.stage_templates (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  name        text not null,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index stage_templates_org_id_idx on public.stage_templates (org_id);

create table public.stage_template_items (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  template_id uuid not null references public.stage_templates (id) on delete cascade,
  name        text not null,
  work_days   numeric(6,1) not null default 0,
  position    integer not null default 0
);
create index stage_template_items_org_id_idx on public.stage_template_items (org_id);
create index stage_template_items_template_id_idx on public.stage_template_items (template_id);

-- =============================================================
-- TIPOS DE CONTRATO (com etapas/subfases predefinidas)
-- =============================================================

create table public.contract_types (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  name        text not null,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index contract_types_org_id_idx on public.contract_types (org_id);

create table public.contract_type_stages (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organizations (id) on delete cascade,
  contract_type_id uuid not null references public.contract_types (id) on delete cascade,
  name             text not null,
  position         integer not null default 0
);
create index contract_type_stages_org_id_idx on public.contract_type_stages (org_id);
create index contract_type_stages_contract_type_id_idx on public.contract_type_stages (contract_type_id);

create table public.contract_type_stage_items (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  stage_id    uuid not null references public.contract_type_stages (id) on delete cascade,
  name        text not null,
  work_days   numeric(6,1) not null default 0,
  position    integer not null default 0
);
create index contract_type_stage_items_org_id_idx on public.contract_type_stage_items (org_id);
create index contract_type_stage_items_stage_id_idx on public.contract_type_stage_items (stage_id);

-- =============================================================
-- KANBAN: FASES (colunas) — execução e planejamento
-- =============================================================

create type public.board_kind as enum ('execution', 'planning');

create table public.phases (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  board       public.board_kind not null default 'execution',
  name        text not null,
  color       text not null default '#6366f1',
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index phases_org_id_idx on public.phases (org_id);
create index phases_org_board_idx on public.phases (org_id, board);

-- =============================================================
-- OBRAS (works) e estrutura interna
-- =============================================================

create table public.works (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organizations (id) on delete cascade,
  phase_id         uuid not null references public.phases (id) on delete cascade,
  contract_type_id uuid references public.contract_types (id) on delete set null,
  name             text not null,
  description      text,
  obra_start_date  date,
  obra_work_days   integer not null default 0,
  obra_end_date    date,
  position         integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index works_org_id_idx on public.works (org_id);
create index works_phase_id_idx on public.works (phase_id);
create index works_contract_type_id_idx on public.works (contract_type_id);

-- Etapas da obra (checklists)
create table public.work_stages (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  work_id     uuid not null references public.works (id) on delete cascade,
  name        text not null,
  started_at  date,
  finished_at date,
  position    integer not null default 0
);
create index work_stages_org_id_idx on public.work_stages (org_id);
create index work_stages_work_id_idx on public.work_stages (work_id);

-- Subfases (items)
create table public.work_stage_items (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  stage_id    uuid not null references public.work_stages (id) on delete cascade,
  team_id     uuid references public.teams (id) on delete set null,
  member_id   uuid references public.team_members (id) on delete set null,
  depends_on  uuid references public.work_stage_items (id) on delete set null,
  name        text not null default '',
  work_days   numeric(6,1) not null default 0,
  start_date  date,
  end_date    date,
  done        boolean not null default false,
  position    integer not null default 0
);
create index work_stage_items_org_id_idx on public.work_stage_items (org_id);
create index work_stage_items_stage_id_idx on public.work_stage_items (stage_id);
create index work_stage_items_team_id_idx on public.work_stage_items (team_id);
create index work_stage_items_depends_on_idx on public.work_stage_items (depends_on);

-- Comentários
create table public.work_comments (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations (id) on delete cascade,
  work_id         uuid not null references public.works (id) on delete cascade,
  author          text not null,
  author_user_id  uuid references auth.users (id) on delete set null,
  body            text not null,
  created_at      timestamptz not null default now()
);
create index work_comments_org_id_idx on public.work_comments (org_id);
create index work_comments_work_id_idx on public.work_comments (work_id);

-- Arquivos (metadados; conteúdo vai para o Supabase Storage)
create table public.work_files (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  work_id       uuid not null references public.works (id) on delete cascade,
  name          text not null,
  mime_type     text,
  size_bytes    bigint not null default 0,
  storage_path  text not null,
  uploaded_by   uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index work_files_org_id_idx on public.work_files (org_id);
create index work_files_work_id_idx on public.work_files (work_id);

-- =============================================================
-- updated_at automático em works
-- =============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger works_set_updated_at
  before update on public.works
  for each row execute function public.set_updated_at();

-- =============================================================
-- NOVO USUÁRIO: cria profile + organização padrão + membership
-- =============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  _org_id uuid;
  _org_name text;
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));

  _org_name := coalesce(
    new.raw_user_meta_data ->> 'org_name',
    'Minha Empresa'
  );

  insert into public.organizations (name)
  values (_org_name)
  returning id into _org_id;

  insert into public.organization_members (org_id, user_id, role)
  values (_org_id, new.id, 'owner');

  -- Fases padrão de execução
  insert into public.phases (org_id, board, name, color, position) values
    (_org_id, 'execution', 'A Iniciar',     '#6366f1', 0),
    (_org_id, 'execution', 'Em Andamento',  '#f59e0b', 1),
    (_org_id, 'execution', 'Concluído',     '#22c55e', 2),
    (_org_id, 'planning',  'Em Planejamento','#a855f7', 0);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

alter table public.organizations          enable row level security;
alter table public.profiles                enable row level security;
alter table public.organization_members    enable row level security;
alter table public.team_types              enable row level security;
alter table public.teams                   enable row level security;
alter table public.team_members            enable row level security;
alter table public.stage_templates         enable row level security;
alter table public.stage_template_items    enable row level security;
alter table public.contract_types          enable row level security;
alter table public.contract_type_stages    enable row level security;
alter table public.contract_type_stage_items enable row level security;
alter table public.phases                  enable row level security;
alter table public.works                   enable row level security;
alter table public.work_stages             enable row level security;
alter table public.work_stage_items        enable row level security;
alter table public.work_comments           enable row level security;
alter table public.work_files              enable row level security;

-- profiles: cada um vê/edita o próprio
create policy "profiles_select_own" on public.profiles
  for select using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update using ((select auth.uid()) = id);

-- organizations: membros podem ver; admins podem atualizar
create policy "orgs_select_member" on public.organizations
  for select using (public.is_org_member(id));
create policy "orgs_update_admin" on public.organizations
  for update using (public.is_org_admin(id));

-- organization_members: membros da org enxergam a lista; admins gerenciam
create policy "org_members_select" on public.organization_members
  for select using (public.is_org_member(org_id));
create policy "org_members_insert_admin" on public.organization_members
  for insert with check (public.is_org_admin(org_id));
create policy "org_members_update_admin" on public.organization_members
  for update using (public.is_org_admin(org_id));
create policy "org_members_delete_admin" on public.organization_members
  for delete using (public.is_org_admin(org_id));

-- Política genérica por org_id para as tabelas de domínio.
-- (membro da org tem acesso total de leitura/escrita)
do $$
declare
  t text;
  domain_tables text[] := array[
    'team_types','teams','team_members',
    'stage_templates','stage_template_items',
    'contract_types','contract_type_stages','contract_type_stage_items',
    'phases','works','work_stages','work_stage_items',
    'work_comments','work_files'
  ];
begin
  foreach t in array domain_tables loop
    execute format(
      'create policy %I on public.%I for all
         using (public.is_org_member(org_id))
         with check (public.is_org_member(org_id));',
      t || '_org_access', t
    );
  end loop;
end;
$$;
