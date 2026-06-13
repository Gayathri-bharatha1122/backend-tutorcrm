import bcrypt from 'bcryptjs';

// Initial datasets mirroring data.ts
const salt = bcrypt.genSaltSync(10);
const studentPass = bcrypt.hashSync('student123', salt);
const parentPass = bcrypt.hashSync('parent123', salt);
const tutorPass = bcrypt.hashSync('tutor123', salt);
const adminPass = bcrypt.hashSync('admin123', salt);
const thallaPass = bcrypt.hashSync('12345678', salt);

// In-memory collections
export const collections: Record<string, any[]> = {
  User: [
    { _id: 'u-admin', email: 'admin@edumanage.com', passwordHash: adminPass, role: 'admin', firstName: 'System', lastName: 'Administrator', phone: '14155550000', createdAt: new Date(), updatedAt: new Date() },
    { _id: 'u-thalla', email: 'thalladachakri@gmail.com', passwordHash: thallaPass, role: 'admin', firstName: 'Chakri', lastName: 'Thallada', phone: '14155550009', createdAt: new Date(), updatedAt: new Date() },
    { _id: 'u-tutor', email: 'alistair.miller@edumanage.com', passwordHash: tutorPass, role: 'tutor', firstName: 'Alistair', lastName: 'Miller', phone: '14155550001', createdAt: new Date(), updatedAt: new Date() },
    { _id: 'u-marcus', email: 'marcus.thorne@edumail.com', passwordHash: studentPass, role: 'student', firstName: 'Marcus', lastName: 'Thorne', phone: '14155550218', createdAt: new Date(), updatedAt: new Date() },
    { _id: 'u-helena', email: 'helena.thorne@edumanage.com', passwordHash: parentPass, role: 'parent', firstName: 'Helena', lastName: 'Thorne', phone: '14155554921', createdAt: new Date(), updatedAt: new Date() },
    { _id: 'u-zoe', email: 'zoe.vance@edumail.com', passwordHash: studentPass, role: 'student', firstName: 'Zoe', lastName: 'Vance', phone: '14155550410', createdAt: new Date(), updatedAt: new Date() },
    { _id: 'u-liam', email: 'liam.sterling@edumail.com', passwordHash: studentPass, role: 'student', firstName: 'Liam', lastName: 'Sterling', phone: '14155551102', createdAt: new Date(), updatedAt: new Date() },
    { _id: 'u-penelope', email: 'penelope.chen@edumail.com', passwordHash: studentPass, role: 'student', firstName: 'Penelope', lastName: 'Chen', phone: '14155559812', createdAt: new Date(), updatedAt: new Date() },
    { _id: 'u-jasper', email: 'jasper.vance@edumail.com', passwordHash: studentPass, role: 'student', firstName: 'Jasper', lastName: 'Vance', phone: '14155557731', createdAt: new Date(), updatedAt: new Date() },
    { _id: 'u-ethan', email: 'ethan.hunt@edumail.com', passwordHash: studentPass, role: 'student', firstName: 'Ethan', lastName: 'Hunt', phone: '14155553091', createdAt: new Date(), updatedAt: new Date() }
  ],
  StudentProfile: [
    { _id: 'sp-marcus', userId: 'u-marcus', grade: '11th Grade', learningGoal: 'Excel in Physics mechanics and prepare for final SAT assessment', parentPhone: '14155554921', avgGrade: 3.8, progress: 84, status: 'Active' },
    { _id: 'sp-zoe', userId: 'u-zoe', grade: '10th Grade', learningGoal: 'Chemistry Honors', parentPhone: '14155558911', avgGrade: 4.0, progress: 92, status: 'Active' },
    { _id: 'sp-liam', userId: 'u-liam', grade: '12th Grade', learningGoal: 'Calculus BC', parentPhone: '14155551910', avgGrade: 3.2, progress: 76, status: 'Active' },
    { _id: 'sp-penelope', userId: 'u-penelope', grade: '9th Grade', learningGoal: 'Algebra I', parentPhone: '14155550239', avgGrade: 3.5, progress: 45, status: 'Pending' },
    { _id: 'sp-jasper', userId: 'u-jasper', grade: '12th Grade', learningGoal: 'AP Literature', parentPhone: '14155558911', avgGrade: 3.7, progress: 88, status: 'Active' },
    { _id: 'sp-ethan', userId: 'u-ethan', grade: '11th Grade', learningGoal: 'Organic Chemistry', parentPhone: '14155554311', avgGrade: 2.8, progress: 0, status: 'Inactive' }
  ],
  TutorProfile: [
    { _id: 'tp-tutor', userId: 'u-tutor', subject: 'Advanced Physics & Calculus', experience: '12 years', status: 'Active', courses: ['Physics Mechanics', 'Quantum Theory Basics', 'Calculus BC'], salaryStatus: 'Credited', attendance: '96%' }
  ],
  Course: [
    { _id: 'c-physics', name: 'Advanced General Physics', tutorName: 'Prof. Alistair Miller', tutorId: 'u-tutor', schedule: 'Tue, Thu at 3:00 PM', iconType: 'physics', progress: 84, room: 'Lab Hall 4B' },
    { _id: 'c-math', name: 'Calculus BC Intensive Course', tutorName: 'Sarah Jenkins', tutorId: 'u-admin', schedule: 'Mon, Wed at 4:30 PM', iconType: 'math', progress: 78, room: 'Seminar A' },
    { _id: 'c-chem', name: 'AP Chemistry Honors Lab', tutorName: 'Dr. Evelyn Sterling', tutorId: 'u-admin', schedule: 'Fri at 2:00 PM', iconType: 'chem', progress: 91, room: 'Room 302' }
  ],
  ExamSchedule: [
    { _id: 'es-1', name: 'Electromagnetism Final Exam', date: 'June 05, 2026', time: '10:00 AM', location: 'Main Examination Quad', type: 'Midterm' },
    { _id: 'es-2', name: 'Complex Limits Practice Quiz', date: 'June 09, 2026', time: '04:30 PM', location: 'Tutoring Studio West', type: 'Quiz' }
  ],
  ExamResult: [
    { _id: 'er-1', studentId: 'u-marcus', examName: 'Midterm Mechanics Mechanics Theory', date: 'April 22', score: 94, maxScore: 100, teacherNotes: 'Excellent understanding of rotational kinematic vectors. Keep it up Marcus.' },
    { _id: 'er-2', studentId: 'u-marcus', examName: 'Thermodynamics Assessment 2', date: 'May 10', score: 81, maxScore: 100, teacherNotes: 'Solid results, pay closer attention to standard heat expansion variables on Exam Part B.' },
    { _id: 'er-3', studentId: 'u-marcus', examName: 'Calculus BC Integration Quiz', date: 'May 24', score: 88, maxScore: 90, teacherNotes: 'Magnificent integration bounds implementation.' }
  ],
  Bill: [
    { _id: 'b-1', studentId: 'u-marcus', itemName: 'Weekly Physics Tutoring Package Charge', paidDate: 'May 28', amount: 320, status: 'Paid' },
    { _id: 'b-2', studentId: 'u-marcus', itemName: 'Chemistry Lab Material Registration Surcharge', paidDate: '-', amount: 120, status: 'Pending' },
    { _id: 'b-3', studentId: 'u-marcus', itemName: 'Math Materials and Workbook Printing Fee', paidDate: 'May 04', amount: 45, status: 'Paid' },
    { _id: 'b-4', studentId: 'u-marcus', itemName: 'Calculus Prep Advanced Session Billing (Overdue)', paidDate: '-', amount: 180, status: 'Overdue' }
  ],
  Quiz: [
    {
      _id: 'q-1',
      title: 'Electromagnetic Fields Intro',
      subject: 'Electromagnetism',
      questionsCount: 1,
      tutorId: 'u-tutor',
      questions: [
        {
          id: 1,
          text: 'What is the SI unit of magnetic flux density?',
          options: ['Tesla', 'Weber', 'Henry', 'Farad'],
          correctAnswer: 'A'
        }
      ]
    }
  ],
  QuizSubmission: [],
  Attendance: [],
  Announcement: [
    { _id: 'an-1', title: 'Interactive Science Symposium 2026', content: 'Join Dr. Sterling for an exploratory biotechnology seminar on chemical engineering. Students of all grade tiers welcome. Registration closes next Wednesday.', timeAgo: '2 hours ago', iconType: 'celebration', createdAt: new Date() },
    { _id: 'an-2', title: 'Summer Term Academic Scheduling Notice', content: 'Weekly tutoring session timesheets will transition fully to the Summer Shift standard effective June 15. Standard reservations will be locked.', timeAgo: '1 day ago', iconType: 'event', createdAt: new Date() },
    { _id: 'an-3', title: 'New Multi-Role Login Launch complete', content: 'Our state of the art EduManage Student, Parent and Tutor workspace CRM system interface is fully operational worldwide.', timeAgo: '3 days ago', iconType: 'info', createdAt: new Date() }
  ],
  ActivityLog: [
    { _id: 'act-1', studentName: 'Marcus Thorne', initials: 'MT', type: 'New Enrollment', detail: 'Successfully enrolled by Administrator into AP Literature Course under Sarah Jenkins', dateTime: 'Today, 10:45 AM', status: 'Completed' },
    { _id: 'act-2', studentName: 'Zoe Vance', initials: 'ZV', type: 'Fee Payment', detail: 'Automatic recurring payment received for Spring Tutors Session Fee package', dateTime: 'Today, 09:12 AM', amount: 320, status: 'Completed' },
    { _id: 'act-3', studentName: 'Liam Sterling', initials: 'LS', type: 'Session Scheduled', detail: 'Private Calculus tutoring session booked with Sarah Jenkins for June 4', dateTime: 'Yesterday, 04:30 PM', status: 'Pending' },
    { _id: 'act-4', studentName: 'Marcus Thorne', initials: 'MT', type: 'Payment Failed', detail: 'Late Fee of ₹120 overdue billing UPI transaction decline - network timeout standard', dateTime: '2 Days ago', amount: 120, status: 'Failed' },
    { _id: 'act-5', studentName: 'Penelope Chen', initials: 'PC', type: 'New Enrollment', detail: 'Account created and awaiting verification checklist status approval', dateTime: '3 Days ago', status: 'Active' }
  ],
  Message: [],
  Feedback: [
    { _id: 'fb-1', authorId: 'u-marcus', authorRole: 'student', authorName: 'Marcus Thorne', feedback: 'The Physics sessions have been very thorough and helpful. Prof. Miller explains every concept with great clarity.', rating: 5, submissionDate: 'May 28, 2026', status: 'Reviewed', createdAt: new Date() },
    { _id: 'fb-2', authorId: 'u-helena', authorRole: 'parent', authorName: 'Helena Thorne', feedback: 'Very satisfied with the progress my child has made. The personalised attention is outstanding.', rating: 4, submissionDate: 'May 30, 2026', status: 'Pending', createdAt: new Date() }
  ]
};

