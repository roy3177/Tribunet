import { motion } from 'framer-motion'
import { pageVariants, cardVariants, staggerContainer } from '../animations/variants'

const STAT_CARDS = [
  { label: 'משחקים', value: '—' },
  { label: 'אצטדיונים', value: '—' },
  { label: 'משתמשים', value: '—' },
  { label: 'מועדפים', value: '—' },
]

export default function AdminDashboard() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto px-4 py-8"
    >
      <h2 className="text-3xl font-bold text-white mb-8">לוח ניהול</h2>

      {/* Stat cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
      >
        {STAT_CARDS.map((s, i) => (
          <motion.div key={s.label} variants={cardVariants} custom={i} className="card">
            <p className="text-dark-400 text-sm mb-1">{s.label}</p>
            <p className="text-3xl font-bold text-white">{s.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* TODO: match table, quick actions */}
      <div className="card text-dark-400 text-center py-12">
        טבלת משחקים ופעולות ניהול — בקרוב
      </div>
    </motion.div>
  )
}
