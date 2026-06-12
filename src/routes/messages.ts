import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middlewares/auth';
import { Message, User } from '../models';

const router = Router();

router.use(authenticateToken);

// 1. GET CHAT MESSAGES HISTORY
router.get('/:otherUserId', async (req: AuthRequest, res: Response) => {
  const currentUserId = req.user?.id;
  const { otherUserId } = req.params;

  if (!currentUserId || !otherUserId) {
    return res.status(400).json({ error: 'User parameters are required.' });
  }

  try {
    const chats = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId }
      ]
    }).sort({ timestamp: 1 });

    return res.json(chats.map(c => ({
      sender: c.senderId.toString() === currentUserId ? 'user' : 'teacher',
      text: c.text,
      time: new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })));
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 2. DISPATCH A NEW CHAT MESSAGE
router.post('/send', async (req: AuthRequest, res: Response) => {
  const senderId = req.user?.id;
  const { receiverId, text } = req.body;

  if (!senderId || !receiverId || !text) {
    return res.status(400).json({ error: 'Message receiver ID and message text are required.' });
  }

  try {
    // 1. Save user's message
    const userMsg = await Message.create({
      senderId,
      receiverId,
      text,
      timestamp: new Date()
    });

    // 2. Resolve simulated response if receiver is a tutor (keeps the mockup interactive!)
    const receiver = await User.findById(receiverId);
    if (receiver && receiver.role === 'tutor') {
      let reply = "Good question. I have logged that in our planner. Let's focus on electromagnetic induction chapters in our review session tomorrow.";
      const lowercase = text.toLowerCase();
      
      if (lowercase.includes('calculus') || lowercase.includes('integration')) {
        reply = "For integration constants, make sure you double-check bounds. Sarah Jenkins is hosting a calculus BC review session this Friday at 4:30 PM!";
      } else if (lowercase.includes('physics') || lowercase.includes('rotational')) {
        reply = "Rotation kinematics require calculating the vector moment of inertia first. Keep practicing assessment sheet 4B.";
      }

      // Save tutor auto response
      await Message.create({
        senderId: receiverId,
        receiverId: senderId,
        text: reply,
        timestamp: new Date(Date.now() + 1000) // 1 second later
      });
    }

    return res.status(201).json({
      status: 'SENT',
      message: userMsg
    });
  } catch (error) {
    console.error('Error sending chat message:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
