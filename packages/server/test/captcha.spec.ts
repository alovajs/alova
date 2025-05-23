import { createCaptchaProvider } from '@/index';
import { createAlova } from 'alova';
import GlobalFetch from 'alova/fetch';

const baseURL = process.env.NODE_BASE_URL as string;
const alovaInst = createAlova({
  baseURL,
  requestAdapter: GlobalFetch(),
  responded: r => r.json()
});

// Mock storage adapter
class MockStorageAdapter {
  private storage = new Map<string, any>();

  async get<T = any>(key: string): Promise<T | undefined> {
    return this.storage.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    this.storage.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.storage.delete(key);
  }

  clear() {
    this.storage.clear();
  }
}

describe('captcha', () => {
  let mockStorage: MockStorageAdapter;
  let currentTime: number;

  beforeEach(() => {
    mockStorage = new MockStorageAdapter();
    currentTime = Date.now();
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime);
    vi.clearAllMocks();
  });

  test('should throw error when store is not provided', () => {
    expect(() => createCaptchaProvider({} as any)).toThrow('store is required');
  });

  test('should use default values when optional parameters not provided', () => {
    const { sendCaptcha } = createCaptchaProvider({
      store: mockStorage
    });
    expect(sendCaptcha).toBeDefined();
  });

  test('should send captcha with default code generation', async () => {
    const { sendCaptcha } = createCaptchaProvider({
      store: mockStorage
    });

    await sendCaptcha((code, key) => alovaInst.Post('/unit-test', { code, key }), { key: 'test' });

    const storedData = await mockStorage.get('alova-captcha:test');
    expect(storedData).toBeDefined();
    expect(storedData.code).toMatch(/^\d{4}$/);
    expect(storedData.expireTime).toBe(currentTime + 300000);
    expect(storedData.resetTime).toBe(currentTime + 60000);
  });

  test('should prevent resending within resetTime', async () => {
    const { sendCaptcha } = createCaptchaProvider({
      store: mockStorage,
      resetTime: 1000
    });

    await sendCaptcha((code, key) => alovaInst.Post('/unit-test', { code, key }), { key: 'test' });

    await expect(
      sendCaptcha((code, key) => alovaInst.Post('/unit-test', { code, key }), { key: 'test' })
    ).rejects.toThrow('Cannot send captcha yet, please wait');
  });

  test('should resend from store when resendFormStore is true', async () => {
    const { sendCaptcha } = createCaptchaProvider({
      store: mockStorage,
      resendFormStore: true
    });

    await sendCaptcha((code, key) => alovaInst.Post('/unit-test', { code, key }), { key: 'test' });
    const firstCode = (await mockStorage.get('alova-captcha:test')).code;

    // Move time forward but still within expireTime
    currentTime += 61000; // Just after resetTime
    await sendCaptcha((code, key) => alovaInst.Post('/unit-test', { code, key }), { key: 'test' });
    const secondCode = (await mockStorage.get('alova-captcha:test')).code;

    expect(secondCode).toBe(firstCode);
  });

  test('should use custom codeSet array', async () => {
    const { sendCaptcha } = createCaptchaProvider({
      store: mockStorage,
      codeSet: ['A', 'B', 'C']
    });

    await sendCaptcha((code, key) => alovaInst.Post('/unit-test', { code, key }), { key: 'test' });

    const storedData = await mockStorage.get('alova-captcha:test');
    expect(storedData.code).toMatch(/^[ABC]{4}$/);
  });

  test('should use custom codeSet object', async () => {
    const { sendCaptcha } = createCaptchaProvider({
      store: mockStorage,
      codeSet: {
        chars: ['X', 'Y', 'Z'],
        length: 6
      }
    });

    await sendCaptcha((code, key) => alovaInst.Post('/unit-test', { code, key }), { key: 'test' });

    const storedData = await mockStorage.get('alova-captcha:test');
    expect(storedData.code).toMatch(/^[XYZ]{6}$/);
  });

  test('should use custom codeSet function', async () => {
    const { sendCaptcha } = createCaptchaProvider({
      store: mockStorage,
      codeSet: () => '1234'
    });

    await sendCaptcha((code, key) => alovaInst.Post('/unit-test', { code, key }), { key: 'test' });

    const storedData = await mockStorage.get('alova-captcha:test');
    expect(storedData.code).toBe('1234');
  });

  test('should verify valid captcha', async () => {
    const { sendCaptcha, verifyCaptcha } = createCaptchaProvider({
      store: mockStorage,
      codeSet: () => '1234'
    });

    await sendCaptcha((code, key) => alovaInst.Post('/unit-test', { code, key }), { key: 'test' });

    await verifyCaptcha('1234', 'test');

    // Verify captcha should be removed after successful verification
    const storedData = await mockStorage.get('alova-captcha:test');
    expect(storedData).toBeUndefined();
  });

  test('should fail verification with wrong code', async () => {
    const { sendCaptcha, verifyCaptcha } = createCaptchaProvider({
      store: mockStorage,
      codeSet: () => '1234'
    });

    await sendCaptcha((code, key) => alovaInst.Post('/unit-test', { code, key }), { key: 'test' });

    const response = await verifyCaptcha('5678', 'test');
    expect(response).toBe(false);

    // Captcha should still exist after failed verification
    const storedData = await mockStorage.get('alova-captcha:test');
    expect(storedData).toBeDefined();
  });

  test('should fail verification with expired captcha', async () => {
    const { sendCaptcha, verifyCaptcha } = createCaptchaProvider({
      store: mockStorage,
      expireTime: 1000,
      codeSet: () => '1234'
    });

    await sendCaptcha((code, key) => alovaInst.Post('/unit-test', { code, key }), { key: 'test' });

    // Move time forward past expireTime
    currentTime += 2000;

    const response = await verifyCaptcha('1234', 'test');
    expect(response).toBe(false);

    // Expired captcha should be removed
    const storedData = await mockStorage.get('alova-captcha:test');
    expect(storedData).toBeUndefined();
  });
});
