import { Request, Response, NextFunction } from 'express';
import { connectDB } from '../config/db';

export const dbMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (error: any) {
    console.error('❌ Database connection middleware failure:', error.message);
    res.status(500).json({
      error: 'Database connection failed. Please ensure your MongoDB Atlas IP Access List has "0.0.0.0/0" (Access from Anywhere) enabled to allow connections from Vercel serverless functions.'
    });
  }
};
