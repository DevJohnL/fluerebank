import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useId, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { fetchAccountMe } from '../../lib/account'
import { postPixTransfer } from '../../lib/pix'
import { ACCESS_TOKEN_KEY } from '../../lib/session'
import { type PixFormInput, type PixFormValues, pixFormSchema } from './pixFormSchema'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function PixPage() {
  const formId = useId()
  const navigate = useNavigate()
  const idempotencyKeyRef = useRef<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [balanceLabel, setBalanceLabel] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PixFormInput, unknown, PixFormValues>({
    resolver: zodResolver(pixFormSchema),
    defaultValues: { amount: '', pixKey: '', reference: '' },
  })

  const amountW = watch('amount')
  const pixKeyW = watch('pixKey')
  const referenceW = watch('reference')

  useEffect(() => {
    const t = sessionStorage.getItem(ACCESS_TOKEN_KEY)
    if (!t) {
      navigate('/entrar', { replace: true, state: { from: '/conta/pix' } })
      return
    }
    setToken(t)
    fetchAccountMe(t).then((r) => {
      if (r.ok) setBalanceLabel(brl.format(r.data.balance))
    })
  }, [navigate])

  useEffect(() => {
    idempotencyKeyRef.current = null
  }, [amountW, pixKeyW, referenceW])

  async function onSubmit(data: PixFormValues) {
    if (!token) return
    setSubmitError(null)
    setSuccessMsg(null)

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID()
    }

    const idem = idempotencyKeyRef.current
    const body = {
      amount: data.amount,
      pixKey: data.pixKey,
      ...(data.reference?.trim() ? { reference: data.reference.trim() } : {}),
    }

    const result = await postPixTransfer(token, idem, body)
    if (!result.ok) {
      setSubmitError(result.message)
      return
    }

    idempotencyKeyRef.current = null
    setSuccessMsg(
      result.data.duplicate
        ? 'Esta transferência já tinha sido registada (pedido repetido).'
        : `Pix de ${brl.format(result.data.amount)} enviado com sucesso.`,
    )
    reset({ amount: '', pixKey: '', reference: '' })
    fetchAccountMe(token).then((r) => {
      if (r.ok) setBalanceLabel(brl.format(r.data.balance))
    })
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

      <h1 className="mt-8 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Pix</h1>
      <p className="mt-3 max-w-lg text-slate-400">
        Transferência com <span className="text-slate-300">Idempotency-Key</span> no servidor para
        evitar duplicados se a rede estiver lenta e o botão for premido várias vezes.
      </p>

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

        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-pixKey`} className="text-sm font-medium text-slate-300">
            Chave Pix
          </label>
          <input
            id={`${formId}-pixKey`}
            type="text"
            autoComplete="off"
            placeholder="E-mail, telefone, CPF ou chave aleatória"
            disabled={isSubmitting}
            className="min-h-[48px] rounded-xl border border-white/10 bg-surface-900 px-4 py-2 text-base text-white outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-400/30 disabled:opacity-60"
            {...register('pixKey')}
          />
          {errors.pixKey ? (
            <p className="text-sm text-red-400" role="alert">
              {errors.pixKey.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-ref`} className="text-sm font-medium text-slate-300">
            Descrição (opcional)
          </label>
          <input
            id={`${formId}-ref`}
            type="text"
            maxLength={140}
            disabled={isSubmitting}
            className="min-h-[48px] rounded-xl border border-white/10 bg-surface-900 px-4 py-2 text-base text-white outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-400/30 disabled:opacity-60"
            {...register('reference')}
          />
          {errors.reference ? (
            <p className="text-sm text-red-400" role="alert">
              {errors.reference.message}
            </p>
          ) : null}
        </div>

        {submitError ? (
          <p className="text-sm text-red-400" role="alert">
            {submitError}
          </p>
        ) : null}

        {successMsg ? (
          <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200" role="status">
            {successMsg}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-[48px] rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-surface-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'A enviar…' : 'Enviar Pix'}
        </button>
      </form>
    </div>
  )
}
