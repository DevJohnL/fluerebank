import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'

const REGISTRATION_PATH = '/api/v1/onboarding/registrations'

export function OnboardingContaPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage(null)
    try {
      const base = import.meta.env.VITE_API_BASE_URL ?? ''
      const res = await fetch(`${base}${REGISTRATION_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          birthDate,
          phone: phone.trim(),
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `HTTP ${res.status}`)
      }
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Não foi possível enviar')
    }
  }

  return (
    <div className="min-h-dvh bg-surface-950 px-4 py-8 font-sans text-slate-300 sm:px-6">
      <Link
        to="/"
        className="inline-flex min-h-[44px] items-center text-sm text-emerald-400 transition hover:text-emerald-300"
      >
        ← Voltar ao início
      </Link>

      <h1 className="mt-8 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        Abrir conta
      </h1>
      <p className="mt-3 max-w-md text-slate-400">
        Preencha os dados abaixo para dar o primeiro passo na Fluxo Bank.
      </p>

      {status === 'success' ? (
        <p
          className="mt-8 max-w-md rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-emerald-200"
          role="status"
        >
          Dados recebidos. Em breve entraremos em contacto com os próximos passos.
        </p>
      ) : (
        <form
          onSubmit={onSubmit}
          className="mt-8 flex max-w-md flex-col gap-5"
          noValidate
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="fullName" className="text-sm font-medium text-slate-200">
              Nome completo
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(ev) => setFullName(ev.target.value)}
              className="min-h-[44px] rounded-xl border border-white/10 bg-surface-900 px-4 py-2 text-white outline-none ring-emerald-400/0 transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-400/30"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-200">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className="min-h-[44px] rounded-xl border border-white/10 bg-surface-900 px-4 py-2 text-white outline-none ring-emerald-400/0 transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-400/30"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="birthDate" className="text-sm font-medium text-slate-200">
              Data de nascimento
            </label>
            <input
              id="birthDate"
              name="birthDate"
              type="date"
              required
              value={birthDate}
              onChange={(ev) => setBirthDate(ev.target.value)}
              className="min-h-[44px] rounded-xl border border-white/10 bg-surface-900 px-4 py-2 text-white outline-none ring-emerald-400/0 transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-400/30"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="phone" className="text-sm font-medium text-slate-200">
              Telefone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              required
              value={phone}
              onChange={(ev) => setPhone(ev.target.value)}
              placeholder="+351 900 000 000"
              className="min-h-[44px] rounded-xl border border-white/10 bg-surface-900 px-4 py-2 text-white outline-none ring-emerald-400/0 transition placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-400/30"
            />
          </div>

          {status === 'error' && errorMessage ? (
            <p className="text-sm text-red-400" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="min-h-[44px] rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-surface-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'loading' ? 'A enviar…' : 'Continuar'}
          </button>
        </form>
      )}
    </div>
  )
}
