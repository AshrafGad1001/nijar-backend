const mongoose = require('mongoose');
require('dotenv').config();
const Category = require('./src/models/Category');

async function updateSlugs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const categories = await Category.find();
    console.log(`Found ${categories.length} categories`);

    for (let cat of categories) {
      if (!cat.slug) {
        cat.markModified('name');
        await cat.save();
        console.log(`Updated slug for: ${cat.name} -> ${cat.slug}`);
      }
    }
    
    console.log('Update complete');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateSlugs();
