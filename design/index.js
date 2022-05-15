const alova = createAlova({
  baseURL: '...',   // base地址
  timeout: 2000,    // 请求超时时间

  // 请求缓存时间，如缓存时间大于0则使用url+参数的请求将首先返回缓存数据
  // 时间为毫秒，小于等于0不缓存，Infinity为永不过期
  staleTime: Infinity,
  statesHook: {
    // vue
    create() {
      const loading = ref(false);
      const data = ref(null);
      const error = ref(null);
      const progress = ref(0);
      return {
        loading,
        data,
        error,
        progress,
      };
    },

    update(newVal, state) {
      state.loading.value = newVal.loading;
      state.data.value = newVal.data;
      state.error.value = newVal.error;
      state.progress.value = newVal.progress;
    },

    // react
    // create() {
    //   const loading = useState(false);
    //   const data = useState(null);
    //   const error = useState(null);
    //   const progress = useState(0);
    //   return {
    //     loading,
    //     data,
    //     error,
    //     progress,
    //   };
    // },
    // export(state) {
    //   const exp = {};
    //   Object.keys(state).forEach(key => {
    //     exp[key] = state[key][0];
    //   });
    //   return exp;
    // },
    // update(newVal, state) {
    //   state.loading[1](newVal.loading);
    //   state.data[1](newVal.data);
    //   state.error[1](newVal.error);
    //   state.progress[1](newVal.progress);
    // },
  },

  // 静默请求配置
  // 以下的key都是自动拼接了对应前缀的key
  silentConfig: {
    push: (key, config) => {
      const silentRequestStorageKey = '__$$silentRequestStorageKey$$__';
      localStorage.setItem(key, JSON.stringify(config));
      const storageKeys = JSON.parse(localStorage.getItem(silentRequestStorageKey) || '[]');
      storageKeys.push(key);
      localStorage.setItem(silentRequestStorageKey, JSON.stringify(storageKeys));
    },
    pop: () => {
      const silentRequestStorageKey = '__$$silentRequestStorageKey$$__';
      const storageKeys = JSON.parse(localStorage.getItem(silentRequestStorageKey) || '[]');
      if (storageKeys.length > 0) {
        const key = storageKeys.shift();
        localStorage.setItem(JSON.stringify(storageKeys));
        const reqConfig = localStorage.getItem(key);
        return reqConfig ? JSON.parse(reqConfig) : undefined;
      }
    }
  },
  persistResponse: {
    set: (key, response) => {
      localStorage(key, JSON.stringify(response));
    },
    get: key => {
      const response = localStorage.getItem(key);
      return response ? JSON.parse(response) : undefined;
    }
  },
  // requestAdapter(source, data, config) {
  //   return fetch(source, { data, ...config });
  // },
});


alova.setRequestInterceptor(config => {
  // 请求前拦截器，包括设置header
});
alova.setResponseInterceptor(response => {
  // 响应拦截器...
});



const alova = createAlova({
  baseURL: '...',   // base地址
  timeout: 2000,    // 请求超时时间
  staleTime: 60000,
  silentRequest: createLocalStorageSilentConfig(),
  statesHook: VueHook,
});



function getter(a, b, h) {
  return alova.Get<Record<string, string>>('...', {
    params: {
      a,
      b,
      // ...get参数
    },
    headers: {
      h,
      // ...header参数
    }
    silent: true,
    timeout: 3000,    // 当前中断时间
    cache: false,     // 设置不缓存，这样每次都能获取最新数据
    // persist: true,    // 是否持久化响应数据？？？是否参考react-query的initData，
    transformResponse(data, headers) {

    }
  });
}
function poster(a, b) {
  return alova.Post('...', {
    a,
    b,
    // ...data参数
  }, {
    params: {
      // ...get参数
    }
    silent: true,
    transformResponse(data, headers) {

    }
  });
}
function deleter(a, b) {
  return alova.Delete('...', {
    silent: true,
    params: {
      // ...get参数
    },
    headers: {
      // ...
    }
  });
}


// hook形式的get请求、post请求
const {
  loading,
  data,
  error,
  progress,
  onSuccess,
} = useRequest(getter(1, 2));
const {
  // ...
} = useRequest(poster(1, 2));

// 监听某个值变化，变化则重新请求
const page = ref(1);
const searchText = ref('');
useWatcher(() => getter(page.value, searchText.value), [page, searchText]);


// 发起普通get请求，返回Promise
const getData = await getter(1, 2).send();
// 发起普通post请求，返回Promise
const postData = await poster(3, 4).send();

// 手动中断请求
const abort = new Alova.Abort();
const getData2 = await getter(1, 2).setAbort(abort).send();
abort.do();


// 让一个key失效
onSuccess(() => {
  alova.invalidate(getter(1, 2));
});
// 更新缓存
onSuccess(() => {
  alova.update(getter(1, 2), data => {
    const d = { ...data.value };
    d.a = 1;
    data.value = d;
  });
});
// 重新获取数据并缓存
onSuccess(() => {
  alova.fetch(getter(1, 2));
});

// 增加机制
// 1、持久化缓存数据，下次请求先返回缓存数据，再请求更新数据
// 2、有缓存时强制请求机制