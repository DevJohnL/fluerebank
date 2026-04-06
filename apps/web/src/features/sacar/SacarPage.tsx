import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { fetchAccountMe } from '../../lib/account'
import { postWithdrawCode } from '../../lib/withdraw'
import { ACCESS_TOKEN_KEY } from '../../lib/session'
import { type SacarFormInput, type SacarFormValues, sacarFormSchema } from './sacarFormSchema'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function SacarPage() {
  const formId = useId()
  const navigate = useNavigate()
  const [token, setToken] = useState<string | null>(null)
  const [balanceLabel, setBalanceLabel] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [code, setCode] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SacarFormInput, unknown, SacarFormValues>({
    resolver: zodResolver(sacarFormSchema),
    defaultValues: { amount: '' },
  })

  useEffect(() => {
    const t = sessionStorage.getItem(ACCESS_TOKEN_KEY)
    if (!t) {
      navigate('/entrar', { replace: true, state: { from: '/conta/sacar' } })
      return
    }
    queueMicrotask(() => setToken(t))
    void fetchAccountMe(t)
      .then((r) => {
        if (r.ok) setBalanceLabel(brl.format(r.data.balance))
      })
      .catch(() => {})
  }, [navigate])

  async function onSubmit(data: SacarFormValues) {
    if (!token) return
    setSubmitError(null)
    setCode(null)

    const result = await postWithdrawCode(token, { amount: data.amount })
    if (!result.ok) {
      setSubmitError(result.message)
      return
    }
    setCode(result.data.code)
  }

  if (!token) {
    return (
      <div className="min-h-dvh bg-surface-950 px-4 py-12 font-sans text-slate-400">
        A redirecionar…
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-surface-950 px-4 py-8 font-sans text-slate-300 sm:px-6">
      <Link
        to="/conta"
        className="inline-flex min-h-[44px] items-center text-sm text-emerald-400 transition hover:text-emerald-300"
      >
        ← Conta
      </Link>

      <h1 className="mt-8 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Sacar</h1>
      <p className="mt-3 max-w-lg text-slate-400">Peça um código para levantar numerário (caixa ou loja parceira).</p>

      {balanceLabel ? (
        <p className="mt-6 text-sm text-slate-500">
          Saldo disponível: <span className="font-medium text-white">{balanceLabel}</span>
        </p>
      ) : null}

      <form
        id={formId}
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 flex max-w-md flex-col gap-6"
        noValidate
      >
        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-amount`} className="text-sm font-medium text-slate-300">
            Valor (R$)
          </label>
          <input
            id={`${formId}-amount`}
            type="text"
            inputMode="decimal"
            autoComplete="transaction-amount"
            placeholder="0,00"
            disabled={isSubmitting}
            className="min-h-[48px] rounded-xl border border-white/10 bg-surface-900 px-4 py-2 text-base text-white outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-400/30 disabled:opacity-60"
            {...register('amount')}
          />
          {errors.amount ? (
            <p className="text-sm text-red-400" role="alert">
              {errors.amount.message}
            </p>
          ) : null}
        </div>

        {submitError ? (
          <p className="text-sm text-red-400" role="alert">
            {submitError}
          </p>
        ) : null}

        {code ? (
          <p
            className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
            role="status"
          >
            Código: <span className="font-mono font-semibold">{code}</span>
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-[48px] rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-surface-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'A gerar…' : 'Gerar código'}
        </button>
      </form>
    </div>
  )
}
