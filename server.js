const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middlewares/errorHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const cookieParser = require('cookie-parser');

const app = express();
app.set('trust proxy', 1);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Enable CORS
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(url => url.trim()) 
  : ['http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Mount routes
app.use('/api/v1/auth', require('./src/routes/authRoutes'));
app.use('/api/v1/categories', require('./src/routes/categoryRoutes'));
app.use('/api/v1/products', require('./src/routes/productRoutes'));
app.use('/api/v1/bundles', require('./src/routes/bundleRoutes'));
app.use('/api/v1/catalog', require('./src/routes/catalogRoutes'));
app.use('/api/v1/settings', require('./src/routes/settingsRoutes'));

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
