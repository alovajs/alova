import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import express from 'express';

const alova = createAlova({
  requestAdapter: adapterFetch(),
  responded(response) {
    return response.json();
  }
});

const router = express.Router();
router.get('/api/basic', async (_, res) => {
  const data = await alova.Get('https://jsonplaceholder.typicode.com/todos/1');
  return res.json({ pid: process.pid, method: 'GET', data });
});
router.post('/api/basic', async (_, res) => {
  const result = await alova.Post('https://jsonplaceholder.typicode.com/posts', {
    title: 'foo',
    body: 'bar',
    userId: 1
  });
  return res.json({ pid: process.pid, method: 'POST', result });
});

export default router;
