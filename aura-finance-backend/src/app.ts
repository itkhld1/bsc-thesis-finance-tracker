import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

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
    // Ensure income column exists
    try {
      await client.query('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS income DECIMAL(10,2) DEFAULT 0');
    } catch (e) {
      console.log('Income column already exists or error adding it');
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

// --- ROUTES ---

app.get('/', (req, res) => res.send('Aura Finance Backend is running!'));

// PING TEST - To verify the server updated
app.get('/ping', (req, res) => res.json({ message: 'pong', version: '1.1', timestamp: new Date() }));

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

  // 1. IMPROVED AMOUNT PARSING
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
        .filter(n => n > 0 && n < 30000); // Filter out numbers that are too large (likely barcodes or IDs)
      
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
    // 1. fetch all expenses for the user
    const result = await pool.query(
      'SELECT amount, date FROM "Expense" WHERE "userId" = $1 ORDER BY date ASC',
      [req.user?.id]
    );

    const expenses = result.rows;

    // 2. create a map to store montly totals
    const monthlyTotals: Record<string, number> = {};

    expenses.forEach(exp => {
      const date = new Date(exp.date);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Number(exp.amount);
    }); 

    // 3. Convert map to a sorted array of objects
    const history = Object.entries(monthlyTotals)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json(history);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching history', details: error.message });
  }
});

app.get('/expenses/forecast', protect, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT amount, date FROM "Expense" WHERE "userId" = $1 ORDER BY date ASC',
      [req.user?.id]
    );

    const expenses = result.rows;
    const monthlyTotals: Record<string, number> = {};

    expenses.forEach(exp => {
      const date = new Date(exp.date);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Number(exp.amount);
    }); 

    const history = Object.entries(monthlyTotals)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    if (history.length < 2) {
      return res.json({ 
        prediction: history.length === 1 ? history[0].amount : 0,
        trend: "neutral",
        confidence: 50,
        message: "Need more data for accurate AI prediction"
      });
    }

    // --- SIMPLE PREDICTION LOGIC (Thesis Concept: Linear Trend) ---
    const amounts = history.map(h => h.amount);
    const n = amounts.length;
    
    // Calculate simple growth rate between months
    let totalGrowth = 0;
    for (let i = 1; i < n; i++) {
      totalGrowth += (amounts[i] - amounts[i-1]);
    }
    const avgGrowth = totalGrowth / (n - 1);
    
    // Predict next month based on last month + avg growth
    const lastAmount = amounts[n-1];
    const prediction = Math.max(0, lastAmount + avgGrowth);
    
    // Determine trend direction
    const trend = avgGrowth > 0 ? "increasing" : avgGrowth < 0 ? "decreasing" : "stable";
    
    // Confidence score based on data points (Max 95%)
    const confidence = Math.min(95, 60 + (n * 5));

    res.json({
      prediction: parseFloat(prediction.toFixed(2)),
      trend,
      confidence,
      historyCount: n,
      nextMonth: "Next Month" // We could calculate the actual month string here
    });

  } catch (error: any) {
    res.status(500).json({ message: 'Error forecasting', details: error.message });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
