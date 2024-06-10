import { useRequest } from '@/index';
import VueHook from '@/predefine/VueHook';
import { Ref } from 'vue';
import { getAlovaInstance } from '~/test/utils';
const alovaInst = getAlovaInstance(VueHook);

interface NestType {
  name: string;
  age: number;
}

const Getter = (name: string, nested: NestType) => alovaInst.Get<number>('test', { params: { name, nested } });
const GetterAny = alovaInst.Get<string>('test');
const GetterAnyHandler = () => alovaInst.Get<string>('test');

const hookA = useRequest(Getter);
const hookB = useRequest(GetterAny);
const hookC = useRequest(GetterAnyHandler);

export type TestCase1 = ExpectTrue<Equal<Parameters<typeof hookA.send>, [string, NestType, ...any[]]>>;
export type TestCase2 = ExpectTrue<Equal<Parameters<typeof hookB.send>, [...any[]]>>;
export type TestCase3 = ExpectTrue<Equal<Parameters<typeof hookB.send>, Parameters<typeof hookC.send>>>;

export type TestCase4 = ExpectTrue<Equal<typeof hookA.data, Ref<number>>>;
export type TestCase5 = ExpectTrue<Equal<typeof hookA.data, Ref<number>>>;
export type TestCase6 = ExpectTrue<Equal<typeof hookA.data, Ref<number>>>;

// expected error
export type TestCase7 = ExpectFalse<Equal<Parameters<typeof hookA.send>, [...any[]]>>;
test('Type tests for send', () => {
  expect<TestCase1>(true);
  expect<TestCase2>(true);
  expect<TestCase3>(true);
  expect<TestCase4>(true);
  expect<TestCase5>(true);
  expect<TestCase6>(true);
  expect<TestCase7>(false);
});
