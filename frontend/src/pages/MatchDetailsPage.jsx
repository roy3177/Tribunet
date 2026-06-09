/**
 * @author Roy Meoded
 * @author Yarin Keshet
 * @author Tomer Gal
 *
 * @date 08-06-2026
 *
 * MatchDetailsPage.jsx — Match Detail View
 * =========================================
 * Full detail page for a single match, routed at /matches/:id.
 * Fetches the match by ID from GET /matches/{id} (or mock data in dev).
 *
 * Displays: league badge, ticket availability, home vs. away teams,
 * date, time, and stadium. Action buttons:
 *   - Ticket purchase link (shown only when hasTickets and ticketUrl exist).
 *   - Save/remove favorites toggle for authenticated users.
 *   - Link back to /map.
 *
 * Renders a not-found message when the match ID does not exist.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Clock, MapPin, Ticket, Star, ExternalLink, Trophy } from 'lucide-react'
import { pageVariants, cardVariants, fadeIn } from '../animations/variants'
import { getMatch, addFavorite, removeFavorite } from '../services/matchService'
import { useAuth } from '../context/AuthContext'

const MOCK_MATCHES = {
  '1': { matchId: '1', homeTeam: 'מכבי תל אביב',  awayTeam: 'הפועל באר שבע', date: '2026-05-14', time: '20:00', stadiumId: 's1', stadiumName: 'בלומפילד',      league: 'ליגת העל', hasTickets: true,  ticketUrl: 'https://www.maccabi-tlv.co.il' },
  '2': { matchId: '2', homeTeam: 'מכבי חיפה',     awayTeam: "בית\"ר ירושלים", date: '2026-05-15', time: '19:00', stadiumId: 's2', stadiumName: 'סמי עופר',       league: 'ליגת העל', hasTickets: true,  ticketUrl: 'https://www.maccabi-haifafc.co.il' },
  '3': { matchId: '3', homeTeam: "בית\"ר ירושלים", awayTeam: 'הפועל תל אביב', date: '2026-05-16', time: '18:30', stadiumId: 's3', stadiumName: 'טדי',            league: 'ליגת העל', hasTickets: false, ticketUrl: '' },
  '4': { matchId: '4', homeTeam: 'הפועל באר שבע', awayTeam: 'מכבי נתניה',    date: '2026-05-17', time: '20:00', stadiumId: 's4', stadiumName: 'טורנר',          league: 'ליגת העל', hasTickets: true,  ticketUrl: 'https://www.hbs.co.il' },
  '5': { matchId: '5', homeTeam: 'מכבי נתניה',    awayTeam: 'הפועל חיפה',    date: '2026-05-18', time: '17:00', stadiumId: 's5', stadiumName: 'נטוע',           league: 'ליגת העל', hasTickets: true,  ticketUrl: '' },
  '6': { matchId: '6', homeTeam: 'מ.ס. אשדוד',    awayTeam: "הפועל פ\"ת",    date: '2026-05-19', time: '19:30', stadiumId: 's6', stadiumName: 'איצטדיון העיר', league: 'ליגת העל', hasTickets: false, ticketUrl: '' },
}

const USE_MOCK = !import.meta.env.VITE_API_URL

// Main match detail page. Fetches the match by :id and manages favorite toggle state.
export default function MatchDetailsPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [match,      setMatch]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favLoading, setFavLoading] = useState(false)

  // Fetches the match data by ID on mount. Sets match to null if not found.
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        setMatch(USE_MOCK ? (MOCK_MATCHES[id] ?? null) : await getMatch(id))
      } catch {
        setMatch(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Toggles the favorite status of the current match via POST/DELETE /favorites.
  async function handleToggleFavorite() {
    if (!user || !match) return
    setFavLoading(true)
    try {
      if (isFavorite) {
        await removeFavorite(match.matchId)
        setIsFavorite(false)
      } else {
        await addFavorite(match.matchId)
        setIsFavorite(true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setFavLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-pitch-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!match) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-dark-400 text-lg mb-6">המשחק לא נמצא</p>
        <button onClick={() => navigate(-1)} className="btn-secondary">חזור</button>
      </div>
    )
  }

  const dateStr = new Date(match.date).toLocaleDateString('he-IL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 pointer-events-none z-0">
        <img src="https://tribunet-frontend-prod.s3.us-east-1.amazonaws.com/assets/game_details_page_img.jpg"
          alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-dark-950/80" />
      </div>

      <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
        className="relative z-10 max-w-3xl mx-auto px-4 py-8">

        <motion.button variants={fadeIn} initial="hidden" animate="visible"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors mb-8 text-sm">
          <ArrowLeft size={16} /> חזרה
        </motion.button>

        <motion.div variants={cardVariants} custom={0} initial="hidden" animate="visible"
          className="card relative overflow-hidden mb-5">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-pitch-500 to-transparent" />
          <div className="flex justify-between items-start mb-6">
            <span className="badge-green flex items-center gap-1.5"><Trophy size={11} /> {match.league}</span>
            <span className={`badge flex items-center gap-1 ${match.hasTickets ? 'badge-green' : 'badge-red'}`}>
              <Ticket size={11} />{match.hasTickets ? 'יש כרטיסים' : 'אזל'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex-1 text-center">
              <p className="text-xs text-dark-500 mb-2 uppercase tracking-widest">בית</p>
              <p className="text-white text-2xl font-black leading-tight">{match.homeTeam}</p>
            </div>
            <div className="text-dark-600 font-bold text-xl shrink-0">VS</div>
            <div className="flex-1 text-center">
              <p className="text-xs text-dark-500 mb-2 uppercase tracking-widest">חוץ</p>
              <p className="text-white text-2xl font-black leading-tight">{match.awayTeam}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 border-t border-dark-800 pt-5">
            <div className="flex flex-col items-center gap-1.5">
              <Calendar size={16} className="text-pitch-400" />
              <p className="text-dark-500 text-xs">תאריך</p>
              <p className="text-white text-sm font-medium text-center">{dateStr}</p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Clock size={16} className="text-pitch-400" />
              <p className="text-dark-500 text-xs">שעה</p>
              <p className="text-white text-sm font-medium">{match.time}</p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <MapPin size={16} className="text-pitch-400" />
              <p className="text-dark-500 text-xs">אצטדיון</p>
              <p className="text-white text-sm font-medium text-center">{match.stadiumName}</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} custom={1} initial="hidden" animate="visible" className="flex flex-wrap gap-3">
          {match.hasTickets && match.ticketUrl && (
            <a href={match.ticketUrl} target="_blank" rel="noopener noreferrer"
              className="btn-primary flex items-center gap-2 flex-1 justify-center min-w-fit">
              <Ticket size={16} /> רכישת כרטיסים <ExternalLink size={13} />
            </a>
          )}
          {user && (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleToggleFavorite} disabled={favLoading}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm border transition-colors ${
                isFavorite ? 'bg-yellow-900/40 border-yellow-700 text-yellow-400' : 'bg-dark-800 border-dark-600 text-dark-100 hover:bg-dark-700'}`}>
              <Star size={15} className={isFavorite ? 'fill-yellow-400' : ''} />
              {isFavorite ? 'הסר ממועדפים' : 'שמור למועדפים'}
            </motion.button>
          )}
          <Link to="/map" className="btn-secondary flex items-center gap-2 px-5">
            <MapPin size={15} /> ראה במפה
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
