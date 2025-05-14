import { accessAction } from 'alova/client';

describe('actionDelegation types', () => {
  test('accessAction parameters', () => {
    // Define common types
    type MatchCallback = (matchedSubscriber: Record<string, any>, index: number) => void;
    type IdType = string | number | symbol | RegExp;

    // id parameter type
    expectTypeOf(accessAction).parameter(0).toMatchTypeOf<IdType>();
    // @ts-expect-error
    expectTypeOf(accessAction).parameter(0).toMatchTypeOf<{ name: string }>();

    // onMatch parameter type
    expectTypeOf(accessAction).parameter(1).toMatchTypeOf<MatchCallback>();
    // @ts-expect-error
    expectTypeOf(accessAction).parameter(1).toMatchTypeOf<() => void>();

    // silent parameter type
    expectTypeOf(accessAction).parameter(2).toMatchTypeOf<boolean | undefined>();
    // @ts-expect-error
    expectTypeOf(accessAction).parameter(2).toMatchTypeOf<string>();
  });
});
