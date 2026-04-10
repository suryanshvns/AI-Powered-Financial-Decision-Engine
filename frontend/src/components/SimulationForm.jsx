import { useState } from 'react'
import toast from 'react-hot-toast'
import { simulate } from '../services/api'
import { scopedLogger } from '../utils/logger'

const log = scopedLogger('simulation')

const scoreOf = p => {
  if (!p) return null
  const v = p.score ?? p.riskScore ?? p.risk_score
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const levelOf = p => {
  if (!p) return '—'
  const s = String(p.riskLevel ?? p.risk_level ?? '').toUpperCase()
  return s || '—'
}

const SimulationForm = ({
  userId,
  baselinePrediction,
  simulatedRisk,
  onResult,
  onPendingChange,
  theme = 'light',
}) => {
  const light = theme === 'light'
  const shell = light ? 'assist-card flex min-w-0 flex-col overflow-hidden' : 'card-elevated flex min-w-0 flex-col overflow-hidden'

  const [reduceExpense, setReduceExpense] = useState(10)
  const [increaseIncome, setIncreaseIncome] = useState(0)
  const [pending, setPending] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    const trimmed = userId?.trim()
    if (!trimmed) {
      toast.error('Load a user first to run a simulation.')
      return
    }
    const cut = Number(reduceExpense)
    const inc = Number(increaseIncome)
    if (Number.isNaN(cut) || cut < 0 || cut > 100) {
      toast.error('Expense reduction must be between 0 and 100%.')
      return
    }
    if (Number.isNaN(inc) || inc < 0 || inc > 100) {
      toast.error('Income increase must be between 0 and 100%.')
      return
    }

    setPending(true)
    onPendingChange?.(true)
    try {
      const { data } = await simulate({
        userId: trimmed,
        reduceExpensePercent: cut,
        increaseIncomePercent: inc,
      })
      const payload = data?.data ?? data
      onResult(payload)
      toast.success('Scenario applied — compare below')
    } catch (err) {
      const msg =
        err.response?.data?.message ??
        err.response?.data?.error ??
        err.message ??
        'Simulation did not complete. Try again.'
      if (!err.response) {
        log.warn('Simulation could not run (client validation or network)', err.message ?? err)
      }
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setPending(false)
      onPendingChange?.(false)
    }
  }

  const disabled = !userId?.trim() || pending
  const beforeScore = scoreOf(baselinePrediction)
  const afterScore = simulatedRisk != null ? scoreOf(simulatedRisk) : null
  const hasAfter = simulatedRisk != null

  const rangeTrack = light ? 'bg-slate-200' : 'bg-white/10'
  const labelStrong = light ? 'text-slate-800' : 'text-slate-300'
  const formBg = light ? 'border-t border-slate-100 bg-slate-50/80' : 'card-inset'

  return (
    <section className={shell}>
      <div className={light ? 'assist-header px-6 py-5 sm:px-8' : 'card-head'}>
        <h2 className={`text-lg font-bold tracking-tight ${light ? 'text-slate-900' : 'text-slate-100'}`}>
          What-if simulator
        </h2>
        <p className={`mt-1 text-sm ${light ? 'text-slate-600' : 'text-slate-400'}`}>
          Adjust spending and income — run a scenario and compare to your current risk readout.
        </p>
      </div>

      {baselinePrediction ? (
        <div
          className={
            light ? 'border-b border-slate-100 bg-white px-6 py-4 sm:px-8' : 'border-b border-white/[0.08] px-6 py-4 sm:px-8'
          }
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Before vs after</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div
              className={
                light
                  ? 'rounded-xl border border-slate-200 bg-slate-50 px-3 py-3'
                  : 'rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3 ring-1 ring-white/[0.04]'
              }
            >
              <p className="text-[10px] font-semibold uppercase text-slate-500">Before</p>
              <p className={`mt-1 font-mono text-xl font-bold ${light ? 'text-slate-900' : 'text-slate-200'}`}>
                {beforeScore != null ? beforeScore.toFixed(2) : '—'}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">{levelOf(baselinePrediction)}</p>
            </div>
            <div
              className={`rounded-xl border px-3 py-3 ring-1 ${
                hasAfter
                  ? light
                    ? 'border-emerald-200 bg-emerald-50 ring-emerald-100'
                    : 'border-teal-500/25 bg-teal-500/[0.08] ring-teal-400/20'
                  : light
                    ? 'border-dashed border-slate-200 bg-white ring-slate-100'
                    : 'border-dashed border-white/15 bg-white/[0.02] ring-white/[0.04]'
              }`}
            >
              <p
                className={`text-[10px] font-semibold uppercase ${hasAfter ? (light ? 'text-emerald-800' : 'text-teal-200/80') : 'text-slate-500'}`}
              >
                After
              </p>
              <p
                className={`mt-1 font-mono text-xl font-bold ${hasAfter ? (light ? 'text-emerald-900' : 'text-teal-100') : light ? 'text-slate-400' : 'text-slate-600'}`}
              >
                {afterScore != null ? afterScore.toFixed(2) : '—'}
              </p>
              <p
                className={`mt-0.5 text-[11px] ${hasAfter ? (light ? 'text-emerald-800' : 'text-teal-200/70') : light ? 'text-slate-500' : 'text-slate-600'}`}
              >
                {hasAfter ? levelOf(simulatedRisk) : 'Run scenario'}
              </p>
            </div>
          </div>
          {beforeScore != null && afterScore != null ? (
            <p className="mt-2 text-center text-xs text-slate-500">
              Delta{' '}
              <span className={`font-mono font-semibold ${light ? 'text-slate-800' : 'text-slate-300'}`}>
                {(afterScore - beforeScore).toFixed(2)}
              </span>
            </p>
          ) : null}
        </div>
      ) : null}

      <form className={`space-y-6 px-6 py-6 sm:px-8 ${formBg}`} onSubmit={handleSubmit}>
        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <label htmlFor="expense-reduce" className={`text-sm font-semibold ${labelStrong}`}>
              Reduce expenses
            </label>
            <span className="rounded-lg bg-emerald-600 px-2.5 py-1 font-mono text-sm font-bold text-white shadow-sm">
              {reduceExpense}%
            </span>
          </div>
          <input
            id="expense-reduce"
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={reduceExpense}
            onChange={e => setReduceExpense(Number(e.target.value))}
            disabled={pending}
            className={`h-2.5 w-full cursor-pointer appearance-none rounded-full ${rangeTrack} disabled:opacity-50 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-emerald-500`}
          />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <label htmlFor="income-up" className={`text-sm font-semibold ${labelStrong}`}>
              Increase income
            </label>
            <span className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 font-mono text-sm font-bold text-sky-800">
              {increaseIncome}%
            </span>
          </div>
          <input
            id="income-up"
            type="range"
            min={0}
            max={50}
            step={0.5}
            value={increaseIncome}
            onChange={e => setIncreaseIncome(Number(e.target.value))}
            disabled={pending}
            className={`h-2.5 w-full cursor-pointer appearance-none rounded-full ${rangeTrack} disabled:opacity-50 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-sky-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-sky-500`}
          />
          <p className="mt-2 text-xs text-slate-500">Server may ignore income if the API only supports expense cuts.</p>
        </div>

        <button
          type="submit"
          disabled={disabled}
          className="assist-btn-primary w-full rounded-2xl py-3.5 text-sm disabled:opacity-45"
        >
          {pending ? 'Running simulation…' : 'Run simulation'}
        </button>
      </form>
    </section>
  )
}

export default SimulationForm
