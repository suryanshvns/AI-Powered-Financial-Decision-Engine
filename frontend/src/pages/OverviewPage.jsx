import AlertsBanner from '../components/AlertsBanner'
import FinanceCharts from '../components/FinanceCharts'
import HealthScoreCard from '../components/assistant/HealthScoreCard'
import InsightsPanel from '../components/InsightsPanel'
import MainIssueCard from '../components/assistant/MainIssueCard'
import SimulationPreview from '../components/assistant/SimulationPreview'
import SuggestionCard from '../components/assistant/SuggestionCard'
import KpiStrip from '../components/KpiStrip'
import RiskCard from '../components/RiskCard'
import SimulationForm from '../components/SimulationForm'
import TransactionsTable from '../components/TransactionsTable'
import { useAppState } from '../context/useAppState'

const SectionHeader = ({ kicker, title, description }) => (
  <div className="mb-6 px-1">
    <p className="assist-eyebrow">{kicker}</p>
    <h2 className="assist-title mt-2 text-balance">{title}</h2>
    {description ? <p className="assist-lede mt-2 max-w-2xl">{description}</p> : null}
  </div>
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

  return (
    <div className="space-y-12 pb-28 sm:space-y-14">
      <div className="assist-hero-panel assist-mesh-accent relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10">
        <div
          className="pointer-events-none absolute -right-24 top-0 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 left-0 h-44 w-44 rounded-full bg-cyan-300/15 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <p className="assist-eyebrow">Single workspace</p>
          <h1 className="assist-title mt-3 max-w-3xl text-balance">Your financial picture, end to end</h1>
          <p className="assist-lede mt-4 max-w-2xl text-pretty">
            Health pulse, alerts, AI notes, interactive charts, scenario lab, and your full ledger — all here. Load a
            user ID in the header and scroll or use the section chips.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
            <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 shadow-sm ring-1 ring-slate-100">
              Range-aware KPIs
            </span>
            <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 shadow-sm ring-1 ring-slate-100">
              Live risk + simulation
            </span>
            <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 shadow-sm ring-1 ring-slate-100">
              Recharts analytics
            </span>
          </div>
        </div>
      </div>

      {dashboardError && hasUser ? (
        <div
          className="rounded-2xl border border-rose-200 bg-rose-50/90 px-5 py-4 text-sm text-rose-900 shadow-sm ring-1 ring-rose-100"
          role="alert"
        >
          <p className="font-bold">Could not refresh</p>
          <p className="mt-1 text-rose-800/90">{dashboardError}</p>
        </div>
      ) : null}

      {!hasUser ? (
        <div className="assist-section-shell relative overflow-hidden px-6 py-16 text-center sm:px-12 sm:py-20">
          <div
            className="pointer-events-none absolute -right-20 top-0 h-52 w-52 rounded-full bg-violet-200/25 blur-3xl"
            aria-hidden
          />
          <div className="relative mx-auto flex max-w-lg flex-col items-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-slate-100 via-white to-emerald-50 text-4xl shadow-lg ring-1 ring-slate-200/80">
              ◎
            </div>
            <p className="text-xl font-extrabold text-slate-900">No workspace loaded</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Enter a user ID above and choose <span className="font-bold text-emerald-700">Load workspace</span> to
              populate scores, charts, scenarios, and transactions on this page.
            </p>
          </div>
        </div>
      ) : loading && !assistantSummary ? (
        <div className="assist-section-shell space-y-6 p-8 sm:p-10">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 animate-pulse rounded-2xl bg-linear-to-br from-emerald-100 to-teal-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 animate-pulse rounded-md bg-slate-200" />
              <div className="h-3 w-64 animate-pulse rounded-md bg-slate-100" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100/90" />
            ))}
          </div>
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100/80" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100/80" />
        </div>
      ) : assistantSummary ? (
        <>
          <div className="scroll-mt-28 lg:scroll-mt-36">
            <KpiStrip transactions={filteredTransactions} theme="light" />
          </div>

          <section id="pulse" className="scroll-mt-28 space-y-6 lg:scroll-mt-36">
            <SectionHeader
              kicker="Assistant pulse"
              title="Guided readout"
              description="Score, priority issue, recommended move, and a forward-looking hint — tuned to your selected time window."
            />
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-6">
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
              </div>
              <div className="space-y-6">
                <SuggestionCard text={assistantSummary.suggestedAction} />
                <SimulationPreview
                  projectedScore={assistantSummary.simulationPreview?.projectedHealthScore}
                  message={assistantSummary.simulationPreview?.message}
                />
              </div>
            </div>
          </section>

          <section id="signals" className="scroll-mt-28 space-y-6 lg:scroll-mt-36">
            <SectionHeader
              kicker="Signals & guidance"
              title="Alerts and AI insights"
              description="Anything that needs attention first, plus pattern-level notes when the API returns them."
            />
            <div className="assist-section-shell space-y-10 p-6 sm:p-8 lg:p-10">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Alerts</h3>
                <div className="mt-4">
                  <AlertsBanner alerts={alerts} theme="light" />
                  {!alerts?.length ? (
                    <p className="text-sm text-slate-500">No active alerts for this window.</p>
                  ) : null}
                </div>
              </div>
              <div className="border-t border-slate-200/80 pt-10">
                <InsightsPanel insights={insights} theme="light" />
                {!insights?.length ? (
                  <p className="text-sm text-slate-500">
                    No extra insights yet — charts and ledger below still reflect your data.
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section id="charts" className="scroll-mt-28 space-y-6 lg:scroll-mt-36">
            <SectionHeader
              kicker="Analytics"
              title="Income, mix, and flow"
              description="Bar, pie, and trend views for the same range as your header control. Amounts in ₹."
            />
            <FinanceCharts
              transactions={filteredTransactions}
              loading={loading}
              trendSeries={trendSeries}
              timeRangeLabel={`Last ${timeRangeDays} days`}
              theme="light"
            />
          </section>

          <section id="lab" className="scroll-mt-28 space-y-6 lg:scroll-mt-36">
            <SectionHeader
              kicker="Scenario lab"
              title="Risk profile & what-if"
              description="Baseline assessment from the model, then adjust spending or income to preview an alternate outcome."
            />
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
              <div className="min-w-0">
                <RiskCard
                  prediction={prediction}
                  loading={loading}
                  simulatedRisk={simulatedRisk}
                  simulationPending={simulationPending}
                  theme="light"
                />
              </div>
              <div className="min-w-0 lg:sticky lg:top-[7.5rem]">
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

          <section id="ledger" className="scroll-mt-28 space-y-6 lg:scroll-mt-36">
            <SectionHeader
              kicker="Ledger"
              title="Transactions"
              description="Every row in scope for the loaded user and selected range — newest first."
            />
            <TransactionsTable
              transactions={filteredTransactions}
              loading={loading}
              theme="light"
            />
          </section>
        </>
      ) : (
        <div className="assist-section-shell px-6 py-14 text-center sm:px-10">
          <p className="text-lg font-bold text-slate-800">Summary unavailable</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Couldn’t build a brief for this user. Try another ID or confirm the summary API is running.
          </p>
        </div>
      )}
    </div>
  )
}

export default OverviewPage
