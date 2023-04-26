import nodeFetch from 'node-fetch';
import 'web-streams-polyfill';
import mockServer from './mockServer';

(global as any).fetch = nodeFetch;
(global as any).isSSR = typeof window === 'undefined';

// 防止Vue warn打印
const warn = console.warn;
console.warn = (...args: any[]) => {
  args = args.filter((a: any) => !/vue warn/i.test(a));
  if (args.length > 0) {
    warn.apply(console, args);
  }
};

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());
