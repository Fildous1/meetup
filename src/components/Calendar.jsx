import { useState, useMemo, useRef, useCallback } from 'react'
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

const stateStyles = {
  neutral:
    'bg-zinc-100 dark:bg-[#2a2a30] hover:bg-zinc-200 dark:hover:bg-[#333338] text-zinc-700 dark:text-zinc-300',
  busy:
    'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-800',
  ideal:
    'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 ring-1 ring-green-200 dark:ring-green-800',
}

const LONG_PRESS_MS = 300

export default function Calendar({ dateFrom, dateTo, availability, onToggle, onSetIdeal, responses, currentUser }) {
  const { t } = useLang()
  const [year, setYear] = useState(dateFrom.getFullYear())
  const [month, setMonth] = useState(dateFrom.getMonth())

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const rangeStart = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate())
  const rangeEnd = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate())

  const heatmap = useMemo(() => {
    const map = {}
    for (const r of responses || []) {
      if (r.participant_name === currentUser) continue
      for (const [key, val] of Object.entries(r.availability || {})) {
        if (val === 'ideal') {
          map[key] = (map[key] || 0) + 1
        }
      }
    }
    return map
  }, [responses, currentUser])

  const maxHeat = Math.max(1, ...Object.values(heatmap))

  function prev() {
    if (month === 0) { setMonth(11); setYear(year - 1) }
    else setMonth(month - 1)
  }

  function next() {
    if (month === 11) { setMonth(0); setYear(year + 1) }
    else setMonth(month + 1)
  }

  const cells = []
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const key = dateKey(year, month, day)
    const state = availability[key] || 'neutral'
    const heat = heatmap[key] || 0
    const cellDate = new Date(year, month, day)
    cellDate.setHours(0, 0, 0, 0)
    const isToday = cellDate.getTime() === today.getTime()
    const isPast = cellDate < today
    const isOutOfRange = cellDate < rangeStart || cellDate > rangeEnd
    const isDisabled = isPast || isOutOfRange

    cells.push(
      <DayCell
        key={key}
        dateKey={key}
        day={day}
        state={state}
        heat={heat}
        maxHeat={maxHeat}
        isToday={isToday}
        isDisabled={isDisabled}
        onToggle={onToggle}
        onSetIdeal={onSetIdeal}
        t={t}
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prev}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-semibold">
          {t.monthNames[month]} {year}
        </h3>
        <button
          onClick={next}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="flex gap-4 mb-4 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-zinc-200 dark:bg-zinc-700" /> {t.neutral}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-200 dark:bg-red-900/60" /> {t.busyLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-200 dark:bg-green-900/60" /> {t.idealLabel}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {t.dayNames.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-zinc-400 dark:text-zinc-500 pb-1">
            {d}
          </div>
        ))}
        {cells}
      </div>
    </div>
  )
}

function DayCell({ dateKey, day, state, heat, maxHeat, isToday, isDisabled, onToggle, onSetIdeal, t }) {
  const longPressTimer = useRef(null)
  const didLongPress = useRef(false)

  const handleClick = useCallback(() => {
    if (isDisabled || didLongPress.current) return
    // Single click: toggle neutral <-> busy
    onToggle(dateKey)
  }, [isDisabled, dateKey, onToggle])

  const handleDoubleClick = useCallback(() => {
    if (isDisabled) return
    // Double-click: set ideal
    onSetIdeal(dateKey)
  }, [isDisabled, dateKey, onSetIdeal])

  const handleTouchStart = useCallback((e) => {
    if (isDisabled) return
    didLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true
      onSetIdeal(dateKey)
    }, LONG_PRESS_MS)
  }, [isDisabled, dateKey, onSetIdeal])

  const handleTouchEnd = useCallback((e) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
  }, [])

  return (
    <button
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onContextMenu={handleContextMenu}
      disabled={isDisabled}
      className={`
        relative aspect-square rounded-lg text-sm font-medium
        transition-transform transition-opacity duration-150 select-none
        ${isDisabled ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
        ${stateStyles[state]}
        ${isToday ? 'ring-2 ring-green-500 ring-offset-1 dark:ring-offset-[#1a1a1f]' : ''}
      `}
      title={isDisabled ? '' : `${dateKey} — ${state}${heat > 0 ? ` (${heat} ${t.ideal})` : ''}`}
    >
      <span className="relative z-10">{day}</span>

      {state === 'neutral' && heat > 0 && !isDisabled && (
        <span
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-green-500"
          style={{ opacity: 0.3 + 0.7 * (heat / maxHeat) }}
        />
      )}
    </button>
  )
}
