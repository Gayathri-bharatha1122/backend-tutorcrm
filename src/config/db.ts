import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { setUseMockDb } from '../models';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/tutorcrm';

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    console.log('⚡ Reusing existing MongoDB connection.');
    return;
  }

  const isServerless = !!(process.env.VERCEL || process.env.NODE_ENV === 'production');
  const timeoutMs = isServerless ? 15000 : 2000;

  try {
    await mongoose.connect(DATABASE_URL, {
      serverSelectionTimeoutMS: timeoutMs
    });
    console.log('⚡ Connected to MongoDB successfully.');
  } catch (error: any) {
    console.error(`❌ Failed to connect to MongoDB at ${DATABASE_URL.split('@').pop()}:`, error.message);
    
    if (isServerless) {
      // In serverless, do not fall back to MongoMemoryServer as it fails/times out
      throw error;
    }

    console.log('⚠️ Failed to connect to local MongoDB. Starting in-memory MongoDB Server...');
    try {
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      console.log('⚡ Connected to In-Memory MongoDB successfully.');
    } catch (memError) {
      console.log('❌ Failed to start In-Memory MongoDB. Falling back to Mock Store.');
      setUseMockDb(true);
    }
  }
};

