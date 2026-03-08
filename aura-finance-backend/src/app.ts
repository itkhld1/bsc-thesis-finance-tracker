import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import * as tf from '@tensorflow/tfjs-node';
import { exec } from 'child_process';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;
const jwtSecret = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());

// Global logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Extend the Request interface for TypeScript
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
      };
    }
  }
}

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set');
if (!jwtSecret) throw new Error('JWT_SECRET not set');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.connect()
  .then(async client => {
    console.log('Connected to PostgreSQL database!');
    // Ensure tables exist
    try {
      await client.query('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS income DECIMAL(10,2) DEFAULT 0');
      await client.query(`
        CREATE TABLE IF NOT EXISTS "Budget" (
          id UUID PRIMARY KEY,
          "userId" INTEGER REFERENCES "User"(id),
          "categoryId" TEXT NOT NULL,
          "limitAmount" DECIMAL(10,2) NOT NULL,
          UNIQUE("userId", "categoryId")
        )
      `);
    } catch (e) {
      console.log('Database migration log:', e.message);
    }
    client.release();
  })
  .catch(err => console.error('DB Connection Error:', err.message));

// Middleware to protect routes
const protect = (req: Request, res: Response, next: NextFunction) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, jwtSecret!) as { userId: number; email: string };
      req.user = { id: decoded.userId, email: decoded.email };
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  return res.status(401).json({ message: 'Not authorized, no token' });
};

// BUDGET ENDPOINTS
app.get('/budget', protect, async (req, res) => {
  try {
    const result = await pool.query('SELECT "categoryId", "limitAmount" FROM "Budget" WHERE "userId" = $1', [req.user?.id]);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching budget' });
  }
});

app.post('/budget', protect, async (req, res) => {
  const { budgets } = req.body; // Array of { categoryId, limitAmount }
  try {
    for (const b of budgets) {
      await pool.query(
        'INSERT INTO "Budget" (id, "userId", "categoryId", "limitAmount") VALUES ($1, $2, $3, $4) ON CONFLICT ("userId", "categoryId") DO UPDATE SET "limitAmount" = EXCLUDED."limitAmount"',
        [uuidv4(), req.user?.id, b.categoryId, b.limitAmount]
      );
    }
    res.json({ message: "Budget updated successfully" });
  } catch (error: any) {
    res.status(500).json({ message: 'Error saving budget', details: error.message });
  }
});

// --- ROUTES ---

app.get('/', (req, res) => res.send('Aura Finance Backend is running!'));

// PING TEST - To verify the server updated
app.get('/ping', (req, res) => res.json({ message: 'pong', version: '1.1', timestamp: new Date() }));

