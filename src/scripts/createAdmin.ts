import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/tutorcrm';

const UserSchema = new mongoose.Schema({
  email: String,
  passwordHash: String,
  role: String,
  firstName: String,
  lastName: String,
  phone: String,
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createAdmin() {
  await mongoose.connect(DATABASE_URL);
  console.log('Connected to MongoDB');

  const email = 'thalladachakri@gmail.com';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`User with email ${email} already exists. Updating role to admin...`);
    existing.role = 'admin';
    const salt = await bcrypt.genSalt(10);
    existing.passwordHash = await bcrypt.hash('12345678', salt);
    await existing.save();
    console.log('✅ User updated to admin successfully.');
  } else {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('12345678', salt);
    await User.create({
      email,
      passwordHash,
      role: 'admin',
      firstName: 'Chakri',
      lastName: 'Thallada',
      phone: '',
    });
    console.log('✅ Admin user created successfully.');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

createAdmin().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
