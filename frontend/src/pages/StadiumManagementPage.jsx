import { motion } from 'framer-motion'
import { pageVariants } from '../animations/variants'

export default function StadiumManagementPage() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-6xl mx-auto px-4 py-8"
    >
      <h2 className="text-3xl font-bold text-white mb-8">ניהול אצטדיונים</h2>
      {/* TODO: stadium list + add/edit/delete */}
      <div className="card text-dark-400 text-center py-12">
        ניהול אצטדיונים — בקרוב
      </div>
    </motion.div>
  )
}
