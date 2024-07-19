import express from 'express';
import path from 'path';
import retryRouter from './routes/retry';
import bodyParser from 'body-parser';
import { clearLogs, flushLogs } from './logs';

const app = express();
const port = 3000;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.use(retryRouter);
app.get('/', (_, res) => {
  res.render('index', { title: 'Alova Demo - server' });
});
app.get('/retry', (req, res) => {
  res.render('retry');
});

app.delete('/logs', (_, res) => {
  clearLogs();
  return res.json({});
});
app.get('/logs', (_, res) => {
  return res.json(flushLogs());
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
