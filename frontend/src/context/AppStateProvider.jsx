import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { getDashboard, getPrediction, getSummary, getTransactions } from '../services/api'
import { scopedLogger } from '../utils/logger'
import { normalizeDashboardPayload, normalizeInsights, unwrapPayload } from '../utils/dashboardNormalize'
import { filterTransactionsByDays } from '../utils/chartData'
import { normalizePrediction } from '../utils/prediction'
import {
  buildAssistantSummaryLocally,
  normalizeSummaryPayload,
} from '../utils/summaryNormalize'
import { AppStateContext } from './appStateContext'

const log = scopedLogger('state')

const normalizeTransactions = raw => {
  if (Array.isArray(raw)) return raw
  if (raw && Array.isArray(raw.transactions)) return raw.transactions
  if (raw && Array.isArray(raw.items)) return raw.items
  return []
}

const AppStateProvider = ({ children }) => {
  const [userIdInput, setUserIdInput] = useState('')
  const [activeUserId, setActiveUserId] = useState('')
  const [transactions, setTransactions] = useState([])
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [simulatedRisk, setSimulatedRisk] = useState(null)
  const [simulationPending, setSimulationPending] = useState(false)
  const [timeRangeDays, setTimeRangeDays] = useState(30)
  const [insights, setInsights] = useState([])
  const [alerts, setAlerts] = useState([])
  const [trendSeries, setTrendSeries] = useState(null)
  const [dashboardError, setDashboardError] = useState(null)
  const [assistantSummary, setAssistantSummary] = useState(null)

  const activeUserIdRef = useRef(activeUserId)
  activeUserIdRef.current = activeUserId
  const isFirstRangeEffect = useRef(true)

  const hydrateUserData = useCallback(
    async (uid, { showToast = false } = {}) => {
      const id = uid?.trim()
      if (!id) return false

      const rangeOpts = { days: timeRangeDays }

      try {
        const sumRes = await getSummary(id, rangeOpts)
        const pack = normalizeSummaryPayload(sumRes)
        let txs = pack.transactions
        if (!txs.length) {
          const txRes = await getTransactions(id, rangeOpts)
          txs = normalizeTransactions(unwrapPayload(txRes))
        }
        let pred = pack.prediction
        if (!pred) {
          const predRes = await getPrediction(id, rangeOpts)
          pred = normalizePrediction(unwrapPayload(predRes))
        }
        setTransactions(txs)
        setPrediction(pred)
        setInsights(normalizeInsights(pack.insights))
        setAlerts(pack.alerts)
        setTrendSeries(null)
        setAssistantSummary(
          pack.assistant ??
            buildAssistantSummaryLocally({
              prediction: pred,
              alerts: pack.alerts,
              insights: pack.insights,
            }),
        )
        setDashboardError(null)
        if (showToast) toast.success('Here’s your financial snapshot')
        return true
      } catch (sumErr) {
        const status = sumErr.response?.status
        const code = sumErr.response?.data?.code
        if (status !== 404 && code !== 'NOT_FOUND') {
          log.debug('Summary unavailable, trying dashboard fallback', {
            userId: id,
            status,
            message: sumErr.message,
          })
        }
        if (status === 404 || code === 'NOT_FOUND') {
          const msg =
            sumErr.response?.data?.message ??
            'User not found'
          setTransactions([])
          setPrediction(null)
          setInsights([])
          setAlerts([])
          setTrendSeries(null)
          setAssistantSummary(null)
          setDashboardError(msg)
          setActiveUserId('')
          toast.error(
            `${msg}. Enter a user ID that exists in your database (e.g. \`1\` after seeding).`,
          )
          return false
        }

        try {
          const dashRes = await getDashboard(id, rangeOpts)
          const n = normalizeDashboardPayload(dashRes)
          let txs = n.transactions
          if (!txs.length) {
            const txRes = await getTransactions(id, rangeOpts)
            txs = normalizeTransactions(unwrapPayload(txRes))
          }
          let pred = n.prediction
          if (!pred) {
            const predRes = await getPrediction(id, rangeOpts)
            pred = normalizePrediction(unwrapPayload(predRes))
          }
          setTransactions(txs)
          setPrediction(pred)
          setInsights(n.insights)
          setAlerts(n.alerts)
          setTrendSeries(n.trendSeries)
          setAssistantSummary(
            buildAssistantSummaryLocally({
              prediction: pred,
              alerts: n.alerts,
              insights: n.insights,
            }),
          )
          setDashboardError(null)
          if (showToast) toast.success('Loaded (summary API fell back to dashboard)')
          return true
        } catch {
          log.debug('Dashboard bundle failed, loading transactions + prediction', { userId: id })
          try {
            const [txRes, predRes] = await Promise.all([
              getTransactions(id, rangeOpts),
              getPrediction(id, rangeOpts),
            ])
            const pred = normalizePrediction(unwrapPayload(predRes))
            const txs = normalizeTransactions(unwrapPayload(txRes))
            setTransactions(txs)
            setPrediction(pred)
            setInsights([])
            setAlerts([])
            setTrendSeries(null)
            setAssistantSummary(
              buildAssistantSummaryLocally({
                prediction: pred,
                alerts: [],
                insights: [],
              }),
            )
            setDashboardError(null)
            if (showToast) toast.success('Loaded basic profile')
            return true
          } catch (err) {
            log.error('Hydration failed after all fallbacks', err)
            const msg =
              err.response?.data?.message ??
              err.response?.data?.error ??
              err.message ??
              'Could not load data. Try again.'
            setDashboardError(typeof msg === 'string' ? msg : JSON.stringify(msg))
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg))
            setActiveUserId('')
            setAssistantSummary(null)
            return false
          }
        }
      }
    },
    [timeRangeDays],
  )

  const loadDashboard = useCallback(
    async uid => {
      const id = uid?.trim()
      if (!id) {
        toast.error('Please enter a user ID to continue.')
        return
      }

      setSimulatedRisk(null)
      setLoading(true)
      setTransactions([])
      setPrediction(null)
      setInsights([])
      setAlerts([])
      setTrendSeries(null)
      setDashboardError(null)
      setAssistantSummary(null)

      try {
        const ok = await hydrateUserData(uid, { showToast: true })
        setActiveUserId(ok ? id : '')
      } finally {
        setLoading(false)
      }
    },
    [hydrateUserData],
  )

  useEffect(() => {
    if (isFirstRangeEffect.current) {
      isFirstRangeEffect.current = false
      return
    }
    const id = activeUserIdRef.current?.trim()
    if (!id) return

    let cancelled = false
    setSimulatedRisk(null)
    setLoading(true)

    ;(async () => {
      try {
        await hydrateUserData(id, { showToast: false })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [timeRangeDays, hydrateUserData])

  const onSimulationResult = useCallback(data => {
    setSimulatedRisk(normalizePrediction(data))
  }, [])

  const filteredTransactions = useMemo(
    () => filterTransactionsByDays(transactions, timeRangeDays),
    [transactions, timeRangeDays],
  )

  const value = useMemo(
    () => ({
      userIdInput,
      setUserIdInput,
      activeUserId,
      transactions,
      filteredTransactions,
      prediction,
      loading,
      simulatedRisk,
      setSimulatedRisk,
      simulationPending,
      setSimulationPending,
      loadDashboard,
      onSimulationResult,
      timeRangeDays,
      setTimeRangeDays,
      insights,
      alerts,
      trendSeries,
      dashboardError,
      assistantSummary,
    }),
    [
      userIdInput,
      activeUserId,
      transactions,
      filteredTransactions,
      prediction,
      loading,
      simulatedRisk,
      simulationPending,
      loadDashboard,
      onSimulationResult,
      timeRangeDays,
      insights,
      alerts,
      trendSeries,
      dashboardError,
      assistantSummary,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export { AppStateProvider }
