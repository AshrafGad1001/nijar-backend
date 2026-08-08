require('dotenv').config();
const mongoose = require('mongoose');

async function runMigration() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/nijar';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const productsCollection = mongoose.connection.collection('products');
    const products = await productsCollection.find({}).toArray();

    let updatedCount = 0;

    for (const product of products) {
      let needsUpdate = false;
      const updateDoc = { $set: {} };

      // Check technicalDetails
      if (product.technicalDetails && typeof product.technicalDetails.dimensions === 'string') {
        needsUpdate = true;
        updateDoc.$set['technicalDetails.dimensions'] = { length: null, width: null, height: null };
      }

      // Check sizes (variants)
      if (product.sizes && Array.isArray(product.sizes)) {
        product.sizes.forEach((size, index) => {
          if (size.variantDetails && typeof size.variantDetails.dimensions === 'string') {
            needsUpdate = true;
            updateDoc.$set[`sizes.${index}.variantDetails.dimensions`] = { length: null, width: null, height: null };
          }
        });
      }

      if (needsUpdate) {
        await productsCollection.updateOne({ _id: product._id }, updateDoc);
        console.log(`Updated product: ${product.name} (${product._id})`);
        updatedCount++;
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} products.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
