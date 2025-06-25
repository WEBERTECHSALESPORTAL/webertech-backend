const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(bodyParser.json());

// In-memory users and sales database
const users = [];
const sales = [];
const stock = [];

const SECRET_KEY = 'webertech_secret';

// Middleware to verify token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Register route
app.post('/api/register', (req, res) => {
  const { name, username, password, isAdmin } = req.body;
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  users.push({ name, username, password, isAdmin });
  res.json({ message: 'Registered' });
});

// Login route
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ username: user.username, isAdmin: user.isAdmin }, SECRET_KEY);
  res.json({ token, name: user.name, isAdmin: user.isAdmin });
});

// Sales routes
app.get('/api/sales', authenticateToken, (req, res) => {
  res.json(sales);
});

app.post('/api/sales', authenticateToken, (req, res) => {
  const sale = { ...req.body, employee: req.user.username, date: new Date(), _id: Date.now().toString() };
  sales.push(sale);
  res.json(sale);
});

app.delete('/api/sales', authenticateToken, (req, res) => {
  const { id } = req.body;
  const index = sales.findIndex(s => s._id === id);
  if (index !== -1) {
    sales.splice(index, 1);
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// Stock routes (admin only)
app.get('/api/stock', authenticateToken, (req, res) => {
  if (!req.user.isAdmin) return res.sendStatus(403);
  res.json(stock);
});

app.post('/api/stock', authenticateToken, (req, res) => {
  if (!req.user.isAdmin) return res.sendStatus(403);
  stock.push(req.body);
  res.json({ message: 'Stock added' });
});

app.listen(3000, () => console.log('Server running on port 3000'));
