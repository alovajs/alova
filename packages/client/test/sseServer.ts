import http from 'http';

let replyList: http.ServerResponse[] = [];

function wrapData(event: string, data: string) {
  return [`event: ${event}`, `data: ${data}`, '\n'].join('\n');
}

export const TriggerEventName = 'trigger';
export const IntervalEventName = 'interval';
export const IntervalMessage = 'interval-message';

export const server = http.createServer((req, res) => {
  req.on('close', () => {
    replyList = replyList.filter(e => e !== res);
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
  }

  if (path === `./${TriggerEventName}`) {
    replyList.push(res);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // trigger client's open event
    res.write('\n\n');

    // but not sending any message...
    // res.write() <--- Trigger manually later
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
});

export async function send(data: string) {
  return Promise.all(replyList.map(e => e.write(wrapData('message', data))));
}
