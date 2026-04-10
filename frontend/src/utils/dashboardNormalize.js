import { normalizePrediction } from './prediction'

const unwrapPayload = res => {
  const d = res?.data
  if (d && typeof d === 'object' && 'data' in d && d.data !== undefined) return d.data
  return d
}

const normalizeTransactions = raw => {
  if (Array.isArray(raw)) return raw
  if (raw && Array.isArray(raw.transactions)) return raw.transactions
  if (raw && Array.isArray(raw.items)) return raw.items
  return []
}

const normalizeInsights = raw => {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw
      .map((item, i) => {
        if (typeof item === 'string') {
          return { id: `ins-${i}`, title: 'Insight', body: item, tone: 'neutral' }
        }
        if (item && typeof item === 'object') {
          return {
            id: String(item.id ?? item.key ?? `ins-${i}`),
            title: String(item.title ?? item.headline ?? 'Insight'),
            body: String(item.body ?? item.text ?? item.description ?? ''),
            tone: String(item.tone ?? item.sentiment ?? 'neutral').toLowerCase(),
          }
        }
        return null
      })
      .filter(Boolean)
  }
  return []
}

const normalizeAlerts = raw => {
  if (!raw) return []
  if (!Array.isArray(raw)) {
    if (typeof raw === 'object' && raw.message) {
      return [
        {
          id: 'alert-0',
          type: String(raw.type ?? 'info'),
          message: String(raw.message),
          severity: String(raw.severity ?? 'medium').toLowerCase(),
        },
      ]
    }
    return []
  }
  return raw
    .map((a, i) => {
      if (typeof a === 'string') {
        return {
          id: `alt-${i}`,
          type: 'notice',
          message: a,
          severity: 'medium',
        }
      }
      if (a && typeof a === 'object') {
        return {
          id: String(a.id ?? `alt-${i}`),
          type: String(a.type ?? a.code ?? 'alert'),
          message: String(a.message ?? a.text ?? a.title ?? ''),
          severity: String(a.severity ?? a.level ?? 'medium').toLowerCase(),
        }
      }
      return null
    })
    .filter(a => a && a.message)
}

const normalizeTrendSeries = raw => {
  if (!Array.isArray(raw) || raw.length === 0) return null
  const first = raw[0]
  if (!first || typeof first !== 'object') return null
  return raw
    .map(row => {
      const date =
        row.date ?? row.day ?? row.period ?? row.bucket ?? row.ts ?? row.timestamp
      if (date == null) return null
      const d = new Date(date)
      const dateKey = Number.isNaN(d.getTime()) ? String(date).slice(0, 10) : d.toISOString().slice(0, 10)
      const income = Number(row.income ?? row.credit ?? row.inflow ?? 0) || 0
      const expense = Number(row.expense ?? row.debit ?? row.outflow ?? row.spend ?? 0) || 0
      return {
        date: dateKey,
        income: Math.round(income * 100) / 100,
        expense: Math.round(expense * 100) / 100,
        label:
          row.label ??
          (Number.isNaN(d.getTime())
            ? dateKey
            : new Date(dateKey + 'T12:00:00').toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date))
}

const normalizeDashboardPayload = res => {
  const d = unwrapPayload(res)
  if (!d || typeof d !== 'object') {
    return {
      transactions: [],
      prediction: null,
      insights: [],
      alerts: [],
      trendSeries: null,
    }
  }

  const prediction = normalizePrediction(
    d.risk ?? d.prediction ?? d.risk_assessment ?? d.riskAssessment ?? d.model_output,
  )

  return {
    transactions: normalizeTransactions(d.transactions ?? d.ledger ?? d),
    prediction,
    insights: normalizeInsights(d.insights ?? d.ai_insights ?? d.aiInsights),
    alerts: normalizeAlerts(
      d.alerts ?? d.summary?.alerts ?? d.warnings ?? d.notifications,
    ),
    trendSeries: normalizeTrendSeries(d.trends ?? d.daily_trends ?? d.dailyTrends ?? d.timeseries),
  }
}

export { unwrapPayload, normalizeInsights, normalizeAlerts, normalizeDashboardPayload }
