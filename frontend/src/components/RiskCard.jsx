const normalizeLevel = level => {
  if (level == null || level === '') return null
  const s = String(level).toUpperCase()
  if (s.includes('CRITICAL')) return 'CRITICAL'
  if (s.includes('HIGH')) return 'HIGH'
  if (s.includes('MEDIUM') || s.includes('MODERATE')) return 'MEDIUM'
  if (s.includes('LOW')) return 'LOW'
  return s
}

const levelBadgeClass = (level, light) => {
  const base = light ? 'ring-1' : 'shadow-md ring-1'
  switch (level) {
    case 'CRITICAL':
      return `bg-rose-600 text-white ${base} ring-rose-400/40`
    case 'HIGH':
      return `bg-rose-500 text-white ${base} ring-rose-400/35`
    case 'MEDIUM':
      return `bg-amber-500 text-slate-950 ${base} ring-amber-400/40`
    case 'LOW':
      return light
        ? `bg-emerald-600 text-white ${base} ring-emerald-500/30`
        : `bg-linear-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-500/25 ring-teal-400/30`
    default:
      return light
        ? `border border-slate-200 bg-slate-100 text-slate-800 ${base} ring-slate-100`
        : 'border border-white/15 bg-slate-800 text-slate-200 ring-white/10'
  }
}

const pickAnomalyFlag = active => {
  if (!active || typeof active !== 'object') return false
  if (active.anomaly === true || active.anomaly_detected === true) return true
  if (active.flags?.anomaly === true) return true
  if (String(active.anomaly_flag ?? '').toLowerCase() === 'true') return true
  return false
}

