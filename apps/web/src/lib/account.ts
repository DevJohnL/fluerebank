import { type FetchJsonResult, fetchJson, getApiBaseUrl } from './http'

export type AccountMeResponse = {
  accountId: string
  balance: number
  balanceCents: string
  mustSetPassword: boolean
}

function parseAccountMePayload(parsed: unknown): AccountMeResponse | null {
  if (!parsed || typeof parsed !== 'object') return null
  const o = parsed as Record<string, unknown>
  if (typeof o.accountId !== 'string') return null

  const balanceRaw = o.balance
  const balance =
    typeof balanceRaw === 'number'
      ? balanceRaw
      : typeof balanceRaw === 'string'
        ? Number(balanceRaw)
        : NaN
  if (!Number.isFinite(balance)) return null

  if (typeof o.balanceCents !== 'string') return null
  if (typeof o.mustSetPassword !== 'boolean') return null

  return {
    accountId: o.accountId,
    balance,
    balanceCents: o.balanceCents,
    mustSetPassword: o.mustSetPassword,
  }
}

/**
 * GET /api/v1/account — valida o JSON no limite para nunca devolver `ok: true` com dados incompletos
 * (ex.: HTTP 200 com corpo vazio ou HTML, antes de `fetchJson` rejeitar, ou proxies estranhos).
 */
export async function fetchAccountMe(accessToken: string): Promise<FetchJsonResult<AccountMeResponse>> {
  const base = getApiBaseUrl()
  const result = await fetchJson<unknown>(`${base}/api/v1/account`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!result.ok) return result
  const data = parseAccountMePayload(result.data)
  if (!data) {
    return {
      ok: false,
      status: 200,
      message:
        'Resposta inválida do servidor ao pedir o saldo (JSON sem campos esperados). Confirme em DevTools → Network se GET /api/v1/account devolve JSON da API e não HTML ou corpo vazio.',
    }
  }
  return { ok: true, data }
}
