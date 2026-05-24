import { createContext, useContext, useState, useEffect } from 'react'
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  getCurrentUser,
  fetchAuthSession,
} from 'aws-amplify/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

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

  async function login(email, password) {
    const result = await signIn({ username: email, password })
    await checkUser()
    return result
  }

  async function logout() {
    await signOut()
    setUser(null)
    setProfile(null)
    setIsAdmin(false)
  }

  async function register(email, password, name) {
    return await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name,
        },
      },
    })
  }

  async function confirmRegistration(email, code) {
    return await confirmSignUp({ username: email, confirmationCode: code })
  }

  async function resendCode(email) {
    return await resendSignUpCode({ username: email })
  }

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

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
