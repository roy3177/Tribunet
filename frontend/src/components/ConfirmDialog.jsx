import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { modalVariants } from '../animations/variants'

export default function ConfirmDialog({ open, title, message, confirmLabel = 'מחק', onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative card max-w-sm w-full z-10 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-900/40 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <h3 className="text-white font-bold text-lg">{title}</h3>
            </div>

            <p className="text-dark-300 text-sm mb-6">{message}</p>

            <div className="flex gap-3">
              <button
                onClick={onConfirm}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
              >
                {confirmLabel}
              </button>
              <button
                onClick={onCancel}
                className="flex-1 btn-secondary text-sm"
              >
                ביטול
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
