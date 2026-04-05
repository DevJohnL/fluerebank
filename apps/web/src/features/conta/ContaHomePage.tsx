import type { FormEvent, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { setInitialPassword } from '../../lib/auth'
import { fetchAccountMe } from '../../lib/account'
import { ACCESS_TOKEN_KEY, clearAccessToken, setAccessToken } from '../../lib/session'

function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="40" height="40" rx="12" className="fill-emerald-500/15" />
      <path
        d="M12 26c0-6 4-10 10-10h2v4h-2c-3.5 0-6 2.5-6 6v4h-4v-4Z"
        className="fill-emerald-400"
      />
      <path
        d="M22 14c6 0 10 4 10 10h-4c0-3.5-2.5-6-6-6h-2v-4h2Z"
        className="fill-emerald-300"
      />
    </svg>
  )
}

type AcaoProps = {
  titulo: string
  descricao: string
  icon: ReactNode
  to?: string
}

function AcaoRapida({ titulo, descricao, icon, to }: AcaoProps) {
  const className =
    'group flex min-h-[44px] flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:border-emerald-500/35 hover:bg-white/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400'
  const inner = (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 transition group-hover:bg-emerald-500/15">
        {icon}
      </span>
      <span>
        <span className="block font-semibold text-white">{titulo}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{descricao}</span>
      </span>
    </>
  )
  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    )
  }
  return (
    <button type="button" className={className}>
      {inner}
    </button>
  )
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const EXTRATO_MOCK = [
  {
    id: '1',
    titulo: 'Pix recebido · Maria S.',
    data: 'Hoje · 14:32',
    valor: '+ R$ 120,00',
    tipo: 'credito' as const,
  },
  {
    id: '2',
    titulo: 'Compra no débito · Mercado',
    data: 'Hoje · 09:15',
    valor: '- R$ 47,80',
    tipo: 'debito' as const,
  },
  {
    id: '3',
    titulo: 'Transferência Pix enviada',
    data: 'Ontem · 18:40',
    valor: '- R$ 200,00',
    tipo: 'debito' as const,
  },
  {
    id: '4',
    titulo: 'Depósito via boleto',
    data: 'Ontem · 11:02',
    valor: '+ R$ 500,00',
    tipo: 'credito' as const,
  },
]

const INPUT_CLASS =
  'min-h-[48px] w-full rounded-xl border border-white/10 bg-surface-900 px-4 py-2 text-base text-white outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-400/30'

