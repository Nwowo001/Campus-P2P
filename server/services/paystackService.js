const axios = require('axios');
const crypto = require('crypto');

const PAYSTACK_API = 'https://api.paystack.co';

// Helper to determine if we should run in simulation mode
const isSimulated = () => {
  const key = process.env.PAYSTACK_SECRET_KEY;
  return !key || key.startsWith('sk_test_mock_') || key === 'placeholder';
};

/**
 * Initialize Paystack transaction
 * @param {string} email - Buyer email
 * @param {number} amount - Amount in Naira (will be converted to kobo)
 * @param {string} reference - Unique order reference
 * @returns {Promise<object>} Paystack response data (authorization_url, reference)
 */
const initializeTransaction = async (email, amount, reference) => {
  const amountInKobo = Math.round(amount * 100);

  if (isSimulated()) {
    console.log(`[Paystack SIMULATION] Initializing transaction for ${email}, amount: ₦${amount}, reference: ${reference}`);
    // Simulate transaction initialization by redirecting to a frontend mock checkout path
    const mockCheckoutUrl = `http://localhost:5173/mock-payment?reference=${reference}&amount=${amount}&email=${encodeURIComponent(email)}`;
    return {
      status: true,
      data: {
        authorization_url: mockCheckoutUrl,
        reference: reference,
        access_code: `mock_code_${reference}`,
      },
    };
  }

  try {
    const response = await axios.post(
      `${PAYSTACK_API}/transaction/initialize`,
      {
        email,
        amount: amountInKobo,
        reference,
        callback_url: 'http://localhost:5173/orders', // redirect to orders page after payment
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Paystack initialize error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Paystack initialization failed');
  }
};

/**
 * Verify Paystack transaction by reference
 * @param {string} reference - Unique transaction reference
 * @returns {Promise<boolean>} True if transaction is successful
 */
const verifyTransaction = async (reference) => {
  if (isSimulated() || reference.startsWith('mock_')) {
    console.log(`[Paystack SIMULATION] Verifying transaction: ${reference}`);
    // Return true for any simulated checkout success
    return {
      status: true,
      data: {
        status: 'success',
        amount: 0, // not verified in simulated
        reference: reference,
      }
    };
  }

  try {
    const response = await axios.get(`${PAYSTACK_API}/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    if (response.data && response.data.status && response.data.data.status === 'success') {
      return response.data;
    }
    return { status: false, data: { status: 'failed' } };
  } catch (error) {
    console.error('Paystack verify error:', error.response?.data || error.message);
    return { status: false, data: { status: 'failed', message: error.message } };
  }
};

/**
 * Verify Paystack Webhook Signature
 * @param {string} signature - The signature from header x-paystack-signature
 * @param {object|string} body - The raw request body
 * @returns {boolean} True if signature matches
 */
const verifyWebhookSignature = (signature, body) => {
  if (isSimulated()) {
    console.log('[Paystack SIMULATION] Skipping webhook signature check for simulation');
    return true; // Auto-pass in simulated mode
  }

  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY)
    .update(typeof body === 'string' ? body : JSON.stringify(body))
    .digest('hex');

  return hash === signature;
};

module.exports = {
  initializeTransaction,
  verifyTransaction,
  verifyWebhookSignature,
};
