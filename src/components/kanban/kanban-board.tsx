"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  createPhase,
  createWork,
  deletePhase,
  moveWork,
  renamePhase,
} from "@/lib/actions";
import type { BoardKind, ContractType, PhaseColumn, Work } from "@/lib/types";
import { WorkModal } from "./work-modal";

interface Props {
  board: BoardKind;
  columns: PhaseColumn[];
  contractTypes: ContractType[];
}

export function KanbanBoard({ board, columns, contractTypes }: Props) {
  const [cols, setCols] = useState<PhaseColumn[]>(columns);
  const [openWork, setOpenWork] = useState<Work | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [, start] = useTransition();
  const isPlanning = board === "planning";

  // Re-sincroniza quando o servidor revalida.
  useEffect(() => setCols(columns), [columns]);

  function findWork(id: string): Work | undefined {
    for (const c of cols) {
      const w = c.works.find((w) => w.id === id);
      if (w) return w;
    }
  }

  function handleDrop(toPhaseId: string) {
    setDragOver(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const work = findWork(id);
    if (!work || work.phase_id === toPhaseId) return;

    // Otimista
    setCols((prev) =>
      prev.map((c) => ({
        ...c,
        works:
          c.id === toPhaseId
            ? [...c.works.filter((w) => w.id !== id), { ...work, phase_id: toPhaseId }]
            : c.works.filter((w) => w.id !== id),
      })),
    );
    start(() => {
      moveWork(id, toPhaseId).catch(() => setCols(columns));
    });
  }

  return (
    <div className="flex items-start gap-4 overflow-x-auto p-7">
      {cols.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
          Nenhuma fase ainda.
        </div>
      )}

      {cols.map((col) => (
        <Column
          key={col.id}
          col={col}
          isPlanning={isPlanning}
          dragOver={dragOver === col.id}
          contractTypes={contractTypes}
          onDragOver={() => setDragOver(col.id)}
          onDrop={() => handleDrop(col.id)}
          onCardDragStart={setDragId}
          onOpen={setOpenWork}
        />
      ))}

      {isPlanning && <AddListButton />}

      {openWork && (
        <WorkModal
          work={openWork}
          contractTypes={contractTypes}
          isPlanning={isPlanning}
          onClose={() => setOpenWork(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------

function Column({
  col,
  isPlanning,
  dragOver,
  contractTypes,
  onDragOver,
  onDrop,
  onCardDragStart,
  onOpen,
}: {
  col: PhaseColumn;
  isPlanning: boolean;
  dragOver: boolean;
  contractTypes: ContractType[];
  onDragOver: () => void;
  onDrop: () => void;
  onCardDragStart: (id: string) => void;
  onOpen: (w: Work) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [, start] = useTransition();

  function add() {
    const n = name.trim();
    if (!n) return;
    setName("");
    setAdding(false);
    start(() => createWork(col.id, n));
  }

  function rename() {
    setMenuOpen(false);
    const n = prompt("Novo nome da fase:", col.name);
    if (n && n.trim()) start(() => renamePhase(col.id, n.trim()));
  }

  function remove() {
    setMenuOpen(false);
    if (col.works.length && !confirm(`A fase "${col.name}" tem ${col.works.length} obra(s). Excluir?`))
      return;
    start(() => deletePhase(col.id));
  }

  return (
    <div
      className={`flex w-72 shrink-0 flex-col rounded-2xl border bg-slate-50 ${
        dragOver ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
    >
      <div className="flex items-center gap-2 rounded-t-2xl border-b border-slate-200 bg-white px-3.5 py-3">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: col.color }}
        />
        <span className="flex-1 truncate text-sm font-bold text-slate-900">
          {col.name}
        </span>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-500">
          {col.works.length}
        </span>
        {isPlanning && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded px-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                <button
                  onClick={rename}
                  className="block w-full rounded px-3 py-1.5 text-left text-sm hover:bg-slate-100"
                >
                  ✏️ Renomear
                </button>
                <button
                  onClick={remove}
                  className="block w-full rounded px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  🗑️ Excluir
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex min-h-[60px] flex-1 flex-col gap-2 p-2.5">
        {col.works.map((w) => (
          <WorkCard
            key={w.id}
            work={w}
            contractTypes={contractTypes}
            onDragStart={() => onCardDragStart(w.id)}
            onClick={() => onOpen(w)}
          />
        ))}
      </div>

      <div className="border-t border-slate-200 p-2.5">
        {adding ? (
          <div className="flex flex-col gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") add();
                if (e.key === "Escape") setAdding(false);
              }}
              placeholder="Nome da obra..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={add}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Adicionar
              </button>
              <button
                onClick={() => setAdding(false)}
                className="rounded-lg px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full rounded-lg border border-dashed border-slate-300 py-2 text-sm font-medium text-slate-500 transition hover:border-blue-500 hover:text-blue-600"
          >
            + Adicionar obra
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------

function WorkCard({
  work,
  contractTypes,
  onDragStart,
  onClick,
}: {
  work: Work;
  contractTypes: ContractType[];
  onDragStart: () => void;
  onClick: () => void;
}) {
  const ct = contractTypes.find((c) => c.id === work.contract_type_id);

  let total = 0;
  let done = 0;
  for (const s of work.work_stages ?? [])
    for (const it of s.work_stage_items ?? []) {
      total++;
      if (it.done) done++;
    }
  const pct = total > 0 ? Math.round((done / total) * 100) : -1;

  const activeStage =
    (work.work_stages ?? []).find((s) => !s.finished_at) ?? null;
  const activeSub =
    activeStage?.work_stage_items?.find((i) => !i.done) ?? null;

  const commentCount = work.work_comments?.[0]?.count ?? 0;
  const fileCount = work.work_files?.[0]?.count ?? 0;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md"
    >
      <div className="text-sm font-bold text-slate-900">
        {work.name || "Sem título"}
      </div>

      {ct && (
        <span className="mt-1.5 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
          📋 {ct.name}
        </span>
      )}

      {activeStage && (
        <div className="mt-2 rounded-md bg-slate-100 px-2.5 py-2">
          <div className="flex items-center gap-1.5">
            {activeStage.started_at && (
              <span className="text-xs">▶</span>
            )}
            <span className="text-xs font-bold text-slate-800">
              {activeStage.name}
            </span>
          </div>
          {activeSub && (
            <div className="mt-1 text-xs text-slate-500">↳ {activeSub.name}</div>
          )}
        </div>
      )}

      {pct >= 0 && (
        <div className="mt-2.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background:
                  pct >= 100 ? "#22c55e" : pct > 0 ? "#2563eb" : "#e2e8f0",
              }}
            />
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {done}/{total} subfases · {pct}%
          </div>
        </div>
      )}

      {(commentCount > 0 || fileCount > 0) && (
        <div className="mt-2 flex gap-3 text-xs text-slate-400">
          {commentCount > 0 && <span>💬 {commentCount}</span>}
          {fileCount > 0 && <span>📎 {fileCount}</span>}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------

function AddListButton() {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [, start] = useTransition();

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  function add() {
    const n = name.trim();
    if (!n) return;
    setName("");
    setAdding(false);
    start(() => createPhase("planning", n));
  }

  return (
    <div className="w-60 shrink-0">
      {adding ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
              if (e.key === "Escape") setAdding(false);
            }}
            placeholder="Nome da lista..."
            className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={add}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Adicionar lista
            </button>
            <button
              onClick={() => setAdding(false)}
              className="rounded-lg px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 px-4 py-3 text-left text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
        >
          + Adicionar outra lista
        </button>
      )}
    </div>
  );
}
