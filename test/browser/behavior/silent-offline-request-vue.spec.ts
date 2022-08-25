import {
  useRequest,
} from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { getResponseCache } from '../../../src/storage/responseCache';
import { key } from '../../../src/utils/helper';
import { Result } from '../result.type';
import { mockServer, getAlovaInstance } from '../../utils';
import { getSilentRequest } from '../../../src/storage/silentStorage';

beforeAll(() => mockServer.listen());
afterEach(() => {
  mockServer.resetHandlers();
  localStorage.clear();
});
afterAll(() => mockServer.close());

class NetworkController {
  private win: Window;
  private onLine: boolean;
  constructor(win: Window) { 
    this.win = win; 
    this.onLine = win.navigator.onLine; 

    // Replace the default onLine implementation with our own. 
    Object.defineProperty(win.navigator.constructor.prototype, 'onLine', {
      get:() => {
        return this.onLine;
      },
    });
  }

  setOnline() { 
    const was = this.onLine;
    this.onLine = true;
    // Fire only on transitions.
    if (!was) {
      this.fire('online'); 
    } 
  } 

  setOffline() { 
    const was = this.onLine; 
    this.onLine = false; 

    // Fire only on transitions. 
    if (was) { 
      this.fire('offline'); 
    } 
  }

  fire(event: string) { 
   this.win.dispatchEvent(new (this.win as any).Event(event));
  } 
}

describe('use useRequest to send silent request', function() {
  test('send a silent\'s post', done => {
    const alova = getAlovaInstance(VueHook);
    const Post = alova.Post<Result<string>>('/unit-test', { postData: 'abc' });
    const {
      loading,
      data,
      downloading,
      error,
      send,
      onSuccess,
      onComplete,
    } = useRequest(Post, {
      immediate: false,
      silent: true,
    });
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    send();
    // 静默请求在发送请求时就会触发onSuccess
    let flag = 0;
    onSuccess(() => {
      expect(loading.value).toBeFalsy();
      expect(data.value).toBeUndefined();
      expect(downloading.value).toEqual({ total: 0, loaded: 0 });
      expect(error.value).toBeUndefined();
      const cacheData = getResponseCache(alova.id, key(Post));
      expect(cacheData).toBeUndefined();
      flag++;
    });
    onComplete(() => flag++);
    // 确保回调是立即执行的
    setTimeout(() => {
      expect(flag).toBe(2);
      done();
    }, 10);
  });

  test('should push to localStorage when silent\'s post is failed', done => {
    jest.setTimeout(10000);   // 因为静默提交失败重新调用间隔为2秒，这边需加大超时时间
    let throwError = 0;
    const alova = getAlovaInstance(VueHook, {
      responseExpect: () => {
        throwError++;
        if (throwError < 3) {
          setTimeout(() => {
            const { serializedMethod } = getSilentRequest(alova.id, alova.storage);
            expect(serializedMethod).not.toBeUndefined();
          }, 0);
          throw new Error('custom error');
        }
        setTimeout(() => {
          const { serializedMethod } = getSilentRequest(alova.id, alova.storage);
          expect(serializedMethod).toBeUndefined();
          done();
        }, 0);
      }
    });
    const Post = alova.Post<Result<string>>('/unit-test', { postData: 'abc' });
    const {
      loading,
      data,
      downloading,
      error,
      send,
    } = useRequest(Post, { immediate: false, silent: true, });
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    send().catch(() => {});
  });

  test('should push to localStorage instead send request when network offline', async () => {
    const requestHookMock = jest.fn(() => {});
    const responsedHookMock = jest.fn(() => {});
    const networkCtrl = new NetworkController(window);
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: requestHookMock,
      responseExpect: responsedHookMock
    });
    const Post = alova.Post<Result<string>>('/unit-test', { postData: 'abc' });
    networkCtrl.setOffline();
    const {
      loading,
      data,
      downloading,
      error,
    } = useRequest(Post, { silent: true });
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    let persisted = getSilentRequest(alova.id, alova.storage);
    const serializedMethod = persisted.serializedMethod || { url: '', type: '', requestBody: {} };
    expect(serializedMethod.url).toBe('/unit-test');
    expect(serializedMethod.type).toBe('POST');
    expect(serializedMethod.requestBody).toEqual({ postData: 'abc' });
    expect(requestHookMock.mock.calls.length).toBe(0);
    expect(responsedHookMock.mock.calls.length).toBe(0);

    // 设置网络正常后将自动启动后台请求服务，把post请求发送出去
    networkCtrl.setOnline();
    await new Promise(resolve => setTimeout(resolve, 2500));
    persisted = getSilentRequest(alova.id, alova.storage);
    expect(persisted.serializedMethod).toBeUndefined();
    expect(requestHookMock.mock.calls.length).toBe(1);
    expect(responsedHookMock.mock.calls.length).toBe(1);
  });
});