const severityStyles = (sev, theme) => {
  if (theme === 'light') {
    switch (sev) {
      case 'high':
      case 'critical':
        return 'border-rose-200 bg-linear-to-br from-rose-50 to-orange-50/80 text-rose-950 ring-rose-100'
      case 'low':
        return 'border-emerald-200 bg-linear-to-br from-emerald-50 to-teal-50/60 text-emerald-950 ring-emerald-100'
      default:
        return 'border-amber-200 bg-linear-to-br from-amber-50 to-yellow-50/50 text-amber-950 ring-amber-100'
    }
  }
  switch (sev) {
    case 'high':
    case 'critical':
      return 'border-rose-500/35 bg-rose-500/[0.12] text-rose-100 ring-rose-400/20'
    case 'low':
      return 'border-teal-500/30 bg-teal-500/[0.08] text-teal-100 ring-teal-400/15'
    default:
      return 'border-amber-500/35 bg-amber-500/[0.1] text-amber-100 ring-amber-400/20'
  }
}

const typeLabel = type => {
  const t = String(type || '').toLowerCase()
  if (t.includes('overspend') || t.includes('budget')) return 'Overspending'
  if (t.includes('anomal') || t.includes('unusual')) return 'Anomaly'
  return 'Alert'
}

const AlertsBanner = ({ alerts, className = '', theme = 'dark' }) => {
  if (!alerts?.length) return null
  const light = theme === 'light'

  return (
    <div
      className={`space-y-3 ${className}`}
      role="region"
      aria-label="Financial alerts"
    >
      {alerts.map(a => (
        <div
          key={a.id}
          className={`flex flex-wrap items-start gap-3 rounded-2xl border px-4 py-3.5 ring-1 ${severityStyles(a.severity, theme)}`}
        >
          <span
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-lg ${
              light ? 'bg-white/80 text-slate-700 shadow-sm ring-1 ring-slate-200/80' : 'bg-black/25'
            }`}
          >
            {a.severity === 'high' || a.severity === 'critical' ? '⚠' : '◆'}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={`text-[10px] font-bold uppercase tracking-wider ${
                light ? 'text-slate-500' : 'text-white/70'
              }`}
            >
              {typeLabel(a.type)}
            </p>
            <p className={`mt-1 text-sm leading-snug ${light ? 'text-slate-800' : 'text-slate-100'}`}>
              {a.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AlertsBanner
