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
import MapPage from './pages/MapPage'
import MatchDetailsPage from './pages/MatchDetailsPage'
import FavoritesPage from './pages/FavoritesPage'
import UserProfilePage from './pages/UserProfilePage'
import AdminDashboard from './pages/AdminDashboard'
import AddEditMatchPage from './pages/AddEditMatchPage'
import StadiumManagementPage from './pages/StadiumManagementPage'
import UserManagementPage from './pages/UserManagementPage'
import NotFoundPage from './pages/NotFoundPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return isAdmin ? children : <Navigate to="/" replace />
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return !user ? children : <Navigate to="/" replace />
}

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
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />
        </Route>

        {/* Authenticated user routes */}
        <Route element={<AppLayout />}>
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Admin routes */}
        <Route element={<AppLayout />}>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/matches/new"
            element={
              <AdminRoute>
                <AddEditMatchPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/matches/:id/edit"
            element={
              <AdminRoute>
                <AddEditMatchPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/stadiums"
            element={
              <AdminRoute>
                <StadiumManagementPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UserManagementPage />
              </AdminRoute>
            }
          />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  )
}

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
