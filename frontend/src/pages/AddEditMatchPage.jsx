import { motion } from 'framer-motion'
import { useParams } from 'react-router-dom'
import { pageVariants } from '../animations/variants'

export default function AddEditMatchPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-2xl mx-auto px-4 py-8"
    >
      <h2 className="text-3xl font-bold text-white mb-8">
        {isEdit ? 'עריכת משחק' : 'הוספת משחק'}
      </h2>
      {/* TODO: build full match form */}
      <div className="card text-dark-400 text-center py-12">
        טופס {isEdit ? 'עריכה' : 'הוספה'} — בקרוב
      </div>
    </motion.div>
  )
}
