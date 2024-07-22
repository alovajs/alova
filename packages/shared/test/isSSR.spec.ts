// this function body will the same as value `isSSR` in `vars.ts`.
// Because the value of 'isSSR' in 'vars. ts' is determined during initialization, so here we create a function which's body has the same content for testing.
const undefStr = 'undefined';
const MockGlobal: any = {};
const isSSR = () =>
  typeof MockGlobal.process !== undefStr
    ? typeof MockGlobal.process.cwd === 'function'
    : typeof MockGlobal.Deno !== undefStr;

const setGlobalProcess = (process: any) => {
  MockGlobal.process = process;
};
const setGlobalDeno = (deno: any) => {
  MockGlobal.Deno = deno;
};

// Mock the global process and Deno objects before each test
beforeEach(() => {
  delete MockGlobal.process;
  delete MockGlobal.Deno;
});

describe('isSSR', () => {
  it('should return false in browser environment', () => {
    // Browser: process is undefined, Deno is undefined
    setGlobalProcess(undefined);
    setGlobalDeno(undefined);
    expect(isSSR()).toBeFalsy();
  });

  it('should return false in react-native environment', () => {
    // React Native: process is undefined, Deno is undefined
    setGlobalProcess(undefined);
    setGlobalDeno(undefined);
    expect(isSSR()).toBeFalsy();
  });

  it('should return false in WeChat Mini Program environment', () => {
    // WeChat Mini Program: process is undefined, Deno is undefined
    setGlobalProcess(undefined);
    setGlobalDeno(undefined);
    expect(isSSR()).toBeFalsy();
  });

  it('should return false in Alipay Mini Program environment', () => {
    // Alipay Mini Program: process is {browser: true}, Deno is undefined
    setGlobalProcess({ browser: true });
    setGlobalDeno(undefined);
    expect(isSSR()).toBeFalsy();
  });

  it('should return false in DingTalk Mini Program environment', () => {
    // DingTalk Mini Program: process is {browser: true}, Deno is undefined
    setGlobalProcess({ browser: true });
    setGlobalDeno(undefined);
    expect(isSSR()).toBeFalsy();
  });

  it('should return false in electron environment', () => {
    // Electron: process is not undefined, but should not be a browser, Deno is undefined
    setGlobalProcess(undefined);
    setGlobalDeno(undefined);
    expect(isSSR()).toBeFalsy();
  });

  it('should return false in tarui environment', () => {
    // Tarui: process is undefined, Deno is undefined
    setGlobalProcess(undefined);
    setGlobalDeno(undefined);
    expect(isSSR()).toBeFalsy();
  });

  it('should return true in Node.js environment', () => {
    // Node.js: process is { cwd() {...}, ... }, Deno is undefined
    setGlobalProcess({ cwd() {} });
    setGlobalDeno(undefined);
    expect(isSSR()).toBeTruthy();
  });

  it('should return false in Deno environment', () => {
    // Deno: process is undefined, Deno is an object
    setGlobalProcess(undefined);
    setGlobalDeno({});
    expect(isSSR()).toBeTruthy();
  });

  it('should return true in bun environment', () => {
    // Bun: process is { cwd() {...}, ... }, Deno is undefined (assuming bun has a similar process object)
    setGlobalProcess({ cwd() {} });
    setGlobalDeno(undefined);
    expect(isSSR()).toBeTruthy();
  });
});
