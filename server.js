const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middlewares/errorHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
app.set('trust proxy', 1);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Mount routes
app.use('/api/v1/auth', require('./src/routes/authRoutes'));
app.use('/api/v1/categories', require('./src/routes/categoryRoutes'));
app.use('/api/v1/items', require('./src/routes/menuItemRoutes'));
app.use('/api/v1/menu', require('./src/routes/menuRoutes'));

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'Nijar API is running' });
});

// Error handler (must be after routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
