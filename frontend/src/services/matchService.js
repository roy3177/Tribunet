import axios from 'axios'
import { fetchAuthSession } from 'aws-amplify/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
})

// Attach Cognito JWT on every request
api.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession()
    const token = session.tokens?.idToken?.toString()
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch {
    // unauthenticated — public endpoints still work
  }
  return config
})

// ── Matches ──────────────────────────────────────────────────────────────────

export async function getMatches(filters = {}) {
  const { data } = await api.get('/matches', { params: filters })
  return data.data ?? []
}

export async function getMatch(id) {
  const { data } = await api.get(`/matches/${id}`)
  return data.data
}

export async function createMatch(payload) {
  const { data } = await api.post('/matches', payload)
  return data.data
}

export async function updateMatch(id, payload) {
  const { data } = await api.put(`/matches/${id}`, payload)
  return data.data
}

export async function deleteMatch(id) {
  await api.delete(`/matches/${id}`)
}

// ── Stadiums ─────────────────────────────────────────────────────────────────

export async function getStadiums() {
  const { data } = await api.get('/stadiums')
  return data.data ?? []
}

export async function createStadium(payload) {
  const { data } = await api.post('/stadiums', payload)
  return data.data
}

export async function updateStadium(id, payload) {
  const { data } = await api.put(`/stadiums/${id}`, payload)
  return data.data
}

export async function deleteStadium(id) {
  await api.delete(`/stadiums/${id}`)
}

// ── Favorites ────────────────────────────────────────────────────────────────

export async function getFavorites() {
  const { data } = await api.get('/favorites')
  return data.data ?? []
}

export async function addFavorite(matchId) {
  const { data } = await api.post(`/favorites/${matchId}`)
  return data.data
}

export async function removeFavorite(matchId) {
  await api.delete(`/favorites/${matchId}`)
}
