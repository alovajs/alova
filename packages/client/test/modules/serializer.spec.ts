import createSerializerPerformer from '@/util/serializer';

const performer = createSerializerPerformer({
  custom: {
    forward: (data: any) => (data === 'a,a' ? '2a' : undefined),
    backward: () => 'a,a'
  }
});
const dateObj = new Date('2022-10-01 00:00:00');
const regObj = /abc_([0-9])+$/;
const dateTimestamp = dateObj.getTime();
describe('serializers', () => {
  test('serialize payload', () => {
    const originalPayload = {
      date: dateObj,
      reg: regObj,
      ary: [1, 'a', 'a,a', 'b', false, dateObj],
      obj: {
        reg: regObj
      }
    };
    const serializedPayload = performer.serialize(originalPayload);

    expect(serializedPayload).toStrictEqual({
      date: ['date', dateTimestamp],
      reg: ['regexp', 'abc_([0-9])+$'],
      ary: [1, 'a', ['custom', '2a'], 'b', false, ['date', dateTimestamp]],
      obj: {
        reg: ['regexp', 'abc_([0-9])+$']
      }
    });
    // Original data remains unchanged
    expect(originalPayload).toStrictEqual({
      date: dateObj,
      reg: regObj,
      ary: [1, 'a', 'a,a', 'b', false, dateObj],
      obj: {
        reg: regObj
      }
    });
  });

  test('serialize outside payload', () => {
    const originalPayload = dateObj;
    const serializedPayload = performer.serialize(originalPayload);
    expect(serializedPayload).toStrictEqual(['date', dateTimestamp]);
  });

  test('dserialize payload', () => {
    const originalPayload = {
      date: ['date', dateTimestamp],
      reg: ['regexp', 'abc_([0-9])+$'],
      ary: [1, 'a', ['custom', '2a'], 'b', false, ['date', dateTimestamp]],
      obj: {
        reg: ['regexp', 'abc_([0-9])+$']
      }
    };
    const serializedPayload = performer.deserialize(originalPayload);
    expect(serializedPayload).toStrictEqual({
      date: dateObj,
      reg: regObj,
      ary: [1, 'a', 'a,a', 'b', false, dateObj],
      obj: {
        reg: regObj
      }
    });
  });

  test('deserialize outside payload', () => {
    const originalPayload = ['date', dateTimestamp];
    const serializedPayload = performer.deserialize(originalPayload);
    expect(serializedPayload).toBeInstanceOf(Date);
  });
});
