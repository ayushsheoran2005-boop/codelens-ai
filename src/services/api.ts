import type { Review } from './reviews'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '')
const apiTimeoutMs = 80000

export async function listReviews(token: string): Promise<Review[]> {
  const result = await apiRequest<{ reviews: Review[] }>('/api/reviews', token)
  return result.reviews
}

export async function loadReview(id: string, token: string): Promise<Review> {
  const result = await apiRequest<{ review: Review }>(`/api/reviews/${encodeURIComponent(id)}`, token)
  return result.review
}

export async function removeReview(id: string, token: string): Promise<void> {
  await apiRequest<void>(`/api/reviews/${encodeURIComponent(id)}`, token, { method: 'DELETE' })
}

export async function analyzeCode(code: string, language: string, token: string): Promise<Review> {
  const result = await apiRequest<{ review: Review }>('/api/reviews/analyze', token, {
    method: 'POST',
    body: JSON.stringify({ code, language }),
  })
  return result.review
}

export async function analyzeRepository(repositoryUrl: string, language: string, token: string): Promise<Review> {
  const result = await apiRequest<{ review: Review }>('/api/reviews/analyze', token, {
    method: 'POST',
    body: JSON.stringify({ code: 'repository-analysis', language, repositoryUrl }),
  })
  return result.review
}

async function apiRequest<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  if (!apiBaseUrl) throw new Error('The CodeLens API is not configured. Set VITE_API_BASE_URL and rebuild the frontend.')
  if (/your[-_ ]?(?:render[-_ ]?)?service|placeholder/i.test(apiBaseUrl)) {
    throw new Error('VITE_API_BASE_URL is still the example placeholder. Deploy the backend to Render, copy its service URL, set it in Vercel, and redeploy the frontend.')
  }
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), apiTimeoutMs)
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${token}`,
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        ...init.headers,
      },
    })
    if (response.status === 204) return undefined as T
    const payload = await response.json().catch(() => null) as { error?: { code?: string; message?: string } } | null
    if (!response.ok) {
      const message = payload?.error?.message || `The API request failed with status ${response.status}.`
      throw new Error(message)
    }
    return payload as T
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The request timed out. The free-tier API may be waking from sleep; wait briefly and retry.')
    }
    if (error instanceof TypeError) {
      throw new Error('Could not reach the CodeLens API. Check its URL, CORS origin, and availability.')
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}
