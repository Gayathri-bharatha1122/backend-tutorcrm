import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { setUseMockDb } from '../models';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/tutorcrm';

export const connectDB = async () => {
  try {
    await mongoose.connect(DATABASE_URL, {
      serverSelectionTimeoutMS: 2000
    });
    console.log('⚡ Connected to MongoDB successfully.');
  } catch (error) {
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
