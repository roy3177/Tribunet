import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, X, ChevronDown, Search } from 'lucide-react'
import { slideInLeft } from '../animations/variants'

function FilterSelect({ label, value, onChange, options, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-dark-400 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field appearance-none pr-8 text-sm"
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none"
        />
      </div>
    </div>
  )
}

export default function FilterSidebar({ open, onClose, filters, leagues, teams, cities, activeFilterCount, updateFilter, clearFilters, matchCount }) {
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <AnimatePresence>
        {open && (
          <motion.aside
            variants={slideInLeft}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="
              fixed top-16 left-0 bottom-0 z-30 w-72
              bg-dark-900 border-r border-dark-800
              flex flex-col overflow-hidden
              lg:relative lg:top-auto lg:z-auto lg:h-full
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-dark-800 shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-pitch-400" />
                <span className="text-white font-semibold text-sm">סינון</span>
                {activeFilterCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-5 h-5 rounded-full bg-pitch-600 text-white text-xs flex items-center justify-center font-bold"
                  >
                    {activeFilterCount}
                  </motion.span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={clearFilters}
                    className="text-xs text-pitch-400 hover:text-pitch-300 transition-colors"
                  >
                    נקה הכל
                  </motion.button>
                )}
                <button onClick={onClose} className="text-dark-500 hover:text-dark-300 transition-colors lg:hidden">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {/* Free-text search */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-dark-400 uppercase tracking-wide">
                  חיפוש
                </label>
                <div className="relative">
                  <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="קבוצה או אצטדיון..."
                    value={filters.search ?? ''}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    className="input-field text-sm pr-8"
                  />
                </div>
              </div>

              <FilterSelect
                label="ליגה"
                value={filters.league}
                onChange={(v) => updateFilter('league', v)}
                options={leagues}
                placeholder="כל הליגות"
              />

              <FilterSelect
                label="קבוצה"
                value={filters.team}
                onChange={(v) => updateFilter('team', v)}
                options={teams}
                placeholder="כל הקבוצות"
              />

              <FilterSelect
                label="עיר"
                value={filters.city}
                onChange={(v) => updateFilter('city', v)}
                options={cities}
                placeholder="כל הערים"
              />

              {/* Tickets toggle */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-dark-400 uppercase tracking-wide">
                  כרטיסים
                </label>
                <div className="flex gap-2">
                  {[
                    { label: 'הכל',      value: '' },
                    { label: 'יש כרטיסים', value: 'true' },
                    { label: 'אזל',      value: 'false' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateFilter('hasTickets', opt.value)}
                      className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium border transition-all duration-150 ${
                        filters.hasTickets === opt.value
                          ? 'bg-pitch-700 border-pitch-600 text-white'
                          : 'bg-dark-800 border-dark-700 text-dark-400 hover:border-dark-500 hover:text-dark-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer — match count */}
            <div className="px-5 py-4 border-t border-dark-800 shrink-0">
              <motion.p
                key={matchCount}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-dark-400 text-center"
              >
                {matchCount === 0 ? 'אין משחקים' : `${matchCount} משחק${matchCount !== 1 ? 'ים' : ''}`}
              </motion.p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
