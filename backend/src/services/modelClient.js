import config from '../config/index.js';

const toModelTransactions = (transactions) =>
  transactions.map((t) => ({
    amount: Number(t.amount),
    category: t.category,
    type: t.type,
  }));

const predictWithModel = async (transactions) => {
  if (!config.modelServiceEnabled) {
    return { ok: false, skipped: true, error: 'Model service disabled' };
  }

  const base = config.modelServiceUrl.replace(/\/$/, '');
  const url = `${base}/predict`;
  const body = JSON.stringify({
    transactions: toModelTransactions(transactions),
  });

  const controller = new AbortController();
  const timeoutMs = Math.max(1000, config.modelServiceTimeoutMs);
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    });

    let data = null;
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error:
          (data && (data.message || data.detail || data.error)) ||
          `Model service HTTP ${res.status}`,
        body: data,
      };
    }

    return { ok: true, data };
  } catch (err) {
    const message =
      err.name === 'AbortError'
        ? `Model request timed out after ${timeoutMs}ms`
        : err.message || 'Model request failed';
    return { ok: false, error: message };
  } finally {
    clearTimeout(timer);
  }
};

export { toModelTransactions, predictWithModel };
