"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-actions";

const TABS = [
  { href: "/planejamento", label: "📐 Planejamento" },
  { href: "/gestao", label: "🏗️ Gestão de Obras" },
];

export function Topbar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 flex h-14 flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-7 shadow-sm">
      <h1 className="flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
        🏗️ <span className="text-blue-600">Gestão</span> de Obras
      </h1>

      <nav className="flex gap-0.5 rounded-lg bg-slate-100 p-0.5">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${
                active
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <Link
        href="/configuracoes"
        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
          pathname === "/configuracoes"
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-slate-200 bg-white text-slate-500 hover:border-blue-500 hover:text-blue-600"
        }`}
      >
        ⚙️ Configurações
      </Link>

      {userEmail && (
        <span className="hidden text-xs text-slate-400 sm:inline">{userEmail}</span>
      )}
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:border-red-400 hover:text-red-600"
        >
          Sair
        </button>
      </form>
    </header>
  );
}
