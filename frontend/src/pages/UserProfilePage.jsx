/**
 * @author Roy Meoded
 * @author Yarin Keshet
 * @author Tomer Gal
 *
 * @date 08-06-2026
 *
 * UserProfilePage.jsx — User Profile Page
 * =========================================
 * Displays the authenticated user's profile with their display name,
 * email, and role badge (admin / registered user).
 *
 * Features:
 *   Inline name edit — clicking the pencil icon activates an input field;
 *                      saving calls PUT /users/profile and updates AuthContext.
 *   Quick links      — shortcuts to /favorites, /map, and /admin (admin only).
 *   Logout           — calls AuthContext.logout and redirects to /.
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { User, Mail, Shield, Heart, LogOut, Trophy, Map, Pencil, Check, X } from 'lucide-react'
import { pageVariants, cardVariants, staggerContainer } from '../animations/variants'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { updateProfile } from '../services/matchService'
import profileImage from '../assets/images/profile_image.jpg'

// Main user profile page. Manages inline name editing state and logout.
export default function UserProfilePage() {
  const { user, profile, isAdmin, logout, updateProfileName } = useAuth()
  const toast    = useToast()
  const navigate = useNavigate()

  const [editing,   setEditing]   = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [saving,    setSaving]    = useState(false)

  const email       = user?.signInDetails?.loginId ?? ''
  const displayName = profile?.name ?? email.split('@')[0] ?? 'משתמש'

  // Logs the user out via AuthContext and redirects to the home page.
  async function handleLogout() {
    await logout()
    navigate('/')
  }

  // Activates inline name edit mode, pre-filling the input with the current display name.
  function startEdit() {
    setNameInput(displayName)
    setEditing(true)
  }

  // Saves the updated display name via PUT /users/profile and updates AuthContext.
  async function handleSave() {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      await updateProfile(trimmed)
      updateProfileName(trimmed)
      toast.success('השם עודכן בהצלחה')
      setEditing(false)
    } catch {
      toast.error('שגיאה בעדכון השם')
    } finally {
      setSaving(false)
    }
  }

  const quickLinks = [
    { to: '/favorites', icon: Heart,  label: 'המשחקים שלי', desc: 'ראה את המשחקים שמורים',  color: 'text-pitch-400',  bg: 'bg-pitch-900/50'  },
    { to: '/map',       icon: Map,    label: 'מפה',          desc: 'גלה משחקים על המפה',      color: 'text-blue-400',   bg: 'bg-blue-900/30'   },
    { to: '/admin',     icon: Trophy, label: 'לוח ניהול',   desc: 'ניהול משחקים ואצטדיונים', color: 'text-yellow-400', bg: 'bg-yellow-900/30', adminOnly: true },
  ]

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
      style={{ backgroundImage: `url(${profileImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      className="relative min-h-screen">

      <div className="absolute inset-0 bg-dark-950/75" />

      <div className="relative z-10">
        <div className="flex flex-col items-center justify-center pt-16 pb-8 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-pitch-900 border-2 border-pitch-700 flex items-center justify-center shadow-xl">
            <User size={28} className="text-pitch-400" />
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white drop-shadow-lg">הפרופיל שלי</h2>
            <p className="text-dark-300 text-sm mt-1">{displayName}</p>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 pb-8">
          <motion.div variants={cardVariants} custom={0} initial="hidden" animate="visible" className="card mb-5">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex-1 min-w-0">
                {editing ? (
                  <div className="flex items-center gap-2">
                    <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
                      autoFocus maxLength={100} className="input-field text-sm flex-1" placeholder="שם מלא" />
                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleSave} disabled={saving}
                      className="p-2 rounded-lg bg-pitch-700 text-white hover:bg-pitch-600 disabled:opacity-50 transition-colors">
                      <Check size={14} />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setEditing(false)}
                      className="p-2 rounded-lg bg-dark-700 text-dark-300 hover:text-white transition-colors">
                      <X size={14} />
                    </motion.button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-white font-bold text-xl truncate">{displayName}</p>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={startEdit}
                      className="p-1.5 rounded-lg text-dark-500 hover:text-white hover:bg-dark-700 transition-colors shrink-0">
                      <Pencil size={13} />
                    </motion.button>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  {isAdmin && (
                    <span className="badge-green flex items-center gap-1 text-xs">
                      <Shield size={10} /> מנהל
                    </span>
                  )}
                  <span className="badge bg-dark-800 text-dark-400 border border-dark-700 text-xs">משתמש רשום</span>
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

          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-3 mb-5">
            {quickLinks.filter((l) => !l.adminOnly || isAdmin).map((link, i) => (
              <motion.div key={link.to} variants={cardVariants} custom={i + 1}>
                <Link to={link.to} className="card flex items-center gap-4 hover:border-dark-700 transition-colors group">
                  <div className={`w-10 h-10 rounded-xl ${link.bg} flex items-center justify-center shrink-0`}>
                    <link.icon size={18} className={link.color} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold group-hover:text-pitch-300 transition-colors">{link.label}</p>
                    <p className="text-dark-500 text-xs">{link.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={cardVariants} custom={4} initial="hidden" animate="visible">
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-red-900 text-red-400 hover:bg-red-900/20 transition-colors font-semibold text-sm">
              <LogOut size={16} /> יציאה מהחשבון
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
