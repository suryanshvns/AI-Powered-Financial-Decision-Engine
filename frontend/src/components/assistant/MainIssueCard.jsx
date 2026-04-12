const styles = {
  risk: {
    wrap: 'border-l-4 border-l-rose-500 bg-linear-to-br from-rose-50/95 via-white to-white ring-rose-200/60',
    icon: 'bg-rose-100 text-rose-600 ring-rose-200/80',
    title: 'text-rose-900',
  },
  warning: {
    wrap: 'border-l-4 border-l-amber-500 bg-linear-to-br from-amber-50/90 via-white to-white ring-amber-200/50',
    icon: 'bg-amber-100 text-amber-700 ring-amber-200/80',
    title: 'text-amber-950',
  },
  good: {
    wrap: 'border-l-4 border-l-emerald-500 bg-linear-to-br from-emerald-50/80 via-white to-white ring-emerald-200/50',
    icon: 'bg-emerald-100 text-emerald-700 ring-emerald-200/80',
    title: 'text-emerald-950',
  },
  info: {
    wrap: 'border-l-4 border-l-slate-300 bg-linear-to-br from-slate-50/90 via-white to-white ring-slate-200/80',
    icon: 'bg-slate-100 text-slate-600 ring-slate-200/80',
    title: 'text-slate-900',
  },
}

const SeverityIcon = ({ severity }) => {
  if (severity === 'risk') {
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    )
  }
  if (severity === 'good') {
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

const MainIssueCard = ({ title, detail, severity = 'warning', minimal = false }) => {
  const key = styles[severity] ? severity : 'info'
  const s = styles[key]

  return (
    <section
      className={`assist-card relative overflow-hidden p-6 shadow-sm sm:p-7 ${minimal ? 'ring-0' : 'shadow-md ring-1'} ${s.wrap}`}
    >
      <div
        className="pointer-events-none absolute right-0 top-0 h-32 w-32 translate-x-1/3 -translate-y-1/3 rounded-full bg-white/40 blur-2xl"
        aria-hidden
      />
      <div className="relative flex gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-inner ring-2 ring-inset ring-white/50 ${s.icon}`}
        >
          <SeverityIcon severity={key === 'info' ? 'warning' : key} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {!minimal ? <span className="assist-step-pill">2</span> : null}
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Main issue</p>
          </div>
          <h2 className={`mt-2 text-xl font-bold tracking-tight ${s.title}`}>{title}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-700">{detail}</p>
        </div>
      </div>
    </section>
  )
}

export default MainIssueCard
