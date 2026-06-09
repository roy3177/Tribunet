/**
 * @author Roy Meoded
 * @author Yarin Keshet
 * @author Tomer Gal
 *
 * @date 08-06-2026
 *
 * App.jsx — Root Application Component
 * ======================================
 * Defines the full routing tree and wraps the app in all global providers:
 *   ErrorBoundary  — catches unhandled render errors.
 *   BrowserRouter  — enables client-side routing.
 *   AuthProvider   — provides Cognito auth state.
 *   ToastProvider  — provides global toast notifications.
 *
 * Route guards:
 *   ProtectedRoute — redirects unauthenticated users to /login.
 *   AdminRoute     — redirects non-admin users to /.
 *   GuestRoute     — redirects authenticated users to /.
 *
 * Route groups:
 *   AppLayout  — public pages (/, /map, /matches/:id) and authenticated pages.
 *   AuthLayout — guest-only pages (/login, /register, /forgot-password).
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Toast from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'

import AppLayout from './layouts/AppLayout'
import AuthLayout from './layouts/AuthLayout'

import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import MapPage from './pages/MapPage'
import MatchDetailsPage from './pages/MatchDetailsPage'
import FavoritesPage from './pages/FavoritesPage'
import UserProfilePage from './pages/UserProfilePage'
import AdminDashboard from './pages/AdminDashboard'
import AddEditMatchPage from './pages/AddEditMatchPage'
import StadiumManagementPage from './pages/StadiumManagementPage'
import UserManagementPage from './pages/UserManagementPage'
import NotFoundPage from './pages/NotFoundPage'

// Redirects unauthenticated users to /login. Shows nothing while auth is loading.
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

// Redirects non-admin users: unauthenticated to /login, authenticated non-admins to /.
function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return isAdmin ? children : <Navigate to="/" replace />
}

// Redirects authenticated users to /. Allows only guests to access the wrapped route.
function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return !user ? children : <Navigate to="/" replace />
}

// Renders the full route tree wrapped in AnimatePresence for page transition animations.
function AnimatedRoutes() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public routes */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/matches/:id" element={<MatchDetailsPage />} />
        </Route>

        {/* Guest-only routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        </Route>

        {/* Authenticated user routes */}
        <Route element={<AppLayout />}>
          <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
        </Route>

        {/* Admin-only routes */}
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/matches/new" element={<AdminRoute><AddEditMatchPage /></AdminRoute>} />
          <Route path="/admin/matches/:id/edit" element={<AdminRoute><AddEditMatchPage /></AdminRoute>} />
          <Route path="/admin/stadiums" element={<AdminRoute><StadiumManagementPage /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><UserManagementPage /></AdminRoute>} />
        </Route>

        {/* 404 catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  )
}

// Root app component. Wraps the router tree in all global providers.
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AnimatedRoutes />
            <Toast />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
