import { createClient } from "@/lib/supabase/server";
import type { BoardKind, ContractType, PhaseColumn, Work } from "@/lib/types";

/**
 * Retorna o org_id da organização do usuário logado.
 * (Por ora assumimos 1 org por usuário; se houver várias, pega a primeira.)
 */
export async function getCurrentOrgId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.org_id;
}

const WORK_SELECT = `
  id, org_id, phase_id, contract_type_id, name, description,
  obra_start_date, obra_work_days, obra_end_date, position, created_at, updated_at,
  work_stages (
    id, org_id, work_id, name, started_at, finished_at, position,
    work_stage_items (
      id, org_id, stage_id, team_id, member_id, depends_on, name,
      work_days, start_date, end_date, done, position
    )
  ),
  work_comments (count),
  work_files (count)
`;

/**
 * Carrega as colunas (fases) de um board com suas obras aninhadas.
 */
export async function getBoard(board: BoardKind): Promise<PhaseColumn[]> {
  const supabase = await createClient();

  const { data: phases, error } = await supabase
    .from("phases")
    .select("id, org_id, board, name, color, position")
    .eq("board", board)
    .order("position", { ascending: true });

  if (error || !phases) return [];

  const { data: works } = await supabase
    .from("works")
    .select(WORK_SELECT)
    .order("position", { ascending: true });

  const byPhase = new Map<string, Work[]>();
  for (const w of (works ?? []) as unknown as Work[]) {
    // ordena etapas e subfases
    w.work_stages?.sort((a, b) => a.position - b.position);
    w.work_stages?.forEach((s) =>
      s.work_stage_items?.sort((a, b) => a.position - b.position),
    );
    const list = byPhase.get(w.phase_id) ?? [];
    list.push(w);
    byPhase.set(w.phase_id, list);
  }

  return phases.map((p) => ({
    ...p,
    works: byPhase.get(p.id) ?? [],
  })) as PhaseColumn[];
}

export async function getContractTypes(): Promise<ContractType[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contract_types")
    .select("id, org_id, name, position")
    .order("position", { ascending: true });
  return (data ?? []) as ContractType[];
}
