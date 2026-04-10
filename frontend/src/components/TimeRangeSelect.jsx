const OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
]

const TimeRangeSelect = ({
  value,
  onChange,
  disabled = false,
  className = '',
  id = 'time-range',
  variant = 'dark',
}) => {
  const selectClass =
    variant === 'light'
      ? 'cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50'
      : 'cursor-pointer rounded-xl border border-white/10 bg-[#0a101c] px-3 py-2 text-sm font-semibold text-slate-100 outline-none ring-teal-500/0 transition focus:border-teal-400/45 focus:ring-4 focus:ring-teal-500/18 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        Range
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={e => onChange(Number(e.target.value))}
        className={selectClass}
      >
        {OPTIONS.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default TimeRangeSelect
