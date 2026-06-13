import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, StudentProfile, Bill } from '../models';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/tutorcrm';

async function main() {
  await mongoose.connect(DATABASE_URL);
  console.log('Connected to MongoDB');

  try {
    console.log('Fetching data...');
    const parentUsers = await User.find({ role: 'parent' }).lean();
    console.log(`Found ${parentUsers.length} parents.`);
    
    const studentProfiles = await StudentProfile.find({}).lean();
    console.log(`Found ${studentProfiles.length} student profiles.`);
    
    const studentUsers = await User.find({ role: 'student' }).lean();
    console.log(`Found ${studentUsers.length} student users.`);
    
    const allBills = await Bill.find({}).lean();
    console.log(`Found ${allBills.length} bills.`);

    const parentsData = parentUsers.map((parent, idx) => {
      console.log(`Processing parent ${idx}: ${parent.firstName} ${parent.lastName} (Phone: ${parent.phone})`);
      const linkedProfiles = studentProfiles.filter(sp => sp.parentPhone === parent.phone);

      const linkedStudents = linkedProfiles.map(sp => {
        if (!sp.userId) {
          console.warn(`WARNING: studentProfile ${sp._id} has no userId!`);
          return {
            studentId: null,
            name: 'Unknown',
            email: '',
            grade: sp.grade || '',
            status: sp.status || 'Active',
            progress: sp.progress || 0,
            avgGrade: sp.avgGrade || 0,
            outstandingDues: 0
          };
        }
        
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
          outstandingDues
        };
      });

      return {
        id: parent._id,
        name: `${parent.firstName} ${parent.lastName}`,
        email: parent.email,
        phone: parent.phone,
        createdAt: parent.createdAt,
        linkedStudents,
        totalStudents: linkedStudents.length,
        totalOutstanding: linkedStudents.reduce((s, st) => s + st.outstandingDues, 0)
      };
    });

    console.log(`Successfully compiled parentsData. count: ${parentsData.length}`);

    // Check unregistered parents logic
    const registeredParentPhones = new Set(parentUsers.map(p => p.phone));
    const unregisteredGroups: Record<string, any[]> = {};

    studentProfiles.forEach(sp => {
      if (sp.parentPhone && !registeredParentPhones.has(sp.parentPhone)) {
        if (!unregisteredGroups[sp.parentPhone]) unregisteredGroups[sp.parentPhone] = [];
        
        if (!sp.userId) {
          console.warn(`WARNING: unregistered studentProfile ${sp._id} has no userId!`);
          return;
        }

        const stuUser = studentUsers.find(u => u._id.toString() === sp.userId.toString());
        const stuBills = allBills.filter(b => b.studentId && b.studentId.toString() === sp.userId.toString());
        const outstandingDues = stuBills
          .filter(b => b.status === 'Pending' || b.status === 'Overdue')
          .reduce((sum: number, b: any) => sum + b.amount, 0);

        unregisteredGroups[sp.parentPhone].push({
          studentId: sp.userId,
          name: stuUser ? `${stuUser.firstName} ${stuUser.lastName}` : 'Unknown',
          email: stuUser?.email || '',
          grade: sp.grade || '',
          status: sp.status || 'Active',
          progress: sp.progress || 0,
          avgGrade: sp.avgGrade || 0,
          outstandingDues
        });
      }
    });

    const unregisteredParents = Object.entries(unregisteredGroups).map(([phone, students]) => ({
      id: null,
      name: 'Unregistered Parent',
      email: null,
      phone,
      createdAt: null,
      linkedStudents: students,
      totalStudents: students.length,
      totalOutstanding: students.reduce((s: number, st: any) => s + st.outstandingDues, 0),
      unregistered: true
    }));

    console.log(`Successfully compiled unregisteredParents. count: ${unregisteredParents.length}`);
    console.log('Total result array count:', parentsData.length + unregisteredParents.length);
  } catch (error: any) {
    console.error('CRITICAL ERROR:', error);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);
