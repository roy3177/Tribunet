/**
 * @author Roy Meoded
 * @author Yarin Keshet
 * @author Tomer Gal
 *
 * @date 08-06-2026
 *
 * StadiumMarker.jsx — MapLibre Stadium Pin
 * ==========================================
 * Animated map marker rendered inside the MapLibre GL map for each stadium.
 * Staggered entry animation based on entryIndex for a cascade effect on load.
 *
 * Visual states:
 *   Default  — dark pin with MapPin icon (no upcoming matches with tickets).
 *   Tickets  — green-bordered pin with Ticket icon (at least one match has tickets).
 *   Selected — pitch-colored pin with a looping pulse ring.
 *   Hovered  — pin scales up and a tooltip shows stadium name, city, and match count.
 *
 * A match count badge is shown in the top-right corner of the pin.
 */
import { useState } from 'react'
import { Marker } from 'react-map-gl/maplibre'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Ticket } from 'lucide-react'

// Renders a single animated stadium pin on the MapLibre map.
// Handles hover state locally; selected state and click are controlled by the parent.
export default function StadiumMarker({ stadium, isSelected, onClick, entryIndex = 0 }) {
  const [hovered, setHovered] = useState(false)

  // True if any of the stadium's matches still have tickets available.
  const hasTickets = stadium.matches.some((m) => m.hasTickets)

  // Total number of matches scheduled at this stadium.
  const matchCount = stadium.matches.length

  return (
    <Marker
      longitude={stadium.lng}
      latitude={stadium.lat}
      anchor="bottom"
      onClick={(e) => { e.originalEvent.stopPropagation(); onClick(stadium) }}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: entryIndex * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
        className="relative cursor-pointer select-none"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Looping pulse ring — only visible when the marker is selected */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              key="pulse"
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full bg-pitch-500"
            />
          )}
        </AnimatePresence>

        {/* Pin body: scales up on hover or selection */}
        <motion.div
          animate={{
            scale: hovered || isSelected ? 1.18 : 1,
            y: hovered || isSelected ? -3 : 0,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className="relative flex flex-col items-center"
        >
          {/* Match count badge — top-right corner of the pin icon */}
          {matchCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`
                absolute -top-2 -right-2 z-10
                min-w-[18px] h-[18px] rounded-full
                flex items-center justify-center
                text-[10px] font-bold text-white
                ${hasTickets ? 'bg-pitch-600' : 'bg-dark-600'}
                border border-dark-900 shadow-md
              `}
            >
              {matchCount}
            </motion.div>
          )}

          {/* Circular icon container: color changes based on selected/ticket state */}
          <div
            className={`
              w-10 h-10 rounded-full flex items-center justify-center shadow-xl
              border-2 transition-colors duration-150
              ${isSelected
                ? 'bg-pitch-600 border-pitch-400 text-white'
                : hasTickets
                  ? 'bg-dark-800 border-pitch-600 text-pitch-400 hover:bg-pitch-900'
                  : 'bg-dark-800 border-dark-600 text-dark-400'
              }
            `}
          >
            {hasTickets ? <Ticket size={17} /> : <MapPin size={17} />}
          </div>

          {/* Small rotated square forming the pin's bottom pointer tip */}
          <div
            className={`
              w-2 h-2 rotate-45 -mt-1 shadow-md
              ${isSelected ? 'bg-pitch-600' : 'bg-dark-800'}
            `}
          />
        </motion.div>

        {/* Hover tooltip — shown only when hovered and not selected */}
        <AnimatePresence>
          {hovered && !isSelected && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.92 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 pointer-events-none"
            >
              <div className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-1.5 shadow-xl whitespace-nowrap">
                <p className="text-white text-xs font-semibold">{stadium.name}</p>
                <p className="text-dark-400 text-[10px]">{stadium.city} · {matchCount} משחק{matchCount !== 1 ? 'ים' : ''}</p>
              </div>
              {/* Tooltip arrow */}
              <div className="w-2 h-2 bg-dark-800 border-r border-b border-dark-700 rotate-45 mx-auto -mt-1" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Marker>
  )
}