app.get('/debug/routes', (req, res) => {
  const routes: any[] = [];
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      routes.push(`${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
    }
  });
  res.json(routes);
});

// USER INFO
app.get('/auth/me', protect, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, username, income FROM "User" WHERE id = $1', [req.user?.id]);
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching user', details: error.message });
  }
});

app.put('/auth/user', protect, async (req, res) => {
  const { income } = req.body;
  console.log(`Updating income for user ${req.user?.id} to: ${income}`);
  try {
    const result = await pool.query(
      'UPDATE "User" SET income = $1 WHERE id = $2 RETURNING id, email, name, username, income',
      [income, req.user?.id]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating income', details: error.message });
  }
});

// CATEGORIES
app.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, icon, color FROM "Category"');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
  }
});

// AUTH
app.post('/auth/register', async (req, res) => {
  const { email, password, name, username } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO "User" (email, password_hash, name, username, income) VALUES ($1, $2, $3, $4, 0) RETURNING id, email, name, username, income',
      [email, hashedPassword, name, username]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret!, { expiresIn: '1h' });
    res.status(201).json({ token, user });
  } catch (error: any) {
    if (error.code === '23505') return res.status(409).json({ message: 'User or username already exists' });
    res.status(500).json({ message: 'Error registering user', details: error.message });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT id, email, name, username, password_hash, income FROM "User" WHERE email = $1', [email]);
    const user = result.rows[0];
    if (user && await bcrypt.compare(password, user.password_hash)) {
      const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret!, { expiresIn: '1h' });
      return res.json({ token, user: { id: user.id, email: user.email, name: user.name, username: user.username, income: user.income } });
    }
    res.status(401).json({ message: 'Invalid credentials' });
  } catch (error: any) {
    res.status(500).json({ message: 'Login error', details: error.message });
  }
});

// EXPENSES (CRUD)
app.get('/ai/insights', protect, async (req, res) => {
  const userId = req.user?.id;
  console.log(`[AI Insights] Request started for User: ${userId}`);
  try {
    // 1. Fetch Expenses & User Income
    const expResult = await pool.query(
      'SELECT amount, "categoryId", description, date FROM "Expense" WHERE "userId" = $1 ORDER BY date DESC',
      [userId]
    );
    console.log(`[AI Insights] Fetched ${expResult.rows.length} expenses`);
    const userResult = await pool.query('SELECT income FROM "User" WHERE id = $1', [userId]);
    console.log(`[AI Insights] Fetched user income: ${userResult.rows[0]?.income}`);
    
    const expenses = expResult.rows || [];
    const income = Number(userResult.rows[0]?.income) || 0;
    
    if (expenses.length === 0) {
      console.log(`[AI Insights] No expenses found for user ${userId}, returning tip`);
      return res.json([
        {
          type: "tip",
          title: "Get Started",
          description: "Add your first few expenses to unlock personalized AI insights and spending analysis.",
          confidence: 100,
          actionLabel: "Add Expense"
        }
      ]);
    }

    const insights = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 2. ANALYZE: Monthly Totals
    const currentMonthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const currentTotal = currentMonthExpenses.reduce((acc, e) => acc + Number(e.amount), 0);

    // 3. INSIGHT: Spending Velocity / Forecast
    if (currentMonthExpenses.length > 5) {
      const dayOfMonth = now.getDate();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const projectedTotal = (currentTotal / dayOfMonth) * daysInMonth;
      const remaining = income - projectedTotal;

      if (remaining > 0) {
        insights.push({
          type: "prediction",
          title: "End-of-Month Forecast",
          description: `Based on your spending velocity, you're on track to have ₺${remaining.toFixed(0)} remaining by month end.`,
          value: `₺${remaining.toFixed(0)}`,
          confidence: 85,
          trend: { value: Math.round((remaining / income) * 100), isPositive: true }
        });
      } else if (income > 0) {
        insights.push({
          type: "warning",
          title: "Over-Budget Prediction",
          description: `You are on pace to exceed your income by ₺${Math.abs(remaining).toFixed(0)}. Consider reducing non-essential spending.`,
          value: `₺${Math.abs(remaining).toFixed(0)}`,
          confidence: 92,
          actionLabel: "View Budget"
        });
      }
    }

    // 4. ANALYZE: Category Shifts (Current vs Last Month)
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });

    const getCategoryTotals = (exps: any[]) => exps.reduce((acc, e) => {
      acc[e.categoryId] = (acc[e.categoryId] || 0) + Number(e.amount);
      return acc;
    }, {} as Record<string, number>);

    const currentCatTotals = getCategoryTotals(currentMonthExpenses);
    const lastCatTotals = getCategoryTotals(lastMonthExpenses);

    for (const [catId, currentAmtValue] of Object.entries(currentCatTotals)) {
      const currentAmt = currentAmtValue as number;
      const lastAmt = lastCatTotals[catId] || 0;
      if (lastAmt > 0) {
        const percentChange = ((currentAmt - lastAmt) / lastAmt) * 100;
        if (Math.abs(percentChange) > 20) {
          insights.push({
            type: "trend",
            title: `${catId.charAt(0).toUpperCase() + catId.slice(1)} Spending Shift`,
            description: `Your ${catId} spending has ${percentChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(percentChange).toFixed(0)}% compared to last month.`,
            confidence: 90,
            trend: { value: Math.abs(Math.round(percentChange)), isPositive: percentChange < 0 }
          });
        }
      }
    }

    // 5. INSIGHT: Unusual Activity (Anomaly Detection)
    // Simple anomaly: transaction > 2.5x the average for that category
    const categoryAverages: Record<string, { sum: number, count: number }> = {};
    expenses.forEach(e => {
      if (!categoryAverages[e.categoryId]) categoryAverages[e.categoryId] = { sum: 0, count: 0 };
      categoryAverages[e.categoryId].sum += Number(e.amount);
      categoryAverages[e.categoryId].count += 1;
    });

    const recentAnomalies = currentMonthExpenses.filter(e => {
      const avg = categoryAverages[e.categoryId].sum / categoryAverages[e.categoryId].count;
      return Number(e.amount) > avg * 2.5 && Number(e.amount) > 200; // Only flag if > 200 units
    });

    if (recentAnomalies.length > 0) {
      insights.push({
        type: "warning",
        title: "Large Transaction Detected",
        description: `We noticed an unusual ₺${Number(recentAnomalies[0].amount).toFixed(0)} purchase in '${recentAnomalies[0].categoryId}'. Was this expected?`,
        confidence: 88,
        actionLabel: "Verify"
      });
    }

    // 6. INSIGHT: Subscription Detection
    const descriptionCounts: Record<string, { amounts: number[], count: number }> = {};
    expenses.forEach(e => {
      const desc = e.description.toLowerCase().trim();
      if (!descriptionCounts[desc]) descriptionCounts[desc] = { amounts: [], count: 0 };
      descriptionCounts[desc].amounts.push(Number(e.amount));
      descriptionCounts[desc].count += 1;
    });

    const subscriptions = Object.entries(descriptionCounts).filter(([desc, data]) => {
      // Check if it appears multiple times with similar amounts (within 5% range)
      if (data.count < 2) return false;
      const avg = data.amounts.reduce((a, b) => a + b) / data.count;
      return data.amounts.every(a => Math.abs(a - avg) < avg * 0.05);
    });

    if (subscriptions.length > 0) {
      const sub = subscriptions[0];
      insights.push({
        type: "tip",
        title: "Subscription Identified",
        description: `AI detected recurring payments for '${sub[0]}'. You've spent ₺${(sub[1].amounts.reduce((a,b)=>a+b)).toFixed(0)} on this total.`,
        value: `₺${(sub[1].amounts[0]).toFixed(0)}/mo`,
        confidence: 95,
        actionLabel: "Manage"
      });
    }

    // 7. Achievement: Low Spending Streak
    const last7Days = expenses.filter(e => {
      const d = new Date(e.date);
      const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
      return diff <= 7;
    });
    if (last7Days.length > 0 && last7Days.reduce((acc, e) => acc + Number(e.amount), 0) < income * 0.05) {
      insights.push({
        type: "achievement",
        title: "Frugal Week!",
        description: "You've spent less than 5% of your income in the last 7 days. Keep it up!",
        confidence: 100,
        trend: { value: 7, isPositive: true }
      });
    }

    // Shuffle and limit to 6
    const finalInsights = insights.sort(() => 0.5 - Math.random()).slice(0, 6);
    
    // Ensure we have at least 1-2 default tips if list is short
    if (finalInsights.length < 2 && income > 0) {
      finalInsights.push({
        type: "action",
        title: "Smart Savings Opportunity",
        description: `Based on your income, setting aside ₺${(income * 0.1).toFixed(0)} (10%) right now would bolster your safety net.`,
        value: `₺${(income * 0.1).toFixed(0)}`,
        confidence: 80,
        actionLabel: "Save Now"
      });
    }

    res.json(finalInsights);

  } catch (error: any) {
    console.error(`[AI Insights Error]`, error);
    res.status(500).json({ message: 'Error generating insights', details: error.message });
  }
});

