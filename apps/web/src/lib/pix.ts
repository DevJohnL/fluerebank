import { fetchJson, getApiBaseUrl } from './http'

export type PixTransferResponse = {
  id: string
  duplicate: boolean
  status: string
  amount: number
  pixKey: string
  reference: string | null
  transactionId: string
  createdAt: string
}

export async function postPixTransfer(
  accessToken: string,
  idempotencyKey: string,
  body: { amount: number; pixKey: string; reference?: string },
) {
  const base = getApiBaseUrl()
  return fetchJson<PixTransferResponse>(`${base}/api/v1/pix/transfers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(body),
  })
}
