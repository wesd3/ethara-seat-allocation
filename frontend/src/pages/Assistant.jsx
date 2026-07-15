import { useRef, useState, useEffect } from 'react'
import { api } from '../api'
import { IconSparkles, IconSend } from '../components/icons.jsx'

const SUGGESTIONS = [
  'Where is my seat? My email is amit@ethara.ai',
  'Which project is employee Amit assigned to?',
  'Show all available seats on Floor 3',
  'Who is sitting near amit@ethara.ai?',
  'How many seats are occupied for Project Indigo?',
]

function BotAvatar() {
  return (
    <span className="grad-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm">
      <IconSparkles className="h-4 w-4" />
    </span>
  )
}

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
  }, [messages, busy])

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
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <span className="grad-accent glow-accent flex h-11 w-11 items-center justify-center rounded-2xl text-white">
          <IconSparkles className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">AI Assistant</h1>
          <p className="text-sm text-muted">Answers grounded in the live database.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => send(s)} className="chip">{s}</button>
        ))}
      </div>

      <div className="card flex h-[62vh] flex-col overflow-hidden p-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex items-end gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              {m.role === 'bot' && <BotAvatar />}
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  m.role === 'user'
                    ? 'grad-accent rounded-br-md text-white'
                    : m.error
                    ? 'rounded-bl-md bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20'
                    : 'rounded-bl-md bg-surface-2 text-ink'
                }`}
              >
                {m.text}
                {m.intent && (
                  <div className={`mt-1 text-[10px] font-semibold uppercase tracking-wider ${m.role === 'user' ? 'text-white/70' : 'text-faint'}`}>intent · {m.intent}</div>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex items-end gap-2.5">
              <BotAvatar />
              <div className="flex gap-1 rounded-2xl rounded-bl-md bg-surface-2 px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-faint [animation-delay:-0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-faint [animation-delay:-0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-faint" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send() }} className="flex gap-2 border-t border-line-soft bg-surface p-3">
          <input className="input" placeholder="Ask about seats, projects, neighbours…" value={input} onChange={(e) => setInput(e.target.value)} />
          <button className="btn-primary px-3.5" disabled={busy || !input.trim()} aria-label="Send">
            <IconSend className="h-5 w-5" />
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-faint">
        Set <code className="rounded bg-surface-2 px-1 py-0.5">OPENAI_API_KEY</code> on the backend to enable LLM-polished phrasing.
      </p>
    </div>
  )
}