// AI BUDGET PREDICTIONS
app.get('/ai/budget-predictions', protect, async (req, res) => {
  const userId = req.user?.id;
  const DEFAULT_BUDGETS: Record<string, number> = {
    food: 3000, transport: 1500, shopping: 2000, entertainment: 1000,
    utilities: 2500, health: 1000, travel: 5000, other: 500
  };

  try {
    // 0. Fetch user's custom budget limits
    const budgetResult = await pool.query('SELECT "categoryId", "limitAmount" FROM "Budget" WHERE "userId" = $1', [userId]);
    const userLimits: Record<string, number> = { ...DEFAULT_BUDGETS };
    budgetResult.rows.forEach(row => {
      userLimits[row.categoryId] = Number(row.limitAmount);
    });

    const expResult = await pool.query(
      'SELECT amount, "categoryId", date FROM "Expense" WHERE "userId" = $1 ORDER BY date DESC',
      [userId]
    );
    const expenses = expResult.rows;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const dayOfMonth = Math.max(1, now.getDate()); // Prevent division by zero
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // 1. Current Month Spending per Category
    const currentMonthExps = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const currentCatTotals: Record<string, number> = {};
    currentMonthExps.forEach(e => {
      const catId = e.categoryId; // Matching "categoryId" from SQL
      currentCatTotals[catId] = (currentCatTotals[catId] || 0) + Number(e.amount);
    });

    // 2. Generate Predictions
    const predictions = Object.entries(userLimits).map(([catId, budgetLimit]) => {
      const spentSoFar = currentCatTotals[catId] || 0;
      // Simple velocity prediction: (spent / days_passed) * total_days
      const predictedSpend = Math.round((spentSoFar / dayOfMonth) * daysInMonth);
      
      let riskLevel: "low" | "medium" | "high" = "low";
      let suggestion = "You're doing great! Keep it up.";

      const percentOfBudget = (predictedSpend / budgetLimit) * 100;

      if (percentOfBudget > 110) {
        riskLevel = "high";
        suggestion = `Predicting ₺${predictedSpend - budgetLimit} over budget. Consider reducing ${catId} spending by 15%.`;
      } else if (percentOfBudget > 90) {
        riskLevel = "medium";
        suggestion = `You're close to the limit. Watch your ${catId} purchases for the rest of the month.`;
      } else {
        riskLevel = "low";
        suggestion = `On track to save ₺${budgetLimit - predictedSpend} in this category. Well done!`;
      }

      // Add category-specific flavor to suggestions
      if (riskLevel === "high") {
        if (catId === "food") suggestion = "Try cooking at home more often to lower your food costs.";
        if (catId === "shopping") suggestion = "Avoid impulse buys. Wait 24 hours before any new shopping.";
        if (catId === "transport") suggestion = "Look for cheaper transport options or carpool this week.";
      }

      return {
        category: catId.charAt(0).toUpperCase() + catId.slice(1),
        predictedSpend: Math.max(spentSoFar, predictedSpend), // Don't predict less than already spent
        budgetLimit,
        confidence: Math.min(98, 60 + (dayOfMonth * 1.2)), // Confidence grows as month progresses
        riskLevel,
        suggestion
      };
    });

    // Sort by risk (high first) then by predicted amount
    predictions.sort((a, b) => {
      const riskMap = { high: 3, medium: 2, low: 1 };
      if (riskMap[a.riskLevel] !== riskMap[b.riskLevel]) {
        return riskMap[b.riskLevel] - riskMap[a.riskLevel];
      }
      return b.predictedSpend - a.predictedSpend;
    });

    res.json(predictions.slice(0, 4)); // Return top 4 most relevant

  } catch (error: any) {
    console.error(`[AI Budget Prediction Error]`, error);
    res.status(500).json({ message: 'Error generating budget predictions' });
  }
});

