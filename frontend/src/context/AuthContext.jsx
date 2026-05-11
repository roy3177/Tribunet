import { createContext, useContext, useState, useEffect } from 'react'
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  getCurrentUser,
  fetchAuthSession,
} from 'aws-amplify/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser()
      const session = await fetchAuthSession()
      const groups = session.tokens?.idToken?.payload?.['cognito:groups'] ?? []
      setUser(currentUser)
      setIsAdmin(groups.includes('Admins'))
    } catch {
      setUser(null)
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

  return (
    <AuthContext.Provider
      value={{ user, isAdmin, loading, login, logout, register, confirmRegistration }}
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
