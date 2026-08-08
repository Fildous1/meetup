import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createEvent } from '../lib/api'
import { useLang } from '../context/LangContext'
import { ACCENT_HEX } from '../lib/accent'

export default function HomePage() {
  const navigate = useNavigate()
  const { t } = useLang()
  const [form, setForm] = useState({
    name: '',
    description: '',
    creator_name: '',
    creator_email: '',
    date_from: '',
    date_to: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { code } = await createEvent(form)
      navigate(`/${code}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const titleParts = t.findPerfectTime.split(/<accent>|<\/accent>/)

  return (
    <div className="max-w-lg mx-auto animate-fade-in-up flex flex-col justify-center min-h-[calc(100vh-10rem)]">
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
          {titleParts[0]}<span className="text-green-500">{titleParts[1]}</span>{titleParts[2] || ''}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg">
          {t.createSubtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label={t.eventName} required accentHex={ACCENT_HEX}>
          <input
            type="text"
            value={form.name}
            onChange={update('name')}
            placeholder="Weekend BBQ"
            required
            maxLength={255}
            className="input"
          />
        </Field>

        <Field label={t.description} accentHex={ACCENT_HEX}>
          <textarea
            value={form.description}
            onChange={update('description')}
            placeholder="..."
            rows={3}
            className="input resize-none"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t.yourName} accentHex={ACCENT_HEX}>
            <input
              type="text"
              value={form.creator_name}
              onChange={update('creator_name')}
              placeholder="Alex"
              maxLength={100}
              className="input"
            />
          </Field>

          <Field label={t.email} accentHex={ACCENT_HEX}>
            <input
              type="email"
              value={form.creator_email}
              onChange={update('creator_email')}
              placeholder="alex@example.com"
              className="input"
            />
          </Field>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 -mt-3">{t.emailHint}</p>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t.dateFrom} required accentHex={ACCENT_HEX}>
            <input
              type="date"
              value={form.date_from}
              onChange={update('date_from')}
              required
              className="input"
            />
          </Field>

          <Field label={t.dateTo} required accentHex={ACCENT_HEX}>
            <input
              type="date"
              value={form.date_to}
              onChange={update('date_to')}
              required
              className="input"
            />
          </Field>
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-medium transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? t.creating : t.createEvent}
        </button>
      </form>
    </div>
  )
}

function Field({ label, required, accentHex, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      <style>{`
        .input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: 0.75rem;
          border: 1px solid #d4d4d8;
          background: white;
          font-size: 0.9375rem;
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
          outline: none;
          box-sizing: border-box;
          color: #18181b;
        }
        .input:focus {
          border-color: ${accentHex};
          box-shadow: 0 0 0 3px ${accentHex}33;
        }
        :is(.dark) .input {
          background: #222228;
          border-color: #333338;
          color: #f4f4f5;
        }
        :is(.dark) .input:focus {
          border-color: ${accentHex};
          box-shadow: 0 0 0 3px ${accentHex}26;
        }
        .input::placeholder {
          color: #a1a1aa;
        }
      `}</style>
    </label>
  )
}
