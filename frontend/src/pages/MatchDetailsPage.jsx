import { motion } from 'framer-motion'
import { useParams } from 'react-router-dom'
import { pageVariants } from '../animations/variants'

export default function MatchDetailsPage() {
  const { id } = useParams()

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-4xl mx-auto px-4 py-8"
    >
      <h2 className="text-3xl font-bold text-white mb-8">פרטי משחק</h2>
      {/* TODO: fetch match by id and display full details */}
      <div className="card text-dark-400 text-center py-12">
        Match ID: {id} — פרטי משחק בקרוב
      </div>
    </motion.div>
  )
}
