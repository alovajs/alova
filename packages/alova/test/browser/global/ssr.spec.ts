import globalConfig, { globalConfigMap } from '@/globalConfig';

describe('ssr', () => {
  test('default ssr option', () => {
    expect(globalConfigMap.ssr).toBeFalsy();
  });

  test('set ssr to false', () => {
    globalConfig({ ssr: false });
    expect(globalConfigMap.ssr).toBeFalsy();
  });

  test('set ssr to true', () => {
    globalConfig({ ssr: true });
    expect(globalConfigMap.ssr).toBeTruthy();
  });
});
