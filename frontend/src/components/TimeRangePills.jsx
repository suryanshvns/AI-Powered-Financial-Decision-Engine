const OPTIONS = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
]

const TimeRangePills = ({ value, onChange, disabled = false, className = '' }) => (
  <div className={`flex flex-wrap items-center gap-2 ${className}`}>
    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Range</span>
    <div
      className="inline-flex rounded-xl border border-slate-200 bg-slate-50/90 p-1 shadow-sm"
      role="group"
      aria-label="Time range"
    >
      {OPTIONS.map(o => {
        const active = Number(value) === o.value
        return (
          <button
            key={o.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={`rounded-lg px-3.5 py-2 text-sm font-bold transition ${
              active
                ? 'bg-white text-[#0f172a] shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
            } disabled:opacity-50`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  </div>
)

export default TimeRangePills
