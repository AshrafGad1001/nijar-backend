const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const backupDir = path.join(__dirname, 'db-backup');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

async function backup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nijar');
    console.log('Connected to DB for backup');

    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      const data = await collection.find({}).toArray();
      fs.writeFileSync(
        path.join(backupDir, `${collection.collectionName}.json`),
        JSON.stringify(data, null, 2)
      );
      console.log(`Backed up ${collection.collectionName} (${data.length} records)`);
    }

    console.log('Backup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

backup();
