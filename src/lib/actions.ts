"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/data";

function revalidateBoards() {
  revalidatePath("/planejamento");
  revalidatePath("/gestao");
}

async function nextPosition(table: string, column: string, value: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, value);
  return count ?? 0;
}

// ---------------------------------------------------------------
// OBRAS (works)
// ---------------------------------------------------------------

export async function createWork(phaseId: string, name: string) {
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("Organização não encontrada.");
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Informe o nome da obra.");

  const supabase = await createClient();
  const position = await nextPosition("works", "phase_id", phaseId);
  const { error } = await supabase.from("works").insert({
    org_id: orgId,
    phase_id: phaseId,
    name: trimmed,
    position,
  });
  if (error) throw new Error(error.message);
  revalidateBoards();
}

export async function moveWork(workId: string, toPhaseId: string) {
  const supabase = await createClient();
  const position = await nextPosition("works", "phase_id", toPhaseId);
  const { error } = await supabase
    .from("works")
    .update({ phase_id: toPhaseId, position })
    .eq("id", workId);
  if (error) throw new Error(error.message);
  revalidateBoards();
}

export interface WorkDetailsInput {
  name: string;
  description: string | null;
  contract_type_id: string | null;
  obra_start_date: string | null;
  obra_work_days: number;
  obra_end_date: string | null;
}

export async function updateWorkDetails(
  workId: string,
  fields: WorkDetailsInput,
) {
  const trimmed = fields.name.trim();
  if (!trimmed) throw new Error("Informe o nome da obra.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("works")
    .update({ ...fields, name: trimmed })
    .eq("id", workId);
  if (error) throw new Error(error.message);
  revalidateBoards();
}

export async function deleteWork(workId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("works").delete().eq("id", workId);
  if (error) throw new Error(error.message);
  revalidateBoards();
}

/** Move uma obra do planejamento para a primeira fase de execução. */
export async function finalizeToExecution(workId: string) {
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("Organização não encontrada.");
  const supabase = await createClient();

  const { data: phase } = await supabase
    .from("phases")
    .select("id")
    .eq("org_id", orgId)
    .eq("board", "execution")
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!phase) throw new Error("Nenhuma fase de execução encontrada.");
  await moveWork(workId, phase.id);
}

// ---------------------------------------------------------------
// FASES (phases / colunas do kanban)
// ---------------------------------------------------------------

export async function createPhase(
  board: "execution" | "planning",
  name: string,
) {
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("Organização não encontrada.");
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Informe o nome da fase.");

  const supabase = await createClient();
  const { count } = await supabase
    .from("phases")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("board", board);

  const palette = [
    "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7",
    "#06b6d4", "#f97316", "#ec4899", "#14b8a6", "#6366f1",
  ];
  const position = count ?? 0;
  const { error } = await supabase.from("phases").insert({
    org_id: orgId,
    board,
    name: trimmed,
    color: palette[position % palette.length],
    position,
  });
  if (error) throw new Error(error.message);
  revalidateBoards();
}

export async function renamePhase(phaseId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Informe o nome da fase.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("phases")
    .update({ name: trimmed })
    .eq("id", phaseId);
  if (error) throw new Error(error.message);
  revalidateBoards();
}

export async function deletePhase(phaseId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("phases").delete().eq("id", phaseId);
  if (error) throw new Error(error.message);
  revalidateBoards();
}
