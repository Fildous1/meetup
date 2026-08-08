import { useEffect, useState, useCallback, useMemo } from 'react'
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
function makeDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function EventPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { t } = useLang()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadEvent = useCallback(async () => {
    try {
      const data = await getEvent(code)
      setEvent(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [code])

  useEffect(() => { loadEvent() }, [loadEvent])

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

  const dateFrom = new Date(event.date_from + 'T00:00:00')
  const dateTo = new Date(event.date_to + 'T00:00:00')
  const hasResponses = event.responses.length > 0

  return (
    <div className="animate-fade-in-up pb-20">
      {/* Event Header */}
      <div className="pb-6 mb-6 border-b border-zinc-200 dark:border-zinc-800/60">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{event.name}</h1>
          {event.creator_name && (
            <span className="text-sm text-zinc-400 dark:text-zinc-500">{t.by} {event.creator_name}</span>
          )}
        </div>
        {event.description && (
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">{event.description}</p>
        )}
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {t.dateRange}: {dateFrom.toLocaleDateString(t.locale, { month: 'long', day: 'numeric' })} — {dateTo.toLocaleDateString(t.locale, { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <ShareLink code={code} t={t} />
          {hasResponses && (
            <>
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
              <button
                onClick={() => navigate(`/${code}/results`)}
                className="inline-flex items-center gap-1.5 text-sm text-green-500 hover:underline cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
                </svg>
                {t.detailedResults}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Simplified Overview Calendar */}
      {hasResponses && (
        <SimplifiedOverview event={event} t={t} />
      )}

      {/* Sticky Respond button — bottom of main */}
      <div className="sticky bottom-0 z-20 flex justify-center pt-3 pb-2 -mx-4 px-4 bg-gradient-to-t from-zinc-50 via-zinc-50 to-transparent dark:from-[#1a1a1f] dark:via-[#1a1a1f]">
        <button
          onClick={() => navigate(`/${code}/respond`)}
          className="px-8 py-3 rounded-xl bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-medium text-lg transition-colors cursor-pointer shadow-lg shadow-green-500/25"
        >
          {t.respond}
        </button>
      </div>
    </div>
  )
}

function SimplifiedOverview({ event, t }) {
  const dateFrom = new Date(event.date_from + 'T00:00:00')
  const dateTo = new Date(event.date_to + 'T00:00:00')

  // Build list of months to display
  const months = useMemo(() => {
    const result = []
    const cursor = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), 1)
    const endMonth = new Date(dateTo.getFullYear(), dateTo.getMonth(), 1)
    while (cursor <= endMonth) {
      result.push({ year: cursor.getFullYear(), month: cursor.getMonth() })
      cursor.setMonth(cursor.getMonth() + 1)
    }
    return result
  }, [event.date_from, event.date_to])

  const daySummary = useMemo(() => {
    const map = {}
    for (const r of event.responses) {
      for (const [key, val] of Object.entries(r.availability || {})) {
        if (!map[key]) map[key] = { ideal: 0, busy: 0 }
        if (val === 'ideal') map[key].ideal++
        else if (val === 'busy') map[key].busy++
      }
    }
    return map
  }, [event])

  const maxIdeal = useMemo(() => {
    let max = 1
    for (const s of Object.values(daySummary)) {
      if (s.ideal > max) max = s.ideal
    }
    return max
  }, [daySummary])

  // Find the single best day
  const bestDayKey = useMemo(() => {
    let best = null
    let bestScore = -Infinity
    for (const [key, s] of Object.entries(daySummary)) {
      const score = s.ideal * 1000 - s.busy
      if (s.busy === 0 && score > bestScore) {
        bestScore = score
        best = key
      }
    }
    if (!best) {
      // fallback: highest ideal even with conflicts
      for (const [key, s] of Object.entries(daySummary)) {
        const score = s.ideal * 1000 - s.busy
        if (score > bestScore) {
          bestScore = score
          best = key
        }
      }
    }
    return best
  }, [daySummary])

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">{t.overview}</h2>
      <div className={`grid gap-4 ${months.length > 1 ? 'sm:grid-cols-2' : ''}`}>
        {months.map(({ year, month }) => (
          <MiniMonth
            key={`${year}-${month}`}
            year={year}
            month={month}
            daySummary={daySummary}
            maxIdeal={maxIdeal}
            bestDayKey={bestDayKey}
            t={t}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        ))}
      </div>
    </div>
  )
}

function MiniMonth({ year, month, daySummary, maxIdeal, bestDayKey, t, dateFrom, dateTo }) {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e-${i}`} />)

  for (let day = 1; day <= daysInMonth; day++) {
    const key = makeDateKey(year, month, day)
    const d = new Date(year, month, day)
    const inRange = d >= dateFrom && d <= dateTo
    const summary = daySummary[key]
    const isBest = key === bestDayKey

    let bg = 'bg-zinc-100 dark:bg-[#222228]'
    if (inRange && summary) {
      if (summary.busy > 0 && summary.ideal === 0) {
        bg = 'bg-red-50 dark:bg-red-900/10'
      } else if (summary.ideal > 0) {
        const ratio = summary.ideal / maxIdeal
        if (ratio > 0.75) bg = 'bg-green-200 dark:bg-green-800/40'
        else if (ratio > 0.5) bg = 'bg-green-100 dark:bg-green-800/25'
        else if (ratio > 0.25) bg = 'bg-green-50 dark:bg-green-900/15'
        else bg = 'bg-green-50/50 dark:bg-green-900/10'
      }
    }

    cells.push(
      <div
        key={key}
        className={`
          aspect-square rounded flex items-center justify-center text-[10px] font-medium
          ${inRange ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-300 dark:text-zinc-700'}
          ${isBest ? 'ring-2 ring-green-500 ring-offset-1 dark:ring-offset-[#1a1a1f]' : ''}
          ${bg}
        `}
      >
        {day}
      </div>
    )
  }

  return (
    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#1e1e23]">
      <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-2">
        {t.monthNames[month]} {year}
      </p>
      <div className="grid grid-cols-7 gap-0.5">
        {t.dayNames.map((d) => (
          <div key={d} className="text-center text-[8px] font-medium text-zinc-400 dark:text-zinc-500 pb-0.5">{d}</div>
        ))}
        {cells}
      </div>
    </div>
  )
}

function ShareLink({ code, t }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}${window.location.pathname}#/${code}`

  function copy() {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(onCopied).catch(fallbackCopy)
    } else {
      fallbackCopy()
    }
  }

  function onCopied() {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function fallbackCopy() {
    const ta = document.createElement('textarea')
    ta.value = url
    ta.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    onCopied()
  }

  return (
    <button onClick={copy} className="inline-flex items-center gap-1.5 text-sm text-green-500 hover:underline cursor-pointer">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      {copied ? t.copied : t.copyLink}
    </button>
  )
}
