import bodyParser from 'body-parser';
import express from 'express';
import hbs from 'hbs';
import path from 'path';
import { clearLogs, flushLogs } from './logs';
import basicRouter from './routes/basic';
import captchaRouter from './routes/captcha';
import pscRouter from './routes/psc';
import rateLimitRouter from './routes/rateLimit';
import retryRouter from './routes/retry';

const app = express();
const port = 3000;
const sourceBranch = 'main';
const pkgName = 'server';

// disable Keep-Alive to random hit different process
app.use((_, res, next) => {
  res.set('Connection', 'close');
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', hbs.__express);
hbs.registerPartials(__dirname + '/views/partials');

// set global variable
app.use((_, res, next) => {
  res.locals.sourceUrl = `https://github.com/alovajs/alova/blob/${sourceBranch ? `${sourceBranch}/` : ''}examples/${pkgName}/routes`;
  res.locals.docUrl = `https://alova.js.org`;
  next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(basicRouter, retryRouter, pscRouter, rateLimitRouter, captchaRouter);

app.get('/', (_, res) => {
  res.render('index', { title: 'Home' });
});
app.get('/basic', (_, res) => {
  res.render('basic', {
    title: 'basic',
    docPath: '/tutorial/getting-started/quick-start'
  });
});
app.get('/retry', (_, res) => {
  res.render('retry', {
    title: 'retry',
    docPath: '/tutorial/server/strategy/retry'
  });
});
app.get('/rateLimit', (_, res) => {
  res.render('rateLimit', {
    title: 'rate limit',
    filePath: 'rateLimit',
    docPath: '/tutorial/server/strategy/rate-limit'
  });
});
app.get('/psc', (_, res) => {
  res.render('psc', {
    title: 'psc',
    docPath: '/resource/storage-adapter/psc'
  });
});
app.get('/captcha', (_, res) => {
  res.render('captcha', {
    title: 'captcha send and verify',
    filePath: 'captcha',
    docPath: '/tutorial/server/strategy/captcha'
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