// Optimized prediction function for varying data sizes
app.get('/expenses', protect, async (req, res) => {
  console.log(`Fetching expenses for user: ${req.user?.id}`);
  try {
    const result = await pool.query(
      'SELECT id, amount, "categoryId", description, date, notes FROM "Expense" WHERE "userId" = $1 ORDER BY date DESC',
      [req.user?.id]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Fetch error:', error.message);
    res.status(500).json({ message: 'Error fetching expenses', details: error.message });
  }
});

app.post('/expenses', protect, async (req, res) => {
  const { amount, categoryId, description, date, notes } = req.body;
  const id = uuidv4();
  try {
    const result = await pool.query(
      'INSERT INTO "Expense" (id, amount, "categoryId", description, date, notes, "userId") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, amount, categoryId, description, date, notes, req.user?.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: 'Error adding expense', details: error.message });
  }
});

app.put('/expenses/:id', protect, async (req, res) => {
  const { amount, categoryId, description, date, notes } = req.body;
  try {
    const result = await pool.query(
      'UPDATE "Expense" SET amount=$1, "categoryId"=$2, description=$3, date=$4, notes=$5 WHERE id=$6 AND "userId"=$7 RETURNING *',
      [amount, categoryId, description, date, notes, req.params.id, req.user?.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Expense not found' });
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: 'Update error', details: error.message });
  }
});

app.delete('/expenses/:id', protect, async (req, res) => {
  try {
    await pool.query('DELETE FROM "Expense" WHERE id=$1 AND "userId"=$2', [req.params.id, req.user?.id]);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: 'Delete error', details: error.message });
  }
});

