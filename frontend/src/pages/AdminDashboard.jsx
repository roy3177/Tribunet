/**
 * @author Roy Meoded
 * @author Yarin Keshet
 * @author Tomer Gal
 *
 * @date 08-06-2026
 *
 * AdminDashboard.jsx — Admin Control Panel
 * =========================================
 * Protected page accessible only to admin users (enforced by the router).
 * Displays a summary of platform statistics and a paginated match management
 * table with edit and delete actions.
 *
 * Stat cards: total matches, stadiums, users, and favorites.
 * Match table: supports pagination (PAGE_SIZE = 10), animated rows,
 *              inline edit and delete with a ConfirmDialog.
 * Quick links to /admin/stadiums and /admin/users for extended management.
 *
 * @feature F-12 | Admin Dashboard
 * @feature F-14 | Edit/Delete Match
 */
import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, MapPin, Users, Heart, Plus, Pencil, Trash2, Ticket, RefreshCw, AlertCircle } from 'lucide-react'
import { pageVariants, cardVariants, staggerContainer, fadeIn } from '../animations/variants'
import { getMatches, deleteMatch, getStadiums, getUsers } from '../services/matchService'
import { useToast } from '../context/ToastContext'
import ConfirmDialog from '../components/ConfirmDialog'
import adminBg from '../assets/images/admin_page.webp'

const USE_MOCK = !import.meta.env.VITE_API_URL

const MOCK_MATCHES = [
  { matchId: '1', homeTeam: 'מכבי תל אביב',   awayTeam: 'הפועל באר שבע', date: '2026-05-14', time: '20:00', stadiumName: 'בלומפילד',      league: 'ליגת העל', hasTickets: true  },
  { matchId: '2', homeTeam: 'מכבי חיפה',       awayTeam: "בית\"ר ירושלים", date: '2026-05-15', time: '19:00', stadiumName: 'סמי עופר',       league: 'ליגת העל', hasTickets: true  },
  { matchId: '3', homeTeam: "בית\"ר ירושלים",  awayTeam: 'הפועל תל אביב', date: '2026-05-16', time: '18:30', stadiumName: 'טדי',            league: 'ליגת העל', hasTickets: false },
  { matchId: '4', homeTeam: 'הפועל באר שבע',  awayTeam: 'מכבי נתניה',    date: '2026-05-17', time: '20:00', stadiumName: 'טורנר',          league: 'ליגת העל', hasTickets: true  },
  { matchId: '5', homeTeam: 'מכבי נתניה',      awayTeam: 'הפועל חיפה',    date: '2026-05-18', time: '17:00', stadiumName: 'נטוע',           league: 'ליגת העל', hasTickets: true  },
  { matchId: '6', homeTeam: 'מ.ס. אשדוד',      awayTeam: "הפועל פ\"ת",    date: '2026-05-19', time: '19:30', stadiumName: 'איצטדיון העיר', league: 'ליגת העל', hasTickets: false },
]

