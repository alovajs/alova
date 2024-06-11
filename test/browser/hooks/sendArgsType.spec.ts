import { useFetcher, useRequest, useWatcher } from '@/index';
import VueHook from '@/predefine/VueHook';
import { Ref, ref } from 'vue';
import { getAlovaInstance } from '~/test/utils';
import { FetcherType } from '~/typings';
const alovaInst = getAlovaInstance(VueHook);

interface NestType {
  name: string;
  age: number;
}
const Getter = (name: string, nested: NestType) => alovaInst.Get<number>('test', { params: { name, nested } });
const GetterAny = alovaInst.Get<string>('test');
const GetterAnyHandler = () => alovaInst.Get<NestType>('test');

describe('Type tests for send', () => {
  test('useRequest send type', () => {
    const hookA = useRequest(Getter, {
      force(...args) {
        expect<Equal<typeof args, [string, NestType, ...any[]]>>(true);
        return false;
      },
      middleware(context, next) {
        expect<Equal<Parameters<typeof context.send>, [string, NestType, ...any[]]>>(true);
        next();
      }
    });
    const hookB = useRequest(GetterAny, {
      force(...args) {
        expect<Equal<typeof args, [...any[]]>>(true);
        return false;
      },
      middleware(context, next) {
        expect<Equal<Parameters<typeof context.send>, [...any[]]>>(true);
        next();
      }
    });
    const hookC = useRequest(GetterAnyHandler, {
      force(...args) {
        expect<Equal<typeof args, [...any[]]>>(true);
        return false;
      },
      middleware(context, next) {
        expect<Equal<Parameters<typeof context.send>, [...any[]]>>(true);
        next();
      }
    });
    hookA.onSuccess(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [string, NestType, ...any[]]>>(true);
    });
    hookA.onComplete(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [string, NestType, ...any[]]>>(true);
    });
    hookA.onError(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [string, NestType, ...any[]]>>(true);
    });
    hookB.onSuccess(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [...any[]]>>(true);
    });
    hookB.onComplete(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [...any[]]>>(true);
    });
    hookB.onError(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [...any[]]>>(true);
    });
    hookC.onSuccess(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [...any[]]>>(true);
    });
    hookC.onComplete(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [...any[]]>>(true);
    });
    hookC.onError(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [...any[]]>>(true);
    });
    expect<Equal<Parameters<typeof hookA.send>, [string, NestType, ...any[]]>>(true);
    expect<Equal<Parameters<typeof hookB.send>, [...any[]]>>(true);
    expect<Equal<Parameters<typeof hookB.send>, Parameters<typeof hookC.send>>>(true);
    expect<Equal<typeof hookA.data, Ref<number>>>(true);
    expect<Equal<typeof hookB.data, Ref<string>>>(true);
    expect<Equal<typeof hookC.data, Ref<NestType>>>(true);
    expect<Equal<Parameters<typeof hookA.send>, [...any[]]>>(false);
  });
  test('useWatcher send type', () => {
    const mutateNum = ref(0);
    const mutateStr = ref('a');
    const hookA = useWatcher(Getter, [mutateNum, mutateStr], {
      force(...args) {
        expect<Equal<typeof args, [string, NestType, ...any[]]>>(true);
        return false;
      },
      middleware(context, next) {
        expect<Equal<Parameters<typeof context.send>, [string, NestType, ...any[]]>>(true);
        next();
      }
    });
    const hookB = useWatcher(GetterAny, [mutateNum, mutateStr], {
      force(...args) {
        expect<Equal<typeof args, [...any[]]>>(true);
        return false;
      },
      middleware(context, next) {
        expect<Equal<Parameters<typeof context.send>, [...any[]]>>(true);
        next();
      }
    });
    const hookC = useWatcher(GetterAnyHandler, [mutateNum, mutateStr], {
      force(...args) {
        expect<Equal<typeof args, [...any[]]>>(true);
        return false;
      },
      middleware(context, next) {
        expect<Equal<Parameters<typeof context.send>, [...any[]]>>(true);
        next();
      }
    });
    hookA.onSuccess(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [string, NestType, ...any[]]>>(true);
    });
    hookA.onComplete(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [string, NestType, ...any[]]>>(true);
    });
    hookA.onError(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [string, NestType, ...any[]]>>(true);
    });
    hookB.onSuccess(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [...any[]]>>(true);
    });
    hookB.onComplete(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [...any[]]>>(true);
    });
    hookB.onError(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [...any[]]>>(true);
    });
    hookC.onSuccess(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [...any[]]>>(true);
    });
    hookC.onComplete(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [...any[]]>>(true);
    });
    hookC.onError(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [...any[]]>>(true);
    });
    expect<Equal<Parameters<typeof hookA.send>, [string, NestType, ...any[]]>>(true);
    expect<Equal<Parameters<typeof hookB.send>, [...any[]]>>(true);
    expect<Equal<Parameters<typeof hookB.send>, Parameters<typeof hookC.send>>>(true);
    expect<Equal<typeof hookA.data, Ref<number>>>(true);
    expect<Equal<typeof hookB.data, Ref<string>>>(true);
    expect<Equal<typeof hookC.data, Ref<NestType>>>(true);
    expect<Equal<Parameters<typeof hookA.send>, [...any[]]>>(false);
  });
  test('useFetcher send type', () => {
    // 取除第一个外后面的参数
    type Tail<T extends any[]> = T extends [any, ...infer Rest] ? Rest : never;

    const hookA = useFetcher<FetcherType<typeof alovaInst>, Parameters<typeof Getter>>({
      force(...args) {
        expect<Equal<typeof args, [string, NestType, ...any[]]>>(true);
        return false;
      },
      middleware(context, next) {
        expect<Equal<Tail<Parameters<typeof context.fetch>>, [string, NestType, ...any[]]>>(true);
        next();
      }
    });
    const hookB = useFetcher<FetcherType<typeof alovaInst>>({
      force(...args) {
        expect<Equal<typeof args, [...any[]]>>(true);
        return false;
      },
      middleware(context, next) {
        expect<Equal<Tail<Parameters<typeof context.fetch>>, [...any[]]>>(true);
        next();
      }
    });
    const hookC = useFetcher<FetcherType<typeof alovaInst>, Parameters<typeof GetterAnyHandler>>({
      force(...args) {
        expect<Equal<typeof args, [...any[]]>>(true);
        return false;
      },
      middleware(context, next) {
        expect<Equal<Tail<Parameters<typeof context.fetch>>, [...any[]]>>(true);
        next();
      }
    });
    hookA.onSuccess(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [string, NestType, ...any[]]>>(true);
    });
    hookA.onComplete(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [string, NestType, ...any[]]>>(true);
    });
    hookA.onError(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [string, NestType, ...any[]]>>(true);
    });
    hookB.onSuccess(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [...any[]]>>(true);
    });
    hookB.onComplete(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [...any[]]>>(true);
    });
    hookB.onError(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [...any[]]>>(true);
    });
    hookC.onSuccess(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [...any[]]>>(true);
    });
    hookC.onComplete(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [...any[]]>>(true);
    });
    hookC.onError(({ sendArgs }) => {
      expect<Equal<typeof sendArgs, [...any[]]>>(true);
    });
    expect<Equal<Tail<Parameters<typeof hookA.fetch>>, [string, NestType, ...any[]]>>(true);
    expect<Equal<Tail<Parameters<typeof hookB.fetch>>, [...any[]]>>(true);
    expect<Equal<Tail<Parameters<typeof hookB.fetch>>, Tail<Parameters<typeof hookC.fetch>>>>(true);
    expect<Equal<Tail<Parameters<typeof hookA.fetch>>, [...any[]]>>(false);
  });
});
