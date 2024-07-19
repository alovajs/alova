import { retry } from 'alova/server';
import express from 'express';
import { getRetryData } from '../api/methods';
import { pushLog } from '../logs';

const router = express.Router();
router.post('/api/retry', async (req, res) => {
  const body = req.body;
  const method = getRetryData({ id: Math.floor(Math.random() * 1000).toString(), errTimes: body.apiErrorTimes });
  setTimeout(() => {
    method.promise?.catch(error => {
      pushLog(`error: ${error.message}`);
    });
  }, 5);

  retry(method, {
    retry: body.retry,
    backoff: {
      delay: body.delay,
      multiplier: body.multiplier,
      startQuiver: body.startQuiver,
      endQuiver: body.endQuiver
    }
  }).then(data => {
    pushLog(`success: ${JSON.stringify(data)}`, null);
  });
  return res.json({});
});

export default router;
