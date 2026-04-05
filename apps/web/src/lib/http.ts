export type FetchJsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string }

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? ''
}

function extractErrorMessage(parsed: unknown, fallbackText: string, status: number): string {
  if (parsed && typeof parsed === 'object') {
    const o = parsed as Record<string, unknown>
    if (typeof o.error === 'string') return o.error
    if (o.error && typeof o.error === 'object') {
      const inner = o.error as Record<string, unknown>
      if (typeof inner.message === 'string') return inner.message
    }
    if (typeof o.message === 'string') return o.message
    if (Array.isArray(o.message)) {
      const parts = o.message.filter((m): m is string => typeof m === 'string')
      if (parts.length) return parts.join(', ')
    }
  }
  return fallbackText || `HTTP ${status}`
}

/** Single read of the body + JSON parse; avoids duplicate res.text()/JSON.parse in callers */
export async function fetchJson<T>(input: string | URL, init?: RequestInit): Promise<FetchJsonResult<T>> {
  const res = await fetch(input, init)
  const text = await res.text()
  let parsed: unknown
  try {
    parsed = text ? JSON.parse(text) : undefined
  } catch {
    parsed = undefined
  }
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      message: extractErrorMessage(parsed, text, res.status),
    }
  }
  return { ok: true, data: parsed as T }
}
