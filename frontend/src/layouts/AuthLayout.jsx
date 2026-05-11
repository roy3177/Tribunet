import { Outlet, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-dark-950 bg-pitch-pattern flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <NavLink to="/" className="flex items-center gap-2 justify-center">
          <Trophy size={28} className="text-pitch-500" />
          <span className="text-white font-bold text-2xl tracking-tight">
            Tri<span className="text-pitch-500">bu</span>net
          </span>
        </NavLink>
      </motion.div>

      {/* Auth card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="w-full max-w-md bg-dark-900 border border-dark-800 rounded-2xl p-8 shadow-2xl"
      >
        <Outlet />
      </motion.div>
    </div>
  )
}
