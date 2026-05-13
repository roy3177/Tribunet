import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, MapPin, Save, X, Loader2, ArrowLeft } from 'lucide-react'
import { pageVariants, cardVariants, staggerContainer, fadeIn, modalVariants } from '../animations/variants'
import { getStadiums, createStadium, updateStadium, deleteStadium } from '../services/matchService'

const USE_MOCK = !import.meta.env.VITE_API_URL

const MOCK_STADIUMS = [
  { stadiumId: 's1', name: 'בלומפילד',       city: 'תל אביב',   lat: 32.057, lng: 34.768 },
  { stadiumId: 's2', name: 'סמי עופר',       city: 'חיפה',      lat: 32.794, lng: 34.988 },
  { stadiumId: 's3', name: 'טדי',            city: 'ירושלים',   lat: 31.739, lng: 35.186 },
  { stadiumId: 's4', name: 'טורנר',          city: 'באר שבע',   lat: 31.239, lng: 34.813 },
  { stadiumId: 's5', name: 'נטוע',           city: 'נתניה',     lat: 32.332, lng: 34.862 },
  { stadiumId: 's6', name: 'איצטדיון העיר',  city: 'פתח תקווה', lat: 32.089, lng: 34.889 },
]

const EMPTY_FORM = { name: '', city: '', lat: '', lng: '' }

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-dark-300 text-sm font-medium mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

export default function StadiumManagementPage() {
  const [stadiums, setStadiums] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null) // null | { mode: 'add' | 'edit', stadium?: {} }
  const [form,     setFormState] = useState(EMPTY_FORM)
  const [saving,   setSaving]   = useState(false)
  const [errors,   setErrors]   = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setStadiums(USE_MOCK ? MOCK_STADIUMS : await getStadiums())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setFormState(EMPTY_FORM)
    setErrors({})
    setModal({ mode: 'add' })
  }

  function openEdit(stadium) {
    setFormState({ name: stadium.name, city: stadium.city, lat: String(stadium.lat), lng: String(stadium.lng) })
    setErrors({})
    setModal({ mode: 'edit', stadium })
  }

  function set(key, value) {
    setFormState((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'שדה חובה'
    if (!form.city.trim()) errs.city = 'שדה חובה'
    if (!form.lat || isNaN(Number(form.lat))) errs.lat = 'ערך מספרי נדרש'
    if (!form.lng || isNaN(Number(form.lng))) errs.lng = 'ערך מספרי נדרש'
    return errs
  }

  async function handleSave() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      const payload = { ...form, lat: parseFloat(form.lat), lng: parseFloat(form.lng) }

      if (modal.mode === 'add') {
        if (USE_MOCK) {
          setStadiums((prev) => [...prev, { ...payload, stadiumId: `s${Date.now()}` }])
        } else {
          const created = await createStadium(payload)
          setStadiums((prev) => [...prev, created])
        }
      } else {
        const sid = modal.stadium.stadiumId
        if (USE_MOCK) {
          setStadiums((prev) => prev.map((s) => s.stadiumId === sid ? { ...s, ...payload } : s))
        } else {
          const updated = await updateStadium(sid, payload)
          setStadiums((prev) => prev.map((s) => s.stadiumId === sid ? updated : s))
        }
      }
      setModal(null)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(stadiumId) {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק אצטדיון זה?')) return
    try {
      if (!USE_MOCK) await deleteStadium(stadiumId)
      setStadiums((prev) => prev.filter((s) => s.stadiumId !== stadiumId))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-4xl mx-auto px-4 py-8"
    >
      {/* Header */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between mb-8"
      >
        <div>
          <Link
            to="/admin"
            className="flex items-center gap-1.5 text-dark-400 hover:text-white transition-colors text-sm mb-2"
          >
            <ArrowLeft size={14} /> חזרה לניהול
          </Link>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <MapPin size={28} className="text-pitch-400" />
            ניהול אצטדיונים
          </h2>
          <p className="text-dark-400 text-sm mt-1">
            {loading ? '...' : `${stadiums.length} אצטדיונים במערכת`}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={openAdd}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> הוסף אצטדיון
        </motion.button>
      </motion.div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-pitch-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid sm:grid-cols-2 gap-4"
        >
          {stadiums.map((s, i) => (
            <motion.div
              key={s.stadiumId}
              variants={cardVariants}
              custom={i}
              className="card flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-pitch-900/50 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-pitch-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold truncate">{s.name}</p>
                  <p className="text-dark-500 text-xs">{s.city} · {s.lat}, {s.lng}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openEdit(s)}
                  className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
                >
                  <Pencil size={14} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDelete(s.stadiumId)}
                  className="p-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 size={14} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setModal(null)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="card w-full max-w-md"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-bold text-lg">
                  {modal.mode === 'add' ? 'הוספת אצטדיון' : 'עריכת אצטדיון'}
                </h3>
                <button
                  onClick={() => setModal(null)}
                  className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Fields */}
              <div className="flex flex-col gap-4">
                <Field label="שם האצטדיון" error={errors.name}>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="בלומפילד"
                    className="input-field"
                  />
                </Field>
                <Field label="עיר" error={errors.city}>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                    placeholder="תל אביב"
                    className="input-field"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="קו רוחב (lat)" error={errors.lat}>
                    <input
                      type="number"
                      step="0.001"
                      value={form.lat}
                      onChange={(e) => set('lat', e.target.value)}
                      placeholder="32.057"
                      className="input-field"
                    />
                  </Field>
                  <Field label="קו אורך (lng)" error={errors.lng}>
                    <input
                      type="number"
                      step="0.001"
                      value={form.lng}
                      onChange={(e) => set('lng', e.target.value)}
                      placeholder="34.768"
                      className="input-field"
                    />
                  </Field>
                </div>
              </div>

              {/* Modal buttons */}
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2 flex-1 justify-center"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  שמור
                </motion.button>
                <button
                  onClick={() => setModal(null)}
                  className="btn-secondary px-5"
                >
                  ביטול
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
