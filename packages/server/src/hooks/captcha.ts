import { createAssert, getTime, isArray, isFn } from '@alova/shared';
import { AlovaGlobalCacheAdapter, Method } from 'alova';

const assert: ReturnType<typeof createAssert> = createAssert('Captcha');

interface CaptchaCodeSet {
  chars?: (string | number)[];
  length?: number;
}

type CaptchaCodeSetType = (string | number)[] | CaptchaCodeSet | (() => string);

export interface CaptchaProviderOptions {
  /**
   * Time interval before captcha can be resent, in milliseconds
   * @default 60000
   */
  resetTime?: number;

  /**
   * Captcha expiration time, in milliseconds
   * @default 300000
   */
  expireTime?: number;

  /**
   * Namespace prefix to prevent naming conflicts when using the same storage
   * @default 'alova-captcha'
   */
  keyPrefix?: string;

  /**
   * Captcha storage adapter, required
   */
  store: AlovaGlobalCacheAdapter;

  /**
   * When set to true, if there's an unexpired captcha in storage during resend,
   * it will resend the stored captcha instead of generating a new one
   * @default false
   */
  resendFormStore?: boolean;

  /**
   * Set of characters for code generation
   * @default Generates a 4-digit random number from 0-9
   */
  codeSet?: CaptchaCodeSetType;
}

interface CaptchaData {
  code: string;
  expireTime: number;
  resetTime: number;
}

const defaultCodeChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const defaultCodeLength = 4;

/**
 * Generate captcha code
 */
const generateCode = (codeSet: CaptchaCodeSetType = defaultCodeChars) => {
  if (isFn(codeSet)) {
    return codeSet();
  }

  const { chars = defaultCodeChars, length = defaultCodeLength } = isArray(codeSet) ? { chars: codeSet } : codeSet;
  let code = '';
  for (let i = 0; i < length; i += 1) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  return code;
};

/**
 * Create captcha provider
 */
export const createCaptchaProvider = (options: CaptchaProviderOptions) => {
  const {
    resetTime = 60 * 1000,
    expireTime = 60 * 1000 * 5,
    keyPrefix = 'alova-captcha',
    store,
    resendFormStore = false,
    codeSet
  } = options;

  assert(!!store, 'store is required');

  /**
   * Get storage key
   */
  const getStoreKey = (key: string) => `${keyPrefix}:${key}`;

  /**
   * Send captcha
   * @param methodHandler Request function for sending captcha
   * @param key Captcha key
   */
  const sendCaptcha = async (methodHandler: (code: string, key: string) => Method, { key }: { key: string }) => {
    const storeKey = getStoreKey(key);
    const now = getTime();
    const storedData = await store.get<CaptchaData>(storeKey);

    // Check if can resend
    if (storedData && now < storedData.resetTime) {
      throw new Error('Cannot send captcha yet, please wait');
    }

    // If resendFormStore is enabled and there's an unexpired captcha in storage,
    // use the stored captcha
    let code: string;
    if (resendFormStore && storedData && now < storedData.expireTime) {
      code = storedData.code;
    } else {
      code = generateCode(codeSet);
    }

    // Send captcha
    const response = await methodHandler(code, key);

    // Store captcha information
    await store.set(storeKey, {
      code,
      expireTime: now + expireTime,
      resetTime: now + resetTime
    });

    return response;
  };

  /**
   * Verify captcha
   * @param code User submitted captcha code
   * @param key Captcha key
   */
  const verifyCaptcha = async (code: string, key: string) => {
    const storeKey = getStoreKey(key);
    const storedData = await store.get<CaptchaData>(storeKey);

    if (!storedData || getTime() > storedData.expireTime) {
      await store.remove(storeKey);
      return false;
    }

    const isValid = storedData.code === code;
    if (isValid) {
      await store.remove(storeKey);
    }
    return isValid;
  };

  return {
    sendCaptcha,
    verifyCaptcha
  };
};

export default createCaptchaProvider;
