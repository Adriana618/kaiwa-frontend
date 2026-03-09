const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface FetchOptions extends RequestInit {
  token?: string;
}

async function tryRefreshToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const refreshToken = localStorage.getItem('kaiwa_refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    localStorage.setItem('kaiwa_token', data.access_token);
    return data.access_token;
  } catch {
    return null;
  }
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  let res = await fetch(`${API_BASE}/api/v1${path}`, {
    ...fetchOptions,
    headers,
  });

  // Auto-refresh on 401
  if (res.status === 401 && token) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}/api/v1${path}`, {
        ...fetchOptions,
        headers,
      });
      // Update store if we have access
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kaiwa:token-refreshed', { detail: newToken }));
      }
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || `API error: ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; display_name?: string; native_language?: string }) =>
    apiFetch<{ access_token: string; refresh_token: string }>('/auth/register', {
      method: 'POST', body: JSON.stringify(data),
    }),
  login: (email: string, password: string) =>
    apiFetch<{ access_token: string; refresh_token: string }>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: email, password }).toString(),
    }),
  getMe: (token: string) =>
    apiFetch<{ id: string; email: string; display_name: string | null; native_language: string }>('/auth/me', { token }),

  // Review
  getNextCards: (token: string, language: string, limit = 50) =>
    apiFetch<any[]>(`/review/next?language=${language}&limit=${limit}`, {
      method: 'POST', token,
    }),
  submitAnswer: (token: string, data: { card_id: string; rating: number; review_duration_ms?: number }) =>
    apiFetch<any>('/review/answer', {
      method: 'POST', token, body: JSON.stringify(data),
    }),
  getReviewStats: (token: string, language: string) =>
    apiFetch<any>(`/review/stats?language=${language}`, { token }),

  // Immersion
  logImmersion: (token: string, data: any) =>
    apiFetch<any>('/immersion/log', {
      method: 'POST', token, body: JSON.stringify(data),
    }),
  getImmersionHistory: (token: string, language: string, days = 30) =>
    apiFetch<any[]>(`/immersion/history?language=${language}&days=${days}`, { token }),
  getImmersionDashboard: (token: string, language: string) =>
    apiFetch<any>(`/immersion/dashboard?language=${language}`, { token }),

  // Cards & Decks
  getDecks: (token: string, language?: string) =>
    apiFetch<any[]>(`/decks${language ? `?language=${language}` : ''}`, { token }),
  createDeck: (token: string, data: { name: string; language: string; description?: string }) =>
    apiFetch<any>('/decks', { method: 'POST', token, body: JSON.stringify(data) }),
  createCard: (token: string, data: { deck_id: string; front: any; back: any; tags?: string[]; card_type?: string }) =>
    apiFetch<any>('/cards', { method: 'POST', token, body: JSON.stringify(data) }),
  getCard: (token: string, cardId: string) =>
    apiFetch<any>(`/cards/${cardId}`, { token }),

  // Recommendations
  getRecommendations: (token: string, language: string) =>
    apiFetch<any[]>(`/immersion/recommend?language=${language}`, { token }),
  getImpact: (token: string, language: string, days = 7) =>
    apiFetch<any>(`/immersion/impact?language=${language}&days=${days}`, { token }),
};
