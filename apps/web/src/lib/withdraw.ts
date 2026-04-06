import { fetchJson, getApiBaseUrl } from './http'

export type WithdrawCodeResponse = {
  code: string
}

export async function postWithdrawCode(accessToken: string, body: { amount: number }) {
  const base = getApiBaseUrl()
  return fetchJson<WithdrawCodeResponse>(`${base}/api/v1/withdraw/code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })
}