// Main admin dashboard component. Loads matches, stadiums, and users in parallel
// and manages pagination and delete confirmation state.
export default function AdminDashboard() {
  const navigate = useNavigate()
  const toast = useToast()

  const [matches,       setMatches]       = useState([])
  const [stadiumsCount, setStadiumsCount] = useState(0)
  const [usersCount,    setUsersCount]    = useState('—')
  const [loading,       setLoading]       = useState(true)
  const [confirmId,     setConfirmId]     = useState(null)
  const [page,          setPage]          = useState(1)
  const PAGE_SIZE = 10

  // Fetches matches, stadiums, and users in parallel and updates all stat counters.
  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (USE_MOCK) {
        setMatches(MOCK_MATCHES)
        setStadiumsCount(6)
      } else {
        const [matchData, stadiumData, userData] = await Promise.all([getMatches(), getStadiums(), getUsers()])
        setMatches(matchData)
        setStadiumsCount(stadiumData.length)
        setUsersCount(userData.length)
        setPage(1)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Deletes a match by ID, removes it from local state, and shows a toast notification.
  async function handleDelete(matchId) {
    try {
      if (!USE_MOCK) await deleteMatch(matchId)
      setMatches((prev) => prev.filter((m) => m.matchId !== matchId))
      toast.success('המשחק נמחק בהצלחה')
    } catch (err) {
      console.error(err)
      toast.error('שגיאה במחיקת המשחק')
    } finally {
      setConfirmId(null)
    }
  }

  const statCards = [
    { label: 'משחקים',    value: matches.length, icon: Trophy, color: 'text-pitch-400',  bg: 'bg-pitch-900/50'  },
    { label: 'אצטדיונים', value: stadiumsCount,  icon: MapPin, color: 'text-blue-400',   bg: 'bg-blue-900/30'   },
    { label: 'משתמשים',   value: usersCount,     icon: Users,  color: 'text-purple-400', bg: 'bg-purple-900/30' },
    { label: 'מועדפים',   value: '—',            icon: Heart,  color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
  ]

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 pointer-events-none z-0">
        <img src={adminBg} alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-dark-950/85" />
      </div>

      <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
        className="relative z-10 max-w-7xl mx-auto px-4 py-8">

        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">לוח ניהול</h2>
            <p className="text-dark-400 text-sm mt-1">ניהול משחקים, אצטדיונים ומשתמשים</p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={load}
              className="p-2.5 rounded-lg bg-dark-800 border border-dark-600 text-dark-400 hover:text-white transition-colors">
              <RefreshCw size={16} />
            </motion.button>
            <Link to="/admin/matches/new" className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} /> הוסף משחק
            </Link>
          </div>
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div key={s.label} variants={cardVariants} custom={i} className="card flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon size={20} className={s.color} />
              </div>
              <div>
                <p className="text-dark-400 text-xs mb-0.5">{s.label}</p>
                <p className="text-white font-bold text-2xl">{loading ? '...' : s.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={cardVariants} custom={4} initial="hidden" animate="visible" className="flex flex-wrap gap-3 mb-8">
          <Link to="/admin/stadiums" className="btn-secondary flex items-center gap-2 text-sm">
            <MapPin size={15} /> ניהול אצטדיונים
          </Link>
          <Link to="/admin/users" className="btn-secondary flex items-center gap-2 text-sm">
            <Users size={15} /> ניהול משתמשים
          </Link>
        </motion.div>

        <motion.div variants={cardVariants} custom={5} initial="hidden" animate="visible" className="card overflow-hidden p-0">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-800">
            <h3 className="text-white font-semibold">כל המשחקים</h3>
            <span className="text-dark-500 text-sm">{matches.length} משחקים</span>
          </div>

          {loading ? (
            <div className="divide-y divide-dark-900">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-5 py-4 flex gap-4 animate-pulse">
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-dark-700 rounded w-32" />
                    <div className="h-2 bg-dark-800 rounded w-24" />
                  </div>
                  <div className="h-3 bg-dark-700 rounded w-24 self-center" />
                  <div className="h-3 bg-dark-700 rounded w-20 self-center" />
                  <div className="h-5 bg-dark-800 rounded-full w-12 self-center" />
                  <div className="flex gap-1 self-center">
                    <div className="h-7 w-7 bg-dark-800 rounded-lg" />
                    <div className="h-7 w-7 bg-dark-800 rounded-lg" />
                  </div>
                </div>
              ))}
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
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
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
                      {matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((match, i) => (
                        <motion.tr key={match.matchId}
                          initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: i * 0.04 } }} exit={{ opacity: 0 }}
                          className="border-b border-dark-900 hover:bg-dark-800/40 transition-colors">
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
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => navigate(`/admin/matches/${match.matchId}/edit`)}
                                className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors">
                                <Pencil size={14} />
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => setConfirmId(match.matchId)}
                                className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-900/20 transition-colors">
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
              {matches.length > PAGE_SIZE && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-dark-800">
                  <span className="text-dark-500 text-xs">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, matches.length)} מתוך {matches.length}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}
                      className="px-3 py-1.5 text-xs rounded-lg bg-dark-800 border border-dark-700 text-dark-300 hover:text-white hover:border-dark-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      הקודם
                    </button>
                    <button onClick={() => setPage((p) => p + 1)} disabled={page * PAGE_SIZE >= matches.length}
                      className="px-3 py-1.5 text-xs rounded-lg bg-dark-800 border border-dark-700 text-dark-300 hover:text-white hover:border-dark-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      הבא
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </motion.div>

      <ConfirmDialog
        open={!!confirmId}
        title="מחיקת משחק"
        message="האם אתה בטוח שברצונך למחוק משחק זה? לא ניתן לשחזר פעולה זו."
        onConfirm={() => handleDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  )
}
