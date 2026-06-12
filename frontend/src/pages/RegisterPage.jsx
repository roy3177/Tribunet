/**
 * @author Roy Meoded
 * @author Yarin Keshet
 * @author Tomer Gal
 *
 * @date 08-06-2026
 *
 * RegisterPage.jsx — User Registration Page
 * ==========================================
 * Handles the two-step registration flow:
 *   Step 1 (RegisterForm)  — collects name, email, password with live validation
 *                            and password-strength indicator, then calls Cognito signUp.
 *   Step 2 (ConfirmForm)   — prompts for the 6-digit email verification code
 *                            and confirms the account via Cognito.
 *
 * On success the user is redirected to /login.
 * If the email already exists and is unconfirmed, a new code is resent automatically.
 *
 * @feature F-01 | User Registration
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2, CheckCircle2, KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { pageVariants } from '../animations/variants'

const inputVariants = {
  hidden:  { opacity: 0, x: -16 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.07 + 0.1, duration: 0.35, ease: 'easeOut' },
  }),
}

// Reusable animated input field with optional password show/hide toggle and inline error message.
function InputField({ id, label, type, value, onChange, icon: Icon, custom, error, autoComplete }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <motion.div variants={inputVariants} custom={custom} initial="hidden" animate="visible">
      <label htmlFor={id} className="block text-sm font-medium text-dark-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none" />
        <input
          id={id}
          type={isPassword ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className={`input-field pl-9 ${isPassword ? 'pr-10' : ''} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mt-1 text-xs text-red-400 flex items-center gap-1"
          >
            <AlertCircle size={12} /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Displays live password strength indicators for length, uppercase, lowercase,
// digit, and special character requirements. Returns null when password is empty.
function PasswordStrength({ password }) {
  const checks = [
    { label: 'לפחות 8 תווים', ok: password.length >= 8 },
    { label: 'אות גדולה', ok: /[A-Z]/.test(password) },
    { label: 'אות קטנה', ok: /[a-z]/.test(password) },
    { label: 'מספר', ok: /\d/.test(password) },
    { label: 'תו מיוחד (!@#$)', ok: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) },
  ]
  if (!password) return null
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      className="flex gap-3 mt-2"
    >
      {checks.map((c) => (
        <span key={c.label} className={`text-xs flex items-center gap-1 ${c.ok ? 'text-pitch-400' : 'text-dark-500'}`}>
          <CheckCircle2 size={11} /> {c.label}
        </span>
      ))}
    </motion.div>
  )
}

// ─── Step 1: Register form ────────────────────────────────────────────────────

// Step 1 form: collects name, email, password, and confirmation.
// Validates all fields, calls Cognito register, and advances to the confirm step.
// If the email already exists but is unconfirmed, resends the verification code.
function RegisterForm({ onSuccess }) {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [errors, setErrors]     = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading]   = useState(false)
  const { register, resendCode } = useAuth()

  // Validates all registration fields. Returns true if valid, false otherwise.
  function validate() {
    const e = {}
    if (!name.trim())  e.name = 'נדרש שם מלא'
    if (!email.trim()) e.email = 'נדרשת כתובת אימייל'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'כתובת אימייל לא תקינה'
    if (!password)           e.password = 'נדרשת סיסמה'
    else if (password.length < 8) e.password = 'סיסמה חייבת להיות לפחות 8 תווים'
    else if (!/[A-Z]/.test(password)) e.password = 'נדרשת לפחות אות גדולה אחת'
    else if (!/[a-z]/.test(password)) e.password = 'נדרשת לפחות אות קטנה אחת'
    else if (!/\d/.test(password))    e.password = 'נדרש לפחות מספר אחד'
    else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) e.password = 'נדרש לפחות תו מיוחד (!@#$)'
    if (confirm !== password) e.confirm = 'הסיסמאות אינן תואמות'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Handles form submission: validates, calls register, then advances to confirm step.
  async function handleSubmit(e) {
    e.preventDefault()
    setApiError('')
    if (!validate()) return
    setLoading(true)
    try {
      await register(email, password, name)
      onSuccess(email)
    } catch (err) {
      const errName = err?.name ?? ''
      if (errName === 'UsernameExistsException') {
        try {
          await resendCode(email)
          onSuccess(email)
        } catch {
          setApiError('כתובת האימייל כבר רשומה ומאומתת במערכת')
        }
      } else if (errName === 'InvalidPasswordException') setApiError('הסיסמה אינה עומדת בדרישות')
      else setApiError('שגיאה בהרשמה, נסה שוב')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white">יצירת חשבון</h1>
        <p className="text-dark-400 text-sm mt-1">הצטרף למשפחת Tribunet</p>
      </motion.div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <InputField id="name" label="שם מלא" type="text" value={name}
          onChange={(e) => setName(e.target.value)} icon={User} custom={0} error={errors.name} autoComplete="name" />
        <InputField id="email" label="אימייל" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)} icon={Mail} custom={1} error={errors.email} autoComplete="email" />
        <div>
          <InputField id="password" label="סיסמה" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} icon={Lock} custom={2} error={errors.password} autoComplete="new-password" />
          <PasswordStrength password={password} />
        </div>
        <InputField id="confirm" label="אימות סיסמה" type="password" value={confirm}
          onChange={(e) => setConfirm(e.target.value)} icon={Lock} custom={3} error={errors.confirm} autoComplete="new-password" />

        <AnimatePresence>
          {apiError && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 bg-red-900/40 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
              <AlertCircle size={15} className="shrink-0" /> {apiError}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button type="submit" disabled={loading}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
          {loading ? <><Loader2 size={16} className="animate-spin" /> נרשם...</> : 'הרשמה'}
        </motion.button>
      </form>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
        className="text-center text-sm text-dark-400 mt-6">
        כבר יש לך חשבון?{' '}
        <Link to="/login" className="text-pitch-400 hover:text-pitch-300 font-medium transition-colors">
          כניסה
        </Link>
      </motion.p>
    </>
  )
}

// ─── Step 2: Email confirmation ───────────────────────────────────────────────

// Step 2 form: collects the 6-digit verification code sent to the user's email
// and confirms the Cognito account. Redirects to /login on success.
function ConfirmForm({ email }) {
  const [code, setCode]         = useState('')
  const [error, setError]       = useState('')
  const [apiError, setApiError] = useState('')
  const [loading, setLoading]   = useState(false)
  const { confirmRegistration } = useAuth()
  const navigate                = useNavigate()

  // Submits the verification code to Cognito and redirects to /login on success.
  async function handleSubmit(e) {
    e.preventDefault()
    setApiError('')
    const trimmedCode = code.trim()
    if (!trimmedCode) { setError('נדרש קוד אימות'); return }
    setLoading(true)
    try {
      await confirmRegistration(email, trimmedCode)
      navigate('/login')
    } catch (err) {
      const errName = err?.name ?? ''
      if (errName === 'CodeMismatchException') setApiError('קוד שגוי, נסה שוב')
      else if (errName === 'ExpiredCodeException') setApiError('הקוד פג תוקף — בקש קוד חדש')
      else if (errName === 'NotAuthorizedException') navigate('/login')
      else setApiError('שגיאה באימות, נסה שוב')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div key="confirm" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-pitch-900 flex items-center justify-center mx-auto mb-4">
          <Mail size={26} className="text-pitch-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">אימות אימייל</h1>
        <p className="text-dark-400 text-sm mt-1">
          שלחנו קוד ל-<span className="text-white">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-dark-300 mb-1.5">קוד אימות</label>
          <div className="relative">
            <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none" />
            <input id="code" type="text" inputMode="numeric" maxLength={6}
              value={code} onChange={(e) => setCode(e.target.value)}
              className={`input-field pl-9 tracking-widest text-center text-xl font-bold ${error ? 'border-red-500' : ''}`}
              placeholder="000000" />
          </div>
          {error && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
        </div>

        <AnimatePresence>
          {apiError && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-red-900/40 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
              <AlertCircle size={15} className="shrink-0" /> {apiError}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button type="submit" disabled={loading}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <><Loader2 size={16} className="animate-spin" /> מאמת...</> : 'אמת חשבון'}
        </motion.button>
      </form>
    </motion.div>
  )
}

// ─── Root component ───────────────────────────────────────────────────────────

// Root component: controls which step is shown (register or confirm)
// by tracking the email after successful step 1 submission.
export default function RegisterPage() {
  const [confirmedEmail, setConfirmedEmail] = useState(null)

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <AnimatePresence mode="wait">
        {confirmedEmail ? (
          <ConfirmForm key="confirm" email={confirmedEmail} />
        ) : (
          <RegisterForm key="register" onSuccess={setConfirmedEmail} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
