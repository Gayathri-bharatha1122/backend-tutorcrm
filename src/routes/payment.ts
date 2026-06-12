import { Router, Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const router = Router();

// Keys are read lazily so the module loads even when .env is not set
const getKeys = () => ({
  keyId: process.env.RAZORPAY_KEY_ID || '',
  keySecret: process.env.RAZORPAY_KEY_SECRET || ''
});

// Lazily create the Razorpay instance only when keys are available
const getRazorpay = () => {
  const { keyId, keySecret } = getKeys();
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// GET /razorpay-key
router.get('/razorpay-key', (req: Request, res: Response) => {
  const { keyId } = getKeys();
  if (!keyId) {
    return res.status(404).json({ error: 'Razorpay Key ID not configured.' });
  }
  return res.status(200).json({ key_id: keyId });
});

// POST /create-order
router.post('/create-order', async (req: Request, res: Response) => {
  const { amount, currency, receipt } = req.body;
  const { keyId, keySecret } = getKeys();

  // 1. Missing fields check
  if (amount === undefined || !currency || !receipt) {
    return res.status(400).json({ error: 'Missing required fields: amount, currency, and receipt are required.' });
  }

  // 2. Validate amount >= 100 paise
  const amountVal = Number(amount);
  if (isNaN(amountVal) || amountVal < 100) {
    return res.status(400).json({ error: 'Amount must be a number and at least 100 paise.' });
  }

  // 3. Handle auth configuration issues proactively
  if (!keyId || !keySecret) {
    return res.status(401).json({ error: 'Razorpay API keys are not configured.' });
  }

  try {
    const razorpay = getRazorpay()!;
    const options = {
      amount: amountVal,
      currency: currency,
      receipt: receipt,
    };

    const order = await razorpay.orders.create(options);
    
    return res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    
    // Check for Razorpay auth/credential issues (often returns 401)
    if (error.statusCode === 401 || (error.error && error.error.code === 'BAD_REQUEST_ERROR' && error.error.description.includes('key'))) {
      return res.status(401).json({ error: 'Unauthorized: Razorpay authentication failed.' });
    }
    
    return res.status(500).json({ error: error.message || 'Failed to create order due to internal error.' });
  }
});

// POST /verify-payment
router.post('/verify-payment', (req: Request, res: Response) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
  const { keySecret } = getKeys();

  // 1. Missing fields check: return 400
  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing required fields: razorpay_payment_id, razorpay_order_id, and razorpay_signature are required.' });
  }

  if (!keySecret) {
    return res.status(500).json({ error: 'Razorpay Secret Key is not configured.' });
  }

  try {
    // 2. Generate expected signature: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    // 3. Compare signature
    if (generatedSignature === razorpay_signature) {
      return res.status(200).json({ success: true, message: 'Payment verified successfully.' });
    } else {
      return res.status(400).json({ success: false, error: 'Signature mismatch. Payment verification failed.' });
    }
  } catch (error: any) {
    console.error('Error verifying payment signature:', error);
    return res.status(500).json({ error: error.message || 'Verification failed.' });
  }
});

export default router;
