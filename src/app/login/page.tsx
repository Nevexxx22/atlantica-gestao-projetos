import Link from "next/link";
import { signIn, signUp } from "@/lib/auth-actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string; message?: string }>;
}) {
  const { mode = "signin", error, message } = await searchParams;
  const isSignup = mode === "signup";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="mb-1 flex items-center gap-2 text-xl font-extrabold text-slate-900">
          🏗️ <span className="text-blue-600">Gestão</span> de Obras
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          {isSignup ? "Crie sua conta e empresa" : "Entre na sua conta"}
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {message}
          </div>
        )}

        <form action={isSignup ? signUp : signIn} className="flex flex-col gap-3">
          {isSignup && (
            <>
              <Field label="Seu nome">
                <input name="full_name" type="text" required className={inputCls} />
              </Field>
              <Field label="Nome da empresa">
                <input name="org_name" type="text" placeholder="Minha Empresa" className={inputCls} />
              </Field>
            </>
          )}
          <Field label="E-mail">
            <input name="email" type="email" required autoComplete="email" className={inputCls} />
          </Field>
          <Field label="Senha">
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={isSignup ? "new-password" : "current-password"}
              className={inputCls}
            />
          </Field>

          <button
            type="submit"
            className="mt-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            {isSignup ? "Criar conta" : "Entrar"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          {isSignup ? (
            <>
              Já tem conta?{" "}
              <Link href="/login?mode=signin" className="font-semibold text-blue-600 hover:underline">
                Entrar
              </Link>
            </>
          ) : (
            <>
              Não tem conta?{" "}
              <Link href="/login?mode=signup" className="font-semibold text-blue-600 hover:underline">
                Criar conta
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
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
