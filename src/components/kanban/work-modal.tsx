"use client";

import { useState, useTransition } from "react";
import {
  deleteWork,
  finalizeToExecution,
  updateWorkDetails,
} from "@/lib/actions";
import type { ContractType, Work } from "@/lib/types";

interface Props {
  work: Work;
  contractTypes: ContractType[];
  isPlanning: boolean;
  onClose: () => void;
}

export function WorkModal({ work, contractTypes, isPlanning, onClose }: Props) {
  const [name, setName] = useState(work.name);
  const [description, setDescription] = useState(work.description ?? "");
  const [contractTypeId, setContractTypeId] = useState(
    work.contract_type_id ?? "",
  );
  const [startDate, setStartDate] = useState(work.obra_start_date ?? "");
  const [workDays, setWorkDays] = useState(String(work.obra_work_days ?? 0));
  const [endDate, setEndDate] = useState(work.obra_end_date ?? "");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save(then?: () => void) {
    setError(null);
    start(async () => {
      try {
        await updateWorkDetails(work.id, {
          name,
          description: description || null,
          contract_type_id: contractTypeId || null,
          obra_start_date: startDate || null,
          obra_work_days: parseInt(workDays) || 0,
          obra_end_date: endDate || null,
        });
        then ? then() : onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao salvar.");
      }
    });
  }

  function remove() {
    if (!confirm("Excluir esta obra permanentemente?")) return;
    start(async () => {
      try {
        await deleteWork(work.id);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao excluir.");
      }
    });
  }

  function finalize() {
    if (!confirm(`Mover "${name}" para Gestão de Obras?`)) return;
    save(async () => {
      await finalizeToExecution(work.id);
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/45 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
          <h2 className="flex-1 text-base font-bold text-slate-900">
            {work.name ? "Editar Obra" : "Nova Obra"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <Field label="Nome da obra *">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da obra..."
              className={inputCls}
            />
          </Field>

          <Field label="Tipo de contrato">
            <select
              value={contractTypeId}
              onChange={(e) => setContractTypeId(e.target.value)}
              className={inputCls}
            >
              <option value="">— Selecione —</option>
              {contractTypes.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Descrição / Observações">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Endereço, descrição, notas..."
              className={inputCls}
            />
          </Field>

          <div className="rounded-lg border border-slate-200 bg-blue-50/50 p-4">
            <div className="mb-3 text-sm font-bold text-blue-600">
              📅 Período de Obra
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Data início">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Dias úteis">
                <input
                  type="number"
                  min={0}
                  value={workDays}
                  onChange={(e) => setWorkDays(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Data fim">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">
            Etapas, comentários e arquivos virão na próxima etapa da migração.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-b-2xl border-t border-slate-200 bg-slate-50 px-6 py-3">
          <button
            onClick={remove}
            disabled={pending}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            🗑️ Excluir
          </button>
          <div className="flex gap-2">
            {isPlanning && (
              <button
                onClick={finalize}
                disabled={pending}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                🚀 Iniciar Execução
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Fechar
            </button>
            <button
              onClick={() => save()}
              disabled={pending}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              💾 Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
