import http from 'http';
import { delay } from 'root/testUtils';

let replyList: { req: http.IncomingMessage; res: http.ServerResponse }[] = [];

function wrapData(event: string, data: string) {
  return [`event: ${event}`, `data: ${data}`, '\n'].join('\n');
}

export const TriggerEventName = 'trigger';
export const IntervalEventName = 'interval';
export const CloseEventName = 'close';
export const IntervalMessage = 'interval-message';

export const server = http.createServer(async (req, res) => {
  req.on('close', () => {
    replyList = replyList.filter(e => e.res !== res);
  });

  const path = `.${req.url}`;

  if (path === './get') {
    res.write('OK');
    res.end();
    return;
  }

  if (path === './not-exist-path') {
    res.statusCode = 404;
    res.end();
    return;
  }

  if (path === `./${TriggerEventName}`) {
    replyList.push({ req, res });
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // trigger client's open event
    res.write('\n\n');

    // but not sending any message...
    // res.write() <---Trigger manually later
    return;
  }

  if (path === `./${IntervalEventName}`) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    res.write('\n\n');

    const interval = setInterval(() => {
      res.write(wrapData('interval', IntervalMessage));
    }, 200);

    req.socket.addListener('close', () => clearInterval(interval));
  }

  if (path === `./${CloseEventName}`) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    res.write(wrapData('message', 'closing'));
    await delay(100);
    res.end();
    res.connection?.end();
  }
});

/**
 * reply message from server
 * @param data response data, if not provided, will reply the request data
 */
export async function send(data?: string) {
  const responsePromises = replyList.map(async ({ req, res }) => {
    if (!data) {
      data = await new Promise<string>(resolve => {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          resolve(
            JSON.stringify({
              url: req.url,
              method: req.method,
              headers: req.headers,
              body: JSON.parse(body)
            })
          );
        });
      });
    }

    res.write(wrapData('message', data));
  });
  await Promise.all(responsePromises);
}
