import bcrypt from 'bcryptjs';
import { 
  User, 
  StudentProfile, 
  TutorProfile, 
  Course, 
  ExamResult, 
  ExamSchedule, 
  Bill, 
  Quiz, 
  ActivityLog, 
  Announcement 
} from '../models';

export const seedDatabase = async () => {
  try {
    // 1. Check if database already has users populated
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('🌱 Database already populated. Skipping database seeding.');
      return;
    }

    console.log('🌱 Database is empty. Seeding default Tutor CRM demo datasets...');

    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('admin123', salt);
    const tutorPass = await bcrypt.hash('tutor123', salt);
    const studentPass = await bcrypt.hash('student123', salt);
    const parentPass = await bcrypt.hash('parent123', salt);

    // 2. Create Base Users
    // Admin
    const adminUser = await User.create({
      email: 'admin@edumanage.com',
      passwordHash: adminPass,
      role: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      phone: '14155550000'
    });

    // Requested Admin Credentials
    const thallaPass = await bcrypt.hash('12345678', salt);
    await User.create({
      email: 'thalladachakri@gmail.com',
      passwordHash: thallaPass,
      role: 'admin',
      firstName: 'Chakri',
      lastName: 'Thallada',
      phone: '14155550009'
    });

    // Tutor Alistair
    const tutorUser = await User.create({
      email: 'alistair.miller@edumanage.com',
      passwordHash: tutorPass,
      role: 'tutor',
      firstName: 'Alistair',
      lastName: 'Miller',
      phone: '14155550001'
    });

    // Student Marcus
    const studentMarcus = await User.create({
      email: 'marcus.thorne@edumail.com',
      passwordHash: studentPass,
      role: 'student',
      firstName: 'Marcus',
      lastName: 'Thorne',
      phone: '14155550218'
    });

    // Parent Helena
    const parentHelena = await User.create({
      email: 'helena.thorne@edumanage.com',
      passwordHash: parentPass,
      role: 'parent',
      firstName: 'Helena',
      lastName: 'Thorne',
      phone: '14155554921'
    });

    // Other students
    const studentZoe = await User.create({
      email: 'zoe.vance@edumail.com',
      passwordHash: studentPass,
      role: 'student',
      firstName: 'Zoe',
      lastName: 'Vance',
      phone: '14155550410'
    });

    const studentLiam = await User.create({
      email: 'liam.sterling@edumail.com',
      passwordHash: studentPass,
      role: 'student',
      firstName: 'Liam',
      lastName: 'Sterling',
      phone: '14155551102'
    });

    const studentPenelope = await User.create({
      email: 'penelope.chen@edumail.com',
      passwordHash: studentPass,
      role: 'student',
      firstName: 'Penelope',
      lastName: 'Chen',
      phone: '14155559812'
    });

    const studentJasper = await User.create({
      email: 'jasper.vance@edumail.com',
      passwordHash: studentPass,
      role: 'student',
      firstName: 'Jasper',
      lastName: 'Vance',
      phone: '14155557731'
    });

    const studentEthan = await User.create({
      email: 'ethan.hunt@edumail.com',
      passwordHash: studentPass,
      role: 'student',
      firstName: 'Ethan',
      lastName: 'Hunt',
      phone: '14155553091'
    });

    // 3. Create Student Profiles
    await StudentProfile.create([
      { userId: studentMarcus._id, grade: '11th Grade', learningGoal: 'Excel in Physics mechanics and prepare for final SAT assessment', parentPhone: '14155554921', avgGrade: 3.8, progress: 84, status: 'Active' },
      { userId: studentZoe._id, grade: '10th Grade', learningGoal: 'General Chemistry focus and biotech project support', parentPhone: '14155558911', avgGrade: 4.0, progress: 92, status: 'Active' },
      { userId: studentLiam._id, grade: '12th Grade', learningGoal: 'Advanced calculus preparation for university mechanics', parentPhone: '14155551910', avgGrade: 3.2, progress: 76, status: 'Active' },
      { userId: studentPenelope._id, grade: '9th Grade', learningGoal: 'Improve algebra basics and functions', parentPhone: '14155550239', avgGrade: 3.5, progress: 45, status: 'Pending' },
      { userId: studentJasper._id, grade: '12th Grade', learningGoal: 'AP English literature review and thesis formatting', parentPhone: '14155558911', avgGrade: 3.7, progress: 88, status: 'Active' },
      { userId: studentEthan._id, grade: '11th Grade', learningGoal: 'Organic chemistry reactions preparation', parentPhone: '14155554311', avgGrade: 2.8, progress: 0, status: 'Inactive' }
    ]);

    // 4. Create Tutor Profiles
    await TutorProfile.create({
      userId: tutorUser._id,
      subject: 'Advanced Physics & Calculus',
      experience: '12 years',
      status: 'Active',
      courses: ['Physics Mechanics', 'Quantum Theory Basics', 'Calculus BC']
    });

    // 5. Create Courses
    await Course.create([
      { name: 'Advanced General Physics', tutorName: 'Prof. Alistair Miller', tutorId: tutorUser._id, schedule: 'Tue, Thu at 3:00 PM', iconType: 'physics', progress: 84, room: 'Lab Hall 4B', status: 'Active', level: 'Grade 11-12' },
      { name: 'Calculus BC Intensive Course', tutorName: 'Sarah Jenkins', tutorId: adminUser._id, schedule: 'Mon, Wed at 4:30 PM', iconType: 'math', progress: 78, room: 'Seminar A', status: 'Active', level: 'Grade 12' },
      { name: 'AP Chemistry Honors Lab', tutorName: 'Dr. Evelyn Sterling', tutorId: adminUser._id, schedule: 'Fri at 2:00 PM', iconType: 'chem', progress: 91, room: 'Room 302', status: 'Active', level: 'Grade 11' }
    ]);

    // 6. Create Exam Schedules
    await ExamSchedule.create([
      { name: 'Electromagnetism Final Exam', date: 'June 05, 2026', time: '10:00 AM', location: 'Main Examination Quad', type: 'Midterm' },
      { name: 'Complex Limits Practice Quiz', date: 'June 09, 2026', time: '04:30 PM', location: 'Tutoring Studio West', type: 'Quiz' }
    ]);

    // 7. Create Exam Results for Marcus
    await ExamResult.create([
      { studentId: studentMarcus._id, examName: 'Midterm Mechanics Mechanics Theory', date: 'April 22', score: 94, maxScore: 100, teacherNotes: 'Excellent understanding of rotational kinematic vectors. Keep it up Marcus.' },
      { studentId: studentMarcus._id, examName: 'Thermodynamics Assessment 2', date: 'May 10', score: 81, maxScore: 100, teacherNotes: 'Solid results, pay closer attention to standard heat expansion variables on Exam Part B.' },
      { studentId: studentMarcus._id, examName: 'Calculus BC Integration Quiz', date: 'May 24', score: 88, maxScore: 90, teacherNotes: 'Magnificent integration bounds implementation.' }
    ]);

    // 8. Create Bills for Marcus (linked to parent Helena)
    await Bill.create([
      { studentId: studentMarcus._id, itemName: 'Weekly Physics Tutoring Package Charge', paidDate: 'May 28', amount: 320, status: 'Paid' },
      { studentId: studentMarcus._id, itemName: 'Chemistry Lab Material Registration Surcharge', paidDate: '-', amount: 120, status: 'Pending' },
      { studentId: studentMarcus._id, itemName: 'Math Materials and Workbook Printing Fee', paidDate: 'May 04', amount: 45, status: 'Paid' },
      { studentId: studentMarcus._id, itemName: 'Calculus Prep Advanced Session Billing (Overdue)', paidDate: '-', amount: 180, status: 'Overdue' }
    ]);

    // 9. Create System Announcements
    await Announcement.create([
      { title: 'Interactive Science Symposium 2026', content: 'Join Dr. Sterling for an exploratory biotechnology seminar on chemical engineering. Students of all grade tiers welcome. Registration closes next Wednesday.', timeAgo: '2 hours ago', iconType: 'celebration' },
      { title: 'Summer Term Academic Scheduling Notice', content: 'Weekly tutoring session timesheets will transition fully to the Summer Shift standard effective June 15. Standard reservations will be locked.', timeAgo: '1 day ago', iconType: 'event' },
      { title: 'New Multi-Role Login Launch complete', content: 'Our state of the art EduManage Student, Parent and Tutor workspace CRM system interface is fully operational worldwide.', timeAgo: '3 days ago', iconType: 'info' }
    ]);

    // 10. Seed Quizzes
    await Quiz.create({
      title: 'Electromagnetic Fields Intro',
      subject: 'Electromagnetism',
      questionsCount: 1,
      tutorId: tutorUser._id,
      questions: [
        {
          id: 1,
          text: 'What is the SI unit of magnetic flux density?',
          options: ['Tesla', 'Weber', 'Henry', 'Farad'],
          correctAnswer: 'A'
        }
      ]
    });

    // 11. Seed Activity Logs
    await ActivityLog.create([
      { studentName: 'Marcus Thorne', initials: 'MT', type: 'New Enrollment', detail: 'Successfully enrolled by Administrator into AP Literature Course under Sarah Jenkins', dateTime: 'Today, 10:45 AM', status: 'Completed' },
      { studentName: 'Zoe Vance', initials: 'ZV', type: 'Fee Payment', detail: 'Automatic recurring payment received for Spring Tutors Session Fee package', dateTime: 'Today, 09:12 AM', amount: 320, status: 'Completed' },
      { studentName: 'Liam Sterling', initials: 'LS', type: 'Session Scheduled', detail: 'Private Calculus tutoring session booked with Sarah Jenkins for June 4', dateTime: 'Yesterday, 04:30 PM', status: 'Pending' },
      { studentName: 'Marcus Thorne', initials: 'MT', type: 'Payment Failed', detail: 'Late Fee of ₹120 overdue billing UPI transaction decline - network timeout standard', dateTime: '2 Days ago', amount: 120, status: 'Failed' },
      { studentName: 'Penelope Chen', initials: 'PC', type: 'New Enrollment', detail: 'Account created and awaiting verification checklist status approval', dateTime: '3 Days ago', status: 'Active' }
    ]);

    console.log('🌱 Database seeded successfully.');
  } catch (error) {
    console.error('❌ Failed to seed database:', error);
  }
};
