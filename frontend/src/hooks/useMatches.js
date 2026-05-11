import { useState, useEffect, useCallback, useMemo } from 'react'
import { getMatches, getStadiums } from '../services/matchService'

// ── Mock data (used when VITE_API_URL is not set) ────────────────────────────
const MOCK_STADIUMS = [
  { stadiumId: 's1', name: 'בלומפילד',        city: 'תל אביב',    lat: 32.057, lng: 34.768 },
  { stadiumId: 's2', name: 'סמי עופר',        city: 'חיפה',       lat: 32.794, lng: 34.988 },
  { stadiumId: 's3', name: 'טדי',             city: 'ירושלים',    lat: 31.739, lng: 35.186 },
  { stadiumId: 's4', name: 'טורנר',           city: 'באר שבע',    lat: 31.239, lng: 34.813 },
  { stadiumId: 's5', name: 'נטוע',            city: 'נתניה',      lat: 32.332, lng: 34.862 },
  { stadiumId: 's6', name: 'איצטדיון העיר',   city: 'פתח תקווה',  lat: 32.089, lng: 34.889 },
]

const MOCK_MATCHES = [
  { matchId: '1', homeTeam: 'מכבי תל אביב',  awayTeam: 'הפועל באר שבע', date: '2026-05-14', time: '20:00', stadiumId: 's1', stadiumName: 'בלומפילד',      league: 'ליגת העל', hasTickets: true,  ticketUrl: 'https://www.maccabi-tlv.co.il' },
  { matchId: '2', homeTeam: 'מכבי חיפה',     awayTeam: "בית\"ר ירושלים",  date: '2026-05-15', time: '19:00', stadiumId: 's2', stadiumName: 'סמי עופר',       league: 'ליגת העל', hasTickets: true,  ticketUrl: 'https://www.maccabi-haifafc.co.il' },
  { matchId: '3', homeTeam: "בית\"ר ירושלים", awayTeam: 'הפועל תל אביב', date: '2026-05-16', time: '18:30', stadiumId: 's3', stadiumName: 'טדי',            league: 'ליגת העל', hasTickets: false, ticketUrl: '' },
  { matchId: '4', homeTeam: 'הפועל באר שבע', awayTeam: 'מכבי נתניה',    date: '2026-05-17', time: '20:00', stadiumId: 's4', stadiumName: 'טורנר',          league: 'ליגת העל', hasTickets: true,  ticketUrl: 'https://www.hbs.co.il' },
  { matchId: '5', homeTeam: 'מכבי נתניה',    awayTeam: 'הפועל חיפה',    date: '2026-05-18', time: '17:00', stadiumId: 's5', stadiumName: 'נטוע',           league: 'ליגת העל', hasTickets: true,  ticketUrl: '' },
  { matchId: '6', homeTeam: 'מ.ס. אשדוד',    awayTeam: 'הפועל פ"ת',     date: '2026-05-19', time: '19:30', stadiumId: 's6', stadiumName: 'איצטדיון העיר', league: 'ליגת העל', hasTickets: false, ticketUrl: '' },
]

const USE_MOCK = !import.meta.env.VITE_API_URL

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useMatches() {
  const [allMatches,  setAllMatches]  = useState([])
  const [stadiums,    setStadiums]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

  const [filters, setFilters] = useState({
    league:     '',
    team:       '',
    hasTickets: '',   // 'true' | 'false' | ''
    city:       '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (USE_MOCK) {
        setAllMatches(MOCK_MATCHES)
        setStadiums(MOCK_STADIUMS)
      } else {
        const [matchData, stadiumData] = await Promise.all([getMatches(), getStadiums()])
        setAllMatches(matchData)
        setStadiums(stadiumData)
      }
    } catch (err) {
      setError('לא ניתן לטעון נתונים כרגע')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Derived lists for filter dropdowns
  const leagues = useMemo(
    () => [...new Set(allMatches.map((m) => m.league))].filter(Boolean),
    [allMatches],
  )
  const teams = useMemo(
    () => [...new Set(allMatches.flatMap((m) => [m.homeTeam, m.awayTeam]))].filter(Boolean).sort(),
    [allMatches],
  )
  const cities = useMemo(
    () => [...new Set(stadiums.map((s) => s.city))].filter(Boolean).sort(),
    [stadiums],
  )

  // Filtered match list
  const filteredMatches = useMemo(() => {
    return allMatches.filter((m) => {
      if (filters.league     && m.league !== filters.league)                             return false
      if (filters.team       && m.homeTeam !== filters.team && m.awayTeam !== filters.team) return false
      if (filters.hasTickets && String(m.hasTickets) !== filters.hasTickets)             return false
      if (filters.city) {
        const stadium = stadiums.find((s) => s.stadiumId === m.stadiumId)
        if (!stadium || stadium.city !== filters.city)                                   return false
      }
      return true
    })
  }, [allMatches, stadiums, filters])

  // Stadiums that have at least one filtered match
  const activeStadiums = useMemo(() => {
    const ids = new Set(filteredMatches.map((m) => m.stadiumId))
    return stadiums.map((s) => ({
      ...s,
      matches: filteredMatches.filter((m) => m.stadiumId === s.stadiumId),
      hasMatches: ids.has(s.stadiumId),
    }))
  }, [stadiums, filteredMatches])

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters],
  )

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function clearFilters() {
    setFilters({ league: '', team: '', hasTickets: '', city: '' })
  }

  return {
    matches: filteredMatches,
    allMatches,
    stadiums: activeStadiums,
    loading,
    error,
    filters,
    leagues,
    teams,
    cities,
    activeFilterCount,
    updateFilter,
    clearFilters,
    reload: load,
  }
}
