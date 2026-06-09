/**
 * @author Roy Meoded
 * @author Yarin Keshet
 * @author Tomer Gal
 *
 * @date 08-06-2026
 *
 * AuthLayout.jsx — Authentication Pages Layout
 * =============================================
 * Wraps all guest-only auth pages (Login, Register, ForgotPassword) with
 * a centered card layout over a full-screen background image.
 *
 * Renders the Tribunet logo above the card and uses <Outlet /> to inject
 * the matched auth page into the card body.
 * The background image is darkened with a near-opaque overlay for readability.
 */
import { Outlet, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import loginBg from '../assets/images/login_image.jpg'
import stadiumIcon from '../assets/stadium-icon.svg'

// Auth layout component. Centers the logo and the auth card over a background image.
export default function AuthLayout() {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4 py-12">
      {/* Full-screen background image with dark overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <img src={loginBg} alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-dark-950/90" />
      </div>

      {/* Animated Tribunet logo linking back to the home page */}
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

      {/* Animated auth card containing the matched child route via Outlet */}
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
