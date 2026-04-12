import axios from 'axios'
import { scopedLogger } from '../utils/logger'

const log = scopedLogger('api')

const baseURL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? '/api/v1' : 'http://localhost:3000/api/v1')

/** Log every request/response in dev, or when VITE_API_VERBOSE=true */
const traceApi =
  import.meta.env.DEV ||
  String(import.meta.env.VITE_API_VERBOSE ?? '').toLowerCase() === 'true'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

const requestLabel = cfg => {
  if (!cfg) return ''
  const base = String(cfg.baseURL ?? '').replace(/\/$/, '')
  const path = String(cfg.url ?? '').replace(/^\//, '')
  const joined = [base, path].filter(Boolean).join('/')
  return joined || base || path || ''
}

const elapsedMs = cfg => {
  const t0 = cfg?.metadata?.start
  if (typeof t0 !== 'number' || typeof performance === 'undefined') return null
  return Math.round(performance.now() - t0)
}

api.interceptors.request.use(config => {
  if (traceApi && typeof performance !== 'undefined') {
    config.metadata = { ...(config.metadata ?? {}), start: performance.now() }
  }
  if (traceApi) {
    const method = (config.method ?? 'get').toUpperCase()
    const label = requestLabel(config)
    log.info(
      `${method} ${label}`,
      {
        params: config.params,
        data: config.data,
      },
    )
  }
  return config
})

api.interceptors.response.use(
  res => {
    if (traceApi) {
      const method = (res.config?.method ?? 'get').toUpperCase()
      const label = requestLabel(res.config)
      const ms = elapsedMs(res.config)
      log.success(
        `${res.status} ${method} ${label}${ms != null ? ` ${ms}ms` : ''}`,
      )
    }
    return res
  },
  err => {
    const status = err.response?.status
    const method = (err.config?.method ?? 'get').toUpperCase()
    const label = requestLabel(err.config)

    if (status === 404) {
      if (traceApi) {
        log.debug(`${method} ${label} → ${status}`)
      }
      return Promise.reject(err)
    }

    if (!err.response) {
      log.error(`${method} ${label || '(request)'} — no response`, err.message)
      return Promise.reject(err)
    }

    const msg = err.response?.data?.message ?? err.response?.data?.error ?? err.message
    if (status >= 500) {
      log.error(`${method} ${label || '(request)'} — ${status}`, msg)
    } else {
      log.warn(`${method} ${label || '(request)'} — ${status}`, msg)
    }
    return Promise.reject(err)
  },
)

const rangeParamsFromDays = days => {
  const d = Number(days)
  switch (d) {
    case 7:
      return { range: '7d' }
    case 30:
      return { range: '30d' }
    case 90:
      return { range: '90d' }
    default:
      return { range: '30d' }
  }
}

const getTransactions = (userId, { days } = {}) => {
  const params = rangeParamsFromDays(days)
  return api.get(`/transactions/${encodeURIComponent(userId)}`, { params })
}

const getDashboard = (userId, { days } = {}) => {
  const params = rangeParamsFromDays(days)
  return api.get(`/dashboard/${encodeURIComponent(userId)}`, { params })
}

const getPrediction = (userId, { days } = {}) => {
  const params = rangeParamsFromDays(days)
  return api.get(`/predict/${encodeURIComponent(userId)}`, { params })
}

const getSummary = (userId, { days } = {}) => {
  const id = String(userId ?? '').trim()
  const params = rangeParamsFromDays(days)
  return api.get(`/summary/${encodeURIComponent(id)}`, { params })
}

/** POST /assistant — rule-based assistant (optional on server). */
const postAssistant = ({ query, userId }) =>
  api.post('/assistant', {
    query: String(query ?? '').trim(),
    ...(userId != null && String(userId).trim() !== '' ? { user_id: String(userId).trim() } : {}),
  })

const simulate = ({ userId, reduceExpensePercent, increaseIncomePercent = 0 }) => {
  const user_id = Number(String(userId ?? '').trim())
  if (!Number.isInteger(user_id) || user_id < 1) {
    log.warn('simulate: invalid user_id', { userId })
    return Promise.reject(
      new Error(
        'Simulation expects a numeric user ID (e.g. 1, 2). String IDs are not accepted by the server for this endpoint.',
      ),
    )
  }
  const reduce_expense_percent = Number(reduceExpensePercent)
  if (
    !Number.isFinite(reduce_expense_percent) ||
    reduce_expense_percent < 0 ||
    reduce_expense_percent > 100
  ) {
    log.warn('simulate: invalid reduce_expense_percent', { reduceExpensePercent })
    return Promise.reject(new Error('reduce_expense_percent must be between 0 and 100.'))
  }
  const adjustments = { reduce_expense_percent }
  const inc = Number(increaseIncomePercent)
  if (Number.isFinite(inc) && inc > 0 && inc <= 100) {
    adjustments.increase_income_percent = inc
  }
  return api.post('/simulate', {
    user_id,
    adjustments,
  })
}

export {
  getTransactions,
  getDashboard,
  getPrediction,
  getSummary,
  postAssistant,
  simulate,
}
