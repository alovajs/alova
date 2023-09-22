import nodeFetch from 'node-fetch';
import 'web-streams-polyfill';
import mockServer from './mockServer';

(global as any).fetch = nodeFetch;
beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());
