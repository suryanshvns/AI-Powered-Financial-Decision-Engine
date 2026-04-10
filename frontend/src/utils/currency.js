const CURRENCY_LOCALE = 'en-IN'
const CURRENCY_CODE = 'INR'

const formatInr = (value, options = {}) => {
  const n = Number(value)
  if (Number.isNaN(n)) return String(value ?? '—')
  return n.toLocaleString(CURRENCY_LOCALE, {
    style: 'currency',
    currency: CURRENCY_CODE,
    maximumFractionDigits: 2,
    ...options,
  })
}

export { CURRENCY_LOCALE, CURRENCY_CODE, formatInr }
