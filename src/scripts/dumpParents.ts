import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, StudentProfile, Bill } from '../models';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/tutorcrm';

async function main() {
  await mongoose.connect(DATABASE_URL);
  console.log('Connected to MongoDB');

  try {
    const parentUsers = await User.find({ role: 'parent' }).lean();
    const studentProfiles = await StudentProfile.find({}).lean();
    const studentUsers = await User.find({ role: 'student' }).lean();
    const allBills = await Bill.find({}).lean();

    const parentsData = parentUsers.map((parent) => {
      const linkedProfiles = studentProfiles.filter(sp => sp.parentPhone === parent.phone);
      const linkedStudents = linkedProfiles.map(sp => {
        const stuUser = studentUsers.find(u => u._id.toString() === sp.userId.toString());
        const stuBills = allBills.filter(b => b.studentId && b.studentId.toString() === sp.userId.toString());
        const outstandingDues = stuBills
          .filter(b => b.status === 'Pending' || b.status === 'Overdue')
          .reduce((sum: number, b: any) => sum + b.amount, 0);

        return {
          studentId: sp.userId,
          name: stuUser ? `${stuUser.firstName} ${stuUser.lastName}` : 'Unknown',
          email: stuUser?.email || '',
          grade: sp.grade || '',
          status: sp.status || 'Active',
          progress: sp.progress || 0,
          avgGrade: sp.avgGrade || 0,
          outstandingDues,
          spRaw: sp
        };
      });

      return {
        id: parent._id,
        name: `${parent.firstName} ${parent.lastName}`,
        email: parent.email,
        phone: parent.phone,
        linkedStudents
      };
    });

    console.log('--- REGISTERED PARENTS DUMP ---');
    console.log(JSON.stringify(parentsData, null, 2));

    const registeredParentPhones = new Set(parentUsers.map(p => p.phone));
    const unregisteredGroups: Record<string, any[]> = {};

    studentProfiles.forEach(sp => {
      if (sp.parentPhone && !registeredParentPhones.has(sp.parentPhone)) {
        if (!unregisteredGroups[sp.parentPhone]) unregisteredGroups[sp.parentPhone] = [];
        const stuUser = studentUsers.find(u => u._id.toString() === sp.userId.toString());
        unregisteredGroups[sp.parentPhone].push({
          studentId: sp.userId,
          name: stuUser ? `${stuUser.firstName} ${stuUser.lastName}` : 'Unknown',
          spRaw: sp
        });
      }
    });

    console.log('--- UNREGISTERED GROUPS ---');
    console.log(JSON.stringify(unregisteredGroups, null, 2));

  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);
