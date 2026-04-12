const SimulationPreview = ({ projectedScore, message, minimal = false, kicker = 'Simulation preview' }) => {
  if (projectedScore == null && !message) return null

  return (
    <section
      className={`assist-card relative overflow-hidden border-slate-200 bg-slate-50/80 p-6 sm:p-7 ${minimal ? 'shadow-sm' : 'shadow-md ring-1 ring-indigo-100'}`}
    >
      {!minimal ? (
        <>
          <div
            className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-violet-400/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-28 w-28 rounded-full bg-indigo-400/15 blur-2xl"
            aria-hidden
          />
        </>
      ) : null}

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          {!minimal ? (
            <span className="assist-step-pill bg-violet-500/10 text-violet-900 ring-violet-300/40">4</span>
          ) : null}
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">{kicker}</p>
        </div>

        {projectedScore != null ? (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            {!minimal ? <p className="text-sm font-semibold text-slate-700">If you follow this</p> : null}
            {!minimal ? (
              <span className="hidden text-slate-300 sm:inline" aria-hidden>
                →
              </span>
            ) : null}
            <div className="flex items-baseline gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Outlook</span>
              <span className="text-2xl font-extrabold tabular-nums text-[#0f172a] sm:text-3xl">
                {Math.round(projectedScore)}
              </span>
            </div>
          </div>
        ) : null}

        {message ? (
          <p className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-[#0f172a]">
            {message}
          </p>
        ) : null}
      </div>
    </section>
  )
}

export default SimulationPreview
