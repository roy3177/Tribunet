import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { Map, Ticket, Star, Shield, Trophy, ArrowRight, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { pageVariants, cardVariants, staggerContainer, fadeIn } from '../animations/variants'
import { getMatches } from '../services/matchService'

const ISRAELI_LEAGUES = ['ליגת העל', 'הליגה הלאומית', 'הליגה הארצית']

const FEATURES = [
  {
    icon: Map,
    title: 'מפה אינטראקטיבית',
    description: 'ראה את כל המשחקים על מפת ישראל. לחץ על אצטדיון ותראה מיד אילו משחקים מתקיימים שם.',
    color: 'text-pitch-400',
    bg: 'bg-pitch-900/50',
  },
  {
    icon: Ticket,
    title: 'קניית כרטיסים ישירה',
    description: 'לינק ישיר לאתר הכרטיסים הרשמי של כל קבוצה — ללא מתווכים.',
    color: 'text-gold-400',
    bg: 'bg-yellow-900/30',
  },
  {
    icon: Star,
    title: 'שמור מועדפים',
    description: 'שמור משחקים שמעניינים אותך ועקוב אחריהם בקלות מהפרופיל שלך.',
    color: 'text-blue-400',
    bg: 'bg-blue-900/30',
  },
  {
    icon: Zap,
    title: 'סינון חכם',
    description: 'סנן לפי ליגה, קבוצה, אזור גיאוגרפי וזמינות כרטיסים — תמצא בדיוק מה שחיפשת.',
    color: 'text-purple-400',
    bg: 'bg-purple-900/30',
  },
]

// ─── Match Card ───────────────────────────────────────────────────────────────
function MatchCard({ match, index }) {
  const dateStr = new Date(match.date).toLocaleDateString('he-IL', {
    weekday: 'short', day: 'numeric', month: 'long',
  })

  return (
    <motion.div
      variants={cardVariants}
      custom={index}
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
      transition={{ duration: 0.2 }}
      className="card group cursor-pointer relative overflow-hidden"
    >
      {/* Green accent bar */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-pitch-600 to-transparent" />

      {/* League badge */}
      <div className="flex justify-between items-start mb-4">
        <span className="badge-green">{match.league}</span>
        <span className={`badge ${match.hasTickets ? 'badge-green' : 'badge-red'}`}>
          <Ticket size={10} />
          {match.hasTickets ? 'יש כרטיסים' : 'אזל'}
        </span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <span className="text-white font-bold text-lg text-right leading-tight flex-1">{match.homeTeam}</span>
        <span className="text-dark-500 font-bold text-sm shrink-0">נגד</span>
        <span className="text-white font-bold text-lg text-left leading-tight flex-1">{match.awayTeam}</span>
      </div>

      {/* Details */}
      <div className="flex items-center justify-between text-sm text-dark-400 border-t border-dark-800 pt-4">
        <span>{dateStr} · {match.time}</span>
        <span>{match.stadium}</span>
      </div>

      {/* Hover CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl"
      >
        <Link
          to={`/matches/${match.id}`}
          className="btn-primary flex items-center gap-2 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          פרטי משחק <ArrowRight size={14} />
        </Link>
      </motion.div>
    </motion.div>
  )
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ feature, index }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      custom={index}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      whileHover={{ y: -4 }}
      className="card flex flex-col gap-4"
    >
      <div className={`w-11 h-11 rounded-xl ${feature.bg} flex items-center justify-center`}>
        <feature.icon size={22} className={feature.color} />
      </div>
      <div>
        <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
        <p className="text-dark-400 text-sm leading-relaxed">{feature.description}</p>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user, isAdmin } = useAuth()
  const matchesRef = useRef(null)
  const inView     = useInView(matchesRef, { once: true, margin: '-80px' })

  const [featuredMatches, setFeaturedMatches] = useState([])
  const [matchesLoading, setMatchesLoading]   = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    getMatches()
      .then((matches) => {
        const upcoming = matches
          .filter(m => ISRAELI_LEAGUES.includes(m.league) && m.date >= today)
          .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
          .slice(0, 3)
          .map(m => ({ ...m, id: m.matchId, stadium: m.stadiumName }))
        setFeaturedMatches(upcoming)
      })
      .catch(() => setFeaturedMatches([]))
      .finally(() => setMatchesLoading(false))
  }, [])

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-pitch-950/30 pointer-events-none" />
        {/* Decorative blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pitch-900/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pitch-800/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.4 }}
            className="inline-flex items-center gap-2 badge-green px-4 py-1.5 text-sm mb-6"
          >
            <Trophy size={14} /> כדורגל ישראל
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.5, ease: 'easeOut' }}
            className="text-6xl md:text-8xl font-black text-white leading-none tracking-tight mb-5"
          >
            Tri<span className="text-pitch-500">bu</span>net
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28, duration: 0.5 }}
            className="text-dark-300 text-xl md:text-2xl max-w-xl mx-auto mb-10 leading-relaxed"
          >
            מפת המשחקים של כדורגל ישראל — מצא, סנן, וקנה כרטיסים בקלות
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/map">
              <motion.span
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3"
              >
                <Map size={18} /> פתח מפה
              </motion.span>
            </Link>
            {!user && (
              <Link to="/register">
                <motion.span
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-secondary inline-flex items-center gap-2 text-base px-8 py-3"
                >
                  הרשם בחינם <ArrowRight size={16} />
                </motion.span>
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Featured Matches ────────────────────────────────────────────────── */}
      <section ref={matchesRef} className="max-w-7xl mx-auto px-4 py-16">
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 className="text-2xl font-bold text-white">משחקים קרובים</h2>
            <p className="text-dark-400 text-sm mt-1">המשחקים הבאים בליגת העל</p>
          </div>
          <Link to="/map" className="text-pitch-400 hover:text-pitch-300 text-sm font-medium flex items-center gap-1 transition-colors">
            כל המשחקים <ArrowRight size={14} />
          </Link>
        </motion.div>

        {matchesLoading ? (
          <div className="flex justify-center items-center py-16 text-dark-400">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-6 h-6 border-2 border-pitch-500 border-t-transparent rounded-full mr-3"
            />
            טוען משחקים...
          </div>
        ) : featuredMatches.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-dark-400 mb-4">אין משחקים קרובים כרגע</p>
            <Link to="/map" className="text-pitch-400 hover:text-pitch-300 text-sm font-medium transition-colors">
              ראה את כל המשחקים במפה <ArrowRight size={14} className="inline" />
            </Link>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="grid md:grid-cols-3 gap-5"
          >
            {featuredMatches.map((match, i) => (
              <MatchCard key={match.id} match={match} index={i} />
            ))}
          </motion.div>
        )}
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-16 border-t border-dark-800/50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-3">כל מה שצריך</h2>
          <p className="text-dark-400 max-w-lg mx-auto">
            פלטפורמה מודרנית לחובבי כדורגל — חפש, סנן ועקוב אחרי המשחקים שלך
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </section>

      {/* ── Admin CTA (admins only) ──────────────────────────────────────────── */}
      {isAdmin && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto px-4 pb-16"
        >
          <div className="card flex flex-col sm:flex-row items-center justify-between gap-4 border-pitch-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pitch-900 flex items-center justify-center">
                <Shield size={20} className="text-pitch-400" />
              </div>
              <div>
                <p className="text-white font-semibold">לוח ניהול</p>
                <p className="text-dark-400 text-sm">ניהול משחקים, אצטדיונים ומשתמשים</p>
              </div>
            </div>
            <Link to="/admin" className="btn-secondary flex items-center gap-2 text-sm shrink-0">
              פתח ניהול <ArrowRight size={14} />
            </Link>
          </div>
        </motion.section>
      )}

    </motion.div>
  )
}
