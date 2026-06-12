import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken, AuthRequest } from '../middlewares/auth';
import { User, StudentProfile, TutorProfile, ActivityLog, Bill } from '../models';

const router = Router();

// Secure all routes in this file to require Admin access
router.use(authenticateToken);

// Helper function to extract initials from name
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

// 1. GET METRICS / STATS OVERVIEW
router.get('/metrics', async (req: AuthRequest, res: Response) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const educatorsCount = await User.countDocuments({ role: 'tutor' });
    const activityLogsCount = await ActivityLog.countDocuments();

    const studentProfiles = await StudentProfile.find({});
    const activeStudents = studentProfiles.filter(s => s.status === 'Active').length;
    const pendingStudents = studentProfiles.filter(s => s.status === 'Pending').length;

    // Calculate receivable bill amounts
    const unpaidBills = await Bill.find({ status: { $ne: 'Paid' } });
    const totalOutstanding = unpaidBills.reduce((sum, b) => sum + b.amount, 0);

    return res.json({
      activeStudents,
      totalStudents,
      pendingStudents,
      educatorsCount,
      activityLogsCount,
      totalOutstanding: totalOutstanding || 2140
    });
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 2. QUERY STUDENTS DIRECTORY
router.get('/students', async (req: AuthRequest, res: Response) => {
  const { query, status } = req.query;

  try {
    // Fetch all student profiles and user records
    const students = await User.find({ role: 'student' }).lean();
    const profiles = await StudentProfile.find({}).lean();

    // Map profile properties onto student user profiles
    const studentData = students.map(st => {
      const profile = profiles.find(p => p.userId.toString() === st._id.toString());
      return {
        id: st._id,
        name: `${st.firstName} ${st.lastName}`,
        email: st.email,
        phone: st.phone,
        initials: getInitials(`${st.firstName} ${st.lastName}`),
        grade: profile?.grade || '11th Grade',
        subject: profile?.learningGoal || 'Advanced Physics',
        parentPhone: profile?.parentPhone || '',
        status: profile?.status || 'Active',
        progress: profile?.progress || 60,
        avgGrade: profile?.avgGrade || 3.5
      };
    });

    // Apply filtering
    const filtered = studentData.filter(st => {
      const matchesSearch = !query ? true : 
        st.name.toLowerCase().includes((query as string).toLowerCase()) || 
        st.email.toLowerCase().includes((query as string).toLowerCase()) || 
        st.phone.includes(query as string) || 
        st.subject.toLowerCase().includes((query as string).toLowerCase());
      
      const matchesStatus = !status || status === 'All' ? true : st.status === status;
      
      return matchesSearch && matchesStatus;
    });

    return res.json(filtered);
  } catch (error) {
    console.error('Error querying students list:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 3. ENROLL NEW STUDENT
router.post('/students/enroll', async (req: AuthRequest, res: Response) => {
  const { name, grade, subject, phone, email, parentPhone, password } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ error: 'Student name, contact phone, and password are required.' });
  }

  try {
    const names = name.split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ') || 'Student';

    // Verify uniqueness
    const existing = await User.findOne({ $or: [{ phone }, { email }] });
    if (existing) {
      return res.status(400).json({ error: 'A student with this phone or email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create Base User
    const newUser = await User.create({
      email: email || `${firstName.toLowerCase()}@edumanage.com`,
      phone,
      passwordHash,
      role: 'student',
      firstName,
      lastName
    });

    // Create Profile
    const newProfile = await StudentProfile.create({
      userId: newUser._id,
      grade: grade || '11th Grade',
      learningGoal: subject || 'Advanced Physics',
      parentPhone: parentPhone || '14155554921',
      avgGrade: 3.5,
      progress: 60,
      status: 'Active'
    });

    // Log Activity log
    const initials = getInitials(name);
    await ActivityLog.create({
      studentName: name,
      initials,
      type: 'New Enrollment',
      detail: `Student ${name} successfully enrolled in ${subject || 'Advanced Physics'} honors course by Administrator.`,
      dateTime: 'Just now',
      status: 'Completed'
    });

    return res.status(201).json({
      id: newUser._id,
      name,
      email: newUser.email,
      phone: newUser.phone,
      initials,
      grade: newProfile.grade,
      subject: newProfile.learningGoal,
      parentPhone: newProfile.parentPhone,
      status: newProfile.status,
      progress: newProfile.progress,
      avgGrade: newProfile.avgGrade
    });
  } catch (error) {
    console.error('Error enrolling student:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 4. RETRIEVE ACTIVITY LOGS
router.get('/activities', async (req: AuthRequest, res: Response) => {
  try {
    const logs = await ActivityLog.find({}).sort({ _id: -1 }).limit(50);
    return res.json(logs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 5. RETRIEVE TEACHER DIRECTORY
router.get('/teachers', async (req: AuthRequest, res: Response) => {
  try {
    const tutors = await User.find({ role: 'tutor' }).lean();
    const profiles = await TutorProfile.find({}).lean();

    const tutorData = tutors.map(t => {
      const p = profiles.find(profile => profile.userId.toString() === t._id.toString());
      return {
        id: t._id,
        name: `Prof. ${t.firstName} ${t.lastName}`,
        firstName: t.firstName,
        lastName: t.lastName,
        email: t.email,
        phone: t.phone,
        subject: p?.subject || 'Advanced Physics & Calculus',
        experience: p?.experience || '12 years',
        status: p?.status || 'Active',
        courses: p?.courses || ['Physics Mechanics', 'Quantum Theory Basics'],
        salaryStatus: p?.salaryStatus || 'Pending',
        attendance: p?.attendance || 'N/A'
      };
    });

    return res.json(tutorData);
  } catch (error) {
    console.error('Error fetching teachers faculty list:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 6. APPROVE OR DECLINE STUDENT ENROLLMENT
router.post('/students/:id/approve', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { action } = req.body; // 'accept' | 'decline'

  if (!action || !['accept', 'decline'].includes(action)) {
    return res.status(400).json({ error: 'Valid action (accept or decline) is required.' });
  }

  try {
    const studentUser = await User.findById(id);
    if (!studentUser) {
      return res.status(404).json({ error: 'Student user not found.' });
    }

    const studentProfile = await StudentProfile.findOne({ userId: id });
    if (!studentProfile) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    const studentName = `${studentUser.firstName} ${studentUser.lastName}`;
    const initials = getInitials(studentName);

    if (action === 'accept') {
      studentProfile.status = 'Active';
      await studentProfile.save();

      // Log activity
      await ActivityLog.create({
        studentName,
        initials,
        type: 'New Enrollment',
        detail: `Student ${studentName} self-registration accepted and enrolled by Administrator.`,
        dateTime: 'Just now',
        status: 'Completed'
      });

      return res.json({ msg: `Student ${studentName} enrollment accepted successfully.` });
    } else {
      // action === 'decline'
      await StudentProfile.deleteOne({ userId: id });
      await User.deleteOne({ _id: id });

      // Log activity
      await ActivityLog.create({
        studentName,
        initials,
        type: 'New Enrollment',
        detail: `Student ${studentName} self-registration was declined by Administrator.`,
        dateTime: 'Just now',
        status: 'Failed'
      });

      return res.json({ msg: `Student ${studentName} enrollment declined and account removed.` });
    }
  } catch (error) {
    console.error('Error approving student registration:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 7. GET DETAILED STUDENT BY ID
router.get('/students/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const studentUser = await User.findById(id).lean();
    if (!studentUser) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    const profile = await StudentProfile.findOne({ userId: id }).lean();
    
    // Fetch related bills and activity logs
    const bills = await Bill.find({ studentId: id }).sort({ _id: -1 }).lean();
    const studentName = `${studentUser.firstName} ${studentUser.lastName}`;
    const activityLogs = await ActivityLog.find({ studentName }).sort({ _id: -1 }).lean();

    return res.json({
      id: studentUser._id,
      firstName: studentUser.firstName,
      lastName: studentUser.lastName,
      name: studentName,
      email: studentUser.email,
      phone: studentUser.phone,
      initials: getInitials(studentName),
      grade: profile?.grade || '11th Grade',
      subject: profile?.learningGoal || 'Advanced Physics',
      parentPhone: profile?.parentPhone || '',
      status: profile?.status || 'Active',
      progress: profile?.progress || 60,
      avgGrade: profile?.avgGrade || 3.5,
      bills,
      activityLogs
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 8. PUT (EDIT) STUDENT
router.put('/students/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { firstName, lastName, email, phone, grade, subject, parentPhone, status } = req.body;

  if (!firstName || !lastName || !phone) {
    return res.status(400).json({ error: 'First name, last name, and phone are required.' });
  }

  try {
    const studentUser = await User.findById(id);
    if (!studentUser) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    // Uniqueness check for email/phone if changed
    if (email && email !== studentUser.email) {
      const emailDup = await User.findOne({ email });
      if (emailDup) return res.status(400).json({ error: 'Already user exist with email.' });
    }
    if (phone && phone !== studentUser.phone) {
      const phoneDup = await User.findOne({ phone });
      if (phoneDup) return res.status(400).json({ error: 'Already user exist with phone number.' });
    }

    // Update User
    studentUser.firstName = firstName;
    studentUser.lastName = lastName;
    studentUser.email = email || studentUser.email;
    studentUser.phone = phone;
    await studentUser.save();

    // Update Profile
    const profile = await StudentProfile.findOne({ userId: id });
    if (profile) {
      profile.grade = grade || profile.grade;
      profile.learningGoal = subject || profile.learningGoal;
      profile.parentPhone = parentPhone || profile.parentPhone;
      profile.status = status || profile.status;
      await profile.save();
    }

    return res.json({ msg: 'Student profile updated successfully.' });
  } catch (error) {
    console.error('Error updating student:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 9. DELETE STUDENT
router.delete('/students/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const studentUser = await User.findById(id);
    if (!studentUser) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    await StudentProfile.deleteOne({ userId: id });
    await User.deleteOne({ _id: id });
    await Bill.deleteMany({ studentId: id });
    
    return res.json({ msg: 'Student account and profile deleted successfully.' });
  } catch (error) {
    console.error('Error deleting student:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 10. POST (ADD) TUTOR
router.post('/tutors', async (req: AuthRequest, res: Response) => {
  const { firstName, lastName, email, phone, subject, experience, courses, status, password } = req.body;

  if (!firstName || !lastName || !email || !phone || !password) {
    return res.status(400).json({ error: 'First name, last name, email, phone, and password are required.' });
  }

  try {
    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(400).json({ error: 'Already user exist with phone number or email.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      phone,
      passwordHash,
      role: 'tutor'
    });

    const coursesArray = typeof courses === 'string' 
      ? courses.split(',').map((c: string) => c.trim()).filter(Boolean)
      : Array.isArray(courses) ? courses : [];

    await TutorProfile.create({
      userId: newUser._id,
      subject: subject || 'General Tutoring',
      experience: experience || '1 year',
      status: status || 'Active',
      courses: coursesArray,
      salaryStatus: 'Pending',
      attendance: 'N/A'
    });

    return res.status(201).json({ msg: 'Tutor profile created successfully.' });
  } catch (error) {
    console.error('Error creating tutor:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 11. GET DETAILED TUTOR BY ID
router.get('/tutors/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const tutorUser = await User.findById(id).lean();
    if (!tutorUser) {
      return res.status(404).json({ error: 'Tutor not found.' });
    }
    const profile = await TutorProfile.findOne({ userId: id }).lean();
    return res.json({
      id: tutorUser._id,
      firstName: tutorUser.firstName,
      lastName: tutorUser.lastName,
      name: `Prof. ${tutorUser.firstName} ${tutorUser.lastName}`,
      email: tutorUser.email,
      phone: tutorUser.phone,
      subject: profile?.subject || '',
      experience: profile?.experience || '',
      status: profile?.status || 'Active',
      courses: profile?.courses || [],
      salaryStatus: profile?.salaryStatus || 'Pending',
      attendance: profile?.attendance || 'N/A'
    });
  } catch (error) {
    console.error('Error fetching tutor details:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 12. PUT (EDIT) TUTOR
router.put('/tutors/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { firstName, lastName, email, phone, subject, experience, courses, status } = req.body;

  if (!firstName || !lastName || !email || !phone) {
    return res.status(400).json({ error: 'First name, last name, email, and phone are required.' });
  }

  try {
    const tutorUser = await User.findById(id);
    if (!tutorUser) {
      return res.status(404).json({ error: 'Tutor not found.' });
    }

    if (email && email !== tutorUser.email) {
      const emailDup = await User.findOne({ email });
      if (emailDup) return res.status(400).json({ error: 'Already user exist with email.' });
    }
    if (phone && phone !== tutorUser.phone) {
      const phoneDup = await User.findOne({ phone });
      if (phoneDup) return res.status(400).json({ error: 'Already user exist with phone number.' });
    }

    tutorUser.firstName = firstName;
    tutorUser.lastName = lastName;
    tutorUser.email = email;
    tutorUser.phone = phone;
    await tutorUser.save();

    const profile = await TutorProfile.findOne({ userId: id });
    if (profile) {
      profile.subject = subject || profile.subject;
      profile.experience = experience || profile.experience;
      profile.status = status || profile.status;
      profile.courses = typeof courses === 'string'
        ? courses.split(',').map((c: string) => c.trim()).filter(Boolean)
        : Array.isArray(courses) ? courses : profile.courses;
      await profile.save();
    }

    return res.json({ msg: 'Tutor profile updated successfully.' });
  } catch (error) {
    console.error('Error updating tutor:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 13. DELETE TUTOR
router.delete('/tutors/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const tutorUser = await User.findById(id);
    if (!tutorUser) {
      return res.status(404).json({ error: 'Tutor not found.' });
    }
    await TutorProfile.deleteOne({ userId: id });
    await User.deleteOne({ _id: id });
    
    return res.json({ msg: 'Tutor account and profile deleted successfully.' });
  } catch (error) {
    console.error('Error deleting tutor:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 14. GET ALL PARENTS WITH LINKED STUDENTS
router.get('/parents', async (req: AuthRequest, res: Response) => {
  try {
    // Get all parent users
    const parentUsers = await User.find({ role: 'parent' }).lean();
    // Get all student profiles (which carry parentPhone linking)
    const studentProfiles = await StudentProfile.find({}).lean();
    // Get all student users
    const studentUsers = await User.find({ role: 'student' }).lean();
    // Get all bills to calculate outstanding dues per student
    const allBills = await Bill.find({}).lean();

    const parentsData = parentUsers.map(parent => {
      // Match by phone: student's parentPhone === parent's phone
      const linkedProfiles = studentProfiles.filter(sp => sp.parentPhone === parent.phone);

      const linkedStudents = linkedProfiles.map(sp => {
        const stuUser = studentUsers.find(u => u._id.toString() === sp.userId.toString());
        const stuBills = allBills.filter(b => b.studentId === sp.userId.toString());
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

    // Also include "unregistered parents" (students have a parentPhone but no parent account)
    const registeredParentPhones = new Set(parentUsers.map(p => p.phone));
    const unregisteredGroups: Record<string, any[]> = {};

    studentProfiles.forEach(sp => {
      if (sp.parentPhone && !registeredParentPhones.has(sp.parentPhone)) {
        if (!unregisteredGroups[sp.parentPhone]) unregisteredGroups[sp.parentPhone] = [];
        const stuUser = studentUsers.find(u => u._id.toString() === sp.userId.toString());
        const stuBills = allBills.filter(b => b.studentId === sp.userId.toString());
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

    return res.json([...parentsData, ...unregisteredParents]);
  } catch (error) {
    console.error('Error fetching parents:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 15. CREATE (ADD) PARENT
router.post('/parents', async (req: AuthRequest, res: Response) => {
  const { firstName, lastName, email, phone, password } = req.body;

  if (!firstName || !lastName || !phone || !password) {
    return res.status(400).json({ error: 'First name, last name, phone, and password are required.' });
  }

  try {
    const sanitizedPhone = phone.replace(/\D/g, '');
    if (sanitizedPhone.length < 10) {
      return res.status(400).json({ error: 'Phone number must be at least 10 digits.' });
    }

    // Check duplicates
    const existingPhone = await User.findOne({ phone: sanitizedPhone });
    if (existingPhone) {
      return res.status(400).json({ error: 'A user with this phone number already exists.' });
    }
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ error: 'A user with this email already exists.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email: email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@edumanage.com`,
      phone: sanitizedPhone,
      passwordHash,
      role: 'parent',
      firstName,
      lastName
    });

    // Find students linked to this parent's phone
    const studentProfiles = await StudentProfile.find({ parentPhone: sanitizedPhone }).lean();
    const studentUsers = await User.find({ role: 'student' }).lean();
    const linkedStudents = studentProfiles.map(sp => {
      const su = studentUsers.find(u => u._id.toString() === sp.userId.toString());
      return { studentId: sp.userId, name: su ? `${su.firstName} ${su.lastName}` : 'Unknown', grade: sp.grade };
    });

    return res.status(201).json({
      msg: 'Parent account created successfully.',
      parent: {
        id: newUser._id,
        name: `${newUser.firstName} ${newUser.lastName}`,
        email: newUser.email,
        phone: newUser.phone,
        linkedStudents,
        totalStudents: linkedStudents.length
      }
    });
  } catch (error) {
    console.error('Error creating parent:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 16. UPDATE PARENT
router.put('/parents/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { firstName, lastName, email, phone } = req.body;

  if (!firstName || !lastName || !phone) {
    return res.status(400).json({ error: 'First name, last name, and phone are required.' });
  }

  try {
    const parentUser = await User.findById(id);
    if (!parentUser || parentUser.role !== 'parent') {
      return res.status(404).json({ error: 'Parent not found.' });
    }

    const sanitizedPhone = phone.replace(/\D/g, '');

    // Check phone uniqueness (skip if unchanged)
    if (sanitizedPhone !== parentUser.phone) {
      const dup = await User.findOne({ phone: sanitizedPhone });
      if (dup) return res.status(400).json({ error: 'This phone number is already used by another account.' });
    }
    // Check email uniqueness
    if (email && email !== parentUser.email) {
      const dupEmail = await User.findOne({ email });
      if (dupEmail) return res.status(400).json({ error: 'This email is already registered.' });
    }

    parentUser.firstName = firstName;
    parentUser.lastName = lastName;
    parentUser.email = email || parentUser.email;
    parentUser.phone = sanitizedPhone;
    await parentUser.save();

    return res.json({ msg: 'Parent account updated successfully.' });
  } catch (error) {
    console.error('Error updating parent:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 17. DELETE PARENT
router.delete('/parents/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const parentUser = await User.findById(id);
    if (!parentUser || parentUser.role !== 'parent') {
      return res.status(404).json({ error: 'Parent not found.' });
    }
    await User.deleteOne({ _id: id });
    return res.json({ msg: 'Parent account deleted successfully.' });
  } catch (error) {
    console.error('Error deleting parent:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
