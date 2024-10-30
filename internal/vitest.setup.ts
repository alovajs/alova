import '@testing-library/jest-dom/vitest';
import { Blob, File } from 'node:buffer';
import mockServer, { baseURL } from './mockServer';

Object.defineProperties(global, {
  Blob: { value: Blob },
  File: { value: File },
  isSSR: { value: typeof window === 'undefined' }
});

process.env.NODE_BASE_URL = baseURL;
beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());
