import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { pageVariants } from '../animations/variants'

const inputVariants = {
  hidden:  { opacity: 0, x: -16 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.08 + 0.15, duration: 0.35, ease: 'easeOut' },
  }),
}

function InputField({ id, label, type, value, onChange, icon: Icon, custom, error }) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type

  return (
    <motion.div variants={inputVariants} custom={custom} initial="hidden" animate="visible">
      <label htmlFor={id} className="block text-sm font-medium text-dark-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none" />
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          className={`input-field pl-9 ${isPassword ? 'pr-10' : ''} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
          autoComplete={isPassword ? 'current-password' : 'email'}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
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

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors]     = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading]   = useState(false)

  const { login }  = useAuth()
  const navigate   = useNavigate()

  function validate() {
    const e = {}
    if (!email.trim())         e.email    = 'נדרשת כתובת אימייל'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'כתובת אימייל לא תקינה'
    if (!password)             e.password = 'נדרשת סיסמה'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError('')
    if (!validate()) return

    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      const errName = err?.name ?? ''
      if (errName === 'UserNotFoundException' || errName === 'NotAuthorizedException') {
        setApiError('אימייל או סיסמה שגויים')
      } else if (errName === 'UserNotConfirmedException') {
        setApiError('חשבון לא מאושר — בדוק את האימייל שלך')
      } else {
        setApiError('שגיאה בהתחברות, נסה שוב')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-bold text-white">ברוך הבא בחזרה</h1>
        <p className="text-dark-400 text-sm mt-1">התחבר לחשבון שלך</p>
      </motion.div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <InputField
          id="email" label="אימייל" type="email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          icon={Mail} custom={0} error={errors.email}
        />
        <InputField
          id="password" label="סיסמה" type="password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          icon={Lock} custom={1} error={errors.password}
        />

        {/* Forgot password */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-right"
        >
          <Link to="/forgot-password" className="text-sm text-pitch-400 hover:text-pitch-300 font-medium transition-colors">
            ?שכחת סיסמה
          </Link>
        </motion.div>

        {/* API error */}
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

        {/* Submit */}
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
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              מתחבר...
            </>
          ) : (
            'כניסה'
          )}
        </motion.button>
      </form>

      {/* Footer link */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-dark-400 mt-6"
      >
        אין לך חשבון?{' '}
        <Link to="/register" className="text-pitch-400 hover:text-pitch-300 font-medium transition-colors">
          הרשם עכשיו
        </Link>
      </motion.p>
    </motion.div>
  )
}
