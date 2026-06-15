import { getBoard, getContractTypes } from "@/lib/data";
import { KanbanBoard } from "@/components/kanban/kanban-board";

export default async function PlanejamentoPage() {
  const [columns, contractTypes] = await Promise.all([
    getBoard("planning"),
    getContractTypes(),
  ]);

  return (
    <div>
      <div className="px-7 pt-6 text-sm text-slate-500">
        Planeje e organize seus contratos antes de iniciar a execução.
      </div>
      <KanbanBoard board="planning" columns={columns} contractTypes={contractTypes} />
    </div>
  );
}
