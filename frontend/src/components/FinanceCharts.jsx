import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import KpiStrip from './KpiStrip';
import { getChartTheme } from './chartTheme';
import { formatInr } from '../utils/currency';
import {
  dailyFlowSeries,
  expenseByCategory,
  summarizeCashFlow,
} from '../utils/chartData';

const PIE_COLORS = [
  '#0d9488',
  '#0891b2',
  '#6366f1',
  '#14b8a6',
  '#0ea5e9',
  '#2dd4bf',
  '#64748b',
];

const formatAxisMoney = v => {
  const n = Number(v)
  if (Number.isNaN(n)) return String(v ?? '')
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`
  return formatInr(n, { maximumFractionDigits: 0 })
}

const ChartCardHeader = ({ title, subtitle, panel, t }) => (
  <div className={panel ? t.panelHead : t.headMain}>
    <h3 className={panel ? t.panelHeadTitle : t.headTitle}>{title}</h3>
    {subtitle ? <p className={panel ? t.panelHeadSub : t.headSub}>{subtitle}</p> : null}
  </div>
)

const FinanceCharts = ({
  transactions,
  loading,
  trendSeries = null,
  timeRangeLabel = '',
  theme = 'light',
}) => {
  const t = useMemo(() => getChartTheme(theme), [theme]);

  const summary = useMemo(
    () => summarizeCashFlow(transactions || []),
    [transactions]
  );
  const pieData = useMemo(
    () => expenseByCategory(transactions || []),
    [transactions]
  );
  const pieTotal = useMemo(
    () => pieData.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
    [pieData]
  );

  const lineData = useMemo(() => {
    if (trendSeries && Array.isArray(trendSeries) && trendSeries.length > 0) {
      return trendSeries;
    }
    return dailyFlowSeries(transactions || []);
  }, [trendSeries, transactions]);

  const barData = useMemo(
    () => [
      { name: 'Income', amount: summary.income },
      { name: 'Expenses', amount: summary.expense },
    ],
    [summary.income, summary.expense]
  );

  if (loading) {
    return (
      <section className={t.shell}>
        <div className={t.loadingHead}>
          <div className={`h-5 w-40 animate-pulse rounded-lg ${t.pulseLine}`} />
          <div className={`mt-2 h-3 w-64 animate-pulse rounded ${t.pulseLine}`} />
        </div>
        <div className={t.loadingInset}>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`h-[260px] animate-pulse rounded-2xl border ${t.pulseCard} ${i === 3 ? 'lg:col-span-2' : ''}`}
            />
          ))}
        </div>
      </section>
    );
  }

  if (!transactions?.length) {
    return (
      <section className={t.shell}>
        <ChartCardHeader
          t={t}
          title="Visual overview"
          subtitle="Charts are built from your loaded transactions"
        />
        <div className={t.emptyBody}>
          <div
            className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border ring-1 ${t.emptyIconWrap}`}
          >
            <svg
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
          </div>
          <p className={`font-semibold ${t.emptyTitle}`}>
            Charts appear after you load data
          </p>
          <p className={`mt-2 max-w-md text-sm ${t.emptyText}`}>
            Bar, category, and timeline views help you spot patterns at a glance
            — enter a user ID above to get started.
          </p>
        </div>
      </section>
    );
  }

  const pieEmpty = pieData.length === 0;
  const lineEmpty = !lineData.length;

  return (
    <section className={t.shell}>
      <ChartCardHeader
        t={t}
        title="Visual overview"
        subtitle={
          timeRangeLabel
            ? `${timeRangeLabel} · income vs spend, categories, and daily trends — ₹`
            : 'Income vs spend, category split, and daily rhythm — amounts in ₹'
        }
      />

      <div className={t.inset}>
        <KpiStrip transactions={transactions} theme={theme} />
      </div>

      <div className="grid gap-6 border-t border-slate-100 bg-slate-50/40 p-5 lg:grid-cols-2 lg:p-6">
        <div className={t.panel}>
          <ChartCardHeader
            t={t}
            panel
            title="Income vs expenses"
            subtitle="Side-by-side totals"
          />
          <div className="h-[280px] w-full p-3 sm:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 16, right: 8, left: 4, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="barIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.95} />
                    <stop
                      offset="100%"
                      stopColor="#0d9488"
                      stopOpacity={0.85}
                    />
                  </linearGradient>
                  <linearGradient id="barExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.95} />
                    <stop
                      offset="100%"
                      stopColor="#0284c7"
                      stopOpacity={0.88}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={t.gridStroke}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={t.axisTick}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  tick={t.axisTick}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                  tickFormatter={formatAxisMoney}
                />
                <Tooltip
                  cursor={{ fill: t.barCursor }}
                  formatter={v => formatInr(v, { maximumFractionDigits: 0 })}
                  contentStyle={t.tooltipOuter}
                  labelStyle={t.tooltipLabel}
                />
                <Bar
                  dataKey="amount"
                  name="Amount"
                  radius={[10, 10, 4, 4]}
                  maxBarSize={72}
                >
                  <Cell fill="url(#barIncome)" />
                  <Cell fill="url(#barExpense)" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div
              className={`flex flex-wrap justify-center gap-x-8 gap-y-2 pb-1 pt-1 text-xs font-semibold ${t.kpiLegend}`}
            >
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-500 shadow-sm shadow-teal-500/40" />
                Income
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shadow-sm shadow-sky-500/35" />
                Expenses
              </span>
            </div>
          </div>
        </div>

        <div className={t.panel}>
          <ChartCardHeader
            t={t}
            panel
            title="Expense mix"
            subtitle="Share by category (expense rows only)"
          />
          <div className="w-full p-2 sm:p-4">
            {pieEmpty ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-slate-500 sm:h-[280px]">
                No categorized expenses in this dataset
              </div>
            ) : (
              <div className="flex min-h-[240px] flex-col gap-4 sm:h-[300px] sm:flex-row sm:items-stretch sm:gap-0">
                <div className="flex h-[200px] w-full shrink-0 sm:h-full sm:min-w-0 sm:flex-[1.05]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="42%"
                        outerRadius="70%"
                        paddingAngle={2}
                        label={false}
                      >
                        {pieData.map((row, i) => (
                          <Cell
                            key={`${row.name}-${i}`}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                            stroke={t.pieStroke}
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => {
                          const n = Number(value) || 0;
                          const pct =
                            pieTotal > 0
                              ? ((n / pieTotal) * 100).toFixed(1)
                              : '0';
                          return [`${formatInr(n)} · ${pct}%`, name];
                        }}
                        contentStyle={t.tooltipOuter}
                        labelStyle={t.tooltipLabel}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div
                  className={`flex min-h-0 min-w-0 flex-1 flex-col border-t pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 md:pl-5 ${t.pieListWrap}`}
                >
                  <p className="mb-1.5 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Categories
                  </p>
                  <ul className="scrollbar-thin min-h-0 flex-1 space-y-0 overflow-y-auto pr-1 sm:max-h-full">
                    {pieData.map((row, i) => {
                      const v = Number(row.value) || 0;
                      const pct = pieTotal > 0 ? (v / pieTotal) * 100 : 0;
                      const pctLabel =
                        pct < 1 ? pct.toFixed(1) : Math.round(pct);
                      return (
                        <li
                          key={`${row.name}-${i}`}
                          className={`flex gap-2.5 border-b py-2 text-xs last:border-0 ${t.pieListItem}`}
                        >
                          <span
                            className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-sm ring-1 ring-slate-200"
                            style={{
                              backgroundColor:
                                PIE_COLORS[i % PIE_COLORS.length],
                            }}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <p className={`font-medium leading-snug ${t.pieTextPri}`}>
                              {row.name}
                            </p>
                            <p className={`mt-0.5 tabular-nums ${t.pieTextSec}`}>
                              {formatInr(v)}
                              <span className={t.pieMuted}> · </span>
                              {pctLabel}%
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`${t.panel} lg:col-span-2`}>
          <ChartCardHeader
            t={t}
            panel
            title="Cash flow trend"
            subtitle="Income and expenses over time"
          />
          <div className="h-[300px] w-full p-3 sm:h-[320px] sm:p-4">
            {lineEmpty ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No dated transactions in this range for a trend line
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 12, right: 12, left: 4, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={t.axisTick}
                    axisLine={false}
                    tickLine={false}
                    dy={8}
                    interval="preserveStartEnd"
                    minTickGap={24}
                  />
                  <YAxis
                    tick={t.axisTick}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                    tickFormatter={formatAxisMoney}
                  />
                  <Tooltip
                    contentStyle={t.tooltipOuter}
                    labelStyle={t.tooltipLabel}
                    formatter={v => formatInr(v, { maximumFractionDigits: 0 })}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    formatter={value => (
                      <span className={t.lineLegendClass}>{value}</span>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke="#2dd4bf"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, fill: '#2dd4bf' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    name="Expenses"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, fill: '#38bdf8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default FinanceCharts
