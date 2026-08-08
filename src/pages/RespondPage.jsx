import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEvent, checkName, saveResponse } from '../lib/api'
import { useLang } from '../context/LangContext'
import Calendar from '../components/Calendar'
import Onboarding from '../components/Onboarding'
import SuccessAnimation from '../components/SuccessAnimation'

export default function RespondPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { t } = useLang()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Name is now entered inline on the calendar screen
  const [nameInput, setNameInput] = useState('')
  const [confirmedName, setConfirmedName] = useState('')
  const [nameConfirmed, setNameConfirmed] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [checkingName, setCheckingName] = useState(false)

  const [availability, setAvailability] = useState({})
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [allMarked, setAllMarked] = useState(false)

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

  useEffect(() => {
    const interval = setInterval(loadEvent, 15000)
    return () => clearInterval(interval)
  }, [loadEvent])

  async function handleNameConfirm(e) {
    if (e) e.preventDefault()
    const trimmed = nameInput.trim()
    if (!trimmed) return
    setCheckingName(true)
    try {
      const { exists } = await checkName(code, trimmed)
      if (exists) {
        setShowConfirmDialog(true)
      } else {
        setIsEditing(false)
        applyName(trimmed)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setCheckingName(false)
    }
  }

  function applyName(participantName) {
    const existing = event?.responses?.find((r) => r.participant_name === participantName)
    if (existing) setIsEditing(true)
    setAvailability(existing?.availability || {})
    setComment(existing?.comment || '')
    setConfirmedName(participantName)
    setNameInput(participantName)
    setNameConfirmed(true)
    setShowConfirmDialog(false)
  }

  function handleOverwrite() {
    setIsEditing(true)
    applyName(nameInput.trim())
  }

  function handleCreateNew() {
    const base = nameInput.trim()
    let n = 2
    const names = new Set(event?.responses?.map((r) => r.participant_name) || [])
    while (names.has(`${base} ${n}`)) n++
    const newName = `${base} ${n}`
    setNameInput(newName)
    setIsEditing(false)
    applyName(newName)
  }

  function handleChangeName() {
    setNameConfirmed(false)
    setConfirmedName('')
    setShowConfirmDialog(false)
  }

  function toggleDay(dateKey) {
    setAvailability((prev) => {
      const current = prev[dateKey] || 'neutral'
      const updated = { ...prev }
      if (current === 'neutral') {
        updated[dateKey] = 'busy'
      } else {
        delete updated[dateKey]
      }
      return updated
    })
    setSaved(false)
  }

  function setIdeal(dateKey) {
    setAvailability((prev) => {
      const current = prev[dateKey] || 'neutral'
      const updated = { ...prev }
      if (current === 'ideal') {
        delete updated[dateKey]
      } else {
        updated[dateKey] = 'ideal'
      }
      return updated
    })
    setSaved(false)
  }

  function toggleMarkAll() {
    if (!event) return
    if (!allMarked) {
      const from = new Date(event.date_from + 'T00:00:00')
      const to = new Date(event.date_to + 'T00:00:00')
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const updated = {}
      const cursor = new Date(from)
      while (cursor <= to) {
        if (cursor >= today) {
          const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
          updated[key] = 'busy'
        }
        cursor.setDate(cursor.getDate() + 1)
      }
      setAvailability(updated)
      setAllMarked(true)
    } else {
      setAvailability({})
      setAllMarked(false)
    }
    setSaved(false)
  }

  async function handleSave() {
    if (!nameConfirmed) return
    setSaving(true)
    try {
      await saveResponse(code, confirmedName, availability, comment, isEditing)
      setSaved(true)
      setShowSuccess(true)
      await loadEvent()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error && !event) {
    return (
      <div className="text-center py-20 animate-fade-in-up">
        <p className="text-red-500 text-lg">{error}</p>
        <a href="#/" className="mt-4 inline-block text-green-500 hover:underline">{t.backToHome}</a>
      </div>
    )
  }

  if (!event) return null

  const dateFrom = new Date(event.date_from + 'T00:00:00')
  const dateTo = new Date(event.date_to + 'T00:00:00')

  return (
    <div className="animate-fade-in-up pb-20">
      {/* Success animation overlay */}
      {showSuccess && (
        <SuccessAnimation
          onShowResults={() => { setShowSuccess(false); navigate(`/${code}/results`) }}
          onDismiss={() => setShowSuccess(false)}
        />
      )}

      {/* Minimal event header */}
      <div className="pb-4 mb-6 border-b border-zinc-200 dark:border-zinc-800/60">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          {event.name}
          {event.creator_name && <span> · {t.by} {event.creator_name}</span>}
        </p>
      </div>

      <Onboarding />

      {/* Inline name entry — always visible at top */}
      <div className="mb-5">
        <form onSubmit={handleNameConfirm} className="flex items-center gap-2">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => { setNameInput(e.target.value); if (nameConfirmed && e.target.value.trim() !== confirmedName) { setNameConfirmed(false); setConfirmedName('') } }}
            placeholder={t.yourName}
            required
            maxLength={100}
            autoFocus
            disabled={nameConfirmed}
            className={`flex-1 px-3.5 py-2.5 rounded-xl border text-sm outline-none transition ${
              nameConfirmed
                ? 'border-green-500/40 bg-green-50/50 dark:bg-green-900/10 text-zinc-900 dark:text-zinc-100'
                : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#222228]'
            } focus:border-green-500 focus:ring-2 focus:ring-green-500/20 disabled:cursor-default`}
          />
          {!nameConfirmed ? (
            <button
              type="submit"
              disabled={checkingName || !nameInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              {checkingName ? '...' : 'OK'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleChangeName}
              className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer shrink-0"
            >
              {t.changeName}
            </button>
          )}
        </form>

        {/* Name exists confirmation — inline */}
        {showConfirmDialog && (
          <div className="mt-3 p-4 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 animate-fade-in-up">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
              <strong>{nameInput.trim()}</strong> {t.alreadyExists}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={handleOverwrite} className="flex-1 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors cursor-pointer text-center">
                {t.overwrite}
              </button>
              <button onClick={handleCreateNew} className="flex-1 px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium transition-colors cursor-pointer text-center">
                {t.createNew}
              </button>
            </div>
            <button onClick={() => setShowConfirmDialog(false)} className="mt-2 text-sm text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">{t.back}</button>
          </div>
        )}
      </div>

      {/* Calendar — always visible, but disabled until name is confirmed */}
      <div className={!nameConfirmed ? 'opacity-50 pointer-events-none select-none' : ''}>
        {nameConfirmed && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t.respondingAs} <strong className="text-zinc-900 dark:text-zinc-100">{confirmedName}</strong>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMarkAll}
                className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
              >
                {allMarked ? t.clearAll : t.markAllBusy}
              </button>
            </div>
          </div>
        )}

        <Calendar
          dateFrom={dateFrom}
          dateTo={dateTo}
          availability={availability}
          onToggle={nameConfirmed ? toggleDay : undefined}
          onSetIdeal={nameConfirmed ? setIdeal : undefined}
          responses={event.responses}
          currentUser={confirmedName}
        />

        {nameConfirmed && (
          <div className="mt-5 pt-5 border-t border-zinc-200 dark:border-zinc-800/60">
            <label className="block">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t.comment}
              </span>
              <textarea
                value={comment}
                onChange={(e) => { setComment(e.target.value); setSaved(false) }}
                placeholder="..."
                rows={2}
                className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-800/60 bg-white dark:bg-[#222228] text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition resize-none"
              />
            </label>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </div>

      {/* Save button — sticks to bottom of main content */}
      {nameConfirmed && (
        <div className="sticky bottom-0 z-20 flex justify-center pt-3 pb-2 -mx-4 px-4 bg-gradient-to-t from-zinc-50 via-zinc-50 to-transparent dark:from-[#1a1a1f] dark:via-[#1a1a1f]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-green-500/25"
          >
            {saving ? t.saving : t.saveAvailability}
          </button>
        </div>
      )}
    </div>
  )
}
