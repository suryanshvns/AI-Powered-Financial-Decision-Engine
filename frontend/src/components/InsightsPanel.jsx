const toneClass = (tone, theme) => {
  if (theme === 'light') {
    switch (tone) {
      case 'positive':
      case 'good':
        return 'border-emerald-200 bg-linear-to-br from-emerald-50/90 to-teal-50/50 ring-emerald-100'
      case 'negative':
      case 'warn':
      case 'warning':
        return 'border-rose-200 bg-linear-to-br from-rose-50/80 to-amber-50/40 ring-rose-100'
      default:
        return 'border-slate-200 bg-linear-to-br from-slate-50 to-slate-100/50 ring-slate-100'
    }
  }
  switch (tone) {
    case 'positive':
    case 'good':
      return 'border-teal-500/25 bg-linear-to-br from-teal-500/[0.12] to-cyan-500/[0.06] ring-teal-400/15'
    case 'negative':
    case 'warn':
    case 'warning':
      return 'border-rose-500/25 bg-linear-to-br from-rose-500/[0.1] to-amber-500/[0.05] ring-rose-400/15'
    default:
      return 'border-white/[0.08] bg-white/[0.04] ring-white/[0.05]'
  }
}

const InsightsPanel = ({ insights, className = '', theme = 'dark' }) => {
  if (!insights?.length) return null
  const light = theme === 'light'

  return (
    <section className={className}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2
            className={`text-[11px] font-bold uppercase tracking-[0.2em] ${
              light ? 'text-emerald-700' : 'text-teal-300/90'
            }`}
          >
            AI insights
          </h2>
          <p className={`mt-1 text-sm ${light ? 'text-slate-600' : 'text-slate-500'}`}>
            Patterns and guidance from your financial picture
          </p>
        </div>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {insights.map(item => (
          <li key={item.id} className={`rounded-2xl border p-5 ring-1 ${toneClass(item.tone, theme)}`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${light ? 'text-slate-500' : 'text-slate-400'}`}>
              {item.title}
            </p>
            <p className={`mt-2 text-sm leading-relaxed ${light ? 'text-slate-800' : 'text-slate-200'}`}>
              {item.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default InsightsPanel