// VOICE PARSING
const categories_list = [
  { id: "food", name: "Food" }, { id: "transport", name: "Transport" }, 
  { id: "entertainment", name: "Entertainment" }, { id: "shopping", name: "Shopping" },
  { id: "utilities", name: "Utilities" }, { id: "health", name: "Health" },
  { id: "travel", name: "Travel" }, { id: "other", name: "Other" }
];

app.post('/expenses/parse-voice', protect, async (req, res) => {
  const { transcript } = req.body;
  let amount = null;
  let categoryId = "other";
  let description = transcript;
  let date = new Date().toISOString().split('T')[0];

  const amountMatch = transcript.match(/(\d+)/);
  if (amountMatch) amount = parseFloat(amountMatch[0]);

  for (const cat of categories_list) {
    if (transcript.toLowerCase().includes(cat.id)) {
      categoryId = cat.id;
      break;
    }
  }

  res.json({ amount, categoryId, description, date });
});

app.post('/expenses/parse-receipt', protect, async (req, res) => {
  const { text } = req.body;
  let amount = null;
  let categoryId = "other";
  let description = "Receipt Expense";
  let date = new Date().toISOString().split('T')[0];

  const normalizedText = text.toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\*/g, '');

  // Strategy A: Look for "TOPLAM", "TUTAR" or "TOTAL" followed by a price format
  // Handles formats like "TOPLAM 756,37" or "TUTAR: 120.00"
  const totalMatch = normalizedText.match(/(toplam|tutar|total|ara toplam|top)\s*[:=]*\s*(\d{1,5}([.,]\d{2})?)/);
  
  if (totalMatch) {
    amount = parseFloat(totalMatch[2].replace(',', '.'));
  } else {
    // Strategy B: Find all potential prices (numbers with 2 decimals) and take the highest
    // This ignores barcodes which are usually long integers or don't follow price formatting
    const priceMatches = normalizedText.match(/\d+([.,]\d{2})/g);
    if (priceMatches) {
      const prices = priceMatches
        .map((m: string) => parseFloat(m.replace(',', '.')))
        .filter((n: number) => n > 0 && n < 30000); // filter out numbers that are too large --> likely barcodes or ids
      
      if (prices.length > 0) {
        amount = Math.max(...prices);
      }
    }
  }

  // 2. REFINED KEYWORD SEARCH
  const categoryKeywords: Record<string, string[]> = {
    food: ["yemek", "restoran", "lokanta", "kahve", "simit", "corba", "kebap", "burger", "pizza", "mutfak", "migros", "bim", "sok", "carrefour", "a101", "firin", "pastane"],
    shopping: ["market", "alisveris", "kıyafet", "ayakkabı", "fatura", "avm", "h&m", "zara", "boyner", "gratis", "watsons", "rossmann", "lcw", "koton", "flo", "decathlon", "ikea"],
    transport: ["benzin", "otobus", "taksi", "metro", "akbil", "yakit", "otopark", "kopru", "shell", "opet", "bp", "total", "petrol", "marmaray"],
    utilities: ["su", "elektrik", "dogalgaz", "internet", "telefon", "kira", "aidat", "turkcell", "vodafone", "telekom"],
    health: ["eczane", "doktor", "ilac", "hastane", "saglik", "disci", "optik"],
    entertainment: ["sinema", "tiyatro", "konser", "oyun", "netflix", "spotify", "eglence", "pub", "bar"],
    travel: ["ucak", "otel", "tatil", "bilet", "pasaport", "konaklama", "thy", "pegasus", "booking", "airbnb"]
  };

  for (const [id, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => normalizedText.includes(keyword))) {
      categoryId = id;
      break;
    }
  }

  res.json({ amount, categoryId, description, date });
});

