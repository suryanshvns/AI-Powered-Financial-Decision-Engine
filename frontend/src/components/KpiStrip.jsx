import { useMemo } from 'react'
import { formatInr } from '../utils/currency'
import { summarizeCashFlow } from '../utils/chartData'

const DARK = {
  teal: 'from-teal-500/20 to-cyan-500/10 text-teal-100 ring-teal-400/20',
  rose: 'from-sky-500/15 to-cyan-500/10 text-sky-100 ring-sky-400/20',
  slate: 'from-slate-500/15 to-slate-600/10 text-slate-200 ring-white/10',
  violet: 'from-indigo-500/20 to-violet-500/10 text-indigo-100 ring-indigo-400/20',
}

const LIGHT = {
  teal: 'border-emerald-100 bg-emerald-50 text-emerald-900 ring-emerald-100',
  rose: 'border-sky-100 bg-sky-50 text-sky-900 ring-sky-100',
  slate: 'border-slate-200 bg-slate-50 text-slate-800 ring-slate-100',
  violet: 'border-violet-100 bg-violet-50 text-violet-900 ring-violet-100',
}

const KpiPill = ({ label, value, tone, theme }) => {
  const tones = theme === 'light' ? LIGHT : DARK
  const valueClass = theme === 'light' ? 'text-slate-900' : 'text-slate-50'
  return (
    <div
      className={`rounded-2xl border bg-linear-to-br px-4 py-3 shadow-sm ring-1 ${tones[tone] ?? tones.slate}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 font-mono text-lg font-bold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  )
}

const KpiStrip = ({ transactions, className = '', theme = 'light' }) => {
  const summary = useMemo(() => summarizeCashFlow(transactions || []), [transactions])
  if (!transactions?.length) return null

  return (
    <div className={`grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 ${className}`}>
      <KpiPill
        theme={theme}
        label="Total income"
        value={formatInr(summary.income, { maximumFractionDigits: 0 })}
        tone="teal"
      />
      <KpiPill
        theme={theme}
        label="Total expenses"
        value={formatInr(summary.expense, { maximumFractionDigits: 0 })}
        tone="rose"
      />
      <KpiPill
        theme={theme}
        label="Net"
        value={formatInr(summary.net, { maximumFractionDigits: 0 })}
        tone={summary.net >= 0 ? 'teal' : 'rose'}
      />
      <KpiPill theme={theme} label="Transactions" value={String(summary.count)} tone="violet" />
    </div>
  )
}

export default KpiStrip
