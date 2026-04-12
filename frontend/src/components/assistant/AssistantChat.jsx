import { useCallback, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { postAssistant } from '../../services/api'

const unwrapPayload = res => {
  const d = res?.data
  if (d && typeof d === 'object' && 'data' in d && d.data !== undefined) return d.data
  return d
}

const pickReply = data => {
  if (!data || typeof data !== 'object') return ''
  return String(
    data.reply ??
      data.message ??
      data.answer ??
      data.text ??
      data.response ??
      '',
  ).trim()
}

const AssistantChat = ({ userId, disabled = false }) => {
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [messages, setMessages] = useState(() => [
    {
      role: 'assistant',
      text: 'Ask anything about saving, spending, or your current snapshot — I’ll answer from your summary signals.',
    },
  ])
  const listRef = useRef(null)

  const send = useCallback(async () => {
    const q = input.trim()
    if (!q || pending || disabled) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text: q }])
    setPending(true)
    try {
      const res = await postAssistant({ query: q, userId })
      const data = unwrapPayload(res)
      const reply = pickReply(data)
      setMessages(m => [
        ...m,
        {
          role: 'assistant',
          text:
            reply ||
            'I could not generate a reply. If your API exposes POST /assistant, ensure it returns { reply } or { message }.',
        },
      ])
    } catch (e) {
      const status = e.response?.status
      const msg =
        e.response?.data?.message ??
        e.response?.data?.error ??
        (status === 404 ? 'Assistant endpoint is not available on this server yet.' : e.message)
      toast.error(typeof msg === 'string' ? msg : 'Request failed')
      setMessages(m => [
        ...m,
        {
          role: 'assistant',
          text:
            typeof msg === 'string'
              ? msg
              : 'Something went wrong. Try again when the assistant API is enabled.',
        },
      ])
    } finally {
      setPending(false)
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
      })
    }
  }, [input, pending, disabled, userId])

  const onKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <section className="fa-surface overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Assistant</p>
        <p className="mt-0.5 text-sm font-semibold text-[#0f172a]">Chat</p>
      </div>
      <div
        ref={listRef}
        className="min-h-[min(360px,45vh)] max-h-[min(520px,60vh)] space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5"
        aria-live="polite"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'border border-slate-200 bg-slate-50 text-[#0f172a]'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {pending ? (
          <p className="text-xs text-slate-500">Thinking…</p>
        ) : null}
      </div>
      <div className="border-t border-slate-200 p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={pending || disabled}
            rows={2}
            placeholder="e.g. How can I save more this month?"
            className="assist-input min-h-[44px] w-full resize-y sm:min-h-[52px]"
          />
          <button
            type="button"
            onClick={send}
            disabled={pending || disabled || !input.trim()}
            className="assist-btn-primary shrink-0 sm:shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </section>
  )
}

export default AssistantChat
