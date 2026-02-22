import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid'; // Import uuid

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;
const jwtSecret = process.env.JWT_SECRET;
console.log('JWT_SECRET loaded:', jwtSecret ? '****' + jwtSecret.substring(jwtSecret.length - 4) : 'NOT SET'); // Log JWT Secret

app.use(cors());
app.use(express.json());

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

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is not set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(client => {
    console.log('Connected to PostgreSQL database!');
    client.release();
  })
  .catch(err => {
    console.error('Error connecting to PostgreSQL database:', err.message);
  });

// Middleware to protect routes
const protect = (req: Request, res: Response, next: NextFunction) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, jwtSecret!) as { userId: number; email: string };
      req.user = { id: decoded.userId, email: decoded.email };
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};


app.get('/', (req, res) => {
  res.send('Aura Finance Backend is running!');
});

app.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, icon, color FROM "Category"');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: 'Failed to fetch categories', details: errorMessage });
  }
});

// Auth registration endpoint
app.post('/auth/register', async (req, res) => {
  const { email, password, name, username } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  // Username must be unique if provided
  if (username && typeof username === 'string') {
    const existingUser = await pool.query('SELECT id FROM "User" WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Username already taken' });
    }
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO "User" (email, password_hash, name, username) VALUES ($1, $2, $3, $4) RETURNING id, email, name, username',
      [email, hashedPassword, name, username]
    );
    const user = result.rows[0];

    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret!, { expiresIn: '1h' });

    res.status(201).json({ message: 'User registered successfully', token, user: { id: user.id, email: user.email, name: user.name, username: user.username } });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      return res.status(409).json({ message: 'User with this email already exists' });
    }
    console.error('Error during registration:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: 'Error registering user', details: errorMessage });
  }
});

// Auth login endpoint
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const result = await pool.query('SELECT id, email, name, username, password_hash FROM "User" WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret!, { expiresIn: '1h' });

    res.status(200).json({ message: 'Logged in successfully', token, user: { id: user.id, email: user.email, name: user.name, username: user.username } });
  } catch (error) {
    console.error('Error during login:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: 'Error logging in', details: errorMessage });
  }
});

// Protected route example
app.get('/protected', protect, (req, res) => {
  res.json({ message: `Welcome ${req.user?.email}, you have access to protected data!`, user: req.user });
});

// POST /expenses endpoint
app.post('/expenses', protect, async (req, res) => {
  const { amount, categoryId, description, date, notes } = req.body;
  const userId = req.user?.id;
  const id = uuidv4(); // Generate a unique ID

  // Basic validation
  if (!amount || !categoryId || !description || !date || !userId) {
    return res.status(400).json({ message: 'Missing required expense fields' });
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ message: 'Amount must be a positive number' });
  }
  if (typeof description !== 'string' || description.length === 0) {
    return res.status(400).json({ message: 'Description is required' });
  }
  if (isNaN(new Date(date).getTime())) {
    return res.status(400).json({ message: 'Invalid date format' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO "Expense" (id, amount, "categoryId", description, date, notes, "userId") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, amount, categoryId, description, date, notes, userId]
    );
    res.status(201).json({ message: 'Expense added successfully', expense: result.rows[0] });
  } catch (error) {
    console.error('Error adding expense:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: 'Error adding expense', details: errorMessage });
  }
});

// PUT /expenses/:id endpoint - Protected (Update Expense)
app.put('/expenses/:id', protect, async (req, res) => {
  const { id } = req.params;
  const { amount, categoryId, description, date, notes } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: User ID not found' });
  }

  // Basic validation (similar to POST, but all fields are optional for update)
  if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
    return res.status(400).json({ message: 'Amount must be a positive number' });
  }
  if (description !== undefined && (typeof description !== 'string' || description.length === 0)) {
    return res.status(400).json({ message: 'Description is required' });
  }
  if (date !== undefined && isNaN(new Date(date).getTime())) {
    return res.status(400).json({ message: 'Invalid date format' });
  }

  try {
    const existingExpense = await pool.query('SELECT "userId" FROM "Expense" WHERE id = $1', [id]);
    if (existingExpense.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    if (existingExpense.rows[0].userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized: You do not own this expense' });
    }

    const setClauses: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (amount !== undefined) {
      setClauses.push(`amount = $${paramIndex++}`);
      queryParams.push(amount);
    }
    if (categoryId !== undefined) {
      setClauses.push(`"categoryId" = $${paramIndex++}`);
      queryParams.push(categoryId);
    }
    if (description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      queryParams.push(description);
    }
    if (date !== undefined) {
      setClauses.push(`date = $${paramIndex++}`);
      queryParams.push(date);
    }
    if (notes !== undefined) {
      setClauses.push(`notes = $${paramIndex++}`);
      queryParams.push(notes);
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ message: 'No fields provided for update' });
    }

    queryParams.push(id); // $paramIndex for id
    const updateResult = await pool.query(
      `UPDATE "Expense" SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      queryParams
    );

    res.status(200).json({ message: 'Expense updated successfully', expense: updateResult.rows[0] });
  } catch (error) {
    console.error('Error updating expense:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: 'Error updating expense', details: errorMessage });
  }
});

// DELETE /expenses/:id endpoint - Protected
app.delete('/expenses/:id', protect, async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: User ID not found' });
  }

  try {
    const existingExpense = await pool.query('SELECT "userId" FROM "Expense" WHERE id = $1', [id]);
    if (existingExpense.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    if (existingExpense.rows[0].userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized: You do not own this expense' });
    }

    await pool.query('DELETE FROM "Expense" WHERE id = $1', [id]);
    res.status(204).send(); // No content for successful deletion
  } catch (error) {
    console.error('Error deleting expense:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: 'Error deleting expense', details: errorMessage });
  }
});

// GET /expenses endpoint - Protected
app.get('/expenses', protect, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: User ID not found' });
  }

  try {
    const result = await pool.query(
      'SELECT id, amount, "categoryId", description, date, notes, "userId" FROM "Expense" WHERE "userId" = $1 ORDER BY date DESC',
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: 'Error fetching expenses', details: errorMessage });
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

process.on('beforeExit', async () => {
  await pool.end();
});
