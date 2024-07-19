import express from 'express';
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello CodeSandbox!!!<a href="/abc">abc</a>');
});

app.get('/abc', (req, res) => {
  res.send('gggg');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
