import { useEffect, useRef } from 'react'
import { useLang } from '../context/LangContext'

const STORAGE_KEY = 'meetup_onboarding_seen_v2'

// Expose debug command to reset onboarding
if (typeof window !== 'undefined') {
  window.resetOnboarding = () => {
    localStorage.removeItem(STORAGE_KEY)
    console.log('Onboarding reset. Reload the page to see it again.')
  }
}

export default function Onboarding() {
  const dialogRef = useRef(null)
  const { t } = useLang()

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY) && dialogRef.current) {
      dialogRef.current.showModal()
    }
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      className="rounded-2xl max-w-sm w-[calc(100%-2rem)] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 m-0"
    >
      <div className="p-6 bg-white dark:bg-[#222228] rounded-2xl">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          {t.howItWorks}
        </h2>

        {/* Tutorial animation at the top */}
        <div className="flex items-center justify-center py-4 px-4 rounded-xl bg-zinc-50 dark:bg-[#1a1a1f] mb-4">
          <TutorialAnimation t={t} />
        </div>

        <div className="space-y-3 mb-5">
          <Step
            label={t.onboardingStep1Title}
            desc={t.onboardingStep1Desc}
            example={
              <div className="flex items-center gap-1.5">
                <span className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-[#2a2a30] flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-xs font-bold">14</span>
                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 ring-1 ring-red-200 dark:ring-red-800 flex items-center justify-center text-red-600 dark:text-red-400 text-xs font-bold">14</span>
              </div>
            }
          />

          <Step
            label={t.onboardingStep2Title}
            desc={t.onboardingStep2Desc}
            example={
              <span className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 ring-1 ring-green-200 dark:ring-green-800 flex items-center justify-center text-green-600 dark:text-green-400 text-xs font-bold">14</span>
            }
          />
        </div>

        {/* Today highlight */}
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-zinc-50 dark:bg-[#1a1a1f]">
          <span className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-[#2a2a30] ring-2 ring-green-500 ring-offset-1 dark:ring-offset-[#1a1a1f] flex items-center justify-center text-zinc-700 dark:text-zinc-300 text-xs font-bold shrink-0">
            {new Date().getDate()}
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{t.today}</span>
        </div>

        {/* Edit tip */}
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-5 px-1">
          {t.onboardingEditTip}
        </p>

        <button
          onClick={dismiss}
          className="w-full py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium text-sm transition-colors cursor-pointer"
        >
          {t.gotIt}
        </button>
      </div>
    </dialog>
  )
}

function Step({ label, desc, example }) {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0">{example}</div>
      <div>
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

/**
 * Animated tutorial showing click interactions on a mini calendar row.
 * Cycles through: neutral -> click -> busy -> click -> neutral -> double-click -> ideal -> pause -> restart
 */
function TutorialAnimation({ t }) {
  const cellRef = useRef(null)
  const cursorRef = useRef(null)
  const labelRef = useRef(null)

  useEffect(() => {
    const cell = cellRef.current
    const cursor = cursorRef.current
    const label = labelRef.current
    if (!cell || !cursor || !label) return

    let frame
    let cancelled = false

    // States: neutral, busy, ideal
    const sequence = [
      // Start: neutral, cursor appears and moves to cell
      { state: 'neutral', cursor: 'hidden', label: '', duration: 600 },
      { state: 'neutral', cursor: 'hovering', label: '', duration: 400 },
      // Click: neutral -> busy
      { state: 'neutral', cursor: 'clicking', label: '', duration: 200 },
      { state: 'busy', cursor: 'hovering', label: t.busyLabel, duration: 1200 },
      // Click: busy -> neutral
      { state: 'busy', cursor: 'clicking', label: t.busyLabel, duration: 200 },
      { state: 'neutral', cursor: 'hovering', label: '', duration: 800 },
      // Double-click: neutral -> ideal
      { state: 'neutral', cursor: 'clicking', label: '', duration: 150 },
      { state: 'neutral', cursor: 'hovering', label: '', duration: 100 },
      { state: 'neutral', cursor: 'clicking', label: '', duration: 150 },
      { state: 'ideal', cursor: 'hovering', label: t.idealLabel, duration: 1500 },
      // Pause, then reset
      { state: 'ideal', cursor: 'hidden', label: t.idealLabel, duration: 400 },
      { state: 'neutral', cursor: 'hidden', label: '', duration: 800 },
    ]

    const stateStyles = {
      neutral: { bg: '', text: 'text-zinc-500 dark:text-zinc-400', ring: '' },
      busy: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-600 dark:text-red-400', ring: 'ring-1 ring-red-200 dark:ring-red-800' },
      ideal: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-600 dark:text-green-400', ring: 'ring-1 ring-green-200 dark:ring-green-800' },
    }

    let stepIndex = 0

    function applyStep() {
      if (cancelled) return
      const step = sequence[stepIndex]
      const style = stateStyles[step.state]

      // Cell styling
      cell.className = `w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-200 ${
        step.state === 'neutral'
          ? 'bg-zinc-200 dark:bg-[#2a2a30] text-zinc-500 dark:text-zinc-400'
          : `${style.bg} ${style.text} ${style.ring}`
      } ${step.cursor === 'clicking' ? 'scale-90' : ''}`

      // Cursor
      if (step.cursor === 'hidden') {
        cursor.style.opacity = '0'
        cursor.style.transform = 'translate(20px, 20px)'
      } else if (step.cursor === 'hovering') {
        cursor.style.opacity = '1'
        cursor.style.transform = 'translate(2px, 2px)'
      } else if (step.cursor === 'clicking') {
        cursor.style.opacity = '1'
        cursor.style.transform = 'translate(0px, 0px) scale(0.85)'
      }

      // Label
      label.textContent = step.label
      label.style.opacity = step.label ? '1' : '0'

      stepIndex = (stepIndex + 1) % sequence.length

      frame = setTimeout(applyStep, step.duration)
    }

    applyStep()

    return () => {
      cancelled = true
      clearTimeout(frame)
    }
  }, [t])

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <div
          ref={cellRef}
          className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-[#2a2a30] flex items-center justify-center text-sm font-bold text-zinc-500 dark:text-zinc-400 transition-all duration-200"
        >
          14
        </div>
        {/* Animated cursor */}
        <svg
          ref={cursorRef}
          className="absolute top-1/2 left-1/2 w-5 h-5 text-zinc-800 dark:text-zinc-200 pointer-events-none transition-all duration-300 ease-out"
          style={{ opacity: 0, transform: 'translate(20px, 20px)' }}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 4.702z" />
        </svg>
      </div>
      <span
        ref={labelRef}
        className="text-xs font-medium text-zinc-500 dark:text-zinc-400 h-4 transition-opacity duration-200"
        style={{ opacity: 0 }}
      />
    </div>
  )
}
