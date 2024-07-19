function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return document.querySelectorAll(selector);
}

function on(selector, event, callback, isAll = false) {
  const els = isAll ? $$(selector) : $(selector);
  (typeof els.length === 'number' ? els : [els]).forEach(item => {
    item.addEventListener(event, callback);
  });
}

// every 500ms to fetch server logs and call handle
function listenServerResponse({ handle, close }) {
  alovaInstance.Delete('/logs').send();
  const timer = setInterval(async () => {
    try {
      const logs = await alovaInstance.Get('/logs', {
        cacheFor: 0
      });
      const logsFiltered = logs.filter(item => item !== null);
      handle(logsFiltered);

      // stop interval while receiving null item
      if (logsFiltered.length !== logs.length) {
        stop();
      }
    } catch (error) {
      console.error(error);
      stop();
    }
  }, 500);
  const stop = () => {
    clearInterval(timer);
    close && close();
  };
  return stop;
}

var alovaInstance = alova.createAlova({
  requestAdapter: alovaFetch(),
  responded: async response => {
    const res = await response.text();
    // const res = await response.json();
    if (response.statusCode > 200) {
      throw new Error(res.message);
    }
    return JSON.parse(res);
  }
});
