import mongoose, { Schema, Document } from 'mongoose';
import { mockStore } from './mockStore';

// Flag to switch between Mongoose and Mock
export let useMockDb = false;

export const setUseMockDb = (val: boolean) => {
  useMockDb = val;
  if (val) {
    console.log('⚠️ Database switched to in-memory Mock Store.');
  }
};

const createModelProxy = (modelName: string, mongooseModel: any) => {
  return new Proxy(mongooseModel, {
    get(target, prop, receiver) {
      if (useMockDb) {
        const mockModel = (mockStore as any)[modelName];
        if (mockModel && prop in mockModel) {
          return mockModel[prop];
        }
      }
      return Reflect.get(target, prop, receiver);
    }
  });
};

// 1. USER MODEL
export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: 'admin' | 'tutor' | 'student' | 'parent';
  firstName: string;
  lastName: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'tutor', 'student', 'parent'], required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true, unique: true, index: true }
}, { timestamps: true });

const UserRaw = mongoose.model<IUser>('User', UserSchema);
export const User = createModelProxy('User', UserRaw) as any;


// 2. STUDENT PROFILE MODEL
export interface IStudentProfile extends Document {
  userId: mongoose.Types.ObjectId;
  grade: string;
  learningGoal: string;
  parentPhone?: string;
  avgGrade: number;
  progress: number;
  status: 'Active' | 'Pending' | 'Inactive';
}

const StudentProfileSchema = new Schema<IStudentProfile>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  grade: { type: String, default: '11th Grade' },
  learningGoal: { type: String, default: '' },
  parentPhone: { type: String, default: '' },
  avgGrade: { type: Number, default: 3.5 },
  progress: { type: Number, default: 60 },
  status: { type: String, enum: ['Active', 'Pending', 'Inactive'], default: 'Active' }
});

const StudentProfileRaw = mongoose.model<IStudentProfile>('StudentProfile', StudentProfileSchema);
export const StudentProfile = createModelProxy('StudentProfile', StudentProfileRaw) as any;


// 3. TUTOR PROFILE MODEL
export interface ITutorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  subject: string;
  experience: string;
  status: 'Active' | 'On Leave';
  courses: string[];
  salaryStatus: 'Credited' | 'Pending';
  attendance: string;
}

const TutorProfileSchema = new Schema<ITutorProfile>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  subject: { type: String, required: true },
  experience: { type: String, required: true },
  status: { type: String, enum: ['Active', 'On Leave'], default: 'Active' },
  courses: { type: [String], default: [] },
  salaryStatus: { type: String, enum: ['Credited', 'Pending'], default: 'Pending' },
  attendance: { type: String, default: '95%' }
});

const TutorProfileRaw = mongoose.model<ITutorProfile>('TutorProfile', TutorProfileSchema);
export const TutorProfile = createModelProxy('TutorProfile', TutorProfileRaw) as any;


// 4. COURSE MODEL
export interface ICourse extends Document {
  name: string;
  tutorName: string;
  tutorId: mongoose.Types.ObjectId;
  schedule: string;
  iconType: 'math' | 'physics' | 'lit' | 'chem';
  progress: number;
  room?: string;
  status: 'Active' | 'Upcoming' | 'Draft';
  level: string;
}

const CourseSchema = new Schema<ICourse>({
  name: { type: String, required: true },
  tutorName: { type: String, required: true },
  tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  schedule: { type: String, required: true },
  iconType: { type: String, enum: ['math', 'physics', 'lit', 'chem'], required: true },
  progress: { type: Number, default: 60 },
  room: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Upcoming', 'Draft'], default: 'Active' },
  level: { type: String, default: 'Grade 11-12' }
});

const CourseRaw = mongoose.model<ICourse>('Course', CourseSchema);
export const Course = createModelProxy('Course', CourseRaw) as any;


// 5. EXAM RESULT MODEL
export interface IExamResult extends Document {
  studentId: mongoose.Types.ObjectId;
  examName: string;
  date: string;
  score: number;
  maxScore: number;
  teacherNotes: string;
}

const ExamResultSchema = new Schema<IExamResult>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  examName: { type: String, required: true },
  date: { type: String, required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  teacherNotes: { type: String, default: '' }
});

const ExamResultRaw = mongoose.model<IExamResult>('ExamResult', ExamResultSchema);
export const ExamResult = createModelProxy('ExamResult', ExamResultRaw) as any;


// 6. EXAM SCHEDULE MODEL
export interface IExamSchedule extends Document {
  name: string;
  date: string;
  time: string;
  location: string;
  type: 'Midterm' | 'Quiz';
}

const ExamScheduleSchema = new Schema<IExamSchedule>({
  name: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String, enum: ['Midterm', 'Quiz'], required: true }
});

const ExamScheduleRaw = mongoose.model<IExamSchedule>('ExamSchedule', ExamScheduleSchema);
export const ExamSchedule = createModelProxy('ExamSchedule', ExamScheduleRaw) as any;


