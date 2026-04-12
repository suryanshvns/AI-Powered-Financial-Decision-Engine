const SuggestionCard = ({ text, minimal = false }) => {
  if (!text) return null

  return (
    <section
      className={`assist-card relative overflow-hidden border-amber-200/70 bg-amber-50/50 p-6 sm:p-7 ${minimal ? 'shadow-sm' : 'shadow-md ring-1 ring-amber-100/80'}`}
    >
      <div
        className="pointer-events-none absolute -left-8 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full bg-amber-200/25 blur-3xl"
        aria-hidden
      />
      <div className="relative flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-amber-400 to-orange-400 text-white shadow-lg shadow-amber-500/30 ring-2 ring-amber-200/50">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18v-5.25m0 0a6.01 6.01 0 001-1.5m-1 1.5a6.01 6.01 0 01-1-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {!minimal ? <span className="assist-step-pill">3</span> : null}
            <p className="text-xs font-bold uppercase tracking-wider text-amber-900/80">Suggested action</p>
          </div>
          <p className="mt-2 text-[15px] font-medium leading-relaxed text-[#0f172a]">
            {!minimal ? (
              <>
                <span className="text-2xl font-light leading-none text-amber-400/90">&ldquo;</span>
                {text}
                <span className="text-2xl font-light leading-none text-amber-400/90">&rdquo;</span>
              </>
            ) : (
              text
            )}
          </p>
        </div>
      </div>
    </section>
  )
}

export default SuggestionCard
