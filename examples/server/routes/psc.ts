import express from 'express';
import { getPSCData } from '../api/methods';

const router = express.Router();
router.get('/api/psc', async (req, res) => {
  const pscMethod = getPSCData();
  const data = await pscMethod;
  return res.json({ pid: process.pid, fromCache: pscMethod.fromCache, data });
});

export default router;
