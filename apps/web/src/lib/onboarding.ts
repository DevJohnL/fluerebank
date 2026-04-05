import { fetchJson, getApiBaseUrl } from './http'

const REGISTRATION_PATH = '/api/v1/onboarding/registrations'

export type RegistrationSuccess = {
  id: string
  accessToken: string
  tokenType: string
  mustSetPassword: boolean
}

export async function submitRegistration(payload: {
  fullName: string
  email: string
  birthDate: string
  phone: string
}) {
  const base = getApiBaseUrl()
  const body = {
    fullName: payload.fullName.trim(),
    email: payload.email.trim().toLowerCase(),
    birthDate: payload.birthDate.trim(),
    phone: payload.phone.trim(),
  }
  return fetchJson<RegistrationSuccess>(`${base}${REGISTRATION_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
