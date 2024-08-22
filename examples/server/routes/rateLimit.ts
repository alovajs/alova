import { createPSCAdapter, NodeSyncAdapter } from '@alova/psc';
import { createRateLimiter } from 'alova/server';
import express from 'express';
import { getRetryData } from '../api/methods';

const rateLimitMap = {} as Record<string, ReturnType<typeof createRateLimiter>>;
const customPSCStorage = createPSCAdapter(NodeSyncAdapter());
const createParameterizedInstance = (config: Record<string, any>) => {
  const isCustomStorage = config.isCustomStorage;
  delete config.isCustomStorage;
  const rateLimit = createRateLimiter({
    ...config,
    keyPrefix: 'alova-demo-test',
    storage: isCustomStorage ? customPSCStorage : undefined
  });
  return rateLimit;
};

const router = express.Router();
router.post('/api/rateLimit', async (req, res) => {
  const key = req.headers.uid?.toString() || '';
  console.log('consume key is: ', key);
  let rateLimit = rateLimitMap[key];
  if (!rateLimit) {
    rateLimit = createParameterizedInstance(req.body);
    rateLimitMap[key] = rateLimit;
  }
  const limitedMethod = rateLimit(getRetryData({ t: Date.now() }), {
    key
  });

  // need some time to synchronous data between processes while creating `rateLimit` with
  // await new Promise(resolve => setTimeout(resolve, 10));
  const ret = await limitedMethod
    .then(value => ({ pid: process.pid, status: 'success', data: value }))
    .catch(error => ({ pid: process.pid, status: 'error', error }));
  return res.json(ret);
});
router.post('/api/rateLimit/reward', async (req, res) => {
  const key = req.headers.uid?.toString() || '';
  console.log('reward key is: ', key);
  let rateLimit = rateLimitMap[key];
  if (!rateLimit) {
    rateLimit = createParameterizedInstance(req.body);
    rateLimitMap[key] = rateLimit;
  }
  const limitedMethod = rateLimit(getRetryData({ t: Date.now() }), {
    key
  });
  const ret = await limitedMethod.reward(1);
  return res.json({ pid: process.pid, status: 'reward', data: ret });
});
router.post('/api/rateLimit/penalty', async (req, res) => {
  const key = req.headers.uid?.toString() || '';
  console.log('penalty key is: ', key);
  let rateLimit = rateLimitMap[key];
  if (!rateLimit) {
    rateLimit = createParameterizedInstance(req.body);
    rateLimitMap[key] = rateLimit;
  }
  const limitedMethod = rateLimit(getRetryData({ t: Date.now() }), {
    key
  });
  const ret = await limitedMethod.penalty(1);
  return res.json({ pid: process.pid, status: 'penalty', data: ret });
});
router.post('/api/rateLimit/delete', async (req, res) => {
  const key = req.headers.uid?.toString() || '';
  console.log('delete key is: ', key);
  let rateLimit = rateLimitMap[key];
  if (!rateLimit) {
    rateLimit = createParameterizedInstance(req.body);
    rateLimitMap[key] = rateLimit;
  }
  const limitedMethod = rateLimit(getRetryData({ t: Date.now() }), {
    key
  });
  const ret = await limitedMethod.delete();
  return res.json({ pid: process.pid, status: 'delete', data: ret });
});

export default router;
