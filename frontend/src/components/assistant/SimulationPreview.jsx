const SimulationPreview = ({ projectedScore, message }) => {
  if (projectedScore == null && !message) return null

  return (
    <section className="assist-card relative overflow-hidden border-indigo-200/70 bg-linear-to-br from-indigo-50 via-violet-50/40 to-white p-6 shadow-md ring-1 ring-indigo-100 sm:p-7">
      <div
        className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-violet-400/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-28 w-28 rounded-full bg-indigo-400/15 blur-2xl"
        aria-hidden
      />

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <span className="assist-step-pill bg-violet-500/10 text-violet-900 ring-violet-300/40">4</span>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Simulation preview</p>
        </div>

        {projectedScore != null ? (
          <div className="mt-5 flex flex-wrap items-end gap-3">
            <p className="text-sm font-semibold text-indigo-900/80">If you follow this</p>
            <span className="hidden text-indigo-300 sm:inline" aria-hidden>
              →
            </span>
            <div className="flex items-baseline gap-1 rounded-xl bg-white/80 px-4 py-2 shadow-inner ring-1 ring-indigo-100">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">Score</span>
              <span className="bg-linear-to-br from-indigo-600 to-violet-600 bg-clip-text text-3xl font-extrabold tabular-nums text-transparent sm:text-4xl">
                {Math.round(projectedScore)}
              </span>
            </div>
          </div>
        ) : null}

        {message ? (
          <p className="mt-4 rounded-xl border border-indigo-100/80 bg-white/60 px-4 py-3 text-sm leading-relaxed text-indigo-950/85 shadow-sm backdrop-blur-sm">
            {message}
          </p>
        ) : null}
      </div>
    </section>
  )
}

export default SimulationPreview
