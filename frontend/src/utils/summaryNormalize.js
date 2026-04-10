import { normalizePrediction } from './prediction'
import { normalizeAlerts } from './dashboardNormalize'

const unwrapPayload = res => {
  const d = res?.data
  if (d && typeof d === 'object' && 'data' in d && d.data !== undefined) return d.data
  return d
}

const riskScoreTo01 = score => {
  const n = Number(score)
  if (!Number.isFinite(n)) return 0.35
  if (n > 1.5) return Math.min(1, Math.max(0, n / 100))
  return Math.min(1, Math.max(0, n))
}

const statusFromRiskLevel = level => {
  const s = String(level ?? '').toUpperCase()
  if (s.includes('HIGH') || s.includes('CRITICAL')) return 'Needs attention'
  if (s.includes('MEDIUM') || s.includes('MODERATE')) return 'Moderate'
  if (s.includes('LOW')) return 'Strong'
  return 'Moderate'
}

const firstInsightText = insights => {
  if (!Array.isArray(insights) || insights.length === 0) return null
  const x = insights[0]
  if (typeof x === 'string') return x
  if (x && typeof x === 'object') return String(x.body ?? x.text ?? x.title ?? '')
  return null
}

const buildMainIssueFromAlertsAndReasons = (alerts, reasons) => {
  const normAlerts = normalizeAlerts(alerts)
  if (normAlerts.length > 0) {
    const a = normAlerts[0]
    const sev = String(a.severity ?? 'medium').toLowerCase()
    const severity =
      sev === 'high' || sev === 'critical' ? 'risk' : sev === 'low' ? 'good' : 'warning'
    return {
      title: 'Something to watch',
      detail: a.message,
      severity,
    }
  }
  if (Array.isArray(reasons) && reasons.length > 0) {
    return {
      title: 'Risk signal',
      detail: String(reasons[0]),
      severity: 'warning',
    }
  }
  return {
    title: "You're on track",
    detail: 'No urgent issues flagged for this period.',
    severity: 'good',
  }
}

const buildAssistantSummaryLocally = ({ prediction, alerts, insights }) => {
  const pred = prediction && typeof prediction === 'object' ? prediction : {}
  const risk01 = riskScoreTo01(pred.score ?? pred.risk_score)
  const healthScore = Math.round((1 - risk01) * 100)
  const healthStatus = statusFromRiskLevel(pred.riskLevel ?? pred.risk_level ?? pred.risk)
  const reasons = Array.isArray(pred.reasons) ? pred.reasons : []
  const mainIssue = buildMainIssueFromAlertsAndReasons(alerts, reasons)
  const suggestedAction =
    firstInsightText(insights) ??
    'Review your cash flow weekly and trim one discretionary category.'
  const lift = Math.max(6, Math.round((100 - healthScore) * 0.2))
  const projected = Math.min(100, healthScore + lift)
  return {
    healthScore,
    healthStatus,
    mainIssue,
    suggestedAction,
    simulationPreview: {
      projectedHealthScore: projected,
      message: `If you follow this plan, your score could reach around ${projected}.`,
    },
  }
}

const normalizeTransactions = raw => {
  if (Array.isArray(raw)) return raw
  if (raw && Array.isArray(raw.transactions)) return raw.transactions
  return []
}

const normalizeSummaryPayload = res => {
  const d = unwrapPayload(res)
  if (!d || typeof d !== 'object') {
    return {
      assistant: null,
      transactions: [],
      prediction: null,
      insights: [],
      alerts: [],
    }
  }

  const mi = d.main_issue ?? d.mainIssue
  const mainIssue =
    mi && typeof mi === 'object'
      ? {
          title: String(mi.title ?? 'Issue'),
          detail: String(mi.detail ?? mi.message ?? ''),
          severity: String(mi.severity ?? 'warning').toLowerCase(),
        }
      : buildMainIssueFromAlertsAndReasons(d.alerts, d.prediction?.reasons)

  const sp = d.simulation_preview ?? d.simulationPreview
  const simulationPreview =
    sp && typeof sp === 'object'
      ? {
          projectedHealthScore: Number(sp.projected_health_score ?? sp.projectedHealthScore) || 0,
          message: String(sp.message ?? ''),
        }
      : {
          projectedHealthScore: Math.min(100, (Number(d.health_score ?? d.healthScore) || 0) + 10),
          message: 'Stick to the suggested action to improve your score.',
        }

  const assistant = {
    healthScore: Math.round(Number(d.health_score ?? d.healthScore) || 0),
    healthStatus: String(d.health_status ?? d.healthStatus ?? 'Moderate'),
    mainIssue,
    suggestedAction: String(d.suggested_action ?? d.suggestedAction ?? ''),
    simulationPreview,
  }

  return {
    assistant,
    transactions: normalizeTransactions(d.transactions),
    prediction: normalizePrediction(d.prediction),
    insights: Array.isArray(d.insights) ? d.insights : [],
    alerts: normalizeAlerts(d.alerts ?? d.summary?.alerts),
  }
}

export { unwrapPayload, buildAssistantSummaryLocally, normalizeSummaryPayload }
