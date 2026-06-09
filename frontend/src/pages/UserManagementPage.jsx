/**
 * @author Roy Meoded
 * @author Yarin Keshet
 * @author Tomer Gal
 *
 * @date 08-06-2026
 *
 * UserManagementPage.jsx — User Management Admin Page
 * =====================================================
 * Admin page for viewing and deleting registered users, at /admin/users.
 * Fetches all users from GET /users and displays them in a table showing
 * name, email, role badge (admin / user), and registration date.
 *
 * Delete is guarded by ConfirmDialog and calls DELETE /users/{userId},
 * which removes the user from both Cognito and DynamoDB.
 * Admins and the currently logged-in user cannot be deleted.
 */
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Trash2, AlertCircle, ArrowRight, RefreshCw, ShieldCheck, User } from 'lucide-react'
import { pageVariants, cardVariants, fadeIn } from '../animations/variants'
import { getUsers, deleteUser } from '../services/matchService'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import ConfirmDialog from '../components/ConfirmDialog'

// Main user management page. Fetches all users on mount and manages delete confirmation.
export default function UserManagementPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [users,       setUsers]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [confirmUser, setConfirmUser] = useState(null)

  // Fetches all registered users from GET /users and updates the table.
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getUsers()
      setUsers(data)
    } catch (err) {
      console.error(err)
      setError('שגיאה בטעינת המשתמשים')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Deletes a user from Cognito and DynamoDB, then removes them from local state.
  async function handleDelete(user) {
    try {
      await deleteUser(user.userId)
      setUsers((prev) => prev.filter((u) => u.userId !== user.userId))
      toast.success('המשתמש נמחק בהצלחה')
    } catch (err) {
      console.error(err)
      toast.error('שגיאה במחיקת המשתמש')
    } finally {
      setConfirmUser(null)
    }
  }

  // Returns the first 2 uppercase characters of the user's name or email as initials.
  function getInitials(name, email) {
    const src = name || email || '?'
    return src.slice(0, 2).toUpperCase()
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 pointer-events-none z-0">
        <img src="https://tribunet-frontend-prod.s3.us-east-1.amazonaws.com/assets/players_management_img.jpg"
          alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-dark-950/85" />
      </div>

      <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
        className="relative z-10 max-w-5xl mx-auto px-4 py-8">

        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 rounded-lg bg-dark-800 border border-dark-600 text-dark-400 hover:text-white transition-colors">
              <ArrowRight size={16} />
            </Link>
            <div>
              <h2 className="text-3xl font-bold text-white">ניהול משתמשים</h2>
              <p className="text-dark-400 text-sm mt-1">צפייה ומחיקת משתמשים רשומים</p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={load}
            className="p-2.5 rounded-lg bg-dark-800 border border-dark-600 text-dark-400 hover:text-white transition-colors">
            <RefreshCw size={16} />
          </motion.button>
        </motion.div>

        <motion.div variants={cardVariants} custom={0} initial="hidden" animate="visible" className="card overflow-hidden p-0">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-800">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Users size={16} className="text-purple-400" /> כל המשתמשים
            </h3>
            <span className="text-dark-500 text-sm">{loading ? '...' : `${users.length} משתמשים`}</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">
              <AlertCircle size={32} className="mx-auto mb-3 opacity-60" /><p>{error}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-dark-500">
              <AlertCircle size={32} className="mx-auto mb-3 opacity-40" /><p>אין משתמשים</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-800 text-dark-400 text-xs uppercase tracking-wider">
                    <th className="px-5 py-3 text-right font-medium">משתמש</th>
                    <th className="px-5 py-3 text-right font-medium">אימייל</th>
                    <th className="px-5 py-3 text-right font-medium">תפקיד</th>
                    <th className="px-5 py-3 text-right font-medium">הצטרף</th>
                    <th className="px-5 py-3 text-right font-medium">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {users.map((u, i) => {
                      const isSelf  = profile?.userId === u.userId
                      const isAdmin = u.role?.trim() === 'admin'
                      return (
                        <motion.tr key={u.userId}
                          initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: i * 0.04 } }} exit={{ opacity: 0 }}
                          className="border-b border-dark-900 hover:bg-dark-800/40 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-xs font-bold text-dark-300 shrink-0">
                                {getInitials(u.name, u.email)}
                              </div>
                              <div>
                                <p className="text-white font-medium leading-tight">
                                  {u.name || '—'}
                                  {isSelf && <span className="text-xs text-pitch-400 mr-1.5">(אתה)</span>}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-dark-300">{u.email}</td>
                          <td className="px-5 py-3">
                            {isAdmin ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-900/40 text-yellow-400 border border-yellow-800/50">
                                <ShieldCheck size={10} /> אדמין
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-dark-700 text-dark-300 border border-dark-600">
                                <User size={10} /> משתמש
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-dark-400 text-xs">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('he-IL') : '—'}
                          </td>
                          <td className="px-5 py-3">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              onClick={() => setConfirmUser(u)} disabled={isSelf || isAdmin}
                              title={isSelf ? 'לא ניתן למחוק את עצמך' : isAdmin ? 'לא ניתן למחוק אדמין' : 'מחק משתמש'}
                              className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-dark-400 disabled:hover:bg-transparent">
                              <Trash2 size={14} />
                            </motion.button>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>

      <ConfirmDialog open={!!confirmUser} title="מחיקת משתמש"
        message={`האם אתה בטוח שברצונך למחוק את ${confirmUser?.name || confirmUser?.email}? הפעולה תמחק את המשתמש גם מ-Cognito וגם מהמסד נתונים.`}
        onConfirm={() => handleDelete(confirmUser)} onCancel={() => setConfirmUser(null)} />
    </div>
  )
}