const scoreOf = p => {
  if (!p) return null
  const v = p.score ?? p.riskScore ?? p.risk_score
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const CardHeader = ({ title, subtitle, right, light }) => (
  <div className={light ? 'assist-header px-6 py-5 sm:px-8' : 'card-head'}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className={`text-lg font-bold tracking-tight ${light ? 'text-slate-900' : 'text-slate-100'}`}>
          {title}
        </h2>
        <p className={`mt-1 text-sm ${light ? 'text-slate-600' : 'text-slate-400'}`}>{subtitle}</p>
      </div>
      {right ? <div className="flex shrink-0 flex-wrap items-center gap-2">{right}</div> : null}
    </div>
  </div>
)

const Skeleton = ({ light }) => (
  <div
    className={`space-y-4 px-6 py-6 sm:px-8 ${light ? 'bg-slate-50/80' : 'card-inset'}`}
    aria-hidden
  >
    <div className={`h-8 w-24 animate-pulse rounded-lg ${light ? 'bg-slate-200' : 'bg-teal-500/20'}`} />
    <div className={`h-14 w-full animate-pulse rounded-xl ${light ? 'bg-slate-100' : 'bg-white/[0.06]'}`} />
    <div className={`h-20 animate-pulse rounded-xl ${light ? 'bg-slate-100' : 'bg-white/[0.04]'}`} />
  </div>
)

const RiskCard = ({
  prediction,
  loading,
  simulatedRisk,
  simulationPending,
  theme = 'light',
}) => {
  const light = theme === 'light'
  const shell = light ? 'assist-card flex min-w-0 flex-col overflow-hidden' : 'card-elevated flex min-w-0 flex-col overflow-hidden'

  const active = simulatedRisk ?? prediction
  const level = normalizeLevel(active?.riskLevel ?? active?.risk_level)
  const isSimulated = Boolean(simulatedRisk)
  const anomaly = pickAnomalyFlag(active)

  if (loading && !active) {
    return (
      <section className={shell}>
        <CardHeader light={light} title="Risk insight" subtitle="Estimating risk from this user’s finances" />
        <Skeleton light={light} />
      </section>
    )
  }

  if (!active) {
    return (
      <section className={shell}>
        <CardHeader light={light} title="Risk insight" subtitle="Estimating risk from this user’s finances" />
        <div className={light ? 'bg-slate-50/80 px-6 py-10 sm:px-8' : 'card-inset px-6 py-10 sm:px-8'}>
          <div
            className={
              light
                ? 'rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center'
                : 'rounded-2xl border border-dashed border-teal-500/30 bg-teal-500/[0.06] px-5 py-10 text-center ring-1 ring-white/[0.05]'
            }
          >
            <p className={`text-sm font-medium ${light ? 'text-slate-800' : 'text-slate-300'}`}>Waiting for data</p>
            <p className={`mx-auto mt-2 max-w-[220px] text-xs leading-relaxed ${light ? 'text-slate-600' : 'text-slate-500'}`}>
              Load a user to see risk level, score, and explanations.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const reasons = Array.isArray(active.reasons)
    ? active.reasons
    : active.reason
      ? [active.reason]
      : []
  const sc = scoreOf(active)
  const scoreDisplay = sc != null ? sc.toFixed(2) : '—'

  const ringTint =
    level === 'CRITICAL' || level === 'HIGH'
      ? light
        ? 'ring-rose-200'
        : 'ring-rose-500/25'
      : level === 'MEDIUM'
        ? light
          ? 'ring-amber-200'
          : 'ring-amber-500/20'
        : light
          ? 'ring-emerald-200'
          : 'ring-teal-500/20'

  const badges = (
    <>
      <span
        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${levelBadgeClass(level, light)}`}
      >
        {level ?? '—'}
      </span>
      {anomaly ? (
        <span
          className={
            light
              ? 'rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800'
              : 'rounded-full border border-violet-400/35 bg-violet-500/20 px-2.5 py-1 text-xs font-semibold text-violet-100'
          }
        >
          Anomaly flagged
        </span>
      ) : null}
      {isSimulated ? (
        <span
          className={
            light
              ? 'rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800'
              : 'rounded-full border border-teal-400/30 bg-teal-500/15 px-2.5 py-1 text-xs font-semibold text-teal-100'
          }
        >
          After simulation
        </span>
      ) : null}
      {simulationPending ? (
        <span className={`text-xs font-medium ${light ? 'text-slate-500' : 'text-slate-500'}`}>Refreshing…</span>
      ) : null}
    </>
  )

  const scoreTextClass = light
    ? 'font-mono text-4xl font-bold tracking-tight text-slate-900'
    : 'mt-1 bg-linear-to-r from-teal-200 via-cyan-200 to-slate-100 bg-clip-text font-mono text-4xl font-bold tracking-tight text-transparent'

  return (
    <section className={shell}>
      <CardHeader light={light} title="Risk insight" subtitle="Based on the loaded user’s profile" right={badges} />

      <div
        className={`relative px-6 pb-6 pt-5 sm:px-8 ${light ? 'border-t border-slate-100 bg-white ring-1 ring-inset' : 'card-inset ring-1 ring-inset'} ${ringTint}`}
      >
        {!light ? (
          <div className="absolute right-6 top-4 h-24 w-24 rounded-full bg-teal-400/10 blur-2xl" aria-hidden />
        ) : (
          <div className="absolute right-6 top-4 h-24 w-24 rounded-full bg-emerald-100/80 blur-2xl" aria-hidden />
        )}
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Risk score</p>
          <p className={scoreTextClass}>{scoreDisplay}</p>
        </div>
      </div>

      <div
        className={
          light
            ? 'border-t border-slate-100 bg-slate-50/80 px-6 py-5 sm:px-8'
            : 'border-t border-white/[0.08] bg-linear-to-b from-slate-950/50 to-teal-950/20 px-6 py-5 sm:px-8'
        }
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Why the model said so</p>
        {reasons.length ? (
          <ul className="mt-3 space-y-2.5">
            {reasons.map((r, i) => (
              <li
                key={i}
                className={
                  light
                    ? 'flex gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-snug text-slate-800 shadow-sm'
                    : 'flex gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm leading-snug text-slate-200 ring-1 ring-white/[0.04]'
                }
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white ${
                    level === 'CRITICAL' || level === 'HIGH'
                      ? 'bg-rose-500'
                      : level === 'MEDIUM'
                        ? 'bg-amber-500 text-slate-900'
                        : 'bg-emerald-600'
                  }`}
                >
                  {i + 1}
                </span>
                <span>{String(r)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No explanations were provided for this score.</p>
        )}
      </div>
    </section>
  )
}

export default RiskCard
