const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const connectDB = require('../config/db');
const Admin = require('../models/Admin');

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      await Admin.create({
        email: 'admin@nijar.com',
        password: 'admin123'
      });
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }

    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
