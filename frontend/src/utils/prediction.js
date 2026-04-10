const normalizePrediction = raw => {
  if (!raw || typeof raw !== 'object') return null
  if (raw.prediction && typeof raw.prediction === 'object') return raw.prediction
  return raw
}

export { normalizePrediction }
