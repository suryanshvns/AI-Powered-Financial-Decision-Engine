const typeKey = t => String(t ?? '').toLowerCase()

const isIncome = (type, amount) => {
  const k = typeKey(type)
  if (k.includes('income') || k.includes('credit')) return true
  if (k.includes('expense') || k.includes('debit')) return false
  return Number(amount) >= 0
}

const formatChartDay = iso => {
  const d = new Date(iso + 'T12:00:00')
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const filterTransactionsByDays = (transactions, days) => {
  if (!Array.isArray(transactions)) return []
  const n = Number(days)
  if (!Number.isFinite(n) || n <= 0) return transactions
  const cutoff = new Date()
  cutoff.setHours(0, 0, 0, 0)
  cutoff.setDate(cutoff.getDate() - n)
  return transactions.filter(row => {
    if (row.date == null || row.date === '') return false
    const d = new Date(row.date)
    if (Number.isNaN(d.getTime())) return false
    return d >= cutoff
  })
}

const summarizeCashFlow = transactions => {
  let income = 0
  let expense = 0
  for (const row of transactions) {
    const amt = Math.abs(Number(row.amount) || 0)
    if (amt === 0) continue
    if (isIncome(row.type, row.amount)) income += amt
    else expense += amt
  }
  return {
    income: Math.round(income * 100) / 100,
    expense: Math.round(expense * 100) / 100,
    net: Math.round((income - expense) * 100) / 100,
    count: transactions.length,
  }
}

const expenseByCategory = transactions => {
  const map = {}
  for (const row of transactions) {
    const amt = Math.abs(Number(row.amount) || 0)
    if (amt === 0) continue
    if (isIncome(row.type, row.amount)) continue
    const cat = String(row.category ?? 'Other').trim() || 'Other'
    map[cat] = (map[cat] || 0) + amt
  }
  return Object.entries(map)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
}

const dailyFlowSeries = transactions => {
  const map = new Map()
  for (const row of transactions) {
    if (row.date == null || row.date === '') continue
    const d = new Date(row.date)
    if (Number.isNaN(d.getTime())) continue
    const key = d.toISOString().slice(0, 10)
    if (!map.has(key)) map.set(key, { date: key, income: 0, expense: 0 })
    const o = map.get(key)
    const amt = Math.abs(Number(row.amount) || 0)
    if (amt === 0) continue
    if (isIncome(row.type, row.amount)) o.income += amt
    else o.expense += amt
  }
  return Array.from(map.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(row => ({
      ...row,
      income: Math.round(row.income * 100) / 100,
      expense: Math.round(row.expense * 100) / 100,
      label: formatChartDay(row.date),
    }))
}

export {
  isIncome,
  filterTransactionsByDays,
  summarizeCashFlow,
  expenseByCategory,
  dailyFlowSeries,
  formatChartDay,
}
