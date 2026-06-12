/**
 * The single boundary between the app and "the backend" (MSW in this project).
 * Everything goes through here so swapping the mock for a real API later means
 * changing only this file. Non-2xx responses throw a typed {@link ApiError}.
 */

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const BASE = '/api'

export type QueryParams = Record<string, string | number | boolean | undefined>

function buildUrl(path: string, params?: QueryParams): string {
  const url = new URL(`${BASE}${path}`, window.location.origin)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

async function request<T>(
  method: string,
  path: string,
  options: { body?: unknown; params?: QueryParams } = {},
): Promise<T> {
  const response = await fetch(buildUrl(path, options.params), {
    method,
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const data = (await response.json()) as { message?: string }
      if (data.message) message = data.message
    } catch {
      // non-JSON error body; keep the default message
    }
    throw new ApiError(response.status, message)
  }

  // 204 No Content has no body to parse.
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const api = {
  get: <T>(path: string, params?: QueryParams) => request<T>('GET', path, { params }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  del: <T>(path: string) => request<T>('DELETE', path),
}
