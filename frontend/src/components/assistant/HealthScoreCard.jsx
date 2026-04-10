const ScoreRing = ({ pct }) => {
  const r = 44
  const c = 2 * Math.PI * r
  const offset = c - (c * Math.min(100, Math.max(0, pct))) / 100

  return (
    <div className="relative flex h-[132px] w-[132px] shrink-0 items-center justify-center">
      <svg className="-rotate-90 transform" width="132" height="132" viewBox="0 0 120 120" aria-hidden>
        <defs>
          <linearGradient id="healthRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#healthRingGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700 motion-safe:ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-2xl bg-linear-to-br from-emerald-500/15 to-cyan-500/10 p-2.5 ring-1 ring-emerald-500/15">
          <svg className="h-7 w-7 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

const HealthScoreCard = ({ score = 0, max = 100, status = 'Moderate' }) => {
  const clamped = Math.min(max, Math.max(0, Number(score) || 0))
  const pct = max > 0 ? (clamped / max) * 100 : 0

  return (
    <section className="assist-card assist-card-glow relative overflow-hidden p-8 sm:p-10">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="assist-step-pill">1</span>
            <p className="text-sm font-semibold text-slate-600">Financial health score</p>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <span className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">{clamped}</span>
            <span className="pb-1.5 text-lg font-semibold text-slate-400">/{max}</span>
          </div>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-linear-to-r from-emerald-50 to-teal-50 px-4 py-1.5 text-sm font-bold text-emerald-900 shadow-sm ring-1 ring-emerald-500/10">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {status}
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">
            Blends income, spending, and savings signals for this period — higher means more headroom.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 sm:items-end">
          <ScoreRing pct={pct} />
          <div className="hidden w-full max-w-[200px] sm:block">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/80">
              <div
                className="h-full rounded-full bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 motion-safe:transition-all motion-safe:duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-right text-xs font-medium text-slate-500">Higher is healthier</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HealthScoreCard
