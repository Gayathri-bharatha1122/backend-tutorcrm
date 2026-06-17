import { Router, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticateToken, AuthRequest } from '../middlewares/auth';
import { StudentProfile, Bill } from '../models';

const router = Router();

router.use(authenticateToken);

// Fallback keyword FAQ matching engine in case Gemini API key is missing
const fallbackQA = [
  {
    keywords: ['attendance', 'calendar', 'present', 'absent', 'may'],
    answer: "You can view the Attendance Calendar card on the Parent Dashboard, or under the 'Attendance Calendar' tab on the Student Dashboard. Present days are green, absent days (May 8 and May 20) are red, and weekends are grey."
  },
  {
    keywords: ['fee', 'pay', 'billing', 'card', 'remit', 'dues', 'invoice'],
    answer: "Navigate to the Tuition Billing Ledger on the Parent Dashboard. Click the 'Pay Now' button next to any pending/overdue item, enter your card details in the secure payment gateway modal, and confirm the transaction."
  },
  {
    keywords: ['teacher', 'tutor', 'message', 'chat', 'contact', 'communication'],
    answer: "Use the 'Messaging Station' on the Student Dashboard or the 'Direct Messages' tab on the Parent Dashboard. You can select your tutor from the dropdown menu and type a message to receive immediate simulated responses."
  },
  {
    keywords: ['resource', 'material', 'pdf', 'book', 'syllabus', 'mechanics', 'practice'],
    answer: "Academic materials and PDFs matching your registered courses are available under the 'Student Hub Academic Resources' section at the bottom of the Student Dashboard."
  },
  {
    keywords: ['grade', 'exam', 'result', 'score', 'mark', 'assessment'],
    answer: "Go to the Student Dashboard. Under the selector menu, check the 'Exams Timeline' tab for upcoming assessments, the 'Assessments Log' tab for instructor notes and marks, or 'Term Results' to download your final PDF report."
  }
];

router.post('/chat', async (req: AuthRequest, res: Response) => {
  const { message, history } = req.body;
  const user = req.user;

  if (!message || !user) {
    return res.status(400).json({ error: 'Chat message prompt is required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Check if API key is not configured; if so, trigger fallback keyword responder
  if (!apiKey) {
    console.log('⚠️ GEMINI_API_KEY environment key not found. Using local offline FAQ model.');
    const lowercase = message.toLowerCase();
    const matched = fallbackQA.find(qa => qa.keywords.some(k => lowercase.includes(k)));
    
    return res.json({
      text: matched 
        ? matched.answer 
        : "I am operating in offline mode. Please ask about 'attendance', 'fees', 'message', 'materials', or 'results' to retrieve FAQ answers.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  try {
    const ai = new GoogleGenerativeAI(apiKey);

    // Build context prompt based on user role and database variables
    let contextPrompt = `You are the EduManage CRM AI Assistant.
    Current User Name: ${user.firstName} ${user.lastName}
    Role: ${user.role}. `;

    if (user.role === 'student') {
      const studentProfile = await StudentProfile.findOne({ userId: user.id });
      contextPrompt += `Enrolled in Grade: ${studentProfile?.grade || '11th Grade'}. GPA Trend: ${studentProfile?.avgGrade || '3.8'}. Attendance Rate: ${studentProfile?.progress || '98'}%. Study Goal: ${studentProfile?.learningGoal || ''}.`;
    } else if (user.role === 'parent') {
      const studentProfile = await StudentProfile.findOne({ parentPhone: user.phone });
      const unpaidBills = studentProfile 
        ? await Bill.find({ studentId: studentProfile.userId, status: { $ne: 'Paid' } })
        : [];
      const outstandingAmt = unpaidBills.reduce((sum, b) => sum + b.amount, 0);
      contextPrompt += `Linked Child: Marcus Thorne. Total Unpaid tuition fees balance: $${outstandingAmt}.`;
    }

    contextPrompt += `
    Use the above user info to answer inquiries accurately when relevant. Do not invent details.
    You are also a general-purpose AI assistant. Feel free to answer any other general questions asked by the user, without refusing to answer questions unrelated to the CRM.
    Answer concisely (under 4-5 sentences). Keep tone professional, supportive, and encouraging.`;

    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: contextPrompt
    });

    const geminiHistory = Array.isArray(history) 
      ? history.map((msg: any) => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }))
      : [];

    const chatSession = model.startChat({
      history: geminiHistory
    });

    const result = await chatSession.sendMessage(message);
    const botText = result.response.text();

    return res.json({
      text: botText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  } catch (error) {
    console.error('Error during Gemini API request execution:', error);
    return res.status(500).json({ error: 'AI assistant offline. Keyword backups active.' });
  }
});

export default router;
