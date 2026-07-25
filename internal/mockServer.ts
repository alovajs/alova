import { DefaultBodyType, delay, http, HttpResponse, StrictRequest } from 'msw';
import { setupServer } from 'msw/node';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { randomId } from './testUtils';

// -------------------
// mock service response
async function result(code: number, req: StrictRequest<DefaultBodyType>, hasBody = false, extraParams = {}) {
  await delay(10);
  const urlObj = new URL(req.url);
  const data: Record<string, any> = {
    path: urlObj.pathname,
    method: req.method,
    params: {
      ...Object.fromEntries(urlObj.searchParams.entries()),
      ...extraParams
    }
  };
  if (hasBody) {
    try {
      data.data = await req.clone().json();
    } catch {
      try {
        const formData = Object.fromEntries((await req.clone().formData()).entries());
        data.data = formData;
      } catch {
        const bodyText = await (await req.clone().blob()).text();
        // The XHR request adapter forwards a manually-set `content-type` header for
        // string bodies, but the MSW XHR interceptor drops request headers on
        // string-body requests. As a result an `application/x-www-form-urlencoded`
        // payload arrives without a content type, so `req.formData()` rejects above.
        // Parse the query-string body heuristically so the server echoes the decoded
        // fields back (e.g. `{ post1: 'p1', post2: 'p2' }`).
        if (/^[^=&?\s]*=[^&]*(&[^=&?\s]*=[^&]*)*$/.test(bodyText)) {
          try {
            data.data = Object.fromEntries(new URLSearchParams(bodyText));
          } catch {
            data.data = bodyText;
          }
        } else {
          data.data = bodyText;
        }
      }
    }
  }
  return HttpResponse.json({
    code,
    msg: '',
    data
  });
}

export const baseURL = 'http://localhost:3000';
const countMap = {} as Record<string, number>;
const mockServer = setupServer(
  http.get(`${baseURL}/unit-test-empty`, () => HttpResponse.text(null)),
  http.get(`${baseURL}/unit-test-plaintext`, () => HttpResponse.text('plaintext')),
  http.get(`${baseURL}/unit-test`, async ({ request }) => result(200, request)),
  http.get(`${baseURL}/unit-test-1s`, async ({ request }) => {
    await delay(900);
    return result(200, request);
  }),
  http.get(`${baseURL}/unit-test-count`, ({ request }) => {
    const urlObj = new URL(request.url);
    const key = (urlObj.searchParams.get('countKey') || '') as string;
    const count = (countMap[key] = countMap[key] || 0);
    countMap[key] += 1;
    return result(200, request, false, { count });
  }),
  http.get(
    `${baseURL}/unit-test-404`,
    () =>
      new HttpResponse(null, {
        status: 404,
        statusText: 'api not found'
      })
  ),
  http.get(`${baseURL}/unit-test-error`, () => HttpResponse.error()),
  http.post(`${baseURL}/unit-test-error`, () => HttpResponse.error()),
  // Backs the XHR adapter's cancellation tests (abort). The request is left
  // pending forever; the adapter rejects the response promise directly when
  // `abort()` is called (see `packages/adapter-xhr/src/requestAdapter.ts`).
  // We intentionally do NOT use a real TCP server here: on Windows a pending
  // connection at worker/thread exit trips a libuv `handle->reqs_pending == 0`
  // assertion and crashes the run.
  http.options(`${baseURL}/unit-test-passthrough`, () => new Promise(() => {})),
  http.get(`${baseURL}/unit-test-passthrough`, () => new Promise(() => {})),
  http.post(`${baseURL}/unit-test`, ({ request }) => result(200, request, true)),
  http.delete(`${baseURL}/unit-test`, ({ request }) => result(200, request, true)),
  http.put(`${baseURL}/unit-test`, ({ request }) => result(200, request, true)),
  http.head(`${baseURL}/unit-test`, () => HttpResponse.json({})),
  http.patch(`${baseURL}/unit-test`, ({ request }) => result(200, request, true)),
  http.options(`${baseURL}/unit-test`, () => HttpResponse.json({})),
  http.post(`${baseURL}/unit-test-headers`, ({ request }) =>
    HttpResponse.json({
      code: 200,
      msg: '',
      data: {
        requestHeaders: Object.fromEntries(request.headers.entries())
      }
    })
  ),
  http.get(`${baseURL}/unit-test-random`, () => HttpResponse.json({ id: randomId() })),

  // download request
  http.get(`${baseURL}/unit-test-download`, async () => {
    await delay(200);
    // Read the image from the file system using the "fs" module.
    const imageBuffer = readFileSync(path.resolve(__dirname, '../assets/img-test.jpg'));
    return new HttpResponse(new Uint8Array(imageBuffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': imageBuffer.byteLength.toString()
      }
    });
  }),

  /**
   * upload request
   */
  http.post(`${baseURL}/unit-test-upload`, async ({ request }) => {
    // Read the image from the file system using the "fs" module.
    const delaySeconds = Number(request.headers.get('delay'));
    if (delaySeconds && delaySeconds > 0) {
      await delay(delaySeconds);
    }
    return result(200, request, true, {
      contentType: request.headers.get('Content-Type')
    });
  })
);

export default mockServer;
