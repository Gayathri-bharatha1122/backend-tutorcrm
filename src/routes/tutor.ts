import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middlewares/auth';
import { User, StudentProfile, TutorProfile, Attendance, ExamResult, Quiz, ExamSchedule, ActivityLog } from '../models';

const router = Router();

router.use(authenticateToken);

// Helper function to build a search regex based on tutor's subject & courses
const getTutorSearchRegex = (tutorProfile: any) => {
  const terms = new Set<string>();
  
  if (tutorProfile.courses) {
    tutorProfile.courses.forEach((c: string) => {
      const clean = c.trim().toLowerCase();
      if (clean) terms.add(clean);
      
      const words = clean.split(/\s+/);
      words.forEach(w => {
        if (w.length > 3 && !['basics', 'theory', 'general', 'advanced', 'course', 'intensive', 'honors', 'prep', 'study', 'final', 'exam'].includes(w)) {
          terms.add(w);
        }
      });
    });
  }
  
  if (tutorProfile.subject) {
    const cleanSub = tutorProfile.subject.trim().toLowerCase();
    terms.add(cleanSub);
    const words = cleanSub.split(/[\s&]+/);
    words.forEach(w => {
      if (w.length > 3 && !['basics', 'theory', 'general', 'advanced', 'course', 'intensive', 'honors', 'prep', 'study', 'final', 'exam'].includes(w)) {
        terms.add(w);
      }
    });
  }
  
  if (terms.size === 0) {
    return /^$/;
  }

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = Array.from(terms).map(t => escapeRegExp(t)).join('|');
  return new RegExp(pattern, 'i');
};

