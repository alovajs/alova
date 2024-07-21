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
      logsFiltered.forEach(item => {
        const divEl = document.createElement('div');
        divEl.innerHTML = item;
        handle(divEl, item);
      });

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
    if (response.status > 200) {
      const msg = 'error:' + response.statusText;
      alert(msg);
      throw new Error(msg);
    }
    const res = await response.json();
    return res;
  }
});

function toNumber(value) {
  return value ? Number(value) : undefined;
}