// Builder to create common query methods for a mock collection
const createMockModel = (collectionName: string) => {
  const getItems = () => collections[collectionName];

  // Helper function to attach save and populate methods to objects
  const attachSave = (item: any) => {
    if (!item) return item;
    const result = { ...item };
    result.save = async function() {
      const list = getItems();
      const idx = list.findIndex(x => x._id === this._id);
      if (idx !== -1) {
        // Strip save and populate functions so they don't persist in the raw array
        const savedItem = { ...this };
        delete (savedItem as any).save;
        delete (savedItem as any).populate;
        list[idx] = savedItem;
      }
      return this;
    };
    result.populate = async (path: string) => {
      if (path === 'userId') {
        const mappedUser = collections.User.find(u => u._id.toString() === item.userId.toString());
        result.userId = mappedUser ? attachSave({ ...mappedUser }) : item.userId;
      }
      return result;
    };
    return result;
  };

  return {
    find(filter: any = {}) {
      let items = [...getItems()];
      if (filter) {
        items = items.filter(item => {
          for (const key in filter) {
            // Simple match OR logic for messaging
            if (key === '$or' && Array.isArray(filter[key])) {
              const matchesOr = filter[key].some((subFilter: any) => {
                for (const subKey in subFilter) {
                  if (item[subKey] !== subFilter[subKey]) return false;
                }
                return true;
              });
              if (!matchesOr) return false;
              continue;
            }
            if (filter[key] instanceof RegExp) {
              if (!filter[key].test(item[key])) return false;
              continue;
            }
            if (key === 'phone' && typeof filter[key] === 'object' && filter[key].$regex) {
              const regex = new RegExp(filter[key].$regex);
              if (!regex.test(item.phone)) return false;
              continue;
            }
            if (item[key] !== filter[key]) return false;
          }
          return true;
        });
      }

      // Chainable return helpers
      const result: any = items.map(attachSave);
      result.sort = () => result;
      result.limit = () => result;
      result.lean = () => result;
      result.populate = () => result;
      return result;
    },

    findOne(filter: any = {}) {
      const items = this.find(filter);
      return items[0] || null;
    },

    findById(id: any) {
      return this.findOne({ _id: id });
    },

    async create(data: any) {
      const list = getItems();
      if (Array.isArray(data)) {
        const createdItems = data.map((item, idx) => {
          return {
            _id: `mock-${collectionName.toLowerCase()}-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...item
          };
        });
        list.push(...createdItems);
        return createdItems.map(attachSave);
      } else {
        const newObj = {
          _id: `mock-${collectionName.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data
        };
        list.push(newObj);
        return attachSave(newObj);
      }
    },

    async findOneAndUpdate(filter: any, update: any, options: any = {}) {
      let match = this.findOne(filter);
      const list = getItems();
      
      if (!match) {
        if (options.upsert) {
          // Generate new obj
          const fields = filter.$or ? filter.$or[0] : filter;
          const uData = update.$set || update;
          match = await this.create({ ...fields, ...uData });
          return match;
        }
        return null;
      }

      // Perform update on match
      const updatedFields = update.$set || update;
      Object.assign(match, updatedFields);
      
      const idx = list.findIndex(x => x._id === match._id);
      if (idx !== -1) {
        const savedItem = { ...match };
        delete (savedItem as any).save;
        delete (savedItem as any).populate;
        list[idx] = savedItem;
      }
      
      return match;
    },

    async deleteOne(filter: any = {}) {
      const list = getItems();
      const matchIdx = list.findIndex(item => {
        for (const key in filter) {
          if (item[key] !== filter[key]) return false;
        }
        return true;
      });
      if (matchIdx !== -1) {
        list.splice(matchIdx, 1);
        return { deletedCount: 1 };
      }
      return { deletedCount: 0 };
    },

    async deleteMany(filter: any = {}) {
      const list = getItems();
      let deletedCount = 0;
      for (let i = list.length - 1; i >= 0; i--) {
        const item = list[i];
        let matches = true;
        for (const key in filter) {
          if (item[key] !== filter[key]) {
            matches = false;
            break;
          }
        }
        if (matches) {
          list.splice(i, 1);
          deletedCount++;
        }
      }
      return { deletedCount };
    },

    async countDocuments(filter: any = {}) {
      const items = this.find(filter);
      return items.length;
    }
  };
};

export const mockStore = {
  User: createMockModel('User'),
  StudentProfile: createMockModel('StudentProfile'),
  TutorProfile: createMockModel('TutorProfile'),
  Course: createMockModel('Course'),
  ExamResult: createMockModel('ExamResult'),
  ExamSchedule: createMockModel('ExamSchedule'),
  Bill: createMockModel('Bill'),
  Quiz: createMockModel('Quiz'),
  QuizSubmission: createMockModel('QuizSubmission'),
  Attendance: createMockModel('Attendance'),
  ActivityLog: createMockModel('ActivityLog'),
  Announcement: createMockModel('Announcement'),
  Message: createMockModel('Message'),
  Feedback: createMockModel('Feedback')
};
