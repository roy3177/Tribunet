import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, KeyRound, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth'
import { pageVariants } from '../animations/variants'

const inputVariants = {
  hidden:  { opacity: 0, x: -16 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.08 + 0.15, duration: 0.35, ease: 'easeOut' },
  }),
}

function InputField({ id, label, type = 'text', value, onChange, icon: Icon, custom, error, placeholder }) {
  return (
    <motion.div variants={inputVariants} custom={custom} initial="hidden" animate="visible">
      <label htmlFor={id} className="block text-sm font-medium text-dark-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none" />
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`input-field pl-9 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
          autoComplete="off"
        />
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 text-xs text-red-400 flex items-center gap-1"
          >
            <AlertCircle size={12} /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function ForgotPasswordPage() {
  const [step, setStep]         = useState('email') // 'email' | 'code' | 'done'
  const [email, setEmail]       = useState('')
  const [code, setCode]         = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [errors, setErrors]     = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading]   = useState(false)

  const navigate = useNavigate()

  // ── Step 1: send reset code ──────────────────────────────────────────────
  function validateEmail() {
    const e = {}
    if (!email.trim())                          e.email = 'נדרשת כתובת אימייל'
    else if (!/\S+@\S+\.\S+/.test(email))       e.email = 'כתובת אימייל לא תקינה'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSendCode(e) {
    e.preventDefault()
    setApiError('')
    if (!validateEmail()) return

    setLoading(true)
    try {
      await resetPassword({ username: email })
      setStep('code')
    } catch (err) {
      const name = err?.name ?? ''
      if (name === 'UserNotFoundException') {
        // Don't reveal if user exists — same UX either way
        setStep('code')
      } else if (name === 'LimitExceededException') {
        setApiError('חרגת מהמגבלה — נסה שוב מאוחר יותר')
      } else {
        setApiError('שגיאה בשליחת הקוד, נסה שוב')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: confirm new password ─────────────────────────────────────────
  function validateCode() {
    const e = {}
    if (!code.trim())           e.code        = 'נדרש קוד אימות'
    if (!newPassword)           e.newPassword = 'נדרשת סיסמה חדשה'
    else if (newPassword.length < 8) e.newPassword = 'סיסמה חייבת להכיל לפחות 8 תווים'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleConfirm(e) {
    e.preventDefault()
    setApiError('')
    if (!validateCode()) return

    setLoading(true)
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      })
      setStep('done')
    } catch (err) {
      const name = err?.name ?? ''
      if (name === 'CodeMismatchException') {
        setErrors({ code: 'קוד שגוי' })
      } else if (name === 'ExpiredCodeException') {
        setErrors({ code: 'הקוד פג תוקף — שלח שוב' })
      } else if (name === 'InvalidPasswordException') {
        setErrors({ newPassword: 'הסיסמה לא עומדת בדרישות' })
      } else {
        setApiError('שגיאה באיפוס הסיסמה, נסה שוב')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">

      {/* ── Done state ── */}
      {step === 'done' ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="text-center space-y-4"
        >
          <div className="flex justify-center">
            <CheckCircle2 size={48} className="text-pitch-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">הסיסמה עודכנה!</h1>
          <p className="text-dark-400 text-sm">אפשר להתחבר עכשיו עם הסיסמה החדשה.</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/login')}
            className="btn-primary w-full mt-4"
          >
            לדף הכניסה
          </motion.button>
        </motion.div>
      ) : (
        <>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl font-bold text-white">איפוס סיסמה</h1>
            <p className="text-dark-400 text-sm mt-1">
              {step === 'email'
                ? 'נשלח לך קוד לאימייל'
                : `קוד נשלח לכתובת ${email}`}
            </p>
          </motion.div>

          {/* Step 1 — Email */}
          {step === 'email' && (
            <form onSubmit={handleSendCode} noValidate className="space-y-5">
              <InputField
                id="email" label="אימייל" type="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                icon={Mail} custom={0} error={errors.email}
              />

              <AnimatePresence>
                {apiError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2 bg-red-900/40 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3"
                  >
                    <AlertCircle size={15} className="shrink-0" />
                    {apiError}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> שולח...</> : 'שלח קוד'}
              </motion.button>
            </form>
          )}

          {/* Step 2 — Code + New Password */}
          {step === 'code' && (
            <form onSubmit={handleConfirm} noValidate className="space-y-5">
              <InputField
                id="code" label="קוד אימות" type="text"
                value={code} onChange={(e) => setCode(e.target.value)}
                icon={KeyRound} custom={0} error={errors.code}
                placeholder="הכנס את הקוד מהאימייל"
              />
              <InputField
                id="newPassword" label="סיסמה חדשה" type="password"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                icon={Lock} custom={1} error={errors.newPassword}
              />

              <AnimatePresence>
                {apiError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2 bg-red-900/40 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3"
                  >
                    <AlertCircle size={15} className="shrink-0" />
                    {apiError}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> מאפס...</> : 'אפס סיסמה'}
              </motion.button>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-sm text-dark-400"
              >
                לא קיבלת קוד?{' '}
                <button
                  type="button"
                  onClick={() => { setStep('email'); setErrors({}); setApiError('') }}
                  className="text-pitch-400 hover:text-pitch-300 font-medium transition-colors"
                >
                  שלח שוב
                </button>
              </motion.p>
            </form>
          )}

          {/* Back to login */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm text-dark-400 mt-6"
          >
            <Link to="/login" className="text-pitch-400 hover:text-pitch-300 font-medium transition-colors">
              חזרה לכניסה
            </Link>
          </motion.p>
        </>
      )}
    </motion.div>
  )
}
