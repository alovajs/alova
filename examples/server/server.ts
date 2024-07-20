import bodyParser from 'body-parser';
import express from 'express';
import path from 'path';
import { clearLogs, flushLogs } from './logs';
import pscRouter from './routes/psc';
import retryRouter from './routes/retry';

const app = express();
const port = 3000;
const sourceBranch = 'next';
const pkgName = 'server';

// disable Keep-Alive to random hit different process
app.use((_, res, next) => {
  res.set('Connection', 'close');
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
// set global variable
app.use((_, res, next) => {
  res.locals.sourceHref = `https://github.com/alovajs/alova/blob/${sourceBranch ? `${sourceBranch}/` : ''}examples/${pkgName}/routes`;
  next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(retryRouter, pscRouter);

app.get('/', (_, res) => {
  res.render('index', { title: 'Alova Demo - server' });
});
app.get('/retry', (req, res) => {
  res.render('retry', {
    title: 'retry - Server Demo'
  });
});
app.get('/rateLimit', (req, res) => {
  res.render('rateLimit', {
    title: 'rateLimit - Server Demo'
  });
});
app.get('/psc', (req, res) => {
  res.render('psc', {
    title: 'psc - Server Demo'
  });
});

app.delete('/logs', (_, res) => {
  clearLogs();
  return res.json({});
});
app.get('/logs', (_, res) => {
  return res.json(flushLogs());
});

app.listen(port, () => {
  console.log(`[pid:${process.pid}] Server listening on port http://127.0.0.1:${port}`);
});
