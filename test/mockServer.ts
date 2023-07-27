import { readFileSync } from 'fs';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import path from 'path';

// -------------------
// 服务模拟
const result = (code: number, req: any, res: any, ctx: any, hasBody = false, extraParams = {}) => {
  const ret = {
    code,
    msg: '',
    data: {
      path: req.url.pathname,
      method: req.method,
      params: {
        ...(req.url.search || '')
          .replace('?', '')
          .split('&')
          .reduce((p: Record<string, any>, c: string) => {
            const [k, v] = c.split('=');
            p[k] = v;
            return p;
          }, {} as Record<string, any>),
        ...extraParams
      }
    } as Record<string, any>
  };
  if (hasBody) {
    ret.data.data = req.body;
  }
  return res(ctx.json(ret));
};

export const baseURL = 'http://localhost:3000';
const countMap = {} as Record<string, number>;
const mockServer = setupServer(
  rest.get(baseURL + '/unit-test', (req, res, ctx) => result(200, req, res, ctx)),
  rest.get(baseURL + '/unit-test-1s', (req, res, ctx) => {
    return new Promise(r => setTimeout(() => r(result(200, req, res, ctx)), 1000));
  }),
  rest.get(baseURL + '/unit-test-count', (req, res, ctx) => {
    const key = req.url.searchParams.get('countKey') || '';
    countMap[key] = countMap[key] || 0;
    return result(200, req, res, ctx, false, { count: countMap[key]++ });
  }),
  rest.get(baseURL + '/unit-test-404', (_, res, ctx) => {
    return res(ctx.status(404, 'api not found'));
  }),
  rest.get(baseURL + '/unit-test-error', () => {
    throw new Error('server error');
  }),
  rest.post(baseURL + '/unit-test', (req, res, ctx) => result(200, req, res, ctx, true)),
  rest.delete(baseURL + '/unit-test', (req, res, ctx) => result(200, req, res, ctx, true)),
  rest.put(baseURL + '/unit-test', (req, res, ctx) => result(200, req, res, ctx, true)),
  rest.head(baseURL + '/unit-test', (_, res, ctx) => res(ctx.json({}))),
  rest.patch(baseURL + '/unit-test', (req, res, ctx) => result(200, req, res, ctx, true)),
  rest.options(baseURL + '/unit-test', (_, res, ctx) => res(ctx.json({}))),
  rest.get(baseURL + '/unit-test-download', (_, res, ctx) => {
    // Read the image from the file system using the "fs" module.
    const imageBuffer = readFileSync(path.resolve(__dirname, './img.jpg'));
    return res(
      ctx.set('Content-Length', imageBuffer.byteLength.toString()),
      ctx.set('Content-Type', 'image/jpeg'),
      // Respond with the "ArrayBuffer".
      ctx.body(imageBuffer)
    );
  })
);

export default mockServer;