app.get('/expenses/history', protect, async (req, res) => {
  try {
    const userId = req.user?.id;
    // 1. Fetch all expenses for the user
    const result = await pool.query(
      'SELECT amount, date FROM "Expense" WHERE "userId" = $1 ORDER BY date ASC',
      [userId]
    );

    // 2. Fetch current total budget to use as a baseline for all months
    const budgetResult = await pool.query('SELECT SUM("limitAmount") as "totalBudget" FROM "Budget" WHERE "userId" = $1', [userId]);
    const currentTotalBudget = Number(budgetResult.rows[0]?.totalBudget) || 10500; // Default fallback

    const expenses = result.rows;

    // 3. Create a map to store monthly totals
    const monthlyTotals: Record<string, number> = {};

    expenses.forEach(exp => {
      const date = new Date(exp.date);
      if (!isNaN(date.getTime())) {
        // Use short month name format "Jul", "Aug" etc
        const monthName = date.toLocaleString('default', { month: 'short' });
        monthlyTotals[monthName] = (monthlyTotals[monthName] || 0) + Number(exp.amount);
      }
    }); 

    // 4. Convert map to a sorted array of objects (using last 6 months logic for the chart)
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const history = Object.entries(monthlyTotals)
      .map(([month, amount]) => ({ 
        month, 
        spent: amount,
        budget: currentTotalBudget
      }))
      .sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));

    res.json(history);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching history', details: error.message });
  }
});

app.get('/expenses/forecast', protect, async (req, res) => {
  const userId = req.user?.id;
  console.log(`[Forecast] Request started for User: ${userId}`);
  
  try {
    const result = await pool.query(
      'SELECT amount, date FROM "Expense" WHERE "userId" = $1 ORDER BY date ASC',
      [userId]
    );

    const expenses = result.rows;
    const monthlyTotals: Record<string, number> = {};

    expenses.forEach(exp => {
      const date = new Date(exp.date);
      if (!isNaN(date.getTime())) {
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Number(exp.amount);
      }
    }); 

    const history = Object.entries(monthlyTotals)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const n = history.length;
    
    // Safety check for metadata
    if (n === 0) {
      return res.json({ prediction: 0, trend: "stable", confidence: 0, historyCount: 0 });
    }

    if (n < 2) {
      return res.json({ 
        prediction: history[0].amount,
        trend: "neutral",
        confidence: 30,
        historyCount: n,
        message: "Need 2+ months for AI"
      });
    }

    const amounts = history.map(h => h.amount);
    const lastAmount = amounts[n-1];
    let prediction = 0;
    let usedFallback = false;

    try {
      // Attempt LSTM/RNN
      prediction = await predictWithLSTM(amounts);
      if (prediction <= (lastAmount * 0.1) || isNaN(prediction)) throw new Error("AI Outlier");
    } catch (aiError) {
      // Fallback 1: Linear Regression / Trend Growth
      usedFallback = true;
      const firstAmount = amounts[0];
      const avgGrowthPerMonth = (lastAmount - firstAmount) / (n - 1);
      prediction = Math.max(lastAmount * 0.7, lastAmount + avgGrowthPerMonth);
      console.log(`[Forecast] AI failed or gave 0, using Trend Fallback: ₺${prediction}`);
    }
    
    const trend = prediction > lastAmount ? "increasing" : prediction < lastAmount ? "decreasing" : "stable";
    const confidence = Math.min(95, 40 + (n * 8));

    res.json({
      prediction: parseFloat(prediction.toFixed(2)),
      trend,
      confidence,
      historyCount: n,
      modelUsed: usedFallback ? "Trend Regression" : (n > 5 ? "LSTM" : "SimpleRNN")
    });

  } catch (error: any) {
    console.error(`[Forecast Fatal Error]`, error);
    res.status(500).json({ message: 'Internal AI Error', historyCount: 0, confidence: 0 });
  }
});

