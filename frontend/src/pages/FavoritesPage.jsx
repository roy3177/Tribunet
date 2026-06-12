/**
 * @author Roy Meoded
 * @author Yarin Keshet
 * @author Tomer Gal
 *
 * @date 08-06-2026
 *
 * FavoritesPage.jsx — Saved Matches Page
 * =======================================
 * Displays the authenticated user's saved (favorited) matches fetched from
 * GET /favorites. Each card shows league badge, ticket availability, teams,
 * date/time/stadium, and links to the match detail page.
 *
 * Removing a favorite calls DELETE /favorites/{matchId} and optimistically
 * removes the card from the list with an exit animation.
 * Empty state guides the user to /map to discover matches.
 *
 * @feature F-08 | Add/Remove Favorites
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Ticket, ArrowRight, Trash2, Map } from 'lucide-react'
import { pageVariants, cardVariants, staggerContainer, fadeIn } from '../animations/variants'
import { getFavorites, removeFavorite } from '../services/matchService'
import favBg from '../assets/images/favourite_page.webp'

const USE_MOCK = !import.meta.env.VITE_API_URL

const MOCK_FAVORITES = [
  { matchId: '1', homeTeam: 'מכבי תל אביב',  awayTeam: 'הפועל באר שבע', date: '2026-05-14', time: '20:00', stadiumName: 'בלומפילד', league: 'ליגת העל', hasTickets: true },
  { matchId: '4', homeTeam: 'הפועל באר שבע', awayTeam: 'מכבי נתניה',    date: '2026-05-17', time: '20:00', stadiumName: 'טורנר',    league: 'ליגת העל', hasTickets: true },
]

// Main favorites page component. Fetches saved matches on mount and manages removal.
export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([])
  const [loading,   setLoading]   = useState(true)

  // Loads the user's favorited matches from the API or mock data on mount.
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        setFavorites(USE_MOCK ? MOCK_FAVORITES : await getFavorites())
      } catch {
        setFavorites([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Removes a match from favorites optimistically and calls DELETE /favorites/{matchId}.
  async function handleRemove(matchId) {
    try {
      if (!USE_MOCK) await removeFavorite(matchId)
      setFavorites((prev) => prev.filter((m) => m.matchId !== matchId))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 pointer-events-none z-0">
        <img src={favBg} alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-black/80" />
      </div>

      <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="relative z-10">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <Heart size={28} className="text-pitch-400" /> המשחקים שלי
              </h2>
              <p className="text-dark-400 text-sm mt-1">
                {loading ? '...' : `${favorites.length} משחקים שמורים`}
              </p>
            </div>
            <Link to="/map" className="btn-secondary flex items-center gap-2 text-sm">
              <Map size={15} /> גלה עוד משחקים
            </Link>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-pitch-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : favorites.length === 0 ? (
            <motion.div variants={fadeIn} initial="hidden" animate="visible" className="card text-center py-16">
              <Heart size={40} className="text-dark-700 mx-auto mb-4" />
              <p className="text-dark-300 text-lg mb-2">עדיין אין משחקים שמורים</p>
              <p className="text-dark-500 text-sm mb-6">גלה משחקים במפה ושמור את האהובים עליך</p>
              <Link to="/map" className="btn-primary inline-flex items-center gap-2">
                <Map size={16} /> פתח מפה
              </Link>
            </motion.div>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-4">
              <AnimatePresence>
                {favorites.map((match, i) => {
                  const dateStr = new Date(match.date).toLocaleDateString('he-IL', {
                    weekday: 'short', day: 'numeric', month: 'long',
                  })
                  return (
                    <motion.div
                      key={match.matchId} variants={cardVariants} custom={i}
                      exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                      layout className="card flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="badge-green text-xs">{match.league}</span>
                          <span className={`badge text-xs ${match.hasTickets ? 'badge-green' : 'badge-red'}`}>
                            <Ticket size={9} /> {match.hasTickets ? 'יש כרטיסים' : 'אזל'}
                          </span>
                        </div>
                        <p className="text-white font-bold text-lg truncate">
                          {match.homeTeam}{' '}
                          <span className="text-dark-500 font-normal text-sm">נגד</span>{' '}
                          {match.awayTeam}
                        </p>
                        <p className="text-dark-400 text-sm mt-1">
                          {dateStr} · {match.time} · {match.stadiumName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link to={`/matches/${match.matchId}`}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-dark-300 hover:text-white hover:bg-dark-800 transition-colors">
                          פרטים <ArrowRight size={14} />
                        </Link>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => handleRemove(match.matchId)}
                          className="p-2 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
