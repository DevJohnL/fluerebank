import { fetchJson, getApiBaseUrl } from './http'

const LOGIN_PATH = '/api/v1/auth/login'

export async function loginWithPassword(credentials: { email: string; password: string }) {
  const base = getApiBaseUrl()
  return fetchJson<{ accessToken: string; tokenType?: string }>(`${base}${LOGIN_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
}
