require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');
const Bundle = require('./src/models/Bundle');

// Set NEW cloudinary credentials
cloudinary.config({
  cloud_name: 'ncatnhlx',
  api_key: '229815893992482',
  api_secret: 'jEY9EjYGtObEwXv3MizTPE0dmCg'
});

async function uploadFromUrl(oldUrl, folder) {
  if (!oldUrl) return null;
  // If it's already using the new cloud name, skip it
  if (oldUrl.includes('ncatnhlx')) {
    return null; // Signals no update needed
  }
  
  console.log('Uploading:', oldUrl);
  try {
    const result = await cloudinary.uploader.upload(oldUrl, {
      folder: folder,
      resource_type: 'image'
    });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (error) {
    console.error('Error uploading', oldUrl, error.message);
    return null;
  }
}

async function migrate() {
  try {
    // Add family: 4 to mongoose options to avoid IPv6 issues
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    console.log('MongoDB Connected...');

    // 1. Migrate Categories
    console.log('Migrating Categories...');
    const categories = await Category.find();
    for (let cat of categories) {
      if (cat.image && cat.image.url) {
        const newImg = await uploadFromUrl(cat.image.url, 'nijar/categories');
        if (newImg) {
          cat.image = newImg;
          await cat.save();
          console.log(`Category updated: ${cat.name}`);
        }
      }
    }

    // 2. Migrate Products
    console.log('Migrating Products...');
    const products = await Product.find();
    for (let prod of products) {
      let isUpdated = false;
      
      // Main image
      if (prod.image && prod.image.url) {
        const newImg = await uploadFromUrl(prod.image.url, 'nijar/items');
        if (newImg) {
          prod.image = newImg;
          isUpdated = true;
        }
      }
      
      // Gallery images
      if (prod.gallery && prod.gallery.length > 0) {
        const newGallery = [];
        for (let gImg of prod.gallery) {
          if (gImg && gImg.url) {
            const newGImg = await uploadFromUrl(gImg.url, 'nijar/gallery');
            if (newGImg) {
              newGallery.push(newGImg);
              isUpdated = true;
            } else {
              // If it fails or is already new, keep the existing one
              newGallery.push(gImg);
            }
          }
        }
        prod.gallery = newGallery;
      }
      
      if (isUpdated) {
        await prod.save();
        console.log(`Product updated: ${prod.name}`);
      }
    }

    // 3. Migrate Bundles
    console.log('Migrating Bundles...');
    const bundles = await Bundle.find();
    for (let bnd of bundles) {
      if (bnd.image && bnd.image.url) {
        const newImg = await uploadFromUrl(bnd.image.url, 'nijar/bundles');
        if (newImg) {
          bnd.image = newImg;
          await bnd.save();
          console.log(`Bundle updated: ${bnd.name}`);
        }
      }
    }

    console.log('Migration Completed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
