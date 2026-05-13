import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { User, Mail, Shield, Heart, LogOut, Trophy, Map } from 'lucide-react'
import { pageVariants, cardVariants, staggerContainer } from '../animations/variants'
import { useAuth } from '../context/AuthContext'

export default function UserProfilePage() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const email       = user?.signInDetails?.loginId ?? ''
  const displayName = email.split('@')[0] ?? 'משתמש'

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const quickLinks = [
    { to: '/favorites', icon: Heart,  label: 'המשחקים שלי',  desc: 'ראה את המשחקים שמורים',     color: 'text-pitch-400', bg: 'bg-pitch-900/50' },
    { to: '/map',       icon: Map,    label: 'מפה',           desc: 'גלה משחקים על המפה',         color: 'text-blue-400',  bg: 'bg-blue-900/30' },
    { to: '/admin',     icon: Trophy, label: 'לוח ניהול',    desc: 'ניהול משחקים ואצטדיונים',    color: 'text-yellow-400', bg: 'bg-yellow-900/30', adminOnly: true },
  ]

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-xl mx-auto px-4 py-8"
    >
      <h2 className="text-3xl font-bold text-white mb-8">הפרופיל שלי</h2>

      {/* Profile card */}
      <motion.div
        variants={cardVariants}
        custom={0}
        initial="hidden"
        animate="visible"
        className="card mb-5"
      >
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-pitch-900 border border-pitch-800 flex items-center justify-center shrink-0">
            <User size={28} className="text-pitch-400" />
          </div>
          <div>
            <p className="text-white font-bold text-xl">{displayName}</p>
            <div className="flex items-center gap-2 mt-1.5">
              {isAdmin && (
                <span className="badge-green flex items-center gap-1 text-xs">
                  <Shield size={10} /> מנהל
                </span>
              )}
              <span className="badge bg-dark-800 text-dark-400 border border-dark-700 text-xs">
                משתמש רשום
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 py-3 border-t border-dark-800">
          <Mail size={16} className="text-dark-500 shrink-0" />
          <div>
            <p className="text-dark-500 text-xs">כתובת אימייל</p>
            <p className="text-dark-100 text-sm">{email}</p>
          </div>
        </div>
      </motion.div>

      {/* Quick links */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-3 mb-5"
      >
        {quickLinks
          .filter((l) => !l.adminOnly || isAdmin)
          .map((link, i) => (
            <motion.div key={link.to} variants={cardVariants} custom={i + 1}>
              <Link
                to={link.to}
                className="card flex items-center gap-4 hover:border-dark-700 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-xl ${link.bg} flex items-center justify-center shrink-0`}>
                  <link.icon size={18} className={link.color} />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold group-hover:text-pitch-300 transition-colors">
                    {link.label}
                  </p>
                  <p className="text-dark-500 text-xs">{link.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
      </motion.div>

      {/* Logout */}
      <motion.div
        variants={cardVariants}
        custom={4}
        initial="hidden"
        animate="visible"
      >
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-red-900 text-red-400 hover:bg-red-900/20 transition-colors font-semibold text-sm"
        >
          <LogOut size={16} /> יציאה מהחשבון
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
