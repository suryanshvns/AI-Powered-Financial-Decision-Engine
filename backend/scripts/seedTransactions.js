import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool } from '../src/db/pool.js';
import { logger } from '../src/utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BATCH_SIZE = Number(process.env.SEED_BATCH_SIZE) || 2000;
const USER_COUNT = Math.max(1, Number(process.env.SEED_USER_COUNT) || 2000);
const TX_TARGET = Math.max(1, Number(process.env.SEED_TRANSACTION_COUNT) || 100_000);

const FIRST_NAMES = [
  'Aarav', 'Vihaan', 'Aditya', 'Arjun', 'Rohan', 'Kabir', 'Krishna', 'Ishaan', 'Shaurya',
  'Rahul', 'Amit', 'Vikram', 'Karan', 'Rohit', 'Sanjay', 'Arvind', 'Deepak', 'Manish', 'Nikhil',
  'Rajesh', 'Suresh', 'Gaurav', 'Harsh', 'Kunal', 'Varun', 'Siddharth', 'Yash', 'Dev',
  'Ananya', 'Diya', 'Aadhya', 'Kiara', 'Aanya', 'Zara', 'Sara', 'Priya', 'Neha', 'Kavita',
  'Meera', 'Swati', 'Ritu', 'Anjali', 'Kavya', 'Sneha', 'Lakshmi', 'Pooja', 'Riya', 'Ishita',
  'Tanvi', 'Nisha', 'Shreya', 'Aditi', 'Divya',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Iyer', 'Nair', 'Menon', 'Kapoor', 'Malhotra', 'Chopra',
  'Singh', 'Kumar', 'Gupta', 'Agarwal', 'Bansal', 'Joshi', 'Desai', 'Shah', 'Mehta', 'Kulkarni',
  'Pawar', 'Naik', 'Rao', 'Choudhary', 'Yadav', 'Jha', 'Mishra', 'Pandey', 'Das', 'Ghosh',
  'Banerjee', 'Mukherjee', 'Sengupta', 'Bhattacharya', 'Nambiar', 'Pillai', 'Krishnan', 'Rajan',
  'Subramanian', 'Hegde', 'Khatri', 'Sethi', 'Bhatia', 'Grover', 'Khanna', 'Saxena', 'Tiwari',
];

const INCOME_PROFILES = [
  { category: 'Salary', merchant: 'TCS Payroll', min: 28000, max: 180000, weight: 22 },
  { category: 'Salary', merchant: 'Infosys Payroll', min: 32000, max: 200000, weight: 18 },
  { category: 'Salary', merchant: 'Wipro Payroll', min: 30000, max: 165000, weight: 14 },
  { category: 'Salary', merchant: 'HCL Payroll', min: 28000, max: 150000, weight: 12 },
  { category: 'Salary', merchant: 'Accenture India Payroll', min: 45000, max: 220000, weight: 10 },
  { category: 'Freelance', merchant: 'Razorpay Payout', min: 8000, max: 95000, weight: 8 },
  { category: 'Freelance', merchant: 'Upwork India', min: 12000, max: 120000, weight: 6 },
  { category: 'Investment', merchant: 'Groww Dividend', min: 500, max: 25000, weight: 5 },
  { category: 'Investment', merchant: 'Zerodha Payout', min: 800, max: 80000, weight: 4 },
  { category: 'Rental', merchant: 'Rent received UPI', min: 10000, max: 55000, weight: 3 },
];

