/**
 * @author Roy Meoded
 * @author Yarin Keshet
 * @author Tomer Gal
 *
 * @date 08-06-2026
 *
 * MapPage.jsx — Interactive Stadium Map
 * ======================================
 * Full-screen interactive map of Israeli football stadiums powered by
 * MapLibre GL (react-map-gl). Matches and stadiums are fetched via the
 * useMatches hook and rendered as StadiumMarker components.
 *
 * Key features:
 *   - FilterSidebar for filtering by league, team, city, date, and tickets.
 *   - Clicking a marker flies the camera to the stadium and opens a MatchPopup.
 *   - Authenticated users can toggle match favorites inline from the popup.
 *   - Map style: OpenFreeMap dark (dev) or Amazon Location Service (prod).
 */
import { useState, useCallback, useRef } from 'react'
import Map, { NavigationControl, ScaleControl } from 'react-map-gl/maplibre'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import 'maplibre-gl/dist/maplibre-gl.css'
import { pageVariants } from '../animations/variants'
import { useMatches } from '../hooks/useMatches'
import { useAuth } from '../context/AuthContext'
import FilterSidebar from '../components/FilterSidebar'
import StadiumMarker from '../components/StadiumMarker'
import MatchPopup from '../components/MatchPopup'
import { addFavorite, removeFavorite } from '../services/matchService'

const MAP_STYLE =
  import.meta.env.VITE_LOCATION_MAP_STYLE_URL ??
  'https://tiles.openfreemap.org/styles/dark'

const ISRAEL_CENTER = { longitude: 34.85, latitude: 31.5 }
const INITIAL_VIEW  = { ...ISRAEL_CENTER, zoom: 7.2, pitch: 0, bearing: 0 }

// Fullscreen spinner overlay shown while match/stadium data is loading.
function LoadingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 bg-dark-950/70 backdrop-blur-sm flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="text-pitch-400 animate-spin" />
        <p className="text-dark-300 text-sm">טוען נתונים...</p>
      </div>
    </motion.div>
  )
}

// Top-centered error banner with a retry button shown when data fetching fails.
function ErrorBanner({ message, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-red-900/80 border border-red-700 text-red-200 text-sm rounded-xl px-4 py-3 shadow-xl backdrop-blur-sm"
    >
      <AlertCircle size={16} className="shrink-0" />
      {message}
      <button onClick={onRetry} className="flex items-center gap-1 text-red-300 hover:text-white transition-colors ml-1">
        <RefreshCw size={13} /> נסה שוב
      </button>
    </motion.div>
  )
}

// Main map page component. Manages sidebar visibility, selected stadium,
// and the user's favorites set.
export default function MapPage() {
  const { user }                              = useAuth()
  const [sidebarOpen, setSidebarOpen]         = useState(true)
  const [selectedStadium, setSelectedStadium] = useState(null)
  const [favorites, setFavorites]             = useState(new Set())
  const mapRef                                = useRef(null)

  const {
    matches, stadiums, loading, error,
    filters, leagues, teams, cities,
    activeFilterCount, updateFilter, clearFilters, reload,
  } = useMatches()

  // Toggles the selected stadium and flies the map camera to its coordinates.
  const handleMarkerClick = useCallback((stadium) => {
    setSelectedStadium((prev) => prev?.stadiumId === stadium.stadiumId ? null : stadium)
    mapRef.current?.flyTo({
      center: [stadium.lng, stadium.lat],
      zoom: 13,
      duration: 900,
      essential: true,
    })
  }, [])

  // Deselects the currently selected stadium when the map background is clicked.
  const handleMapClick = useCallback(() => {
    setSelectedStadium(null)
  }, [])

  // Adds or removes a match from the user's favorites via POST/DELETE /favorites.
  async function handleToggleFavorite(match) {
    if (!user) return
    const id = match.matchId
    try {
      if (favorites.has(id)) {
        await removeFavorite(id)
        setFavorites((prev) => { const s = new Set(prev); s.delete(id); return s })
      } else {
        await addFavorite(id)
        setFavorites((prev) => new Set(prev).add(id))
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err)
    }
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
      className="flex h-[calc(100vh-64px)] overflow-hidden">

      <FilterSidebar
        open={sidebarOpen} onClose={() => setSidebarOpen(false)}
        filters={filters} leagues={leagues} teams={teams} cities={cities}
        activeFilterCount={activeFilterCount} updateFilter={updateFilter}
        clearFilters={clearFilters} matchCount={matches.length}
      />

      <div className="relative flex-1 overflow-hidden">
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium shadow-xl border transition-colors
              ${sidebarOpen ? 'bg-pitch-700 border-pitch-600 text-white' : 'bg-dark-900/90 border-dark-700 text-dark-300 hover:text-white backdrop-blur-sm'}`}>
            <SlidersHorizontal size={15} />
            סינון
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-pitch-500 text-white text-xs flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </motion.button>
          <AnimatePresence>
            {filters.league && (
              <motion.span key="league-chip"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="badge-green px-3 py-1.5 text-xs backdrop-blur-sm bg-pitch-900/80">
                {filters.league}
              </motion.span>
            )}
            {filters.team && (
              <motion.span key="team-chip"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="badge-green px-3 py-1.5 text-xs backdrop-blur-sm bg-pitch-900/80">
                {filters.team}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <motion.div key={matches.length} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 right-4 z-20 bg-dark-900/90 border border-dark-700 backdrop-blur-sm rounded-xl px-3 py-2 text-xs text-dark-300 shadow-xl">
          {matches.length} משחק{matches.length !== 1 ? 'ים' : ''}
        </motion.div>

        <AnimatePresence>
          {error && <ErrorBanner message={error} onRetry={reload} />}
        </AnimatePresence>
        <AnimatePresence>
          {loading && <LoadingOverlay />}
        </AnimatePresence>

        <Map ref={mapRef} initialViewState={INITIAL_VIEW} style={{ width: '100%', height: '100%' }}
          mapStyle={MAP_STYLE} onClick={handleMapClick} attributionControl={false}>
          <NavigationControl position="bottom-right" showCompass={false} />
          <ScaleControl position="bottom-left" unit="metric" />
          {stadiums.map((stadium, i) => (
            <StadiumMarker key={stadium.stadiumId} stadium={stadium}
              isSelected={selectedStadium?.stadiumId === stadium.stadiumId}
              onClick={handleMarkerClick} entryIndex={i} />
          ))}
        </Map>

        {selectedStadium && (
          <MatchPopup stadium={selectedStadium} onClose={() => setSelectedStadium(null)}
            favorites={favorites} onToggleFavorite={handleToggleFavorite} />
        )}
      </div>
    </motion.div>
  )
}
