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

// ── Map style ─────────────────────────────────────────────────────────────────
// Development: free OSM/Maptiler style.
// Production: replace with Amazon Location Service tile endpoint.
//
//   `https://maps.geo.${region}.amazonaws.com/maps/v0/maps/${mapName}/style-descriptor?key=${apiKey}`
//
const MAP_STYLE =
  import.meta.env.VITE_LOCATION_MAP_STYLE_URL ??
  'https://tiles.openfreemap.org/styles/dark'

const ISRAEL_CENTER = { longitude: 34.85, latitude: 31.5 }
const INITIAL_VIEW  = { ...ISRAEL_CENTER, zoom: 7.2, pitch: 0, bearing: 0 }

// ── Loading overlay ───────────────────────────────────────────────────────────
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

// ── Error banner ──────────────────────────────────────────────────────────────
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MapPage() {
  const { user }          = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedStadium, setSelectedStadium] = useState(null)
  const [favorites, setFavorites]     = useState(new Set())
  const mapRef                        = useRef(null)

  const {
    matches, stadiums, loading, error,
    filters, leagues, teams, cities,
    activeFilterCount, updateFilter, clearFilters, reload,
  } = useMatches()

  // Fly map to selected stadium
  const handleMarkerClick = useCallback((stadium) => {
    setSelectedStadium((prev) => prev?.stadiumId === stadium.stadiumId ? null : stadium)
    mapRef.current?.flyTo({
      center: [stadium.lng, stadium.lat],
      zoom: 13,
      duration: 900,
      essential: true,
    })
  }, [])

  const handleMapClick = useCallback(() => {
    setSelectedStadium(null)
  }, [])

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
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex h-[calc(100vh-64px)] overflow-hidden"
    >
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <FilterSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        filters={filters}
        leagues={leagues}
        teams={teams}
        cities={cities}
        activeFilterCount={activeFilterCount}
        updateFilter={updateFilter}
        clearFilters={clearFilters}
        matchCount={matches.length}
      />

      {/* ── Map area ────────────────────────────────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden">

        {/* Top bar */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen((v) => !v)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium shadow-xl border transition-colors
              ${sidebarOpen
                ? 'bg-pitch-700 border-pitch-600 text-white'
                : 'bg-dark-900/90 border-dark-700 text-dark-300 hover:text-white backdrop-blur-sm'
              }
            `}
          >
            <SlidersHorizontal size={15} />
            סינון
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-pitch-500 text-white text-xs flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </motion.button>

          {/* Active filter chips */}
          <AnimatePresence>
            {filters.league && (
              <motion.span
                key="league-chip"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="badge-green px-3 py-1.5 text-xs backdrop-blur-sm bg-pitch-900/80"
              >
                {filters.league}
              </motion.span>
            )}
            {filters.team && (
              <motion.span
                key="team-chip"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="badge-green px-3 py-1.5 text-xs backdrop-blur-sm bg-pitch-900/80"
              >
                {filters.team}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Match count pill */}
        <motion.div
          key={matches.length}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 right-4 z-20 bg-dark-900/90 border border-dark-700 backdrop-blur-sm rounded-xl px-3 py-2 text-xs text-dark-300 shadow-xl"
        >
          {matches.length} משחק{matches.length !== 1 ? 'ים' : ''}
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && <ErrorBanner message={error} onRetry={reload} />}
        </AnimatePresence>

        {/* Loading */}
        <AnimatePresence>
          {loading && <LoadingOverlay />}
        </AnimatePresence>

        {/* Map */}
        <Map
          ref={mapRef}
          initialViewState={INITIAL_VIEW}
          style={{ width: '100%', height: '100%' }}
          mapStyle={MAP_STYLE}
          onClick={handleMapClick}
          attributionControl={false}
        >
          <NavigationControl position="bottom-right" showCompass={false} />
          <ScaleControl position="bottom-left" unit="metric" />

          {/* Stadium markers */}
          {stadiums.map((stadium, i) => (
            <StadiumMarker
              key={stadium.stadiumId}
              stadium={stadium}
              isSelected={selectedStadium?.stadiumId === stadium.stadiumId}
              onClick={handleMarkerClick}
              entryIndex={i}
            />
          ))}
        </Map>

        {/* Match popup */}
        {selectedStadium && (
          <MatchPopup
            stadium={selectedStadium}
            onClose={() => setSelectedStadium(null)}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </div>
    </motion.div>
  )
}
