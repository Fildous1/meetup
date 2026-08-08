import { createPortal } from 'react-dom'
import { useLang } from '../context/LangContext'

export default function SuccessAnimation({ onShowResults, onDismiss }) {
  const { t } = useLang()

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in-up">
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-green-500/15 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-green-500 animate-success-check"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" className="success-check-path" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-white">{t.saved}</p>
        <button
          onClick={onShowResults}
          className="mt-2 px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium text-sm transition-colors cursor-pointer"
        >
          {t.showResults}
        </button>
        <button
          onClick={onDismiss}
          className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors cursor-pointer"
        >
          {t.back}
        </button>
      </div>
    </div>,
    document.body
  )
}
