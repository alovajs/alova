import { createPSCAdapter, NodeSyncAdapter } from '@alova/psc';
import { createRateLimiter } from 'alova/server';
import express from 'express';
import { getRetryData } from '../api/methods';

// let rateLimit = new RateLimiterMemory({});
let rateLimit = createRateLimiter();
const router = express.Router();
router.put('/api/rateLimit', async (req, res) => {
  const body = req.body;
  const isCustomStorage = body.isCustomStorage;
  delete body.isCustomStorage;
  rateLimit = createRateLimiter({
    ...body,
    keyPrefix: 'alova-demo-test',
    storage: isCustomStorage ? createPSCAdapter(NodeSyncAdapter()) : undefined
  });

  return res.json({});
});
router.get('/api/rateLimit', async (req, res) => {
  const key = req.headers.uid?.toString();
  console.log('consume key is: ', key);
  const limitedMethod = rateLimit(getRetryData({ t: Date.now() }), {
    key
  });

  const ret = await limitedMethod
    .then(value => ({ pid: process.pid, status: 'success', data: value }))
    .catch(error => ({ pid: process.pid, status: 'error', error }));
  return res.json(ret);
});
router.post('/api/rateLimit/reward', async (req, res) => {
  const key = req.headers.uid?.toString();
  console.log('reward key is: ', key);
  const limitedMethod = rateLimit(getRetryData({ t: Date.now() }), {
    key
  });
  const ret = await limitedMethod.reward(1);
  return res.json({ pid: process.pid, status: 'reward', data: ret });
});
router.post('/api/rateLimit/penalty', async (req, res) => {
  const key = req.headers.uid?.toString();
  console.log('penalty key is: ', key);
  const limitedMethod = rateLimit(getRetryData({ t: Date.now() }), {
    key
  });
  const ret = await limitedMethod.penalty(1);
  return res.json({ pid: process.pid, status: 'penalty', data: ret });
});
router.post('/api/rateLimit/delete', async (req, res) => {
  const key = req.headers.uid?.toString();
  console.log('delete key is: ', key);
  const limitedMethod = rateLimit(getRetryData({ t: Date.now() }), {
    key
  });
  const ret = await limitedMethod.delete();
  return res.json({ pid: process.pid, status: 'delete', data: ret });
});

export default router;
