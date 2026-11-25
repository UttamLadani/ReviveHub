import mongoose from 'mongoose';
import { config, assertConfig } from './config.js';
import { createApp } from './app.js';

assertConfig();

try {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB.');
} catch (e) {
  console.error('\nCould not connect to MongoDB:', e.message);
  console.error('Check MONGODB_URI in .env, the database password, and Atlas > Network Access.\n');
  process.exit(1);
}

createApp().listen(config.port, () => {
  console.log(`ReviveHub API running on http://localhost:${config.port}`);
});
