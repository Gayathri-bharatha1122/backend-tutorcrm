import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, StudentProfile, IStudentProfile } from '../models';
import { authenticateToken, AuthRequest } from '../middlewares/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_tutor_crm_jwt_token_key_123!';

// Mock OTP storage in memory for simplicity (in production use Redis/Database)
const pendingOtps = new Map<string, string>();

// 1. VERIFY STUDENT LINKAGE LOOKUP (For Parent Stepper Step 3)
router.get('/verify-linkage', async (req: Request, res: Response) => {
  const { phone } = req.query;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required.' });
  }

  try {
    const sanitized = (phone as string).replace(/\D/g, '');
    
    // Find all student profiles where parentPhone matches this sanitized parent phone
    const studentProfiles = await StudentProfile.find({ parentPhone: sanitized }).populate('userId');

    if (studentProfiles.length === 0) {
      return res.status(404).json({ 
        error: 'No registered student found with this parent phone number. Please ensure the student registers first and lists this parent number.' 
      });
    }

    const students = studentProfiles.map(p => {
      const studentUser = p.userId as any;
      return {
        id: studentUser?._id,
        name: studentUser ? `${studentUser.firstName} ${studentUser.lastName}` : 'Unknown Student',
        grade: p.grade || '11th Grade',
        subject: p.learningGoal || 'Advanced Physics'
      };
    });

    // Generate a simulated OTP (always '6423' for ease of testing as per frontend spec)
    const code = '6423';
    pendingOtps.set(sanitized, code);

    return res.json({
      status: 'LINKED_STUDENTS_FOUND',
      students,
      msg: 'Simulated OTP code sent: 6423'
    });
  } catch (error) {
    console.error('Error during student linkage lookup:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 2. REGISTER USER (Student or Parent)
router.post('/register', async (req: Request, res: Response) => {
  const { 
    firstName, 
    lastName, 
    email, 
    phone, 
    password, 
    role, 
    grade, 
    learningGoal, 
    parentPhone
  } = req.body;

  if (!email || !phone || !password || !role || !firstName || !lastName) {
    return res.status(400).json({ error: 'All primary registry details are required.' });
  }

  try {
    // Validate phone length
    const sanitizedPhone = phone.replace(/\D/g, '');
    if (sanitizedPhone.length !== 10) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits.' });
    }

    // Validate parent phone if registering as student
    let sanitizedParentPhone = '';
    if (role === 'student') {
      if (!parentPhone) {
        return res.status(400).json({ error: 'Parent phone number is required.' });
      }
      sanitizedParentPhone = parentPhone.replace(/\D/g, '');
      if (sanitizedParentPhone.length !== 10) {
        return res.status(400).json({ error: 'Parent phone number must be exactly 10 digits.' });
      }
    }

    // Check if phone number already exists
    const existingPhone = await User.findOne({ phone: sanitizedPhone });
    if (existingPhone) {
      return res.status(400).json({ error: 'Already user exist with phone number' });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create Base User
    const newUser = await User.create({
      email,
      phone: sanitizedPhone,
      passwordHash,
      role,
      firstName,
      lastName
    });

    // Create Profile context if student - Default to Pending
    if (role === 'student') {
      await StudentProfile.create({
        userId: newUser._id,
        grade: grade || '11th Grade',
        learningGoal: learningGoal || '',
        parentPhone: sanitizedParentPhone,
        avgGrade: 3.5,
        progress: 60,
        status: 'Pending'
      });
    }

    // Sign JWT Token
    const token = jwt.sign(
      { 
        id: newUser._id, 
        email: newUser.email, 
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone
      }, 
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        name: `${newUser.firstName} ${newUser.lastName}`
      }
    });
  } catch (error) {
    console.error('Error during user registration:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 3. LOGIN USER
router.post('/login', async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Please provide both email/identifier, role, and password.' });
  }

  try {
    // Find User
    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials or role selection mismatch.' });
    }

    // If student, check if pending approval
    if (role === 'student') {
      const studentProfile = await StudentProfile.findOne({ userId: user._id });
      if (!studentProfile || studentProfile.status !== 'Active') {
        return res.status(403).json({ error: 'Your account is pending administrator approval. Please check back later.' });
      }
    }

    // Match Password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid key token or database credential mismatch.' });
    }

    // Sign JWT Token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone
      }, 
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 4. GET CURRENT USER PROFILE
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User context not found.' });
  }

  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      name: `${req.user.firstName} ${req.user.lastName}`
    }
  });
});

export default router;
