import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home } from 'lucide-react'
import { pageVariants, fadeIn, cardVariants } from '../animations/variants'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center"
    >
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <p className="text-8xl font-black text-pitch-500 mb-2 leading-none">404</p>
      </motion.div>

      <motion.div variants={cardVariants} custom={1} initial="hidden" animate="visible">
        <h1 className="text-2xl font-bold text-white mb-3">הדף לא נמצא</h1>
        <p className="text-dark-400 text-sm mb-8 max-w-xs">
          הדף שחיפשת לא קיים או הוסר. ייתכן שהלינק שגוי.
        </p>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/')}
          className="btn-primary flex items-center gap-2 mx-auto"
        >
          <Home size={16} />
          חזרה לדף הבית
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