export function ContaHomePage() {
  const [balanceLabel, setBalanceLabel] = useState<string | null>(null)
  const [mustSetPassword, setMustSetPassword] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSaving, setPwSaving] = useState(false)

  useEffect(() => {
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY)
    if (!token) {
      setMustSetPassword(false)
      return
    }
    void fetchAccountMe(token).then((r) => {
      if (r.ok) {
        setBalanceLabel(brl.format(r.data.balance))
        setMustSetPassword(r.data.mustSetPassword)
      } else {
        setMustSetPassword(false)
      }
    })
  }, [])

  async function onSetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPwError(null)
    if (password.length < 8) {
      setPwError('Use pelo menos 8 caracteres')
      return
    }
    if (password !== confirmPassword) {
      setPwError('As palavras-passe não coincidem')
      return
    }
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY)
    if (!token) {
      setPwError('Sessão inválida. Inicie sessão novamente.')
      return
    }
    setPwSaving(true)
    const r = await setInitialPassword(token, password)
    setPwSaving(false)
    if (!r.ok) {
      setPwError(r.message)
      return
    }
    setAccessToken(r.data.accessToken)
    setMustSetPassword(false)
    setPassword('')
    setConfirmPassword('')
  }

  const showPasswordGate = mustSetPassword === true

  return (
    <div className="relative min-h-dvh overflow-hidden bg-surface-950 font-sans text-slate-300">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_-15%,rgba(16,185,129,0.22),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl"
        aria-hidden
      />

      {showPasswordGate ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="primeira-senha-titulo"
        >
          <form
            onSubmit={onSetPassword}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-surface-950 p-6 shadow-2xl shadow-black/40"
          >
            <h2 id="primeira-senha-titulo" className="text-xl font-semibold text-white">
              Crie a sua palavra-passe
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Por segurança, a palavra-passe é armazenada com hash (bcrypt) no servidor — não guardamos o texto em
              claro.
            </p>
            <div className="mt-6 flex flex-col gap-4">
              <div>
                <label htmlFor="nova-senha" className="sr-only">
                  Nova palavra-passe
                </label>
                <input
                  id="nova-senha"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  placeholder="Nova palavra-passe"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="confirmar-senha" className="sr-only">
                  Confirmar palavra-passe
                </label>
                <input
                  id="confirmar-senha"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(ev) => setConfirmPassword(ev.target.value)}
                  placeholder="Confirmar palavra-passe"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
            {pwError ? (
              <p className="mt-4 text-sm text-red-400" role="alert">
                {pwError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={pwSaving}
              className="mt-6 min-h-[48px] w-full rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-surface-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pwSaving ? 'A guardar…' : 'Continuar'}
            </button>
          </form>
        </div>
      ) : null}

      <header className="relative z-10 border-b border-white/5 bg-surface-950/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <LogoMark className="h-10 w-10 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">Olá, João</p>
              <p className="truncate text-xs text-slate-500">Conta corrente · **** 4821</p>
            </div>
          </div>
          <Link
            to="/"
            onClick={() => clearAccessToken()}
            className="shrink-0 rounded-lg px-2 py-2 text-sm text-emerald-400 transition hover:text-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            Sair
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <section
          className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6 shadow-lg shadow-black/20 backdrop-blur-sm"
          aria-labelledby="saldo-heading"
        >
          <p id="saldo-heading" className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Saldo disponível
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-white sm:text-4xl">
            {balanceLabel ?? '—'}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {balanceLabel ? 'Sincronizado com a API · sessão ativa' : 'Inicie sessão em Entrar para ver o saldo real'}
          </p>
        </section>

        <section className="mt-10" aria-labelledby="acoes-heading">
          <h2 id="acoes-heading" className="text-lg font-semibold tracking-tight text-white">
            O que deseja fazer?
          </h2>
          <p className="mt-1 text-sm text-slate-500">Pix com idempotência no servidor</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <AcaoRapida
              to="/conta/pix"
              titulo="Pix"
              descricao="Enviar ou receber na hora"
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5 10.5 6.75l4.5 4.5 6-6M3.75 6.75h4.5v4.5" />
                </svg>
              }
            />
            <AcaoRapida
              titulo="Depositar"
              descricao="Boleto ou transferência"
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              }
            />
            <AcaoRapida
              titulo="Sacar"
              descricao="Caixa eletrónico ou loja"
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0-6.75 6.75M12 4.5l6.75 6.75" />
                </svg>
              }
            />
            <AcaoRapida
              titulo="Guardar"
              descricao="Reservar para objetivos"
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 3V9m0 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9v3" />
                </svg>
              }
            />
          </div>
        </section>

        <section className="mt-12" aria-labelledby="extrato-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="extrato-heading" className="text-lg font-semibold tracking-tight text-white">
                Extrato
              </h2>
              <p className="mt-1 text-sm text-slate-500">Últimas movimentações</p>
            </div>
            <button
              type="button"
              className="text-sm font-medium text-emerald-400 transition hover:text-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
            >
              Ver tudo
            </button>
          </div>

          <ul className="mt-6 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03]">
            {EXTRATO_MOCK.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-4 first:rounded-t-2xl last:rounded-b-2xl">
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{item.titulo}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.data}</p>
                </div>
                <p
                  className={
                    item.tipo === 'credito'
                      ? 'shrink-0 tabular-nums font-semibold text-emerald-400'
                      : 'shrink-0 tabular-nums font-medium text-slate-300'
                  }
                >
                  {item.valor}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
