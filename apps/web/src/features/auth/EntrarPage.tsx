import { Link } from 'react-router-dom'

export function EntrarPage() {
  return (
    <div className="min-h-dvh bg-surface-950 px-4 py-8 font-sans text-slate-300 sm:px-6">
      <Link
        to="/"
        className="inline-flex min-h-[44px] items-center text-sm text-emerald-400 transition hover:text-emerald-300"
      >
        ← Voltar ao início
      </Link>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        Entrar
      </h1>
      <p className="mt-3 max-w-md text-slate-400">
        Acesso à sua conta Fluxo Bank. Formulário de autenticação em construção.
      </p>
    </div>
  )
}
