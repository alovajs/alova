import { Blob, File } from 'node:buffer';
import { TextDecoder, TextEncoder } from 'node:util';
import { ReadableStream } from 'web-streams-polyfill';

Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
  ReadableStream: { value: ReadableStream },
  setImmediate: { value: setTimeout },
  clearImmediate: { value: clearTimeout }
});

// if the environment is jsdom, set process.browser to true
if (typeof window !== 'undefined') {
  (process as any).browser = true;
}

// undici must import after defining TextDecoder and TextEncoder, otherwise it will throw error
// eslint-disable-next-line
import { Headers, Request, Response, fetch } from 'undici';
Object.defineProperties(global, {
  fetch: { value: fetch, writable: true },
  Response: { value: Response },
  Request: { value: Request },
  Headers: { value: Headers },
  Blob: { value: Blob },
  File: { value: File },
  isSSR: { value: typeof window === 'undefined' }
});
