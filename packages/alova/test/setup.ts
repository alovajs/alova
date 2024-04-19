import { TextDecoder, TextEncoder } from 'node:util';
import { ReadableStream } from 'web-streams-polyfill';
Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
  ReadableStream: { value: ReadableStream }
});

import { Blob, File } from 'node:buffer';
import { fetch, Headers, Request, Response } from 'undici';
Object.defineProperties(global, {
  fetch: { value: fetch, writable: true },
  Response: { value: Response },
  Request: { value: Request },
  Headers: { value: Headers },
  Blob: { value: Blob },
  File: { value: File }
});

import mockServer from '../../shared/src/mockServer';
beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());
