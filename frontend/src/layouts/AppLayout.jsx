import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, Map, Heart, User, Shield, LogOut, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
          isActive
            ? 'bg-pitch-900 text-pitch-400'
            : 'text-dark-300 hover:text-white hover:bg-dark-800'
        }`
      }
    >
      <Icon size={16} />
      <span className="hidden sm:inline">{label}</span>
    </NavLink>
  )
}

export default function AppLayout() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark-950">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-50 bg-dark-900/80 backdrop-blur-md border-b border-dark-800"
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 shrink-0">
            <Trophy size={22} className="text-pitch-500" />
            <span className="text-white font-bold text-lg tracking-tight">
              Tri<span className="text-pitch-500">bu</span>net
            </span>
          </NavLink>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            <NavItem to="/map" icon={Map} label="מפה" />
            {user && <NavItem to="/favorites" icon={Heart} label="מועדפים" />}
            {isAdmin && <NavItem to="/admin" icon={Shield} label="ניהול" />}
          </div>

          {/* Auth */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <NavItem to="/profile" icon={User} label="פרופיל" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">יציאה</span>
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="flex items-center gap-2 btn-primary text-sm py-2 px-4"
              >
                <LogIn size={16} />
                <span>כניסה</span>
              </NavLink>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-6 text-center text-dark-500 text-sm">
        © {new Date().getFullYear()} Tribunet — כדורגל ישראל
      </footer>
    </div>
  )
}
