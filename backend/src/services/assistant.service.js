import * as dashboardService from './dashboard.service.js';
import { normalizeRangeParam } from '../utils/dateRange.js';

const norm = (s) => String(s ?? '').toLowerCase().trim();

const answerQuery = async (body) => {
  const rawQuery = body?.query;
  const query = norm(rawQuery);
  if (!query) {
    return {
      reply:
        'Send a short question in `query`. Add `user_id` (and optional `range`) for answers tailored to your data.',
    };
  }

  let features = null;
  let insights = [];
  let alerts = [];
  const uid = body?.user_id;
  if (uid !== undefined && uid !== null && String(uid).trim() !== '') {
    const n = Number(uid);
    if (Number.isFinite(n) && n > 0) {
      const rangeKey = normalizeRangeParam(body?.range);
      const dash = await dashboardService.getDashboardForUser(n, rangeKey);
      features = dash.features ?? null;
      insights = Array.isArray(dash.insights) ? dash.insights : [];
      alerts = dash.summary?.alerts ?? [];
    }
  }

  const topLine = insights[0] ? String(insights[0]) : null;
  const savingsPct =
    features?.savings_ratio_raw != null && Number.isFinite(features.savings_ratio_raw)
      ? Math.round(features.savings_ratio_raw * 100)
      : null;
  const overspend = alerts.find((a) => String(a.type).includes('overspend'));

  if (query.includes('save') || query.includes('saving')) {
    if (topLine) {
      return {
        reply: `Based on your recent pattern: ${topLine}. Start with one category you can trim this week, then automate a small transfer on payday.`,
      };
    }
    return {
      reply:
        'Try the 50/30/20 split as a guide, then automate savings on payday so spending never sees that money. Add `user_id` for specifics from your data.',
    };
  }

  if (query.includes('budget') || query.includes('plan')) {
    if (savingsPct != null && features?.total_income > 0) {
      return {
        reply: `You retained about ${savingsPct}% of income in this window—keep fixed costs flat and cap variable spend to protect that cushion.`,
      };
    }
    return {
      reply:
        'Anchor your plan on fixed costs first, then set weekly spending caps for variable categories. Link a user id for numbers grounded in your history.',
    };
  }

  if (
    query.includes('spend') ||
    query.includes('expense') ||
    query.includes('food') ||
    query.includes('shopping')
  ) {
    if (overspend) {
      return {
        reply: `${overspend.message} Re-balance by pausing non-essential subscriptions and batching discretionary purchases.`,
      };
    }
    if (topLine) {
      return { reply: `${topLine} Review that category weekly until the trend normalizes.` };
    }
    return {
      reply:
        'Watch categories that move week to week—those usually offer the fastest savings without touching essentials.',
    };
  }

  if (query.includes('risk') || query.includes('safe') || query.includes('ok')) {
    if (alerts.length > 0) {
      return {
        reply: `I see ${alerts.length} alert(s): ${alerts[0].message}. Treat the highest-severity item first, then re-check in a week.`,
      };
    }
    return {
      reply:
        'Nothing urgent jumped out—keep logging transactions so small drifts do not compound.',
    };
  }

  if (topLine) {
    return {
      reply: `Here is what stands out: ${topLine}. Pick one action for the next 7 days and measure the impact.`,
    };
  }

  return {
    reply:
      'I work best with your profile: include `user_id` (optional `range` like 30d) so I can reference your insights and alerts.',
  };
};

export { answerQuery };
