/**
 * @author Roy Meoded
 * @author Yarin Keshet
 * @author Tomer Gal
 *
 * @date 08-06-2026
 *
 * AddEditMatchPage.jsx — Add / Edit Match Admin Page
 * ===================================================
 * Shared page for creating a new match (POST /matches) and editing an existing
 * one (PUT /matches/{id}), routed via /admin/matches/new and
 * /admin/matches/:id/edit respectively.
 *
 * Loads stadiums, teams, and leagues from the API (or mock data when
 * VITE_API_URL is unset) and pre-populates the form when in edit mode.
 * On save, redirects back to /admin with a toast notification.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { pageVariants, cardVariants, fadeIn } from '../animations/variants'
import { getMatch, createMatch, updateMatch, getStadiums, getTeams, getLeagues } from '../services/matchService'
import { useToast } from '../context/ToastContext'

const USE_MOCK = !import.meta.env.VITE_API_URL

const MOCK_STADIUMS = [
  { stadiumId: 's1', name: 'בלומפילד' },
  { stadiumId: 's2', name: 'סמי עופר' },
  { stadiumId: 's3', name: 'טדי' },
  { stadiumId: 's4', name: 'טורנר' },
  { stadiumId: 's5', name: 'נטוע' },
  { stadiumId: 's6', name: 'איצטדיון העיר' },
]

const MOCK_MATCHES = {
  '1': { homeTeam: 'מכבי תל אביב', awayTeam: 'הפועל באר שבע', date: '2026-05-14', time: '20:00', stadiumId: 's1', league: 'ליגת העל', hasTickets: true,  ticketUrl: 'https://www.maccabi-tlv.co.il' },
  '2': { homeTeam: 'מכבי חיפה',    awayTeam: "בית\"ר ירושלים",  date: '2026-05-15', time: '19:00', stadiumId: 's2', league: 'ליגת העל', hasTickets: true,  ticketUrl: '' },
}

const EMPTY_FORM = {
  homeTeam: '', awayTeam: '', date: '', time: '',
  stadiumId: '', league: '', hasTickets: false, ticketUrl: '',
}

// Reusable labeled form field wrapper with optional error message below the input.
function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-dark-300 text-sm font-medium mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

// Main add/edit match page. Determines mode (add vs edit) from the URL param :id.
export default function AddEditMatchPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const isEdit   = Boolean(id)
  const toast    = useToast()

  const [form,     setForm]     = useState(EMPTY_FORM)
  const [stadiums, setStadiums] = useState([])
  const [teams,    setTeams]    = useState([])
  const [leagues,  setLeagues]  = useState([])
  const [loading,  setLoading]  = useState(isEdit)
  const [saving,   setSaving]   = useState(false)
  const [errors,   setErrors]   = useState({})

  // Loads stadiums, teams, and leagues on mount. In edit mode also fetches the
  // existing match data and pre-populates the form.
  useEffect(() => {
    async function load() {
      try {
        const [stadiumData, teamData, leagueData] = await Promise.all([
          USE_MOCK ? Promise.resolve(MOCK_STADIUMS) : getStadiums(),
          USE_MOCK ? Promise.resolve([]) : getTeams(),
          USE_MOCK ? Promise.resolve([]) : getLeagues(),
        ])
        setStadiums(stadiumData)
        setTeams(teamData)
        setLeagues(leagueData)

        if (isEdit) {
          const match = USE_MOCK ? (MOCK_MATCHES[id] ?? EMPTY_FORM) : await getMatch(id)
          setForm({
            homeTeam:   match.homeTeam   ?? '',
            awayTeam:   match.awayTeam   ?? '',
            date:       match.date       ?? '',
            time:       match.time       ?? '',
            stadiumId:  match.stadiumId  ?? '',
            league:     match.league     ?? '',
            hasTickets: match.hasTickets ?? false,
            ticketUrl:  match.ticketUrl  ?? '',
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, isEdit])

  // Updates a single form field and clears its validation error.
  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  // Validates all required fields. Returns an errors object (empty if valid).
  function validate() {
    const errs = {}
    if (!form.homeTeam.trim()) errs.homeTeam  = 'שדה חובה'
    if (!form.awayTeam.trim()) errs.awayTeam  = 'שדה חובה'
    if (!form.date)            errs.date      = 'שדה חובה'
    if (!form.time)            errs.time      = 'שדה חובה'
    if (!form.stadiumId)       errs.stadiumId = 'שדה חובה'
    if (!form.league)          errs.league    = 'שדה חובה'
    return errs
  }

  // Submits the form: creates or updates the match and redirects to /admin.
  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      if (!USE_MOCK) {
        if (isEdit) await updateMatch(id, form)
        else        await createMatch(form)
      }
      toast.success(isEdit ? 'המשחק עודכן בהצלחה' : 'המשחק נוצר בהצלחה')
      navigate('/admin')
    } catch (err) {
      console.error(err)
      toast.error('שגיאה בשמירת המשחק')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-pitch-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-2xl mx-auto px-4 py-8">
      <motion.button variants={fadeIn} initial="hidden" animate="visible"
        onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors mb-8 text-sm">
        <ArrowLeft size={16} /> חזרה לניהול
      </motion.button>

      <motion.div variants={cardVariants} custom={0} initial="hidden" animate="visible" className="card">
        <h2 className="text-2xl font-bold text-white mb-6">
          {isEdit ? 'עריכת משחק' : 'הוספת משחק חדש'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="קבוצת בית" error={errors.homeTeam}>
              <select value={form.homeTeam} onChange={(e) => set('homeTeam', e.target.value)} className="input-field">
                <option value="">בחר קבוצת בית...</option>
                {teams.map((t) => <option key={t.teamId} value={t.name}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="קבוצת חוץ" error={errors.awayTeam}>
              <select value={form.awayTeam} onChange={(e) => set('awayTeam', e.target.value)} className="input-field">
                <option value="">בחר קבוצת חוץ...</option>
                {teams.map((t) => <option key={t.teamId} value={t.name}>{t.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="תאריך" error={errors.date}>
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className="input-field" />
            </Field>
            <Field label="שעה" error={errors.time}>
              <input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} className="input-field" />
            </Field>
          </div>

          <Field label="אצטדיון" error={errors.stadiumId}>
            <select value={form.stadiumId} onChange={(e) => set('stadiumId', e.target.value)} className="input-field">
              <option value="">בחר אצטדיון...</option>
              {stadiums.map((s) => <option key={s.stadiumId} value={s.stadiumId}>{s.name}</option>)}
            </select>
          </Field>

          <Field label="ליגה" error={errors.league}>
            <select value={form.league} onChange={(e) => set('league', e.target.value)} className="input-field">
              <option value="">בחר ליגה...</option>
              {leagues.map((l) => <option key={l.leagueId} value={l.name}>{l.name}</option>)}
            </select>
          </Field>

          <Field label="זמינות כרטיסים">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => set('hasTickets', !form.hasTickets)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${form.hasTickets ? 'bg-pitch-600' : 'bg-dark-700'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${form.hasTickets ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <span className="text-dark-300 text-sm">{form.hasTickets ? 'יש כרטיסים' : 'אין כרטיסים'}</span>
            </div>
          </Field>

          {form.hasTickets && (
            <Field label="לינק לכרטיסים (אופציונלי)">
              <input type="url" value={form.ticketUrl} onChange={(e) => set('ticketUrl', e.target.value)}
                placeholder="https://..." className="input-field" />
            </Field>
          )}

          <div className="flex gap-3 pt-2">
            <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="btn-primary flex items-center gap-2 flex-1 justify-center">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isEdit ? 'שמור שינויים' : 'צור משחק'}
            </motion.button>
            <button type="button" onClick={() => navigate('/admin')} className="btn-secondary px-6">ביטול</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
