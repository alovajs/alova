import { retry } from 'alova/server';
import express from 'express';
import { getRetryData } from '../api/methods';
import { pushLog } from '../logs';

const router = express.Router();
router.post('/api/retry', async (req, res) => {
  const body = req.body;
  const method = getRetryData({ id: Math.floor(Math.random() * 1000).toString(), errTimes: body.apiErrorTimes });
  const retryMethod = retry(method, {
    retry: body.retry,
    backoff: {
      delay: body.delay,
      multiplier: body.multiplier,
      startQuiver: body.startQuiver,
      endQuiver: body.endQuiver
    }
  });

  // check if is retrying
  let currentPromise: Promise<any>;
  const timer = setInterval(() => {
    if (method.promise && currentPromise !== method.promise) {
      currentPromise = method.promise;
      method.promise?.catch(error => {
        pushLog(`error: ${error.message}`);
      });
    }
  }, 10);

  retryMethod
    .then((data: any) => {
      pushLog(`success: ${JSON.stringify(data)}`, null);
    })
    .catch(error => {
      pushLog(`fail: ${error.message}`, null);
    })
    .finally(() => {
      clearInterval(timer);
    });
  return res.json({});
});

export default router;
