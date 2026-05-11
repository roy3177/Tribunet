import { motion } from 'framer-motion'
import { pageVariants } from '../animations/variants'
import { useAuth } from '../context/AuthContext'

export default function UserProfilePage() {
  const { user } = useAuth()

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-2xl mx-auto px-4 py-8"
    >
      <h2 className="text-3xl font-bold text-white mb-8">הפרופיל שלי</h2>
      {/* TODO: display & edit profile */}
      <div className="card text-dark-400 text-center py-12">
        {user?.signInDetails?.loginId ?? 'משתמש'} — עריכת פרופיל בקרוב
      </div>
    </motion.div>
  )
}
