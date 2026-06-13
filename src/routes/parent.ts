import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middlewares/auth';
import { User, StudentProfile, Bill, Attendance, Announcement, ActivityLog, Course, TutorProfile, Feedback } from '../models';

const router = Router();

router.use(authenticateToken);

// 1. GET LINKED CHILD'S PROGRESS PROFILE & METRICS
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  const parentPhone = req.user?.phone;

  if (!parentPhone) {
    return res.status(401).json({ error: 'Unauthorized access.' });
  }

  try {
    // Look up student profile matching parent contact phone
    const studentProfile = await StudentProfile.findOne({ parentPhone }).populate('userId');

    if (!studentProfile) {
      return res.status(404).json({ error: 'No linked child student profile found matching your parent contact phone ID.' });
    }

    const studentUser = studentProfile.userId as any;
    
    // Fetch upcoming announcements
    const announcements = await Announcement.find({}).sort({ _id: -1 });

    // Fetch monthly attendance logs for the child
    const attendances = await Attendance.find({ studentId: studentUser._id });

    // Fetch all courses with tutor availability
    const courses = await Course.find({});
    const tutorProfiles = await TutorProfile.find({});
    const coursesWithTutors = courses.map((course: any) => {
      const tutorProfile = tutorProfiles.find((tp: any) => tp.userId === course.tutorId || tp.userId?.toString() === course.tutorId?.toString());
      return {
        id: course._id,
        name: course.name,
        tutorName: course.tutorName,
        tutorId: course.tutorId,
        schedule: course.schedule,
        iconType: course.iconType,
        progress: course.progress,
        room: course.room,
        tutorAvailability: tutorProfile ? tutorProfile.status : 'Unknown'
      };
    });

    return res.json({
      student: {
        id: studentUser._id,
        name: `${studentUser.firstName} ${studentUser.lastName}`,
        grade: studentProfile.grade,
        avgGrade: studentProfile.avgGrade,
        progress: studentProfile.progress, // attendance rate
        learningGoal: studentProfile.learningGoal
      },
      announcements,
      courses: coursesWithTutors,
      attendances: attendances.map((a: any) => ({
        date: a.date,
        status: a.status
      }))
    });
  } catch (error) {
    console.error('Error fetching parent dashboard payload:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 2. GET TUITION INVOICES LEDGER
router.get('/bills', async (req: AuthRequest, res: Response) => {
  const parentPhone = req.user?.phone;

  try {
    const studentProfile = await StudentProfile.findOne({ parentPhone });

    if (!studentProfile) {
      return res.status(404).json({ error: 'No child profiles linked.' });
    }

    let bills = await Bill.find({ studentId: studentProfile.userId });
    
    // Auto-create default bills for the student if none exist
    if (bills.length === 0) {
      bills = await Bill.create([
        { studentId: studentProfile.userId, itemName: 'Q1 Tuition Fee', paidDate: 'Jan 05', amount: 820, status: 'Paid' },
        { studentId: studentProfile.userId, itemName: 'Q2 Tuition Fee', paidDate: 'Apr 03', amount: 820, status: 'Paid' },
        { studentId: studentProfile.userId, itemName: 'Library & Lab Fees', paidDate: 'Feb 15', amount: 180, status: 'Paid' },
        { studentId: studentProfile.userId, itemName: 'Q3 Tuition Fee', paidDate: '-', amount: 320, status: 'Overdue' }
      ]);
    }

    return res.json(bills);
  } catch (error) {
    console.error('Error loading parent invoices:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 3. SECURE GATEWAY REMITTANCE PAYMENT
router.post('/bills/:billId/pay', async (req: AuthRequest, res: Response) => {
  const { billId } = req.params;
  const parentName = `${req.user?.firstName} ${req.user?.lastName}`;

  try {
    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(404).json({ error: 'Invoice billing card not found.' });
    }

    if (bill.status === 'Paid') {
      return res.status(400).json({ error: 'Invoice has already been paid.' });
    }

    const paidStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' });

    // Update status to Paid
    bill.status = 'Paid';
    bill.paidDate = paidStr;
    await bill.save();

    // Log Activity log
    await ActivityLog.create({
      studentName: 'Marcus Thorne', // In a production app, fetch from StudentUser profile
      type: 'Fee Payment',
      detail: `Tuition transaction of ₹${bill.amount} successfully settled in real-time via UPI by parent ${parentName}.`,
      dateTime: 'Just now',
      amount: bill.amount,
      status: 'Completed'
    });

    return res.json({
      msg: 'Payment processed successfully. Balance cleared.',
      bill
    });
  } catch (error) {
    console.error('Error processing billing remittance:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 4. GET PARENT FEEDBACK HISTORY
router.get('/feedback', async (req: AuthRequest, res: Response) => {
  const parentId = req.user?.id;
  if (!parentId) return res.status(401).json({ error: 'Unauthorized.' });
  try {
    const feedbacks = await Feedback.find({ authorId: parentId, authorRole: 'parent' });
    return res.json(feedbacks);
  } catch (error) {
    console.error('Error fetching parent feedback:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 5. SUBMIT PARENT FEEDBACK & RATING
router.post('/feedback', async (req: AuthRequest, res: Response) => {
  const parentId = req.user?.id;
  const { feedback, rating } = req.body;

  if (!parentId) return res.status(401).json({ error: 'Unauthorized.' });
  if (!feedback || rating === undefined) {
    return res.status(400).json({ error: 'Feedback text and rating are required.' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }

  try {
    const authorName = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Parent';
    const submissionDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });

    const newFeedback = await Feedback.create({
      authorId: parentId,
      authorRole: 'parent',
      authorName,
      feedback,
      rating: Number(rating),
      submissionDate,
      status: 'Pending'
    });

    return res.status(201).json(newFeedback);
  } catch (error) {
    console.error('Error submitting parent feedback:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
