import { useRef, useState, useEffect } from 'react'
import { api } from '../api'

const SUGGESTIONS = [
  'Where is my seat? My email is amit@ethara.ai',
  'Which project is employee Amit assigned to?',
  'Show all available seats on Floor 3',
  'Who is sitting near amit@ethara.ai?',
  'How many seats are occupied for Project Indigo?',
]

export default function Assistant() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Hi! I'm the Ethara seating assistant. Ask me where someone sits, their project, available seats, neighbours, or project utilisation.",
    },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    const q = (text ?? input).trim()
    if (!q || busy) return
    setMessages((m) => [...m, { role: 'user', text: q }])
    setInput('')
    setBusy(true)
    try {
      const res = await api.aiQuery(q)
      setMessages((m) => [...m, { role: 'bot', text: res.answer, intent: res.intent }])
    } catch (e) {
      setMessages((m) => [...m, { role: 'bot', text: `Error: ${e.message}`, error: true }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold">AI Assistant</h1>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => send(s)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-brand-300 hover:text-brand-700">
            {s}
          </button>
        ))}
      </div>

      <div className="card flex h-[60vh] flex-col p-0">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-brand-500 text-white'
                    : m.error
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {m.text}
                {m.intent && <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">intent: {m.intent}</div>}
              </div>
            </div>
          ))}
          {busy && <div className="text-sm text-slate-400">Thinking…</div>}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
          className="flex gap-2 border-t border-slate-100 p-3"
        >
          <input
            className="input"
            placeholder="Ask about seats, projects, neighbours…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="btn-primary" disabled={busy || !input.trim()}>
            Send
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-slate-400">
        Answers are grounded in the live database. Set <code>OPENAI_API_KEY</code> on the backend to enable LLM-polished phrasing.
      </p>
    </div>
  )
}
