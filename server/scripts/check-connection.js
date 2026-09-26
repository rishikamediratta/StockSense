import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from '../src/db/connect.js';

try {
  const db = await connectDatabase();
  await db.db.admin().command({ ping: 1 });
  console.log(`MongoDB connected: ${db.name}`);
} catch (error) {
  console.error(`MongoDB connection failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
