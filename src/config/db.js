const mongoose = require('mongoose');

const connectDB = async () => {
    try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Fail fast in 5 seconds
      family: 4 // Force IPv4 to fix DNS resolution issues
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    throw error; // Let Vercel log the unhandled rejection instead of crashing instantly without trace
  }
};

module.exports = connectDB;
