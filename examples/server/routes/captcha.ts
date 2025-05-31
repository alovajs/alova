import { createCaptchaProvider } from 'alova/server';
import express from 'express';
import { alova } from '../api';
import { captcha } from '../api/methods';

const { sendCaptcha, verifyCaptcha } = createCaptchaProvider({
  resetTime: 10_000,
  expireTime: 30_000,
  store: alova.l2Cache,
  resendFormStore: true
});

const router = express.Router();
router.post('/api/captcha/send', async (req, res) => {
  const { phoneNumber } = req.body;
  try {
    await sendCaptcha(
      (code, key) => {
        console.warn('key is: ', phoneNumber, ' | ', 'sending captcha is: ', code);
        return captcha(code, key);
      },
      {
        key: phoneNumber
      }
    );
    return res.json({
      success: true
    });
  } catch (error: any) {
    return res.json({
      success: false,
      error: error.message
    });
  }
});
router.post('/api/captcha/verify', async (req, res) => {
  const { phoneNumber, captcha } = req.body;
  const result = await verifyCaptcha(captcha, phoneNumber);
  return res.json({
    success: result
  });
});

export default router;
