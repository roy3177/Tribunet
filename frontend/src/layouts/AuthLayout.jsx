import { Outlet, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import loginBg from '../assets/images/login_image.jpg'
import stadiumIcon from '../assets/stadium-icon.svg'

export default function AuthLayout() {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4 py-12">
      {/* Background image */}
      <div className="absolute inset-0 pointer-events-none">
        <img src={loginBg} alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-dark-950/90" />
      </div>
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 mb-8"
      >
        <NavLink to="/" className="flex items-center gap-2 justify-center">
          <img src={stadiumIcon} alt="stadium" className="w-7 h-7" />
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
        className="relative z-10 w-full max-w-md bg-dark-900 border border-dark-800 rounded-2xl p-8 shadow-2xl"
      >
        <Outlet />
      </motion.div>
    </div>
  )
}
