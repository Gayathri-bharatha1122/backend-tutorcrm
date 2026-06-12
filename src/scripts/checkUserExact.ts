import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/tutorcrm';

async function main() {
  await mongoose.connect(DATABASE_URL);
  console.log('Connected to MongoDB');

  const user = await User.findOne({ email: /chakri/i });
  if (user) {
    console.log('User found! Details:');
    console.log(JSON.stringify(user, null, 2));
  } else {
    console.log('No user matching chakri found.');
  }

  await mongoose.disconnect();
}

main().catch(console.error);
