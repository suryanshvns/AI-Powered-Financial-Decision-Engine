import { formatInr } from '../utils/currency'

const formatDate = value => {
  if (value == null || value === '') return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en-IN')
}

const typeKey = t => String(t ?? '').toLowerCase()

const isIncome = (type, amount) => {
  const k = typeKey(type)
  if (k.includes('income') || k.includes('credit')) return true
  if (k.includes('expense') || k.includes('debit')) return false
  return Number(amount) >= 0
}

const initials = name => {
  const s = String(name ?? '?').trim()
  if (!s) return '?'
  const parts = s.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return s.slice(0, 2).toUpperCase()
}

const TableSkeleton = ({ light }) => {
  const row = light
    ? 'border-slate-200 bg-white'
    : 'border-white/[0.06] bg-white/[0.03] ring-white/[0.04]';
  const bar = light ? 'bg-slate-200' : 'bg-white/10';
  return (
    <div className="space-y-3 p-2" aria-busy aria-label="Loading transactions">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div
          key={i}
          className={`flex animate-pulse items-center gap-4 rounded-2xl border px-4 py-3 ring-1 ${row}`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className={`h-10 w-10 shrink-0 rounded-full ${light ? 'bg-emerald-100' : 'bg-teal-500/20'}`} />
          <div className="flex-1 space-y-2">
            <div className={`h-3 w-1/3 rounded ${bar}`} />
            <div className={`h-2 w-1/4 rounded ${light ? 'bg-slate-100' : 'bg-white/5'}`} />
          </div>
          <div className={`h-4 w-20 rounded ${light ? 'bg-slate-100' : 'bg-teal-500/15'}`} />
        </div>
      ))}
    </div>
  )
}

const TransactionsTable = ({
  transactions,
  loading,
  theme = 'light',
  embedded = false,
  /** Taller scroll area for main dashboard (no short cap). */
  expanded = false,
}) => {
  const light = theme === 'light';

  const shell = light ? 'assist-card flex min-h-0 min-w-0 flex-col overflow-hidden' : 'card-elevated flex min-h-0 min-w-0 flex-col overflow-hidden';
  const head = light
    ? 'assist-header px-6 py-5 sm:px-8'
    : 'card-head';
  const headTitle = light ? 'text-lg font-bold tracking-tight text-slate-900' : 'text-lg font-bold tracking-tight text-slate-100';
  const headSub = light ? 'mt-1 text-sm text-slate-600' : 'mt-1 text-sm text-slate-400';
  const badge = light
    ? 'border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-emerald-100'
    : 'border-teal-400/25 bg-teal-500/15 text-teal-200 ring-teal-400/15';
  const inset = light ? 'bg-slate-50/50' : 'card-inset';
  const thead = light
    ? 'sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 text-[11px] font-bold uppercase tracking-wider text-slate-500 backdrop-blur-sm'
    : 'card-table-head sticky top-0 z-10 text-[11px] font-bold uppercase tracking-wider text-slate-400 backdrop-blur-sm';
  const rowHover = light ? 'hover:bg-slate-50' : 'hover:bg-white/[0.04]';
  const divide = light ? 'divide-slate-100' : 'divide-white/[0.06]';
  const avatar = light
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 ring-emerald-100 group-hover:bg-emerald-100'
    : 'border-teal-500/25 bg-teal-500/15 text-teal-200 ring-teal-400/10 group-hover:bg-teal-500/25';
  const titleC = light ? 'text-slate-900' : 'text-slate-100';
  const muted = light ? 'text-slate-500' : 'text-slate-500';
  const dateC = light ? 'text-slate-600' : 'text-slate-400';
  const catC = light ? 'text-slate-700' : 'text-slate-300';
  const typeBadge = light
    ? 'border-slate-200 bg-white text-slate-700 ring-slate-100'
    : 'border-teal-500/25 bg-teal-500/10 text-teal-100 ring-teal-400/10';
  const amtInc = light ? 'text-emerald-700' : 'text-teal-300';
  const amtExp = light ? 'text-sky-700' : 'text-sky-300';

  const tableBlock = (
    <>
      {loading ? (
        <div className={`min-h-[200px] px-4 py-4 sm:px-6 ${inset}`}>
          <TableSkeleton light={light} />
        </div>
      ) : !transactions?.length ? (
        <div
          className={`flex min-h-[200px] flex-col items-center justify-center px-6 py-12 text-center sm:py-16 ${inset}`}
        >
          <div
            className={
              light
                ? 'mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400'
                : 'mb-4 flex h-16 w-16 flex-col items-center justify-center gap-1.5 rounded-2xl border border-teal-500/25 bg-teal-500/10 ring-1 ring-teal-400/15'
            }
          >
            {light ? (
              <span className="text-2xl" aria-hidden>
                —
              </span>
            ) : (
              <>
                <span className="h-1 w-8 rounded-full bg-teal-400/50" />
                <span className="h-1 w-6 rounded-full bg-teal-400/30" />
                <span className="h-1 w-8 rounded-full bg-cyan-400/30" />
              </>
            )}
          </div>
          <p className={`text-base font-semibold ${light ? 'text-slate-800' : 'text-slate-200'}`}>
            No transactions yet
          </p>
          <p className={`mt-2 max-w-sm text-sm leading-relaxed ${muted}`}>
            Enter a user ID in the header and tap Load data to see entries here.
          </p>
        </div>
      ) : (
        <div
          className={
            expanded
              ? `min-h-[52vh] max-h-[min(88dvh,1400px)] overflow-auto overscroll-contain ${inset}`
              : `max-h-[min(620px,calc(100dvh-12rem))] min-h-[min(380px,48vh)] overflow-auto overscroll-contain ${inset}`
          }
        >
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className={thead}>
                <th className="px-6 py-3.5 pl-8">Details</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-6 py-3.5 pr-8 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className={divide}>
              {transactions.map((row, i) => {
                const title = row.merchant || row.category || 'Transaction';
                const inc = isIncome(row.type, row.amount);
                return (
                  <tr key={row.id ?? `${row.date}-${i}`} className={`group transition-colors ${rowHover}`}>
                    <td className="px-6 py-3.5 pl-8">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ring-1 transition ${avatar}`}
                        >
                          {initials(title)}
                        </div>
                        <div className="min-w-0">
                          <p className={`truncate font-semibold ${titleC}`}>{title}</p>
                          {row.merchant && row.category ? (
                            <p className={`truncate text-xs ${muted}`}>{row.category}</p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3.5 ${dateC}`}>{formatDate(row.date)}</td>
                    <td className={`max-w-[140px] truncate px-4 py-3.5 ${catC}`} title={row.category ?? ''}>
                      {row.category ?? '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${typeBadge}`}
                      >
                        {row.type ?? '—'}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-3.5 pr-8 text-right font-mono text-sm font-semibold tabular-nums ${
                        inc ? amtInc : amtExp
                      }`}
                    >
                      {formatInr(row.amount, { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">{tableBlock}</div>
    );
  }

  return (
    <section className={shell}>
      <div className={head}>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className={headTitle}>Transactions</h2>
            <p className={headSub}>All movements for the loaded user, newest first</p>
          </div>
          {!loading && transactions?.length ? (
            <span className={`shrink-0 rounded-full border px-3 py-1.5 ring-1 ${badge}`}>
              {transactions.length} {transactions.length === 1 ? 'row' : 'rows'}
            </span>
          ) : null}
        </div>
      </div>
      {tableBlock}
    </section>
  )
}

export default TransactionsTable
