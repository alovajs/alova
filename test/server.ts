import { setupServer } from 'msw/node';
import { rest } from 'msw';
import fetch from 'node-fetch';

(global as any).fetch = (window as any).fetch = fetch;

const result = (code: number, req: any, res: any, ctx: any, hasBody = false) => {
  const ret = {
    code,
    msg: '',
    data: {
      path: req.url.pathname,
      method: req.method,
      params: (req.url.search || '').replace('?', '').split('&').reduce((p: Record<string, any>, c: string) => {
        const [k, v] = c.split('=');
        p[k] = v;
        return p;
      }, {} as Record<string, any>),
    } as Record<string, any>,
  };
  if (hasBody) {
    ret.data.data = req.body;
  }
  // console.log(req.method, ret);
  return res(ctx.json(ret));
}

const baseURL = 'http://localhost:3000';
export default setupServer(
  rest.get(baseURL + '/unit-test', (req, res, ctx) => result(200, req, res, ctx)),
  rest.get(baseURL + '/unit-test-10s', (req, res, ctx) => {
    return new Promise(r => setTimeout(() => r(result(200, req, res, ctx)), 10000));
  }),
  rest.get(baseURL + '/unit-test-404', () => {
    throw new Error('404');
  }),
  rest.post(baseURL + '/unit-test', (req, res, ctx) => result(200, req, res, ctx, true)),
  rest.delete(baseURL + '/unit-test', (req, res, ctx) => result(200, req, res, ctx, true)),
  rest.put(baseURL + '/unit-test', (req, res, ctx) => result(200, req, res, ctx, true)),
);