// AI INSIGHTS & RECOMMENDATIONS
async function predictWithLSTM(data:number[]) {
  const n = data.length;
  if (n < 2) return data[0] || 0;

  // 2. Normalization with padding
  const max = Math.max(...data) * 1.5; 
  const min = Math.min(...data) * 0.5;
  const range = max - min || 1; 
  const normalizedData = data.map(val => (val - min) / range);

  // 3. Prepare Tensors
  const xs = [];
  const ys = [];
  for (let i = 0; i < n - 1; i++) {
    xs.push([normalizedData[i]]); 
    ys.push(normalizedData[i + 1]);
  }

  const tensorXs = tf.tensor3d(xs, [xs.length, 1, 1]);
  const tensorYs = tf.tensor2d(ys, [ys.length, 1]);

  // 4. Dynamic Model Selection
  // LSTM needs more data to be stable. For < 5 months, SimpleRNN is safer.
  const model = tf.sequential();
  if (n < 5) {
    model.add(tf.layers.simpleRNN({ units: 16, inputShape: [1, 1] }));
  } else {
    model.add(tf.layers.lstm({ units: 32, inputShape: [1, 1] }));
  }
  model.add(tf.layers.dense({ units: 1 }));
  
  model.compile({ optimizer: tf.train.adam(0.02), loss: 'meanSquaredError' });

  // 5. Training
  await model.fit(tensorXs, tensorYs, { epochs: 250, verbose: 0 });

  // 6. Predict
  const lastVal = normalizedData[n - 1];
  const input = tf.tensor3d([[[lastVal]]]);
  const prediction = model.predict(input) as tf.Tensor;
  const predictedValue = (await prediction.data())[0];

  tf.dispose([tensorXs, tensorYs, input, prediction]); // Clean up memory

  return (predictedValue * range) + min;
}

// gradient boosted tree
app.get('/budget/optimize', protect, async (req, res) => {
  const userIncome = req.user?.income || 5000; 
  const scriptPath = path.join(__dirname, '../../aura-finance-ai/optimize.py');
   
   exec(`python3 ${scriptPath} ${userIncome}`, { cwd: path.join(__dirname, '../../aura-finance-ai') }, (error, stdout, stderr) => {
     if (error) {
       console.error(`Exec error: ${error}`);
       return res.status(500).json({ message: "AI Optimization failed" });
     }
 
     try {
       const rawAiResult = JSON.parse(stdout);
       
       // Clean and map Kaggle 10 categories to App 8 categories
       const mappedResults: Record<string, number> = {
         food: rawAiResult["Food & Drink"] || 0,
         transport: (rawAiResult["Travel"] || 0) * 0.4, 
         entertainment: rawAiResult["Entertainment"] || 0,
         shopping: rawAiResult["Shopping"] || 0,
         utilities: (rawAiResult["Utilities"] || 0) + (rawAiResult["Rent"] || 0),
         health: rawAiResult["Health & Fitness"] || 0,
         travel: (rawAiResult["Travel"] || 0) * 0.6,
         other: rawAiResult["Other"] || 0
       };

       res.json(mappedResults);
     } catch (e) {
       res.status(500).json({ message: "Failed to parse AI result" });
     }
   });
 });

app.listen(port, () => console.log(`Server running on port ${port}`));
