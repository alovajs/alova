import { xhrRequestAdapter } from '@/index';
import { createAlova } from 'alova';
import { readFileSync } from 'fs';
import path from 'path';
import { Result, delay, untilReject } from 'root/testUtils';
import { AlovaXHRResponse } from '~/typings';

const baseURL = process.env.NODE_BASE_URL as string;
describe('request adapter', () => {
  test('should send request by XMLHttpRequest', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: xhrRequestAdapter(),
      timeout: 100000,
      responded(response) {
        const { status, statusText, data } = response;
        expect(status).toBe(200);
        expect(statusText).toBe('OK');
        return data;
      }
    });

    const Get = alovaInst.Get<Result>('/unit-test', {
      params: {
        a: '1',
        b: '2'
      }
    });

    const data = await Get;
    expect(data.code).toBe(200);
    expect(data.data.method).toBe('GET');
    expect(data.data.params).toStrictEqual({
      a: '1',
      b: '2'
    });
    expect(data.data.path).toBe('/unit-test');
  });

  test('should send post requset without `content-type`', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: xhrRequestAdapter(),
      responded({ data }) {
        return data;
      }
    });

    const Post = alovaInst.Post<Result<true>>(
      '/unit-test',
      { post1: 'p1', post2: 'p2' },
      {
        params: {
          a: '1',
          b: '2'
        },
        auth: {
          username: 'name1',
          password: '123456'
        }
      }
    );

    const data = await Post;
    expect(data.code).toBe(200);
    expect(data.data.method).toBe('POST');
    expect(data.data.data).toStrictEqual({
      post1: 'p1',
      post2: 'p2'
    });
    expect(data.data.path).toBe('/unit-test');
  });

  test('should throw error when set wrong param', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: xhrRequestAdapter()
    });

    Object.defineProperty(XMLHttpRequest.prototype, 'timeout', {
      configurable: true,
      set() {
        throw new Error('mock timeout set error');
      }
    });

    const Get = alovaInst.Get<Result<true>>('/unit-test', {
      params: {
        a: '1',
        b: '2'
      }
    });
    await expect(Get).rejects.toThrow('mock timeout set error');
    delete (XMLHttpRequest.prototype as any).timeout;
  });

  test('should send post requset with `content-type=application/x-www-form-urlencoded`', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: xhrRequestAdapter(),
      responded({ data }) {
        return data;
      }
    });

    const Post = (data: any) =>
      alovaInst.Post<Result<true>>('/unit-test', data, {
        params: {
          a: '1',
          b: '2'
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        mimeType: 'text/plain; charset=x-user-defined'
      });

    const data = await Post({ post1: 'p1', post2: 'p2' });
    expect(data.code).toBe(200);
    expect(data.data.method).toBe('POST');
    expect(data.data.data).toStrictEqual({ post1: 'p1', post2: 'p2' });
    expect(data.data.path).toBe('/unit-test');

    // 再次测试提交复杂层级数据
    const dataRaw = await Post({
      a: null,
      b: [2, 3],
      c: {
        d: [
          55,
          {
            e: 78,
            ddddd: [
              { g: 889 },
              900,
              [
                {
                  oo: 23,
                  op: [99, 62]
                }
              ]
            ]
          }
        ]
      },
      h: undefined
    }).send();
    expect(dataRaw.code).toBe(200);
    expect(dataRaw.data.method).toBe('POST');
    expect(data.data.path).toBe('/unit-test');
    expect(dataRaw.data.data).toStrictEqual({
      a: 'null',
      'b[0]': '2',
      'b[1]': '3',
      'c[d][0]': '55',
      'c[d][1][ddddd][0][1]': '900',
      'c[d][1][ddddd][0][2][0][oo]': '23',
      'c[d][1][ddddd][0][2][0][op][0]': '99',
      'c[d][1][ddddd][0][2][0][op][1]': '62',
      'c[d][1][ddddd][0][g]': '889',
      'c[d][1][e]': '78'
    });
  });

  test('api not found when request', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: xhrRequestAdapter()
    });

    const Get = alovaInst.Get<AlovaXHRResponse<Result>>('/unit-test-404');

    const data = await Get;
    expect(data.data).toStrictEqual('');
    expect(data.status).toBe(404);
    expect(data.statusText).toBe('api not found');
  });

  test('request fail', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: xhrRequestAdapter(),
      responded({ data }) {
        return data;
      }
    });

    const Get = alovaInst.Get<Result>('/unit-test-error');

    const error = await untilReject(Get);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toMatch(/Network Error/);
  });

  // 单独跑这个单测可以通过，整体测试报错，暂时先skip
  test.skip('should cancel request when timeout', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: xhrRequestAdapter(),
      timeout: 1,
      responded({ data }) {
        return data;
      }
    });

    const Get = alovaInst.Get<Result>('/unit-test-passthrough');
    const error = await untilReject(Get);
    expect(error.message).toBe('Network Timeout');
  });

  test('should cancel request when call `abort`', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: xhrRequestAdapter(),
      responded({ data }) {
        return data;
      }
    });

    const Get = alovaInst.Get<Result>('/unit-test-passthrough');
    delay(0).then(() => {
      Get.abort();
    });
    const error = await untilReject(Get);
    expect(error.message).toBe('The user aborted a request.');
  });

  test('should upload file and pass the right args', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: xhrRequestAdapter(),
      responded({ data }) {
        return data;
      }
    });

    // 使用formData上传文件
    const formData = new FormData();
    formData.append('f1', 'f1');
    formData.append('f2', 'f2');
    const imageFile = new File([readFileSync(path.resolve(__dirname, '../../../assets/img-test.jpg'))], 'file', {
      type: 'image/jpeg'
    });
    formData.append('file', imageFile);
    // msw的xhr.upload不支持上传功能
    const Post = alovaInst.Post<Result<string>>('/unit-test-upload', formData, {
      withCredentials: true
    });

    const data = await Post;
    expect(data.code).toBe(200);
    expect(data.data.method).toBe('POST');
    expect(data.data.path).toBe('/unit-test-upload');
    expect(data.data.params.contentType).toMatch('multipart/form-data;');
  });

  test('should download file and pass the right args', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: xhrRequestAdapter(),
      responded({ data }) {
        return data;
      }
    });

    const Get = alovaInst.Get('/unit-test-download', {
      responseType: 'blob'
    });

    let downloading = {};
    Get.onDownload(progress => {
      downloading = progress;
    });
    await Get;
    expect(downloading).toStrictEqual({ total: 250569, loaded: 250569 });
  });

  // https://github.com/alovajs/alova/issues/501
  test('should return string in text type response', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: xhrRequestAdapter(),
      responded({ data }) {
        return data;
      }
    });

    const Get = alovaInst.Get('/unit-test-plaintext');
    const GetWithJSONType = alovaInst.Get('/unit-test-plaintext', {
      responseType: 'json'
    });
    const GetWithTextType = alovaInst.Get('/unit-test-plaintext', {
      responseType: 'text'
    });

    Get.then(ret => expect(ret).toStrictEqual('plaintext'));
    GetWithJSONType.then(ret => expect(ret).toStrictEqual('plaintext'));
    GetWithTextType.then(ret => expect(ret).toStrictEqual('plaintext'));

    await Promise.all([Get, GetWithJSONType, GetWithTextType]);
  });

  test('should get empty string when receive nothing from response', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: xhrRequestAdapter(),
      responded({ data }) {
        return data;
      }
    });

    const Get = alovaInst.Get('/unit-test-empty');

    Get.then(ret => expect(ret).toStrictEqual(''));
    await Get;
  });
});