const EXPENSE_PROFILES = [
  { category: 'Food', merchant: 'Swiggy', min: 180, max: 920, weight: 14 },
  { category: 'Food', merchant: 'Zomato', min: 200, max: 1100, weight: 13 },
  { category: 'Groceries', merchant: 'Blinkit', min: 350, max: 2800, weight: 10 },
  { category: 'Groceries', merchant: 'BigBasket', min: 600, max: 5200, weight: 9 },
  { category: 'Groceries', merchant: 'DMart', min: 800, max: 7500, weight: 8 },
  { category: 'Groceries', merchant: 'Reliance Smart', min: 500, max: 6200, weight: 7 },
  { category: 'Shopping', merchant: 'Amazon India', min: 299, max: 12000, weight: 8 },
  { category: 'Shopping', merchant: 'Flipkart', min: 249, max: 9500, weight: 8 },
  { category: 'Shopping', merchant: 'Myntra', min: 599, max: 6500, weight: 5 },
  { category: 'Shopping', merchant: 'Nykaa', min: 450, max: 4800, weight: 4 },
  { category: 'Transport', merchant: 'Uber India', min: 120, max: 850, weight: 7 },
  { category: 'Transport', merchant: 'Ola', min: 110, max: 780, weight: 7 },
  { category: 'Transport', merchant: 'Metro Recharge', min: 50, max: 500, weight: 4 },
  { category: 'Bills', merchant: 'BESCOM Electricity', min: 900, max: 6200, weight: 5 },
  { category: 'Bills', merchant: 'BWSSB Water', min: 400, max: 2200, weight: 3 },
  { category: 'Bills', merchant: 'Jio Postpaid', min: 499, max: 899, weight: 4 },
  { category: 'Bills', merchant: 'Airtel Postpaid', min: 499, max: 999, weight: 4 },
  { category: 'Entertainment', merchant: 'BookMyShow', min: 250, max: 1800, weight: 4 },
  { category: 'Entertainment', merchant: 'Netflix India', min: 199, max: 649, weight: 3 },
  { category: 'Entertainment', merchant: 'Hotstar', min: 299, max: 1499, weight: 3 },
  { category: 'Health', merchant: 'Apollo Pharmacy', min: 150, max: 3200, weight: 5 },
  { category: 'Health', merchant: '1mg', min: 200, max: 2800, weight: 4 },
  { category: 'Health', merchant: 'Practo', min: 500, max: 2500, weight: 2 },
  { category: 'Travel', merchant: 'IRCTC', min: 350, max: 4500, weight: 3 },
  { category: 'Travel', merchant: 'MakeMyTrip', min: 2500, max: 28000, weight: 2 },
  { category: 'Education', merchant: "Byju's", min: 2000, max: 15000, weight: 2 },
  { category: 'Education', merchant: 'Unacademy', min: 999, max: 8000, weight: 2 },
  { category: 'Utilities', merchant: 'Google Pay Bill', min: 100, max: 3500, weight: 4 },
  { category: 'Utilities', merchant: 'PhonePe', min: 50, max: 12000, weight: 5 },
  { category: 'Utilities', merchant: 'Paytm', min: 100, max: 8000, weight: 4 },
  { category: 'Rent', merchant: 'Landlord UPI', min: 12000, max: 42000, weight: 3 },
  { category: 'Subscriptions', merchant: 'Spotify India', min: 119, max: 179, weight: 2 },
  { category: 'Shopping', merchant: 'Meesho', min: 199, max: 2200, weight: 3 },
  { category: 'Food', merchant: 'EatSure', min: 160, max: 750, weight: 3 },
];

const pickWeighted = (list) => {
  const total = list.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const x of list) {
    r -= x.weight;
    if (r <= 0) return x;
  }
  return list[list.length - 1];
};

const rupeesBetween = (min, max) => {
  const v = min + Math.random() * (max - min);
  return Math.round(v * 100) / 100;
};

const randomDateBetween = (start, end) => {
  const t = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(t).toISOString().slice(0, 10);
};

