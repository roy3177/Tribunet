// @feature F-04 | View Matches List
// @feature F-07 | View Match Details
// @feature F-08 | Add/Remove Favorites
// @feature F-09 | View Stadium Map
// @feature F-10 | Edit User Profile
// @feature F-13 | Add New Match
// @feature F-14 | Edit/Delete Match
// @feature F-15 | Manage Stadiums & Users

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
  return data.data?.matches ?? data.data ?? []
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

// ── Teams ─────────────────────────────────────────────────────────────────────

export async function getTeams() {
  const { data } = await api.get('/teams')
  return data.data ?? []
}

// ── Leagues ───────────────────────────────────────────────────────────────────

export async function getLeagues() {
  const { data } = await api.get('/leagues')
  return data.data ?? []
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getUsers() {
  const { data } = await api.get('/users')
  return data.data ?? []
}

export async function deleteUser(id) {
  await api.delete(`/users/${id}`)
}

export async function updateProfile(name) {
  const { data } = await api.put('/users/me', { name })
  return data.data
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
