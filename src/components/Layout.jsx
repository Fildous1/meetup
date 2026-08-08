import ThemeToggle from './ThemeToggle'
import { useLang } from '../context/LangContext'
import { ACCENT_HEX } from '../lib/accent'

export default function Layout({ children }) {
  const { t, cycleLang } = useLang()

  return (
    <div dir="ltr" className="min-h-screen flex flex-col text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Subtle accent gradient background */}
      <div className="fixed inset-0 -z-10 bg-zinc-50 dark:bg-[#1a1a1f]">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            background: `radial-gradient(ellipse at 30% 20%, ${ACCENT_HEX} 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, ${ACCENT_HEX} 0%, transparent 50%)`,
          }}
        />
      </div>

      <header className="border-b border-zinc-200 dark:border-zinc-800/60 bg-white/80 dark:bg-[#1a1a1f]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="#/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <img src="/logo-black.png" alt="MeetUp" className="h-7 block dark:hidden" />
            <img src="/logo-white.png" alt="MeetUp" className="h-7 hidden dark:block" />
          </a>
          <div className="flex items-center gap-1">
            <button
              onClick={cycleLang}
              className="px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400 text-xs font-semibold"
              title="Change language"
            >
              {t.code}
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        {children}
      </main>
      <footer className="border-t border-zinc-200 dark:border-zinc-800/60 py-4 text-center text-xs text-zinc-400 dark:text-zinc-600">
        &copy; {new Date().getFullYear()} <a href="https://filiprosa.cz" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-500 dark:hover:text-zinc-500 transition-colors underline">Filip Rosa</a>
      </footer>
    </div>
  )
}
