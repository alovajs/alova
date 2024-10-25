import { createAlovaMockAdapter, defineMock, FetchRequestInit } from '@alova/mock';
import { AlovaRequestAdapter } from 'alova';
import { untilCbCalled } from 'root/testUtils';

const total = 300;
let mockListData: any;
export const setMockListData = (cb?: (data: any) => void) => {
  mockListData = typeof cb === 'function' ? cb(mockListData) : Array.from({ length: total }).map((_, i) => i);
};

let mockListWithSearchData: { id: number; word: string }[] = [];
export const setMockListWithSearchData = (cb?: (data: any) => typeof mockListWithSearchData) => {
  mockListWithSearchData =
    typeof cb === 'function'
      ? cb(mockListWithSearchData)
      : Array.from({ length: total }).map((_, i) => {
          const n = i % 3;
          return {
            id: i,
            word: ['aaa', 'bbb', 'ccc'][n]
          };
        });
};

const shortTotal = 10;
let shortList: any;
export const setMockShortListData = (cb?: (data: any) => void) => {
  shortList = typeof cb === 'function' ? cb(shortList) : Array.from({ length: shortTotal }).map((_, i) => i);
};

setMockListData();
setMockListWithSearchData();
setMockShortListData();

let detailErrorId = '';
let detailErrorTimes = 0;
const mocks = defineMock({
  '/list': ({ query }) => {
    let { page = 1, pageSize = 10 } = query;
    const { min = 0, max = Infinity } = query;
    page = Number(page);
    pageSize = Number(pageSize);
    const start = (page - 1) * pageSize;
    const filteredListData = mockListData.filter((num: number) => num >= Number(min) && num <= Number(max));
    return {
      total: filteredListData.length,
      list: filteredListData.slice(start, start + pageSize)
    };
  },

  '/list-short': ({ query }) => {
    let { page = 1, pageSize = 10 } = query;
    page = Number(page);
    pageSize = Number(pageSize);
    const start = (page - 1) * pageSize;
    return {
      total: shortList.length,
      list: shortList.slice(start, start + pageSize)
    };
  },

  '/list-with-search': ({ query }) => {
    let { page = 1, pageSize = 10 } = query;
    const { keyword } = query;
    page = Number(page);
    pageSize = Number(pageSize);
    const start = (page - 1) * pageSize;
    const filteredList = mockListWithSearchData.filter(({ word }) => (keyword ? word === keyword : true));
    return {
      total: filteredList.length,
      list: filteredList.slice(start, start + pageSize)
    };
  },

  '/info-list': () => [
    {
      id: 10,
      text: 'a'
    },
    {
      id: 20,
      text: 'b'
    },
    {
      id: 30,
      text: 'c'
    }
  ],
  '[POST]/detail': () => ({
    id: 1
  }),
  '[DELETE]/detail/{id}': ({ params, data }) => ({
    params,
    data
  }),
  '[POST]/detail-error': ({ data = {} }) => {
    const { id, failTimes = 3 } = data;
    // 根据id判断是否需要重置detailErrorTimes
    if (id !== detailErrorId) {
      detailErrorTimes = 0;
      detailErrorId = id;
    }
    if (detailErrorTimes < Number(failTimes)) {
      detailErrorTimes += 1;
      return {
        status: 403,
        statusText: 'no permission'
      };
    }
    detailErrorTimes = 0;
    return {
      id: 1
    };
  },
  '[GET]/list-error': () => ({
    status: 500,
    statusText: 'server error'
  }),
  '[POST]/detail2': ({ data = {} }) => ({
    id: 10,
    ...data
  }),
  '[POST]/captcha': ({ data = {} }) => {
    if (data.error) {
      return {
        status: 500,
        statusText: 'server error'
      };
    }
    return 'success';
  },
  '[POST]/saveData': ({ data = {} }) => {
    if (data.error) {
      return {
        status: 500,
        statusText: 'server error'
      };
    }
    return {
      code: 200,
      data
    };
  },
  '/list-auth': ({ headers, query }) => {
    if (headers.Authorization !== '123') {
      return {
        status: 401,
        statusText: `unauthorized${query.notError ? '-notError' : ''}`
      };
    }
    return [0, 1, 2, 3, 4, 5];
  },
  '/refresh-token': ({ query }) => {
    if (query.error) {
      return {
        status: 401,
        statusText: 'refresh token unauthorized'
      };
    }
    return {
      token: '123'
    };
  },
  '/return-query': ({ query }) => ({
    query
  }),
  '/query-1s': async ({ query }) => {
    await untilCbCalled(setTimeout, 1000);
    return { query };
  }
});

interface BodyType {
  status: number;
  statusText: string;
  [k: string]: any;
}

// 模拟数据请求适配器
export const mockRequestAdapter = createAlovaMockAdapter([mocks], {
  delay: 50,
  onMockResponse: ({ status, statusText, body }) => {
    // 当status为错误码时，如果包含notError则以body的形式返回错误信息
    if (status >= 300) {
      if (!/notError/.test(statusText)) {
        const err = new Error(statusText);
        err.name = status.toString();
        throw err;
      } else {
        body = {
          status,
          statusText
        };
      }
    }
    return {
      response: body as BodyType,
      headers: {} as Record<string, number | string>
    };
  },
  mockRequestLogger: false
});

export type MockRequestAdapter = AlovaRequestAdapter<FetchRequestInit, BodyType, Record<string, string | number>>;
