/**
 * @author Roy Meoded
 * @author Yarin Keshet
 * @author Tomer Gal
 *
 * @date 08-06-2026
 *
 * MatchPopup.jsx — Stadium Match Popup Panel
 * ============================================
 * Floating panel rendered over the MapPage when a stadium marker is selected.
 * Lists all matches for the selected stadium as MatchRow cards.
 *
 * Each MatchRow displays: home vs. away teams, date, time, ticket status,
 * a details link to /matches/:id, an optional ticket purchase link,
 * and a favorite toggle button for authenticated users.
 *
 * The popup is dismissed via the X button or by clicking the map background.
 * Returns null when no stadium is selected.
 */
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { X, Calendar, Clock, MapPin, Ticket, ExternalLink, Heart } from 'lucide-react'
import { modalVariants } from '../animations/variants'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

// Renders a single match card with team names, date/time, ticket status,
// and action buttons (details, buy ticket, favorite toggle).
function MatchRow({ match, isFavorite, onToggleFavorite }) {
  const dateStr = new Date(match.date).toLocaleDateString('he-IL', {
    weekday: 'short', day: 'numeric', month: 'short',
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-dark-800 border border-dark-700 hover:border-dark-600 transition-colors"
    >
      {/* Teams */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-white font-bold text-sm text-right flex-1">{match.homeTeam}</span>
        <span className="text-dark-500 text-xs font-bold shrink-0">VS</span>
        <span className="text-white font-bold text-sm text-left flex-1">{match.awayTeam}</span>
      </div>

      {/* Date, time, and ticket availability */}
      <div className="flex flex-wrap gap-3 text-xs text-dark-400 mb-3">
        <span className="flex items-center gap-1"><Calendar size={11} />{dateStr}</span>
        <span className="flex items-center gap-1"><Clock size={11} />{match.time}</span>
        <span className={`flex items-center gap-1 font-medium ${match.hasTickets ? 'text-pitch-400' : 'text-red-400'}`}>
          <Ticket size={11} />
          {match.hasTickets ? 'יש כרטיסים' : 'אזל'}
        </span>
      </div>

      {/* Action buttons: details link, optional ticket link, favorite toggle */}
      <div className="flex items-center gap-2">
        <Link
          to={`/matches/${match.matchId}`}
          className="flex-1 btn-secondary text-xs py-1.5 text-center"
        >
          פרטים
        </Link>

        {match.hasTickets && match.ticketUrl && (
          <a
            href={match.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 btn-primary text-xs py-1.5 text-center flex items-center justify-center gap-1"
          >
            קנה כרטיס <ExternalLink size={11} />
          </a>
        )}

        {onToggleFavorite && (
          <motion.button
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onToggleFavorite(match)}
            className={`p-1.5 rounded-lg border transition-colors ${
              isFavorite
                ? 'bg-red-900/50 border-red-800 text-red-400'
                : 'bg-dark-700 border-dark-600 text-dark-400 hover:text-red-400'
            }`}
          >
            <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

// Main popup component. Renders a scrollable panel of MatchRow cards for the
// selected stadium. Returns null if no stadium is provided.
// The favorite toggle is only shown to authenticated users.
export default function MatchPopup({ stadium, onClose, favorites, onToggleFavorite }) {
  const { user } = useAuth()

  if (!stadium) return null

  return (
    <AnimatePresence>
      <motion.div
        key="popup-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-40 flex items-end sm:items-center justify-center p-4 pointer-events-none"
      >
        <motion.div
          key="popup"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="
            pointer-events-auto
            w-full max-w-sm max-h-[70vh]
            bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl
            flex flex-col overflow-hidden
          "
        >
          {/* Header: stadium name, city, and close button */}
          <div className="flex items-start justify-between p-5 border-b border-dark-800 shrink-0">
            <div>
              <h3 className="text-white font-bold text-base">{stadium.name}</h3>
              <p className="text-dark-400 text-xs flex items-center gap-1 mt-0.5">
                <MapPin size={11} /> {stadium.city}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-dark-500 hover:text-white transition-colors p-1 -mr-1 -mt-1"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable match list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {stadium.matches.length === 0 ? (
              <p className="text-dark-500 text-sm text-center py-8">אין משחקים לאצטדיון זה</p>
            ) : (
              stadium.matches.map((match) => (
                <MatchRow
                  key={match.matchId}
                  match={match}
                  isFavorite={favorites?.has(match.matchId)}
                  onToggleFavorite={user ? onToggleFavorite : null}
                />
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
