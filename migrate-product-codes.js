const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Product = require('./src/models/Product');

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    // Find products without productCode or where it is null
    const products = await Product.find({ $or: [{ productCode: { $exists: false } }, { productCode: null }] });
    console.log(`Found ${products.length} products without productCode.`);

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      // Generate a unique legacy code: LEGACY- + last 4 chars of ID + i
      const newCode = `LG-${product._id.toString().slice(-4).toUpperCase()}${i}`;
      
      // we use collection updateOne to bypass mongoose strict schema validation for this one-time task
      await mongoose.connection.collection('products').updateOne(
        { _id: product._id },
        { $set: { productCode: newCode } }
      );
      
      console.log(`Updated product ${product.name} with code ${newCode}`);
    }

    console.log('Migration complete.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
