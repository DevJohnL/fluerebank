import { fetchJson, getApiBaseUrl } from './http'

export type GuardarDepositResponse = {
  id: string
  duplicate: boolean
  status: string
  amountCents: string
  transactionId: string
  createdAt: string
}

export async function postGuardarDeposit(
  accessToken: string,
  idempotencyKey: string,
  body: { amountCents: number },
) {
  const base = getApiBaseUrl()
  return fetchJson<GuardarDepositResponse>(`${base}/api/v1/guardar/deposits`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(body),
  })
}
