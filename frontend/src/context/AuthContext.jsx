/**
 * @author Roy Meoded
 * @author Yarin Keshet
 * @author Tomer Gal
 *
 * @date 08-06-2026
 *
 * AuthContext.jsx — Authentication Context Provider
 * ==================================================
 * Provides global authentication state and Cognito-backed auth actions
 * to the entire app via React Context.
 *
 * Exposed state: user, profile, isAdmin, loading.
 * Exposed actions: login, logout, register, confirmRegistration,
 *                  resendCode, updateProfileName.
 *
 * On mount, checkUser() restores the session from Cognito and fetches
 * the user's profile from GET /users/me to determine role (admin/user).
 */
import { createContext, useContext, useState, useEffect } from 'react'
import {
  signIn, signOut, signUp, confirmSignUp,
  resendSignUpCode, getCurrentUser, fetchAuthSession,
} from 'aws-amplify/auth'

const AuthContext = createContext(null)

// Top-level provider that wraps the app and exposes auth state and actions.
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  // Restores the current Cognito session, fetches /users/me, and sets
  // user, profile, and isAdmin state. Resets all state on failure.
  async function checkUser() {
    try {
      const currentUser = await getCurrentUser()
      const session = await fetchAuthSession()
      setUser(currentUser)

      const token = session.tokens?.idToken?.toString()
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setProfile(json.data ?? null)
        setIsAdmin(json.data?.role?.trim() === 'admin')
      } else {
        setProfile(null)
        setIsAdmin(false)
      }
    } catch {
      setUser(null)
      setProfile(null)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  // Signs the user in via Cognito and refreshes the auth session state.
  async function login(email, password) {
    const result = await signIn({ username: email, password })
    await checkUser()
    return result
  }

  // Signs the user out via Cognito and clears all auth state.
  async function logout() {
    await signOut()
    setUser(null)
    setProfile(null)
    setIsAdmin(false)
  }

  // Creates a new Cognito user with email, password, and name attributes.
  async function register(email, password, name) {
    return await signUp({
      username: email,
      password,
      options: {
        userAttributes: { email, name },
      },
    })
  }

  // Confirms a new Cognito account using the 6-digit verification code.
  async function confirmRegistration(email, code) {
    return await confirmSignUp({ username: email, confirmationCode: code })
  }

  // Resends the email verification code for an unconfirmed Cognito account.
  async function resendCode(email) {
    return await resendSignUpCode({ username: email })
  }

  // Optimistically updates the display name in the local profile state
  // without requiring a full re-fetch from the API.
  function updateProfileName(name) {
    setProfile((prev) => prev ? { ...prev, name } : prev)
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, isAdmin, loading, login, logout, register, confirmRegistration, resendCode, updateProfileName }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook for consuming AuthContext. Throws if used outside AuthProvider.
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
