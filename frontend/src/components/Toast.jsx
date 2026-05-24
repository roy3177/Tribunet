import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, X } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { modalVariants } from '../animations/variants'

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
