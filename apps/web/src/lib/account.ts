import { fetchJson, getApiBaseUrl } from './http'

export type AccountMeResponse = {
  accountId: string
  balance: number
  balanceCents: string
  mustSetPassword: boolean
}

export async function fetchAccountMe(accessToken: string) {
  const base = getApiBaseUrl()
  return fetchJson<AccountMeResponse>(`${base}/api/v1/account`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}
