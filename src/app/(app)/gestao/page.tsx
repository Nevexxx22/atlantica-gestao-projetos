import { getBoard, getContractTypes } from "@/lib/data";
import { KanbanBoard } from "@/components/kanban/kanban-board";

export default async function GestaoPage() {
  const [columns, contractTypes] = await Promise.all([
    getBoard("execution"),
    getContractTypes(),
  ]);

  return (
    <div>
      <div className="px-7 pt-6 text-sm text-slate-500">
        Arraste as obras entre as colunas para acompanhar o andamento.
      </div>
      <KanbanBoard board="execution" columns={columns} contractTypes={contractTypes} />
    </div>
  );
}
