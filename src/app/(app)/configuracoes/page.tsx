export default function ConfiguracoesPage() {
  const items = [
    "📋 Tipos de Contrato",
    "🔧 Biblioteca de Etapas",
    "👥 Equipes",
    "🏷️ Tipos de Equipe",
    "🗂️ Fases",
  ];
  return (
    <div className="mx-auto max-w-3xl px-7 py-8">
      <h1 className="text-lg font-bold text-slate-900">⚙️ Configurações</h1>
      <p className="mt-1 text-sm text-slate-500">
        Estas seções serão portadas na próxima etapa da migração.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <div
            key={it}
            className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm"
          >
            {it}
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-400">
              em breve
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
