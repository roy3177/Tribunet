/**
 * @author Roy Meoded
 * @author Yarin Keshet
 * @author Tomer Gal
 *
 * @date 08-06-2026
 *
 * Toast.jsx — Global Toast Notification
 * =======================================
 * Animated toast notification rendered in the top-right corner of the screen.
 * Reads the current toast state from ToastContext and displays it with a
 * success (green) or error (red) style.
 *
 * The toast auto-dismisses via ToastContext's internal timer, or can be
 * manually dismissed by clicking the X button which calls clear().
 * Uses AnimatePresence so the toast animates out smoothly when removed.
 */
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, X } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { modalVariants } from '../animations/variants'

// Renders the active toast notification from ToastContext.
// Shows a check icon for success toasts and an X icon for error toasts.
// Clicking the X button manually clears the toast via ToastContext.clear().
export default function Toast() {
  const { toast, clear } = useToast()

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.message + toast.type}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium max-w-sm ${
            toast.type === 'success' ? 'bg-pitch-600' : 'bg-red-600'
          }`}
        >
          {toast.type === 'success'
            ? <CheckCircle size={18} className="shrink-0" />
            : <XCircle size={18} className="shrink-0" />
          }
          <span className="flex-1">{toast.message}</span>
          <button onClick={clear} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity">
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