const buildIndianUsers = (count) => {
  const users = [];
  const usedEmails = new Set();
  for (let i = 0; i < count; i++) {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length];
    const ln = LAST_NAMES[(Math.floor(i / FIRST_NAMES.length) + i * 13) % LAST_NAMES.length];
    const name = `${fn} ${ln}`;
    const base = `${fn}.${ln}.${i + 1}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9.]/g, '');
    let email = `${base}@gmail.com`;
    if (usedEmails.has(email)) {
      email = `${base}${i}@gmail.com`;
    }
    usedEmails.add(email);
    users.push({ name, email });
  }
  return users;
};

const buildSyntheticTransactions = (userCount, totalRows) => {
  const start = new Date('2024-01-01');
  const end = new Date();

  const rows = [];
  let remaining = totalRows;

  const salarySlots = Math.min(
    Math.floor(totalRows * 0.12),
    userCount * 24,
  );
  for (let s = 0; s < salarySlots && remaining > 0; s++) {
    const userId = 1 + Math.floor(Math.random() * userCount);
    const prof = pickWeighted(INCOME_PROFILES.filter((p) => p.category === 'Salary'));
    const dateStr = randomDateBetween(start, end);
    rows.push({
      userId,
      dateStr,
      amount: rupeesBetween(prof.min, prof.max),
      category: prof.category,
      merchant: prof.merchant,
      txnType: 'income',
    });
    remaining -= 1;
  }

  const otherIncomeSlots = Math.floor(totalRows * 0.06);
  for (let o = 0; o < otherIncomeSlots && remaining > 0; o++) {
    const pool = INCOME_PROFILES.filter((p) => p.category !== 'Salary');
    const prof = pickWeighted(pool);
    const userId = 1 + Math.floor(Math.random() * userCount);
    rows.push({
      userId,
      dateStr: randomDateBetween(start, end),
      amount: rupeesBetween(prof.min, prof.max),
      category: prof.category,
      merchant: prof.merchant,
      txnType: 'income',
    });
    remaining -= 1;
  }

  while (remaining > 0) {
    const prof = pickWeighted(EXPENSE_PROFILES);
    const userId = 1 + Math.floor(Math.random() * userCount);
    rows.push({
      userId,
      dateStr: randomDateBetween(start, end),
      amount: rupeesBetween(prof.min, prof.max),
      category: prof.category,
      merchant: prof.merchant,
      txnType: 'expense',
    });
    remaining -= 1;
  }

  rows.sort((a, b) => {
    const c = a.dateStr.localeCompare(b.dateStr);
    if (c !== 0) return c;
    return a.userId - b.userId;
  });

  return rows;
};

const resolveCsvPath = () => {
  const fromArg = process.argv[2]?.trim();
  const fromEnv = process.env.SEED_CSV_PATH?.trim();
  const raw = fromArg || fromEnv;
  if (!raw) return null;
  return path.resolve(raw);
};

const parseTransactionsCsv = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length < 2) {
    throw new Error('CSV must include a header row and at least one data row.');
  }

  const header = lines[0].split(',').map((h) => h.trim());
  const expected = ['user_id', 'date', 'amount', 'category', 'merchant', 'type'];
  if (header.length !== expected.length || !expected.every((k, i) => header[i] === k)) {
    throw new Error(`Unexpected CSV header. Expected: ${expected.join(',')}`);
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length !== 6) {
      throw new Error(`Line ${i + 1}: expected 6 columns, got ${parts.length}`);
    }
    const [userId, dateStr, amountStr, category, merchant, txnType] = parts.map((p) => p.trim());
    rows.push({
      userId: Number(userId),
      dateStr,
      amount: amountStr,
      category,
      merchant,
      txnType,
    });
  }
  return rows;
};

const ensureSchema = async (client) => {
  const sqlPath = path.join(__dirname, 'sql', '001_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await client.query(sql);
};

const seedUsersFromList = async (client, users) => {
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const chunk = users.slice(i, i + BATCH_SIZE);
    const values = [];
    const placeholders = [];
    let p = 1;
    for (const u of chunk) {
      placeholders.push(`($${p++}, $${p++})`);
      values.push(u.name, u.email);
    }
    await client.query(
      `INSERT INTO users (name, email) VALUES ${placeholders.join(', ')}`,
      values,
    );
  }
  await client.query(
    `SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT COALESCE(MAX(id), 1) FROM users))`,
  );
};

const DEMO_USER_PROFILES = new Map([
  [1, { name: 'Priya Nair', email: 'demo.1.healthy@seed.local' }],
  [2, { name: 'Rohit Verma', email: 'demo.2.overspending@seed.local' }],
  [3, { name: 'Ananya Kapoor', email: 'demo.3.thin_margin@seed.local' }],
  [4, { name: 'Karan Mehta', email: 'demo.4.food_heavy@seed.local' }],
  [5, { name: 'Neha Singh', email: 'demo.5.spike_growth@seed.local' }],
]);

const seedUsersForCsvIds = async (client, parsed) => {
  const ids = [...new Set(parsed.map((r) => r.userId))].sort((a, b) => a - b);
  for (const id of ids) {
    const profile = DEMO_USER_PROFILES.get(id);
    const name = profile?.name ?? `User ${id}`;
    const email = profile?.email ?? `user_${id}@seed.local`;
    await client.query(
      `INSERT INTO users (id, name, email) VALUES ($1, $2, $3)`,
      [id, name, email],
    );
  }
  await client.query(
    `SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT COALESCE(MAX(id), 1) FROM users))`,
  );
};

const insertTransactionChunk = async (client, chunk) => {
  const values = [];
  const placeholders = [];
  let p = 1;
  for (const row of chunk) {
    placeholders.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++})`);
    values.push(
      row.userId,
      row.dateStr,
      row.amount,
      row.category,
      row.merchant,
      row.txnType,
    );
  }
  const text = `
    INSERT INTO transactions (user_id, "date", amount, category, merchant, "type")
    VALUES ${placeholders.join(', ')}
  `;
  await client.query(text, values);
};

const seedFromSynthetic = async (client) => {
  logger.info(
    { userCount: USER_COUNT, txTarget: TX_TARGET },
    'Generating synthetic users and INR transactions',
  );
  const users = buildIndianUsers(USER_COUNT);
  await seedUsersFromList(client, users);
  const parsed = buildSyntheticTransactions(USER_COUNT, TX_TARGET);
  for (let i = 0; i < parsed.length; i += BATCH_SIZE) {
    await insertTransactionChunk(client, parsed.slice(i, i + BATCH_SIZE));
  }
  logger.info(
    { users: users.length, transactions: parsed.length },
    'Synthetic seed complete',
  );
};

const seedFromCsv = async (client, csvPath) => {
  const parsed = parseTransactionsCsv(csvPath);
  await seedUsersForCsvIds(client, parsed);
  for (let i = 0; i < parsed.length; i += BATCH_SIZE) {
    await insertTransactionChunk(client, parsed.slice(i, i + BATCH_SIZE));
  }
  logger.info({ rows: parsed.length, csvPath }, 'CSV seed complete');
  if (path.basename(csvPath) === 'demo-users-1-5.csv') {
    logger.info(
      'Demo users 1–5: 1=healthy savings | 2=expense>income | 3=~95% income to expenses + low savings | 4=~48% spend on Food | 5=low prior spend then large spike (use ?range=30d for growth).',
    );
  }
};

const seed = async () => {
  const csvPath = resolveCsvPath();
  const useCsv =
    Boolean(csvPath) &&
    fs.existsSync(csvPath) &&
    fs.statSync(csvPath).isFile();

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await ensureSchema(client);

    if (useCsv) {
      await seedFromCsv(client, csvPath);
    } else {
      await seedFromSynthetic(client);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

seed().catch((err) => {
  logger.fatal({ err }, 'Seed failed');
  process.exit(1);
});
