import { type FormEvent, useEffect, useId } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setAccessToken } from '../../lib/session'
import { STEP_QUESTIONS } from './onboardingSteps'
import { useOnboardingWizard } from './useOnboardingWizard'

const INPUT_CLASS =
  'min-h-[48px] rounded-xl border border-white/10 bg-surface-900 px-4 py-2 text-base text-white outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-400/30'

export function OnboardingContaPage() {
  const formId = useId()
  const navigate = useNavigate()
  const { state, step, isLastStep, progressLabel, setField, goNext, goBack, submit } =
    useOnboardingWizard()

  const { fields, fieldError, errorMessage, submitStatus, accessToken } = state
  const loading = submitStatus === 'loading'

  useEffect(() => {
    if (submitStatus === 'success' && accessToken) {
      setAccessToken(accessToken)
      navigate('/conta', { replace: true })
    }
  }, [submitStatus, accessToken, navigate])

  function onPrimaryAction(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isLastStep) {
      void submit()
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
                value={fields.fullName}
                onChange={(ev) => setField('fullName', ev.target.value)}
                className={INPUT_CLASS}
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
                value={fields.email}
                onChange={(ev) => setField('email', ev.target.value)}
                className={INPUT_CLASS}
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
                value={fields.birthDate}
                onChange={(ev) => setField('birthDate', ev.target.value)}
                className={INPUT_CLASS}
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
                value={fields.phone}
                onChange={(ev) => setField('phone', ev.target.value)}
                placeholder="+351 900 000 000"
                className={`${INPUT_CLASS} placeholder:text-slate-600`}
              />
            </div>
          ) : null}

          {fieldError ? (
            <p className="text-sm text-red-400" role="alert">
              {fieldError}
            </p>
          ) : null}
        </div>

        {submitStatus === 'error' && errorMessage ? (
          <p className="text-sm text-red-400" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {state.stepIndex > 0 ? (
            <button
              type="button"
              onClick={goBack}
              disabled={loading}
              className="min-h-[44px] rounded-xl border border-white/15 px-4 text-sm font-medium text-slate-200 transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:opacity-50"
            >
              Anterior
            </button>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="min-h-[44px] flex-1 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-surface-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-initial"
          >
            {loading ? 'A enviar…' : isLastStep ? 'Criar conta' : 'Seguinte'}
          </button>
        </div>
      </form>
    </div>
  )
}
