import { useMemo } from 'react'
import AlertsBanner from '../components/AlertsBanner'
import AssistantChat from '../components/assistant/AssistantChat'
import HealthScoreCard from '../components/assistant/HealthScoreCard'
import MainIssueCard from '../components/assistant/MainIssueCard'
import SimulationPreview from '../components/assistant/SimulationPreview'
import SuggestionCard from '../components/assistant/SuggestionCard'
import FinanceCharts from '../components/FinanceCharts'
import RiskCard from '../components/RiskCard'
import SimulationForm from '../components/SimulationForm'
import TransactionsTable from '../components/TransactionsTable'
import { useAppState } from '../context/useAppState'

const scrollTop = 'scroll-mt-36 lg:scroll-mt-44'

const SectionHeading = ({ kicker, title, description }) => (
  <header className="mb-5 border-b border-slate-200 pb-4">
    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{kicker}</p>
    <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0f172a]">{title}</h2>
    {description ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{description}</p> : null}
  </header>
)

const OverviewPage = () => {
  const {
    activeUserId,
    assistantSummary,
    filteredTransactions,
    loading,
    trendSeries,
    timeRangeDays,
    insights,
    alerts,
    dashboardError,
    prediction,
    simulatedRisk,
    simulationPending,
    userIdInput,
    onSimulationResult,
    setSimulationPending,
  } = useAppState()

  const hasUser = Boolean(activeUserId)

  const secondaryInsight = useMemo(() => {
    if (!Array.isArray(insights) || insights.length < 2) return ''
    const x = insights[1]
    return typeof x === 'string' ? x : String(x?.body ?? '')
  }, [insights])

  const primaryInsight = useMemo(() => {
    if (!Array.isArray(insights) || !insights.length) return ''
    const x = insights[0]
    return typeof x === 'string' ? x : String(x?.body ?? '')
  }, [insights])

  const futureMessage = useMemo(() => {
    if (!assistantSummary) return ''
    const fp = assistantSummary.futurePrediction
    const sp = assistantSummary.simulationPreview
    if (fp) return fp
    const base = sp?.message ?? ''
    if (secondaryInsight && !base.includes(secondaryInsight.slice(0, 20))) {
      return [base, secondaryInsight].filter(Boolean).join(' ')
    }
    return base || primaryInsight
  }, [assistantSummary, primaryInsight, secondaryInsight])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-14 pb-28 sm:space-y-16">
      {!hasUser ? (
        <div className="fa-surface mx-auto max-w-2xl px-8 py-14 text-center sm:py-16">
          <p className="text-xl font-bold text-[#0f172a]">Financial assistant</p>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Enter a user ID above and tap <span className="font-semibold text-emerald-700">Load workspace</span> for
            your full snapshot — health score, guidance, charts, and ledger in one scrollable view.
          </p>
        </div>
      ) : null}

      {dashboardError && hasUser ? (
        <div
          className="fa-surface border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950"
          role="alert"
        >
          <p className="font-semibold">Could not refresh</p>
          <p className="mt-1 text-amber-900/90">{dashboardError}</p>
        </div>
      ) : null}

      {!hasUser ? null : loading && !assistantSummary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="fa-surface h-44 animate-pulse bg-slate-100/90 sm:col-span-2" />
          <div className="fa-surface h-44 animate-pulse bg-slate-100/90" />
          <div className="fa-surface h-32 animate-pulse bg-slate-100/90 sm:col-span-2 lg:col-span-3" />
        </div>
      ) : assistantSummary ? (
        <>
          <section id="assistant" className={`${scrollTop} space-y-6`}>
            <SectionHeading
              kicker="Snapshot"
              title="Assistant readout"
              description="Health score, what matters most, a concrete next step, and outlook — tuned to your selected range."
            />
            <div className="grid gap-6 xl:grid-cols-12 xl:items-start xl:gap-8">
              <div className="space-y-5 xl:col-span-7">
                <HealthScoreCard
                  score={assistantSummary.healthScore}
                  max={100}
                  status={assistantSummary.healthStatus}
                />
                <MainIssueCard
                  title={assistantSummary.mainIssue.title}
                  detail={assistantSummary.mainIssue.detail}
                  severity={assistantSummary.mainIssue.severity}
                />
                <SuggestionCard text={assistantSummary.suggestedAction} />
                <SimulationPreview
                  kicker="Future prediction"
                  projectedScore={assistantSummary.simulationPreview?.projectedHealthScore}
                  message={futureMessage}
                />
                {primaryInsight && !assistantSummary.futurePrediction ? (
                  <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm">
                    {primaryInsight}
                  </p>
                ) : null}
              </div>
              <div className="min-w-0 xl:col-span-5">
                <AssistantChat userId={activeUserId} disabled={loading} />
              </div>
            </div>
          </section>

          <section id="alerts" className={`${scrollTop} space-y-4`}>
            <SectionHeading
              kicker="Signals"
              title="Alerts"
              description="Anything that needs attention for this window."
            />
            {alerts?.length ? (
              <AlertsBanner alerts={alerts} theme="light" />
            ) : (
              <p className="rounded-xl border border-slate-200 bg-white px-5 py-6 text-sm text-slate-600 shadow-sm">
                No alerts for this period.
              </p>
            )}
          </section>

          <section id="charts" className={`${scrollTop} space-y-4`}>
            <SectionHeading
              kicker="Analytics"
              title="Income, mix, and flow"
              description={`Figures for the last ${timeRangeDays} days (₹).`}
            />
            <FinanceCharts
              transactions={filteredTransactions}
              loading={loading}
              trendSeries={trendSeries}
              timeRangeLabel={`Last ${timeRangeDays} days`}
              theme="light"
            />
          </section>

          <section id="ledger" className={`${scrollTop} space-y-4`}>
            <SectionHeading
              kicker="Ledger"
              title="Transactions"
              description="Every row in scope for the loaded user — newest first."
            />
            <TransactionsTable
              transactions={filteredTransactions}
              loading={loading}
              theme="light"
              expanded
            />
          </section>

          <section id="lab" className={`${scrollTop} space-y-6`}>
            <SectionHeading
              kicker="Scenario lab"
              title="What-if simulator"
              description="Adjust spending or income and compare to your current risk readout."
            />
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
              <div className="min-w-0">
                <RiskCard
                  prediction={prediction}
                  loading={loading}
                  simulatedRisk={simulatedRisk}
                  simulationPending={simulationPending}
                  theme="light"
                />
              </div>
              <div className="min-w-0 lg:sticky lg:top-44">
                <SimulationForm
                  userId={activeUserId || userIdInput}
                  baselinePrediction={prediction}
                  simulatedRisk={simulatedRisk}
                  onResult={onSimulationResult}
                  onPendingChange={setSimulationPending}
                  theme="light"
                />
              </div>
            </div>
          </section>
        </>
      ) : (
        <div className="fa-surface mx-auto max-w-lg px-6 py-12 text-center">
          <p className="text-lg font-semibold text-[#0f172a]">Summary unavailable</p>
          <p className="mt-2 text-sm text-slate-600">
            Try another user ID or confirm <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">GET /summary</code>{' '}
            is running.
          </p>
        </div>
      )}
    </div>
  )
}

export default OverviewPage
