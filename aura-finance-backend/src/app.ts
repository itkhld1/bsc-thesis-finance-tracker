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
  .then(client => {
    console.log('Connected to PostgreSQL database!');
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
app.get('/ping', (req, res) => res.json({ message: 'pong', timestamp: new Date() }));

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
      'INSERT INTO "User" (email, password_hash, name, username) VALUES ($1, $2, $3, $4) RETURNING id, email, name, username',
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
    const result = await pool.query('SELECT id, email, name, username, password_hash FROM "User" WHERE email = $1', [email]);
    const user = result.rows[0];
    if (user && await bcrypt.compare(password, user.password_hash)) {
      const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret!, { expiresIn: '1h' });
      return res.json({ token, user: { id: user.id, email: user.email, name: user.name, username: user.username } });
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
    .replace(/\*/g, ''); // Remove * often found in OCR

  // 1. Better Amount Parsing
  // First, try to find the line with "TOPLAM" or "TUTAR" (Turkish for Total)
  const totalMatch = normalizedText.match(/(toplam|tutar|total)\s*(\d+([.,]\d+)?)/);
  if (totalMatch) {
    amount = parseFloat(totalMatch[2].replace(',', '.'));
  } else {
    // Fallback: Get the largest number in the text
    const amountMatches = normalizedText.match(/\d+([.,]\d+)?/g);
    if (amountMatches) {
      const amounts = amountMatches.map((m: string) => parseFloat(m.replace(',', '.')));
      amount = Math.max(...amounts);
    }
  }

  // 2. Keyword Search
  const categoryKeywords: Record<string, string[]> = {
    food: ["yemek", "restoran", "lokanta", "kahve", "simit", "corba", "kebap", "burger", "pizza", "mutfak", "migros", "bim", "sok", "carrefour"],
    shopping: ["market", "alisveris", "kıyafet", "ayakkabı", "fatura", "avm", "h&m", "zara", "boyner"],
    transport: ["benzin", "otobus", "taksi", "metro", "akbil", "yakit", "otopark", "kopru", "shell", "opet", "bp"],
    utilities: ["su", "elektrik", "dogalgaz", "internet", "telefon", "kira", "aidat", "turkcell", "vodafone"],
    health: ["eczane", "doktor", "ilac", "hastane", "saglik", "disci"],
    entertainment: ["sinema", "tiyatro", "konser", "oyun", "netflix", "spotify", "eglence"],
    travel: ["ucak", "otel", "tatil", "bilet", "pasaport", "konaklama", "thy", "pegasus"]
  };

  for (const [id, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => normalizedText.includes(keyword))) {
      categoryId = id;
      break;
    }
  }

  res.json({ amount, categoryId, description, date });
});

app.listen(port, () => console.log(`Server running on port ${port}`));

process.on('beforeExit', async () => await pool.end());
