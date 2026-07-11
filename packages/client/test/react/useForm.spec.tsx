import { useForm } from '@/index';
import ReactHook from '@/statesHook/react';
import { getMethodInternalKey } from '@alova/shared';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AlovaGenerics, Method, createAlova } from 'alova';
import { ReactElement } from 'react';
import { delay } from 'root/testUtils';
import { mockRequestAdapter } from '~/test/mockData';
import { FormHookConfig } from '~/typings/clienthook';

type ID = NonNullable<FormHookConfig<AlovaGenerics, any, any[]>['id']>;
const getStoragedKey = <AG extends AlovaGenerics>(targetKey: Method<AG> | ID) =>
  `alova/form-${targetKey instanceof Method ? getMethodInternalKey(targetKey) : targetKey}`;
const alovaInst = createAlova({
  baseURL: 'http://localhost:8080',
  statesHook: ReactHook,
  requestAdapter: mockRequestAdapter,
  cacheLogger: false
});

describe('react => useForm', () => {
  test('should default not request immediately', async () => {
    const poster = vi.fn((data: any) => alovaInst.Post('/saveData', data));
    function Page() {
      const { form, send, loading, updateForm } = useForm(poster, {
        initialForm: { name: '', age: '' }
      });
      return (
        <div>
          <span role="loading">{loading ? 'loading' : 'loaded'}</span>
          <span role="form">{JSON.stringify(form)}</span>
          <button
            role="btnSend"
            onClick={() => send(form)}>
            send
          </button>
          <button
            role="btnUpdate"
            onClick={() => {
              updateForm({ name: 'Ming' });
              updateForm({ age: '18' });
            }}>
            update
          </button>
        </div>
      );
    }
    render((<Page />) as ReactElement<any, any>);
    expect(screen.getByRole('form')).toHaveTextContent(JSON.stringify({ name: '', age: '' }));
    expect(screen.getByRole('loading')).toHaveTextContent('loaded');

    fireEvent.click(screen.getByRole('btnUpdate'));
    expect(screen.getByRole('form')).toHaveTextContent(JSON.stringify({ name: 'Ming', age: '18' }));
    expect(poster).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('btnSend'));
    await waitFor(() => {
      expect(poster).toHaveBeenCalledTimes(1);
    });
  });

  test('should persist form data when set store to true', async () => {
    const poster = (data: any) => alovaInst.Post('/saveData?persist=1', data);
    const initialForm = {
      name: '',
      age: ''
    };
    const methodStorageKey = getStoragedKey(poster(initialForm));
    const getStoragedForm = () => alovaInst.l2Cache.get(methodStorageKey);

    function Page() {
      const { form, updateForm } = useForm(poster, {
        initialForm,
        store: true
      });
      return (
        <div>
          <span role="form">{JSON.stringify(form)}</span>
          <button
            role="btnUpdate1"
            onClick={() => updateForm({ name: 'Ming' })}>
            update1
          </button>
          <button
            role="btnUpdate2"
            onClick={() => updateForm({ age: '18' })}>
            update2
          </button>
        </div>
      );
    }
    render((<Page />) as ReactElement<any, any>);

    // Update form data and validate persistent data
    fireEvent.click(screen.getByRole('btnUpdate1'));
    await delay(100);
    expect(getStoragedForm()).toStrictEqual({
      name: 'Ming',
      age: ''
    });

    fireEvent.click(screen.getByRole('btnUpdate2'));
    await delay(100);
    expect(getStoragedForm()).toStrictEqual({
      name: 'Ming',
      age: '18'
    });
  });

  test('should restore form data when set store to true (simulating page refresh)', async () => {
    const poster = (data: any) => alovaInst.Post('/saveData?restore=1', data);
    const initialForm = {
      name: '',
      age: ''
    };
    const storagedForm = {
      name: 'Ming',
      age: '20'
    };

    // Store data in advance with the key based on initialForm (simulating a page refresh)
    const methodStorageKey = getStoragedKey(poster(initialForm));
    alovaInst.l2Cache.set(methodStorageKey, storagedForm);

    function Page() {
      const { form } = useForm(poster, {
        initialForm,
        store: true
      });
      return (
        <div>
          <span role="form">{JSON.stringify(form)}</span>
        </div>
      );
    }
    render((<Page />) as ReactElement<any, any>);
    // After cache recovery, the form should be restored
    await waitFor(() => {
      expect(screen.getByRole('form')).toHaveTextContent(JSON.stringify(storagedForm));
    });
  });

  test('should persist and restore form data across renders (full cycle)', async () => {
    const poster = (data: any) => alovaInst.Post('/saveData?cycle=1', data);
    const initialForm = {
      name: '',
      age: ''
    };
    const methodStorageKey = getStoragedKey(poster(initialForm));
    const getStoragedForm = () => alovaInst.l2Cache.get(methodStorageKey);

    // Step 1: Fill in the form and persist
    function Page1() {
      const { form, updateForm } = useForm(poster, {
        initialForm,
        store: true
      });
      return (
        <div>
          <span role="form">{JSON.stringify(form)}</span>
          <button
            role="btnFill"
            onClick={() => {
              updateForm({ name: 'Ming' });
              updateForm({ age: '20' });
            }}>
            fill
          </button>
        </div>
      );
    }
    const { unmount } = render((<Page1 />) as ReactElement<any, any>);
    fireEvent.click(screen.getByRole('btnFill'));
    await delay(100);
    // Data should be persisted with the key based on initialForm
    expect(getStoragedForm()).toStrictEqual({
      name: 'Ming',
      age: '20'
    });
    unmount();

    // Step 2: Simulate page refresh - new component, should restore
    function Page2() {
      const { form } = useForm(poster, {
        initialForm,
        store: true
      });
      return <span role="form2">{JSON.stringify(form)}</span>;
    }
    render((<Page2 />) as ReactElement<any, any>);
    await waitFor(() => {
      expect(screen.getByRole('form2')).toHaveTextContent(
        JSON.stringify({
          name: 'Ming',
          age: '20'
        })
      );
    });
  });

  test('should restore data first and request immediately', async () => {
    const poster = (form: any) => alovaInst.Post('/saveData?immediate=1', form);
    const initialForm = {
      name: '',
      age: ''
    };
    const storagedForm = {
      name: 'Ming',
      age: '20'
    };

    // Store data in advance and simulate refresh to restore persistent data
    const methodStorageKey = getStoragedKey(poster(initialForm));
    alovaInst.l2Cache.set(methodStorageKey, storagedForm);

    function Page() {
      const { form, data } = useForm(poster, {
        initialForm,
        immediate: true,
        store: true
      });
      return (
        <div>
          <span role="form">{JSON.stringify(form)}</span>
          <span role="data">{JSON.stringify(data)}</span>
        </div>
      );
    }

    render((<Page />) as ReactElement<any, any>);
    // After cache recovery, the form should be restored
    await waitFor(() => {
      expect(screen.getByRole('form')).toHaveTextContent(JSON.stringify(storagedForm));
    });
    // Request will be sent after restore
    await waitFor(() => {
      expect(screen.getByRole('data')).toHaveTextContent(
        JSON.stringify({
          code: 200,
          data: storagedForm
        })
      );
    });
  });

  test('should clear storaged data when call function reset manually', async () => {
    const poster = (data: any) => alovaInst.Post('/saveData?reset=1', data);
    const initialForm = {
      name: '',
      age: ''
    };
    const methodStorageKey = getStoragedKey(poster(initialForm));

    function Page() {
      const { form, reset, updateForm } = useForm(poster, {
        initialForm,
        store: true
      });
      return (
        <div>
          <span role="form">{JSON.stringify(form)}</span>
          <button
            role="btnUpdate"
            onClick={() => updateForm({ name: 'Ming' })}>
            update
          </button>
          <button
            role="btnReset"
            onClick={() => reset()}>
            reset
          </button>
        </div>
      );
    }
    render((<Page />) as ReactElement<any, any>);

    fireEvent.click(screen.getByRole('btnUpdate'));
    await delay(100);
    expect(screen.getByRole('form')).toHaveTextContent(JSON.stringify({ name: 'Ming', age: '' }));
    expect(alovaInst.l2Cache.get(methodStorageKey)).toStrictEqual({ name: 'Ming', age: '' });

    fireEvent.click(screen.getByRole('btnReset'));
    expect(screen.getByRole('form')).toHaveTextContent(JSON.stringify(initialForm));
    await delay(100);
    expect(alovaInst.l2Cache.get(methodStorageKey)).toBeNull();
  });

  test('should reset when call function reset manually', () => {
    const poster = (data: any) => alovaInst.Post('/saveData?reset2=1', data);
    const initialForm = {
      name: '',
      age: ''
    };

    function Page() {
      const { form, reset, updateForm } = useForm(poster, {
        initialForm
      });
      return (
        <div>
          <span role="form">{JSON.stringify(form)}</span>
          <button
            role="btnUpdate"
            onClick={() => updateForm({ name: 'Hong', age: '22' })}>
            update
          </button>
          <button
            role="btnReset"
            onClick={() => reset()}>
            reset
          </button>
        </div>
      );
    }
    render((<Page />) as ReactElement<any, any>);

    fireEvent.click(screen.getByRole('btnUpdate'));
    expect(screen.getByRole('form')).toHaveTextContent(JSON.stringify({ name: 'Hong', age: '22' }));

    fireEvent.click(screen.getByRole('btnReset'));
    expect(screen.getByRole('form')).toHaveTextContent(JSON.stringify(initialForm));
  });
});
