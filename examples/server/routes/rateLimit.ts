import { createRateLimiter } from 'alova/server';
import express from 'express';
import { alova } from '../api';
import { getRetryData } from '../api/methods';

let rateLimit = createRateLimiter();
const router = express.Router();
router.put('/api/rateLimit', async (req, res) => {
  const body = req.body;
  const isCustomStorage = body.isCustomStorage;
  delete body.isCustomStorage;
  console.log(body);
  rateLimit = createRateLimiter({
    ...body,
    keyPrefix: 'alova-demo-test',
    storage: isCustomStorage ? alova.l1Cache : alova.l1Cache
  });
  return res.json({});
});
router.get('/api/rateLimit', async (_, res) => {
  const limitingMethod = rateLimit(getRetryData({ t: Date.now() }));
  return res.json(await limitingMethod);
});

export default router;
