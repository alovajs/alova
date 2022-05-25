const express = require('express');
const app = express();

const result = (code, msgOrData, res) => {
  const ret = {
    code,
    msg: '',
  };
  ret[code === 200 ? 'data' : 'msg'] = msgOrData;
  res.json(ret);
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// 支持跨域
app.all('*', (req, res, next) => {
	//设置允许跨域的域名，*代表允许任意域名跨域
	res.header('Access-Control-Allow-Origin', '*');
	//允许的header类型
	res.header('Access-Control-Allow-Headers', 'content-type');
	//跨域允许的请求方式 
	res.header('Access-Control-Allow-Methods', 'DELETE,PUT,POST,GET,OPTIONS');
	if (req.method == 'OPTIONS')
		res.sendStatus(200); //让options尝试请求快速结束
	else
		next();
});

app.get('/unit-test', (req, res) => result(200, {
  path: req._parsedUrl.pathname,
  method: req.method,
  params: req.query,
}, res));
app.get('/unit-test-10s', (req, res) => setTimeout(() => result(200, {
  path: req._parsedUrl.pathname,
  method: req.method,
  params: req.query,
}, res), 10000));
app.post('/unit-test', (req, res) => result(200, {
  path: req._parsedUrl.pathname,
  method: req.method,
  params: req.query,
  data: req.body,
}, res));
app.delete('unit-test', (req, res) => result(200, {
  path: req._parsedUrl.pathname,
  method: req.method,
  params: req.query,
  data: req.body,
}, res));
app.put('/unit-test', (req, res) => result(200, {
  path: req._parsedUrl.pathname,
  method: req.method,
  params: req.query,
  data: req.body,
}, res));
const port = 3000;
app.listen(port, () => console.log('服务器已启动, http://localhost:' + port));