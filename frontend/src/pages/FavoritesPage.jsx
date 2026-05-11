import { motion } from 'framer-motion'
import { pageVariants } from '../animations/variants'

export default function FavoritesPage() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-6xl mx-auto px-4 py-8"
    >
      <h2 className="text-3xl font-bold text-white mb-8">המשחקים שלי</h2>
      {/* TODO: fetch and display user favorites */}
      <div className="card text-dark-400 text-center py-12">
        רשימת המועדפים — בקרוב
      </div>
    </motion.div>
  )
}
