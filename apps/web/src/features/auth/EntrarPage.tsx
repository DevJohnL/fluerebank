import { type FormEvent, useId, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginWithPassword } from '../../lib/auth'
import { ACCESS_TOKEN_KEY } from '../../lib/session'
import { EMAIL_REGEX } from '../../lib/validation'

export function EntrarPage() {
  const navigate = useNavigate()
  const formId = useId()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  function validate(): boolean {
    const next: { email?: string; password?: string } = {}
    const e = email.trim()
    if (!e) {
      next.email = 'Indique o seu e-mail'
    } else if (!EMAIL_REGEX.test(e)) {
      next.email = 'E-mail inválido'
    }
    if (!password) {
      next.password = 'Indique a palavra-passe'
    } else if (password.length < 6) {
      next.password = 'Mínimo de 6 caracteres'
    }
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return
    setStatus('loading')
    setErrorMessage(null)
    try {
      const result = await loginWithPassword({
        email: email.trim(),
        password,
      })
      if (!result.ok) {
        throw new Error(result.message)
      }
      const { accessToken } = result.data
      if (!accessToken) {
        throw new Error('Resposta inválida do servidor')
      }
      sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
      setStatus('success')
      navigate('/conta', { replace: true })
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Não foi possível iniciar sessão')
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
        Entrar
      </h1>
      <p className="mt-3 max-w-md text-slate-400">
        Aceda à sua conta Fluxo Bank com o seu e-mail e palavra-passe.
      </p>

      {status === 'success' ? (
        <p
          className="mt-8 max-w-md rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-emerald-200"
          role="status"
        >
          Sessão iniciada. A redirecionar para a conta…
        </p>
      ) : (
        <form
          id={formId}
          onSubmit={onSubmit}
          className="mt-8 flex max-w-md flex-col gap-6"
          noValidate
        >
          <div className="flex flex-col gap-2">
            <label htmlFor={`${formId}-email`} className="text-sm font-medium text-slate-300">
              E-mail
            </label>
            <input
              id={`${formId}-email`}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              disabled={status === 'loading'}
              className="min-h-[48px] rounded-xl border border-white/10 bg-surface-900 px-4 py-2 text-base text-white outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-400/30 disabled:opacity-60"
            />
            {fieldErrors.email ? (
              <p className="text-sm text-red-400" role="alert">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={`${formId}-password`} className="text-sm font-medium text-slate-300">
              Palavra-passe
            </label>
            <input
              id={`${formId}-password`}
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              disabled={status === 'loading'}
              className="min-h-[48px] rounded-xl border border-white/10 bg-surface-900 px-4 py-2 text-base text-white outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-400/30 disabled:opacity-60"
            />
            {fieldErrors.password ? (
              <p className="text-sm text-red-400" role="alert">
                {fieldErrors.password}
              </p>
            ) : null}
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
            {status === 'loading' ? 'A entrar…' : 'Entrar'}
          </button>
        </form>
      )}
    </div>
  )
}
