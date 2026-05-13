import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, MapPin, Users, Heart, Plus, Pencil, Trash2,
  Ticket, RefreshCw, AlertCircle,
} from 'lucide-react'
import { pageVariants, cardVariants, staggerContainer, fadeIn } from '../animations/variants'
import { getMatches, deleteMatch, getStadiums } from '../services/matchService'

const USE_MOCK = !import.meta.env.VITE_API_URL

const MOCK_MATCHES = [
  { matchId: '1', homeTeam: 'מכבי תל אביב',   awayTeam: 'הפועל באר שבע', date: '2026-05-14', time: '20:00', stadiumName: 'בלומפילד',       league: 'ליגת העל', hasTickets: true  },
  { matchId: '2', homeTeam: 'מכבי חיפה',       awayTeam: "בית\"ר ירושלים", date: '2026-05-15', time: '19:00', stadiumName: 'סמי עופר',        league: 'ליגת העל', hasTickets: true  },
  { matchId: '3', homeTeam: "בית\"ר ירושלים",  awayTeam: 'הפועל תל אביב', date: '2026-05-16', time: '18:30', stadiumName: 'טדי',             league: 'ליגת העל', hasTickets: false },
  { matchId: '4', homeTeam: 'הפועל באר שבע',  awayTeam: 'מכבי נתניה',    date: '2026-05-17', time: '20:00', stadiumName: 'טורנר',           league: 'ליגת העל', hasTickets: true  },
  { matchId: '5', homeTeam: 'מכבי נתניה',      awayTeam: 'הפועל חיפה',    date: '2026-05-18', time: '17:00', stadiumName: 'נטוע',            league: 'ליגת העל', hasTickets: true  },
  { matchId: '6', homeTeam: 'מ.ס. אשדוד',      awayTeam: "הפועל פ\"ת",    date: '2026-05-19', time: '19:30', stadiumName: 'איצטדיון העיר',  league: 'ליגת העל', hasTickets: false },
]

export default function AdminDashboard() {
  const navigate = useNavigate()

  const [matches,       setMatches]       = useState([])
  const [stadiumsCount, setStadiumsCount] = useState(0)
  const [loading,       setLoading]       = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (USE_MOCK) {
        setMatches(MOCK_MATCHES)
        setStadiumsCount(6)
      } else {
        const [matchData, stadiumData] = await Promise.all([getMatches(), getStadiums()])
        setMatches(matchData)
        setStadiumsCount(stadiumData.length)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(matchId) {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק משחק זה?')) return
    try {
      if (!USE_MOCK) await deleteMatch(matchId)
      setMatches((prev) => prev.filter((m) => m.matchId !== matchId))
    } catch (err) {
      console.error(err)
    }
  }

  const statCards = [
    { label: 'משחקים',    value: matches.length, icon: Trophy, color: 'text-pitch-400',  bg: 'bg-pitch-900/50'    },
    { label: 'אצטדיונים', value: stadiumsCount,  icon: MapPin, color: 'text-blue-400',   bg: 'bg-blue-900/30'     },
    { label: 'משתמשים',   value: '—',            icon: Users,  color: 'text-purple-400', bg: 'bg-purple-900/30'   },
    { label: 'מועדפים',   value: '—',            icon: Heart,  color: 'text-yellow-400', bg: 'bg-yellow-900/30'   },
  ]

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto px-4 py-8"
    >
      {/* Header */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h2 className="text-3xl font-bold text-white">לוח ניהול</h2>
          <p className="text-dark-400 text-sm mt-1">ניהול משחקים, אצטדיונים ומשתמשים</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={load}
            className="p-2.5 rounded-lg bg-dark-800 border border-dark-600 text-dark-400 hover:text-white transition-colors"
          >
            <RefreshCw size={16} />
          </motion.button>
          <Link to="/admin/matches/new" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> הוסף משחק
          </Link>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            variants={cardVariants}
            custom={i}
            className="card flex items-center gap-3"
          >
            <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon size={20} className={s.color} />
            </div>
            <div>
              <p className="text-dark-400 text-xs mb-0.5">{s.label}</p>
              <p className="text-white font-bold text-2xl">
                {loading ? '...' : s.value}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick link */}
      <motion.div
        variants={cardVariants}
        custom={4}
        initial="hidden"
        animate="visible"
        className="flex gap-3 mb-8"
      >
        <Link to="/admin/stadiums" className="btn-secondary flex items-center gap-2 text-sm">
          <MapPin size={15} /> ניהול אצטדיונים
        </Link>
      </motion.div>

      {/* Match table */}
      <motion.div
        variants={cardVariants}
        custom={5}
        initial="hidden"
        animate="visible"
        className="card overflow-hidden p-0"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-800">
          <h3 className="text-white font-semibold">כל המשחקים</h3>
          <span className="text-dark-500 text-sm">{matches.length} משחקים</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-2 border-pitch-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12 text-dark-500">
            <AlertCircle size={32} className="mx-auto mb-3 opacity-40" />
            <p>אין משחקים עדיין</p>
            <Link to="/admin/matches/new" className="btn-primary inline-flex items-center gap-2 mt-4 text-sm">
              <Plus size={14} /> הוסף ראשון
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-800 text-dark-400 text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 text-right font-medium">קבוצות</th>
                  <th className="px-5 py-3 text-right font-medium">תאריך</th>
                  <th className="px-5 py-3 text-right font-medium">אצטדיון</th>
                  <th className="px-5 py-3 text-right font-medium">כרטיסים</th>
                  <th className="px-5 py-3 text-right font-medium">פעולות</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {matches.map((match, i) => (
                    <motion.tr
                      key={match.matchId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: { delay: i * 0.04 } }}
                      exit={{ opacity: 0 }}
                      className="border-b border-dark-900 hover:bg-dark-800/40 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <p className="text-white font-medium">{match.homeTeam}</p>
                        <p className="text-dark-500 text-xs">נגד {match.awayTeam}</p>
                      </td>
                      <td className="px-5 py-3 text-dark-300">
                        {new Date(match.date).toLocaleDateString('he-IL')} · {match.time}
                      </td>
                      <td className="px-5 py-3 text-dark-300">{match.stadiumName}</td>
                      <td className="px-5 py-3">
                        <span className={`badge text-xs ${match.hasTickets ? 'badge-green' : 'badge-red'}`}>
                          <Ticket size={9} /> {match.hasTickets ? 'יש' : 'אזל'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(`/admin/matches/${match.matchId}/edit`)}
                            className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
                          >
                            <Pencil size={14} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(match.matchId)}
                            className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
