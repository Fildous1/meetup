import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEvent } from '../lib/api'
import { useLang } from '../context/LangContext'

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfWeek(year, month) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}
function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
function getInitials(name) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function ResultsPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { t } = useLang()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadEvent = useCallback(async () => {
    try {
      setEvent(await getEvent(code))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [code])

  useEffect(() => { loadEvent() }, [loadEvent])

  const dateFrom = event?.date_from
    ? new Date(event.date_from + 'T00:00:00')
    : new Date()

  const [year, setYear] = useState(() => dateFrom.getFullYear())
  const [month, setMonth] = useState(() => dateFrom.getMonth())

  useEffect(() => {
    if (event) {
      const d = event.date_from ? new Date(event.date_from + 'T00:00:00') : new Date()
      setYear(d.getFullYear())
      setMonth(d.getMonth())
    }
  }, [event])

  const daySummary = useMemo(() => {
    if (!event) return {}
    const map = {}
    for (const r of event.responses) {
      for (const [key, val] of Object.entries(r.availability || {})) {
        if (!map[key]) map[key] = { ideal: [], busy: [] }
        if (val === 'ideal') map[key].ideal.push(r.participant_name)
        else if (val === 'busy') map[key].busy.push(r.participant_name)
      }
    }
    return map
  }, [event])

  const bestDays = useMemo(() => {
    const entries = Object.entries(daySummary)

    return entries
      .sort((a, b) => {
        const aBusy = a[1].busy.length
        const bBusy = b[1].busy.length
        const aHasVeto = aBusy > 0
        const bHasVeto = bBusy > 0

        if (aHasVeto !== bHasVeto) return aHasVeto ? 1 : -1
        if (a[1].ideal.length !== b[1].ideal.length) return b[1].ideal.length - a[1].ideal.length
        return aBusy - bBusy
      })
      .slice(0, 5)
  }, [daySummary])

  const heatmapScores = useMemo(() => {
    const scores = {}
    for (const [key, summary] of Object.entries(daySummary)) {
      if (summary.busy.length > 0) {
        scores[key] = -summary.busy.length
      } else {
        scores[key] = summary.ideal.length
      }
    }
    return scores
  }, [daySummary])

  const maxScore = useMemo(() => {
    const vals = Object.values(heatmapScores)
    return Math.max(1, ...vals)
  }, [heatmapScores])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="text-center py-20 animate-fade-in-up">
        <p className="text-red-500 text-lg">{error || 'Event not found'}</p>
        <a href="#/" className="mt-4 inline-block text-green-500 hover:underline">{t.backToHome}</a>
      </div>
    )
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const totalResponses = event.responses.length

  function prev() {
    if (month === 0) { setMonth(11); setYear(year - 1) } else setMonth(month - 1)
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(year + 1) } else setMonth(month + 1)
  }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e-${i}`} />)

  for (let day = 1; day <= daysInMonth; day++) {
    const key = dateKey(year, month, day)
    const summary = daySummary[key]
    const isBestDay = bestDays.length > 0 && bestDays[0][0] === key

    const score = heatmapScores[key] || 0
    const normalizedScore = score > 0 ? score / maxScore : 0
    let heatBg = 'bg-zinc-100 dark:bg-[#222228]'
    if (score > 0) {
      if (normalizedScore > 0.75) heatBg = 'bg-green-200 dark:bg-green-800/40'
      else if (normalizedScore > 0.5) heatBg = 'bg-green-100 dark:bg-green-800/25'
      else if (normalizedScore > 0.25) heatBg = 'bg-green-50 dark:bg-green-900/15'
      else heatBg = 'bg-green-50/50 dark:bg-green-900/10'
    } else if (score < 0) {
      heatBg = 'bg-red-50 dark:bg-red-900/10'
    }

    cells.push(
      <div
        key={key}
        className={`
          relative aspect-square rounded-lg p-0.5 flex flex-col items-center justify-start
          ${isBestDay ? 'ring-2 ring-green-500' : ''}
          ${heatBg}
        `}
      >
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">{day}</span>

        {summary && (
          <div className="flex flex-wrap justify-center gap-px mt-auto mb-0.5">
            {summary.ideal.map((n) => (
              <span
                key={n}
                title={`${n} — ${t.ideal}`}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-green-500 text-white text-[6px] sm:text-[7px] font-bold flex items-center justify-center leading-none"
              >
                {getInitials(n)}
              </span>
            ))}
            {summary.busy.map((n) => (
              <span
                key={n}
                title={`${n} — ${t.busy}`}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-red-500 text-white text-[6px] sm:text-[7px] font-bold flex items-center justify-center leading-none"
              >
                {getInitials(n)}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up">
      <div className="pb-6 mb-6 border-b border-zinc-200 dark:border-zinc-800/60">
        <button
          onClick={() => navigate(`/${code}`)}
          className="text-sm text-green-500 hover:underline cursor-pointer mb-3 inline-flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M15 19l-7-7 7-7" />
          </svg>
          {t.backToEvent}
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{event.name} — {t.results}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {totalResponses} {totalResponses !== 1 ? t.responsePlural : t.response}
        </p>
      </div>

      {/* Best Days */}
      {bestDays.length > 0 && (
        <div className="mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800/60">
          <h2 className="text-lg font-semibold mb-3">{t.bestDays}</h2>
          <div className="grid gap-2">
            {bestDays.map(([key, data]) => {
              const d = new Date(key + 'T00:00:00')
              const hasVeto = data.busy.length > 0
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                    hasVeto
                      ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30'
                      : 'bg-green-50 dark:bg-green-900/15 border-green-200 dark:border-green-900/40'
                  }`}
                >
                  <div>
                    <span className="font-medium text-sm">
                      {d.toLocaleDateString(t.locale, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                    {hasVeto && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        {t.vetoWarning}
                      </span>
                    )}
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {data.ideal.map((n) => (
                        <span key={n} className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-green-500 font-semibold text-lg">{data.ideal.length}</span>
                    <span className="text-xs text-zinc-400 ml-1">{t.ideal}</span>
                    {data.busy.length > 0 && (
                      <div className="text-xs text-red-500">{data.busy.length} {t.busy}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Overview */}
      <div className="mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800/60">
        <h2 className="text-lg font-semibold mb-3">{t.overview}</h2>
        <div className="flex items-center justify-between mb-4">
          <button onClick={prev} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h3 className="text-lg font-semibold">{t.monthNames[month]} {year}</h3>
          <button onClick={next} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {t.dayNames.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-zinc-400 dark:text-zinc-500 pb-1">{d}</div>
          ))}
          {cells}
        </div>
      </div>

      {/* Responses */}
      <div>
        <h2 className="text-lg font-semibold mb-3">{t.responses}</h2>
        <div className="grid gap-2">
          {event.responses.map((r) => (
            <ParticipantCard key={r.id} response={r} t={t} event={event} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ParticipantCard({ response, t, event }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const cardRef = useRef(null)

  const idealCount = Object.values(response.availability || {}).filter((v) => v === 'ideal').length
  const busyCount = Object.values(response.availability || {}).filter((v) => v === 'busy').length

  return (
    <div
      ref={cardRef}
      className="relative px-4 py-3 rounded-xl bg-zinc-100 dark:bg-[#222228]"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip((prev) => !prev)}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm cursor-default">{response.participant_name}</span>
        <div className="flex gap-1">
          {idealCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {idealCount} {t.ideal}
            </span>
          )}
          {busyCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {busyCount} {t.busy}
            </span>
          )}
        </div>
      </div>
      {response.comment && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 italic">"{response.comment}"</p>
      )}

      {showTooltip && (
        <MiniGridTooltip response={response} event={event} t={t} />
      )}
    </div>
  )
}

function MiniGridTooltip({ response, event, t }) {
  const availability = response.availability || {}

  // Build list of all relevant months between date_from and date_to
  const dateFrom = new Date(event.date_from + 'T00:00:00')
  const dateTo = new Date(event.date_to + 'T00:00:00')

  const months = []
  const cursor = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), 1)
  const endMonth = new Date(dateTo.getFullYear(), dateTo.getMonth(), 1)
  while (cursor <= endMonth) {
    months.push({ year: cursor.getFullYear(), month: cursor.getMonth() })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return (
    <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 rounded-xl bg-white dark:bg-[#2a2a30] shadow-lg border border-zinc-200 dark:border-zinc-700 animate-fade-in-up">
      <div className={`flex gap-3 ${months.length > 2 ? 'flex-wrap justify-center' : ''}`}>
        {months.map(({ year, month }) => {
          const daysInMonth = getDaysInMonth(year, month)
          const firstDay = getFirstDayOfWeek(year, month)

          const cells = []
          for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`e-${i}`} className="w-3 h-3" />)
          }
          for (let day = 1; day <= daysInMonth; day++) {
            const key = dateKey(year, month, day)
            const state = availability[key] || 'neutral'
            let bg = 'bg-zinc-200 dark:bg-zinc-700'
            if (state === 'ideal') bg = 'bg-green-500'
            else if (state === 'busy') bg = 'bg-red-500'
            cells.push(
              <div key={key} className={`w-3 h-3 rounded-sm ${bg}`} title={`${day}: ${state}`} />
            )
          }

          return (
            <div key={`${year}-${month}`}>
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                {t.monthNames[month]} {year}
              </p>
              <div className="grid grid-cols-7 gap-0.5">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <div key={i} className="w-3 h-3 text-[7px] text-center text-zinc-400 leading-3">{d}</div>
                ))}
                {cells}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-2 mt-2">
        <span className="flex items-center gap-1 text-[9px] text-zinc-400">
          <span className="w-2 h-2 rounded-sm bg-green-500" /> {t.ideal}
        </span>
        <span className="flex items-center gap-1 text-[9px] text-zinc-400">
          <span className="w-2 h-2 rounded-sm bg-red-500" /> {t.busy}
        </span>
      </div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white dark:border-t-[#2a2a30]" />
    </div>
  )
}