// 7. TUITION BILL MODEL
export interface IBill extends Document {
  studentId: mongoose.Types.ObjectId;
  itemName: string;
  paidDate: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
}

const BillSchema = new Schema<IBill>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  itemName: { type: String, required: true },
  paidDate: { type: String, default: '-' },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Pending' }
});

const BillRaw = mongoose.model<IBill>('Bill', BillSchema);
export const Bill = createModelProxy('Bill', BillRaw) as any;


// 8. SUBJECT QUIZ MODEL
export interface IQuizQuestion {
  id: number;
  text: string;
  options: string[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export interface IQuiz extends Document {
  title: string;
  subject: string;
  questionsCount: number;
  questions: IQuizQuestion[];
  tutorId: mongoose.Types.ObjectId;
}

const QuizSchema = new Schema<IQuiz>({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  questionsCount: { type: Number, required: true },
  questions: [{
    id: { type: Number, required: true },
    text: { type: String, required: true },
    options: { type: [String], required: true },
    correctAnswer: { type: String, enum: ['A', 'B', 'C', 'D'], required: true }
  }],
  tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

const QuizRaw = mongoose.model<IQuiz>('Quiz', QuizSchema);
export const Quiz = createModelProxy('Quiz', QuizRaw) as any;


// 9. QUIZ SUBMISSION MODEL
export interface IQuizSubmission extends Document {
  quizId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  answers: Record<number, string>;
  score: number;
  total: number;
  submittedAt: Date;
}

const QuizSubmissionSchema = new Schema<IQuizSubmission>({
  quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  answers: { type: Schema.Types.Mixed, required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now }
});

const QuizSubmissionRaw = mongoose.model<IQuizSubmission>('QuizSubmission', QuizSubmissionSchema);
export const QuizSubmission = createModelProxy('QuizSubmission', QuizSubmissionRaw) as any;


// 10. ATTENDANCE LOG MODEL
export interface IAttendance extends Document {
  studentId: mongoose.Types.ObjectId;
  date: string;
  status: 'Present' | 'Absent' | 'Excused';
  markedBy: mongoose.Types.ObjectId;
}

const AttendanceSchema = new Schema<IAttendance>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Excused'], required: true },
  markedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});
AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

const AttendanceRaw = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
export const Attendance = createModelProxy('Attendance', AttendanceRaw) as any;


// 11. AUDIT ACTIVITY LOG MODEL
export interface IActivityLog extends Document {
  studentName: string;
  initials?: string;
  type: 'New Enrollment' | 'Fee Payment' | 'Session Scheduled' | 'Payment Failed';
  detail: string;
  dateTime: string;
  amount?: number;
  status: 'Active' | 'Completed' | 'Pending' | 'Failed';
}

const ActivityLogSchema = new Schema<IActivityLog>({
  studentName: { type: String, required: true },
  initials: { type: String, default: '' },
  type: { type: String, enum: ['New Enrollment', 'Fee Payment', 'Session Scheduled', 'Payment Failed'], required: true },
  detail: { type: String, required: true },
  dateTime: { type: String, required: true },
  amount: { type: Number },
  status: { type: String, enum: ['Active', 'Completed', 'Pending', 'Failed'], required: true }
});

const ActivityLogRaw = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
export const ActivityLog = createModelProxy('ActivityLog', ActivityLogRaw) as any;


// 12. DIRECT CHAT MESSAGES MODEL
export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  text: string;
  timestamp: Date;
}

const MessageSchema = new Schema<IMessage>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const MessageRaw = mongoose.model<IMessage>('Message', MessageSchema);
export const Message = createModelProxy('Message', MessageRaw) as any;


// 13. SYSTEM ANNOUNCEMENTS MODEL
export interface IAnnouncement extends Document {
  title: string;
  content: string;
  timeAgo: string;
  iconType: 'event' | 'celebration' | 'info';
  createdAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  timeAgo: { type: String, required: true },
  iconType: { type: String, enum: ['event', 'celebration', 'info'], required: true },
  createdAt: { type: Date, default: Date.now }
});

const AnnouncementRaw = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
export const Announcement = createModelProxy('Announcement', AnnouncementRaw) as any;


// 14. FEEDBACK & RATING MODEL
export interface IFeedback extends Document {
  authorId: mongoose.Types.ObjectId;
  authorRole: 'student' | 'parent';
  authorName: string;
  feedback: string;
  rating: number;
  submissionDate: string;
  status: 'Reviewed' | 'Pending';
}

const FeedbackSchema = new Schema<IFeedback>({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  authorRole: { type: String, enum: ['student', 'parent'], required: true },
  authorName: { type: String, required: true },
  feedback: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  submissionDate: { type: String, required: true },
  status: { type: String, enum: ['Reviewed', 'Pending'], default: 'Pending' }
}, { timestamps: true });

const FeedbackRaw = mongoose.model<IFeedback>('Feedback', FeedbackSchema);
export const Feedback = createModelProxy('Feedback', FeedbackRaw) as any;
