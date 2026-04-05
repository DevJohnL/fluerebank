import { type FormEvent, useId, useState } from 'react'
import { Link } from 'react-router-dom'

const REGISTRATION_PATH = '/api/v1/onboarding/registrations'

const STEPS = ['fullName', 'email', 'birthDate', 'phone'] as const
type StepId = (typeof STEPS)[number]

const STEP_QUESTIONS: Record<StepId, string> = {
  fullName: 'Qual é o seu nome completo?',
  email: 'Qual é o seu e-mail?',
  birthDate: 'Qual é a sua data de nascimento?',
  phone: 'Qual é o seu número de telefone?',
}

export function OnboardingContaPage() {
  const formId = useId()
  const [stepIndex, setStepIndex] = useState(0)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)

  const step = STEPS[stepIndex]
  const isLastStep = stepIndex === STEPS.length - 1
  const progressLabel = `Passo ${stepIndex + 1} de ${STEPS.length}`

  function validateCurrent(): boolean {
    setFieldError(null)
    if (step === 'fullName') {
      if (!fullName.trim()) {
        setFieldError('Indique o seu nome completo')
        return false
      }
    }
    if (step === 'email') {
      const v = email.trim()
      if (!v) {
        setFieldError('Indique o seu e-mail')
        return false
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        setFieldError('E-mail inválido')
        return false
      }
    }
    if (step === 'birthDate') {
      if (!birthDate) {
        setFieldError('Indique a data de nascimento')
        return false
      }
    }
    if (step === 'phone') {
      if (!phone.trim()) {
        setFieldError('Indique o telefone')
        return false
      }
    }
    return true
  }

  function goNext() {
    if (!validateCurrent()) return
    if (!isLastStep) {
      setStepIndex((i) => i + 1)
    }
  }

  function goBack() {
    setFieldError(null)
    setStepIndex((i) => Math.max(0, i - 1))
  }

  async function submitAll(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validateCurrent()) {
      return
    }
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

  function onPrimaryAction(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isLastStep) {
      void submitAll(e)
    } else {
      goNext()
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
        Responda a cada pergunta — um passo de cada vez.
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
          id={formId}
          onSubmit={onPrimaryAction}
          className="mt-8 flex max-w-md flex-col gap-6"
          noValidate
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500" aria-live="polite">
            {progressLabel}
          </p>

          <div key={step} className="onboarding-step-panel flex min-h-[140px] flex-col gap-3">
            <h2 className="text-lg font-medium leading-snug text-white sm:text-xl">
              {STEP_QUESTIONS[step]}
            </h2>

            {step === 'fullName' ? (
              <div className="flex flex-col gap-2">
                <label htmlFor="fullName" className="sr-only">
                  Nome completo
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  autoFocus
                  value={fullName}
                  onChange={(ev) => setFullName(ev.target.value)}
                  className="min-h-[48px] rounded-xl border border-white/10 bg-surface-900 px-4 py-2 text-base text-white outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-400/30"
                />
              </div>
            ) : null}

            {step === 'email' ? (
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="sr-only">
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  autoFocus
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  className="min-h-[48px] rounded-xl border border-white/10 bg-surface-900 px-4 py-2 text-base text-white outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-400/30"
                />
              </div>
            ) : null}

            {step === 'birthDate' ? (
              <div className="flex flex-col gap-2">
                <label htmlFor="birthDate" className="sr-only">
                  Data de nascimento
                </label>
                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  autoFocus
                  value={birthDate}
                  onChange={(ev) => setBirthDate(ev.target.value)}
                  className="min-h-[48px] rounded-xl border border-white/10 bg-surface-900 px-4 py-2 text-base text-white outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-400/30"
                />
              </div>
            ) : null}

            {step === 'phone' ? (
              <div className="flex flex-col gap-2">
                <label htmlFor="phone" className="sr-only">
                  Telefone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  autoFocus
                  value={phone}
                  onChange={(ev) => setPhone(ev.target.value)}
                  placeholder="+351 900 000 000"
                  className="min-h-[48px] rounded-xl border border-white/10 bg-surface-900 px-4 py-2 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-400/30"
                />
              </div>
            ) : null}

            {fieldError ? (
              <p className="text-sm text-red-400" role="alert">
                {fieldError}
              </p>
            ) : null}
          </div>

          {status === 'error' && errorMessage ? (
            <p className="text-sm text-red-400" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={goBack}
                disabled={status === 'loading'}
                className="min-h-[44px] rounded-xl border border-white/15 px-4 text-sm font-medium text-slate-200 transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:opacity-50"
              >
                Anterior
              </button>
            ) : null}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="min-h-[44px] flex-1 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-surface-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-initial"
            >
              {status === 'loading'
                ? 'A enviar…'
                : isLastStep
                  ? 'Enviar'
                  : 'Seguinte'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
