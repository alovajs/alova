import { Blob, File } from 'node:buffer';
import { TextDecoder, TextEncoder } from 'node:util';
import { Headers, Request, Response, fetch } from 'undici';
import { ReadableStream } from 'web-streams-polyfill';

Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
  ReadableStream: { value: ReadableStream }
});
Object.defineProperties(global, {
  fetch: { value: fetch, writable: true },
  Response: { value: Response },
  Request: { value: Request },
  Headers: { value: Headers },
  Blob: { value: Blob },
  File: { value: File },
  isSSR: { value: typeof window === 'undefined' }
});