// 1. FETCH TUTOR'S ASSIGNED STUDENTS
router.get('/students', async (req: AuthRequest, res: Response) => {
  try {
    const tutorId = req.user?.id;
    const tutorProfile = await TutorProfile.findOne({ userId: tutorId }).lean();

    if (!tutorProfile) {
      return res.json([]);
    }

    const searchRegex = getTutorSearchRegex(tutorProfile);

    // Query matching student profiles first that are approved/active
    const profiles = await StudentProfile.find({ learningGoal: searchRegex, status: 'Active' }).lean();

    // Fetch corresponding users one by one to support mock store compatibility (which doesn't support $in)
    const studentData: any[] = [];
    for (const p of profiles) {
      if (!p.userId) continue;
      const s = await User.findOne({ _id: p.userId }).lean();
      if (s) {
        studentData.push({
          id: s._id,
          name: `${s.firstName} ${s.lastName}`,
          grade: p.grade || '11th Grade',
          subject: p.learningGoal || 'Advanced Physics',
          attendanceRate: p.progress !== undefined ? p.progress : 95
        });
      }
    }

    return res.json(studentData);
  } catch (error) {
    console.error('Error fetching tutor student roster:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 2. SUBMIT / MARK ATTENDANCE
router.post('/attendance', async (req: AuthRequest, res: Response) => {
  const { studentId, status } = req.body;
  const tutorId = req.user?.id;

  if (!studentId || !status || !tutorId) {
    return res.status(400).json({ error: 'Student ID and attendance status are required.' });
  }

  try {
    const studentProfile = await StudentProfile.findOne({ userId: studentId });
    if (!studentProfile) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }
    if (studentProfile.status !== 'Active') {
      return res.status(403).json({ error: 'Student account is pending administrator approval.' });
    }

    const tutorProfile = await TutorProfile.findOne({ userId: tutorId }).lean();
    if (!tutorProfile) {
      return res.status(403).json({ error: 'Tutor profile not found.' });
    }

    const searchRegex = getTutorSearchRegex(tutorProfile);

    if (!searchRegex.test(studentProfile.learningGoal || '')) {
      return res.status(403).json({ error: 'You can only mark attendance for students registered in your courses.' });
    }

    const getKolkataDateString = () => {
      const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
      const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(new Date());
      const year = parts.find(p => p.type === 'year')?.value;
      const month = parts.find(p => p.type === 'month')?.value;
      const day = parts.find(p => p.type === 'day')?.value;
      return `${year}-${month}-${day}`;
    };

    const todayStr = req.body.date || getKolkataDateString();

    // Perform upsert for attendance status on student for today
    await Attendance.findOneAndUpdate(
      { studentId, date: todayStr },
      { status, markedBy: tutorId },
      { upsert: true, new: true }
    );

    // Retrieve student name to log activity
    const student = await User.findById(studentId);
    if (student) {
      // Calculate new cumulative attendance progress percentage
      const totalSessions = await Attendance.countDocuments({ studentId });
      const presentSessions = await Attendance.countDocuments({ studentId, status: 'Present' });
      
      const attRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 95;
      
      // Update student profile progress metric to show changes
      await StudentProfile.findOneAndUpdate({ userId: studentId }, { progress: attRate });
    }

    return res.json({ msg: 'Attendance logged successfully.' });
  } catch (error) {
    console.error('Error logging student attendance:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 3. COMPILE & RECORD ASSIGNMENT GRADE
router.post('/assignments/grade', async (req: AuthRequest, res: Response) => {
  const { studentId, assignmentName, score, feedback } = req.body;

  if (!studentId || !assignmentName || score === undefined) {
    return res.status(400).json({ error: 'Student ID, assignment name, and score are required.' });
  }

  try {
    const studentProfile = await StudentProfile.findOne({ userId: studentId });
    if (!studentProfile) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }
    if (studentProfile.status !== 'Active') {
      return res.status(403).json({ error: 'Student account is pending administrator approval.' });
    }

    const tutorProfile = await TutorProfile.findOne({ userId: req.user?.id }).lean();
    if (!tutorProfile) {
      return res.status(403).json({ error: 'Tutor profile not found.' });
    }

    const searchRegex = getTutorSearchRegex(tutorProfile);

    if (!searchRegex.test(studentProfile.learningGoal || '')) {
      return res.status(403).json({ error: 'You can only grade assignments for students registered in your courses.' });
    }

    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    
    // Log exam result database record
    const result = await ExamResult.create({
      studentId,
      examName: assignmentName,
      date: today,
      score,
      maxScore: 100,
      teacherNotes: feedback || ''
    });

    // Update Average Grade progress in Student Profile based on results
    const results = await ExamResult.find({ studentId });
    if (results.length > 0) {
      const avg = results.reduce((sum, r) => sum + (r.score / r.maxScore) * 100, 0) / results.length;
      const gpa = parseFloat((avg / 25).toFixed(1)); // Convert 0-100 score to 0-4.0 GPA scale
      await StudentProfile.findOneAndUpdate({ userId: studentId }, { avgGrade: gpa });
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error('Error logging assignment score:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 4. PUBLISH MULTI-CHOICE TOPIC QUIZ
router.post('/quizzes/publish', async (req: AuthRequest, res: Response) => {
  const { title, subject, questions } = req.body;
  const tutorId = req.user?.id;

  if (!title || !subject || !questions || !Array.isArray(questions) || !tutorId) {
    return res.status(400).json({ error: 'Quiz title, subject, and questions array are required.' });
  }

  try {
    const newQuiz = await Quiz.create({
      title,
      subject,
      questionsCount: questions.length,
      questions: questions.map((q, idx) => ({
        id: q.id || idx + 1,
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer
      })),
      tutorId
    });

    return res.status(201).json(newQuiz);
  } catch (error) {
    console.error('Error publishing topic quiz:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 5. SCHEDULE LECTURE SESSION SEMINAR
router.post('/lectures/schedule', async (req: AuthRequest, res: Response) => {
  const { title, date, time, location } = req.body;

  if (!title || !date || !time || !location) {
    return res.status(400).json({ error: 'Lecture title, date, time, and location are required.' });
  }

  try {
    const session = await ExamSchedule.create({
      name: title,
      date,
      time,
      location,
      type: 'Quiz' // Default category as scheduled quiz/review session
    });

    return res.status(201).json(session);
  } catch (error) {
    console.error('Error scheduling lecture seminar:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 6. GET TUTOR PROFILE DETAILS
router.get('/profile', async (req: AuthRequest, res: Response) => {
  const tutorId = req.user?.id;
  if (!tutorId) return res.status(401).json({ error: 'Unauthorized.' });
  try {
    const profile = await TutorProfile.findOne({ userId: tutorId });
    if (!profile) {
      return res.status(404).json({ error: 'Tutor profile not found.' });
    }
    return res.json(profile);
  } catch (error) {
    console.error('Error fetching tutor profile:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
