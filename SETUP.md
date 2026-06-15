# Configuração — Gestão de Obras (Next.js + Supabase)

Fundação do projeto. Stack: **Next.js 16 (App Router) + Supabase (Postgres, Auth, Storage)**, deploy na **Vercel**.

A UI original (HTML) está em [`reference/GESTAO_DE_OBRAS.html`](reference/GESTAO_DE_OBRAS.html) e serve de referência para portar as telas.

---

## 1. Pré-requisitos

- Node 24 e npm (já instalados)
- Supabase CLI (já instalado — `supabase --version`)
- Docker Desktop **rodando** (necessário só para o ambiente local `supabase start`)
- Conta no [Supabase](https://supabase.com) e na [Vercel](https://vercel.com)

## 2. Criar o projeto no Supabase

1. No dashboard do Supabase, **New project**. Anote a senha do banco.
2. Em **Project Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (secreta)

## 3. Conectar o CLI ao projeto

```bash
supabase login
supabase link --project-ref <SEU_PROJECT_REF>   # ref está na URL do dashboard
```

## 4. Aplicar o schema

As migrations estão em [`supabase/migrations/`](supabase/migrations/):

- `..._initial_schema.sql` — tabelas, RLS por organização, triggers
- `..._storage.sql` — bucket `work-files` + policies

**Opção A — direto no projeto remoto:**

```bash
npm run db:push        # supabase db push
```

**Opção B — desenvolvimento local (precisa de Docker):**

```bash
npm run db:start       # sobe Postgres/Auth/Storage locais e aplica as migrations
npm run db:reset       # recria o banco local do zero a partir das migrations
```

## 5. Variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preencha com os valores do passo 2 (ou os impressos por `supabase start`, para local).

## 6. Gerar os tipos TypeScript

```bash
# a partir do banco local (após supabase start):
npm run db:types

# ou a partir do projeto remoto vinculado:
supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

## 7. Rodar a aplicação

```bash
npm run dev      # http://localhost:3000
```

## 8. Deploy na Vercel

1. Suba o repositório no GitHub e importe na Vercel.
2. Em **Settings → Environment Variables**, adicione `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (e `SUPABASE_SERVICE_ROLE_KEY` se usado).
3. Em **Supabase → Authentication → URL Configuration**, adicione a URL da Vercel
   em *Site URL* e *Redirect URLs*.

---

## Modelo de dados (resumo)

Multi-tenancy por **organização** (empresa). Todo dado pertence a uma org e o acesso
é controlado por RLS via `is_org_member(org_id)`.

Ao criar um usuário (signup), um trigger cria automaticamente: `profile`,
uma `organization` ("Minha Empresa"), o vínculo `organization_members` como `owner`
e as fases padrão do Kanban.

| Conceito (HTML)        | Tabela(s)                                                    |
|------------------------|-------------------------------------------------------------|
| `phases` / `planningPhases` | `phases` (coluna `board` = `execution` \| `planning`)  |
| Obra (`card`)          | `works`                                                      |
| Etapa (`checklist`)    | `work_stages`                                                |
| Subfase (`item`)       | `work_stage_items` (com `depends_on`, `team_id`, `done`…)    |
| Comentário             | `work_comments`                                              |
| Arquivo                | `work_files` (metadados) + bucket `work-files` no Storage    |
| `teams` / `members`    | `teams` / `team_members`                                     |
| `teamTypes`            | `team_types`                                                 |
| `contractTypes`        | `contract_types` → `contract_type_stages` → `..._stage_items`|
| `stageTemplates`       | `stage_templates` → `stage_template_items`                   |

> O cálculo de dias úteis/feriados e a árvore de dependências hoje vivem no JS do
> HTML; ao portar, isso pode virar utilitários no front ou funções no Postgres.
