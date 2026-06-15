// Tipos de domínio (espelham o schema do Postgres).
// Quando os tipos gerados estiverem prontos (npm run db:types),
// podemos derivar destes a partir de Database['public']['Tables'].

export type BoardKind = "execution" | "planning";
export type OrgRole = "owner" | "admin" | "member";

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface Phase {
  id: string;
  org_id: string;
  board: BoardKind;
  name: string;
  color: string;
  position: number;
}

export interface TeamType {
  id: string;
  org_id: string;
  name: string;
  color: string;
  position: number;
}

export interface Team {
  id: string;
  org_id: string;
  type_id: string | null;
  name: string;
  color: string;
  position: number;
}

export interface TeamMember {
  id: string;
  org_id: string;
  team_id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  position: number;
}

export interface ContractType {
  id: string;
  org_id: string;
  name: string;
  position: number;
}

export interface WorkStageItem {
  id: string;
  org_id: string;
  stage_id: string;
  team_id: string | null;
  member_id: string | null;
  depends_on: string | null;
  name: string;
  work_days: number;
  start_date: string | null;
  end_date: string | null;
  done: boolean;
  position: number;
}

export interface WorkStage {
  id: string;
  org_id: string;
  work_id: string;
  name: string;
  started_at: string | null;
  finished_at: string | null;
  position: number;
  work_stage_items: WorkStageItem[];
}

export interface Work {
  id: string;
  org_id: string;
  phase_id: string;
  contract_type_id: string | null;
  name: string;
  description: string | null;
  obra_start_date: string | null;
  obra_work_days: number;
  obra_end_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  work_stages: WorkStage[];
  // counts agregados via select
  work_comments: { count: number }[];
  work_files: { count: number }[];
}

// Coluna do kanban já com suas obras
export interface PhaseColumn extends Phase {
  works: Work[];
}
