import { accessAction, actionDelegationMiddleware, useForm } from '@/index';
import VueHook from '@/statesHook/vue';
import { getMethodInternalKey } from '@alova/shared/function';
import { fireEvent, render, screen } from '@testing-library/vue';
import { AlovaGenerics, Method, createAlova } from 'alova';
import { untilCbCalled } from 'root/testUtils';
import { mockRequestAdapter } from '~/test/mockData';
import { FormHookConfig } from '~/typings/clienthook';
import CompPersistentDataReset from './components/persistent-data-reset.vue';
import CompRestorePersistentData from './components/restore-persistent-data.vue';

type ID = NonNullable<FormHookConfig<AlovaGenerics, any, any[]>['id']>;
const getStoragedKey = (methodInstance: Method, id?: ID) => `alova/form-${id || getMethodInternalKey(methodInstance)}`;
const alovaInst = createAlova({
  baseURL: 'http://localhost:8080',
  statesHook: VueHook,
  requestAdapter: mockRequestAdapter,
  cacheLogger: false
});
describe('vue => useForm', () => {
  test('should default not request immediately', async () => {
    const poster = (data: any) => alovaInst.Post('/saveData', data);
    const { form, send, loading, updateForm } = useForm(poster);
    expect(form.value).toBeUndefined();
    expect(loading.value).toBeFalsy();
    updateForm({ name: 'Ming' });
    updateForm({ age: '18' });

    const newForm = {
      name: 'Ming',
      age: '18'
    };
    expect(form.value).toStrictEqual(newForm);
    const res = await send(form.value);
    expect(res).toStrictEqual({
      code: 200,
      data: newForm
    });
    // 提交后表单数据不重置
    expect(form.value).toStrictEqual(newForm);
  });

  test('should get the initial form and send request immediately', async () => {
    const poster = (form: any) => alovaInst.Post('/saveData', form);
    const newForm = {
      name: 'Ming',
      age: '18'
    };
    const {
      form: form1,
      loading: loading1,
      data: data1,
      onSuccess: onSuccess1
    } = useForm(poster, {
      initialForm: newForm,
      immediate: true
    });
    expect(form1.value).toStrictEqual(newForm);
    expect(loading1.value).toBeTruthy();

    const { data: dataRaw1 } = await untilCbCalled(onSuccess1);
    // 提交后表单数据不重置
    expect(dataRaw1).toStrictEqual({
      code: 200,
      data: newForm
    });
    expect(data1.value).toStrictEqual({
      code: 200,
      data: newForm
    });

    const {
      form: form2,
      loading: loading2,
      data: data2,
      onSuccess: onSuccess2
    } = useForm(poster, {
      initialForm: newForm,
      immediate: true,
      store: true
    });
    expect(form2.value).toStrictEqual(newForm);
    expect(loading2.value).toBeFalsy(); // 在恢复数据后才请求

    const { data: dataRaw2 } = await untilCbCalled(onSuccess2);
    // 提交后表单数据不重置
    expect(dataRaw2).toStrictEqual({
      code: 200,
      data: newForm
    });
    expect(data2.value).toStrictEqual({
      code: 200,
      data: newForm
    });
  });

  test('should restore data first and request immediately', async () => {
    const poster = (form: any) => alovaInst.Post('/saveData', form);
    const initialForm = {
      name: '',
      age: ''
    };
    const storagedForm = {
      name: 'Ming',
      age: '20'
    };

    // 预先存储数据，模拟刷新恢复持久化数据
    const methodStorageKey = getStoragedKey(poster(initialForm));
    alovaInst.l2Cache.set(methodStorageKey, storagedForm);

    const { form, onSuccess } = useForm(poster, {
      initialForm,
      immediate: true,
      store: true
    });

    const { data } = await untilCbCalled(onSuccess);
    // 提交后表单数据不重置
    expect(data).toStrictEqual({
      code: 200,
      data: form.value
    });
  });

  test('should reset form data when set resetAfterSubmiting to true', async () => {
    const poster = (data: any) => alovaInst.Post('/saveData', data);
    const initialForm = {
      name: '',
      age: ''
    };
    const { form, loading, send } = useForm(poster, {
      initialForm,
      resetAfterSubmiting: true
    });

    expect(form.value).toStrictEqual(initialForm);
    expect(loading.value).toBeFalsy();

    // 更新表单数据
    form.value.name = 'Ming';
    form.value.age = '18';

    await send(form.value);
    // 提交后表单数据后将重置数据
    expect(form.value).toStrictEqual(initialForm);
  });

  test('should persist form data when set store to true', async () => {
    const poster = (data: any) => alovaInst.Post('/saveData?d=1', data);
    const initialForm = {
      name: '',
      age: ''
    };
    const { form, send, onRestore } = useForm(poster, {
      initialForm,
      store: true,
      resetAfterSubmiting: true
    });
    const restoreMockHandler = vi.fn();
    onRestore(restoreMockHandler);

    await untilCbCalled(setTimeout, 100);
    expect(restoreMockHandler).not.toHaveBeenCalled(); // 没有缓存不会触发onRestore

    // storageKey会在useForm被调用时同步生成
    const methodStorageKey = getStoragedKey(poster(initialForm));
    const getStoragedForm = () => alovaInst.l2Cache.get(methodStorageKey);

    // 更新表单数据，并验证持久化数据
    form.value.name = 'Ming';
    await untilCbCalled(setTimeout, 100);
    expect(await getStoragedForm()).toStrictEqual({
      name: 'Ming',
      age: ''
    });
    form.value.age = '18';
    await untilCbCalled(setTimeout, 100);
    expect(getStoragedForm()).toStrictEqual({
      name: 'Ming',
      age: '18'
    });

    await send(form.value);
    // 提交后表单数据后将重置数据
    expect(form.value).toStrictEqual(initialForm);
    expect(getStoragedForm()).toBeNull();
  });

  test('should send request after persistent data is restored', async () => {
    const poster = (data: any) => alovaInst.Post('/saveData?d=2', data);
    const initialForm = {
      name: '',
      age: ''
    };
    const storagedForm = {
      name: 'Hong',
      age: '22'
    };
    // 预先存储数据，模拟刷新恢复持久化数据
    const methodStorageKey = getStoragedKey(poster(initialForm));
    alovaInst.l2Cache.set(methodStorageKey, storagedForm);

    render(CompRestorePersistentData);

    expect(screen.getByRole('form')).toHaveTextContent(JSON.stringify(initialForm)); // 缓存恢复前
    await screen.findByText('isRestore_1');
    expect(screen.getByRole('form')).toHaveTextContent(JSON.stringify(storagedForm)); // 缓存恢复后

    // 缓存恢复后才会开始发送请求
    await screen.findByText('isSuccess_1');
    expect(screen.getByRole('form')).toHaveTextContent(JSON.stringify(initialForm)); // 请求成功后重置了

    // 当有缓存数据并且immediate设置为true时，会在数据恢复后再发起提交
    expect(screen.getByRole('data')).toHaveTextContent(
      JSON.stringify({
        code: 200,
        data: storagedForm
      })
    );
  });

  test('should reset when call function reset manually', () => {
    const poster = (data: any) => alovaInst.Post('/saveData', data);
    const initialForm = {
      name: '',
      age: ''
    };
    const newForm = {
      name: 'Hong',
      age: '22'
    };
    const { form, reset, updateForm } = useForm(form => poster(form), {
      initialForm
    });

    updateForm(newForm);
    expect(form.value).toStrictEqual(newForm);

    reset();
    expect(form.value).toStrictEqual(initialForm);
  });

  test('should clear storaged data when call function reset manually', async () => {
    const poster = (data: any) => alovaInst.Post('/saveData', data);
    const initialForm = {
      date: null as Date | null,
      reg: null as RegExp | null
    };
    const { form, reset } = useForm(poster, {
      initialForm,
      store: true
    });
    const methodStorageKey = getStoragedKey(poster(initialForm));
    const dateObj = new Date('2022-10-01 00:00:00');
    const dateTimestamp = dateObj.getTime();
    const regObj = /abc_([0-9])+$/;
    form.value.date = dateObj;
    form.value.reg = regObj;
    await untilCbCalled(setTimeout, 20);
    expect(form.value).toStrictEqual({
      date: dateObj,
      reg: regObj
    });
    // 序列化自动转换date和regexp对象
    expect(alovaInst.l2Cache.get(methodStorageKey)).toStrictEqual({
      date: ['date', dateTimestamp],
      reg: ['regexp', regObj.source]
    });

    reset();
    expect(form.value).toStrictEqual(initialForm);
    await untilCbCalled(setTimeout, 20);
    expect(alovaInst.l2Cache.get(methodStorageKey)).toBeNull();
  });

  test('should remove storage form data when call function reset', async () => {
    const poster = (data: any) => alovaInst.Post('/saveData?d=3', data);
    const initialForm = {
      name: '',
      age: ''
    };
    const storagedForm = {
      name: 'Hong',
      age: '22'
    };

    // 预先存储数据，模拟刷新恢复持久化数据
    const methodStorageKey = getStoragedKey(poster(initialForm));
    alovaInst.l2Cache.set(methodStorageKey, storagedForm);
    const getStoragedForm = () => alovaInst.l2Cache.get(methodStorageKey);
    expect(getStoragedForm()).toStrictEqual(storagedForm);

    render(CompPersistentDataReset); // 渲染组件
    expect(screen.getByRole('form')).toHaveTextContent(JSON.stringify(initialForm)); // 缓存恢复前
    await screen.findByText('isRestore_1');
    expect(screen.getByRole('form')).toHaveTextContent(JSON.stringify(storagedForm)); // 缓存恢复后

    fireEvent.click(screen.getByRole('btnReset'));
    expect(getStoragedForm()).toBeNull();
  });

  test('should access actions by middleware actionDelegation', async () => {
    const poster = (form: any) => alovaInst.Post('/saveData', form);
    const newForm = {
      name: 'Ming',
      age: '18'
    };
    const { onSuccess, onComplete } = useForm(poster, {
      initialForm: newForm,
      immediate: true,
      middleware: actionDelegationMiddleware('test_page')
    });

    const successFn = vi.fn();
    const completeFn = vi.fn();
    onSuccess(successFn);
    onComplete(completeFn);
    await untilCbCalled(onSuccess);

    accessAction('test_page', handlers => {
      expect(handlers.send).toBeInstanceOf(Function);
      expect(handlers.abort).toBeInstanceOf(Function);
      expect(handlers.updateForm).toBeInstanceOf(Function);
      expect(handlers.reset).toBeInstanceOf(Function);
      handlers.send();
    });

    await untilCbCalled(onSuccess);
    expect(successFn).toHaveBeenCalledTimes(2);
    expect(completeFn).toHaveBeenCalledTimes(2);
  });
});
