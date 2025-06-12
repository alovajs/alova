import useRequest from '@/hooks/core/useRequest';
import { statesHookHelper } from '@/util/helper';
import createSerializerPerformer from '@/util/serializer';
import {
  $self,
  createEventManager,
  falseValue,
  getContext,
  getMethodInternalKey,
  instanceOf,
  isArray,
  isPlainObject,
  noop,
  sloughConfig,
  trueValue,
  undefinedValue,
  walkObject
} from '@alova/shared';
import { AlovaGenerics, AlovaGlobalCacheAdapter, Method, promiseStatesHook } from 'alova';
import { FormExposure, FormHookConfig, FormHookHandler, RestoreHandler, StoreDetailConfig } from '~/typings/clienthook';

const RestoreEventKey = Symbol('FormRestore');
const getStoragedKey = <AG extends AlovaGenerics>(targetKey: Method<AG> | ID) =>
  `alova/form-${instanceOf(targetKey, Method) ? getMethodInternalKey(targetKey) : targetKey}`;
type ID = NonNullable<FormHookConfig<AlovaGenerics, any, any[]>['id']>;

const sharedEventManager = createEventManager<{ [x: string]: FormData }>();
const sharedStates: Record<
  ID,
  {
    form: any;
    l2Cache?: AlovaGlobalCacheAdapter;
    config: FormHookConfig<any, any, any>;
  }
> = {};
const cloneFormData = <T>(form: T): T => {
  const shallowClone = (value: any) => (isArray(value) ? [...value] : isPlainObject(value) ? { ...value } : value);
  return walkObject(shallowClone(form), shallowClone);
};

export default <AG extends AlovaGenerics, FormData extends Record<string | symbol, any>, Args extends any[] = any[]>(
  handler: FormHookHandler<AG, FormData, Args>,
  config: FormHookConfig<AG, FormData, Args> = {}
): FormExposure<AG, FormData, Args> => {
  // If the id in config also has a corresponding shared state, it will also be returned.
  // The reason for continuing the execution is to be compatible with the problem that the number of hook executions in react cannot be changed, otherwise it will throw "Rendered fewer hooks than expected. This may be caused by an accidental early return statement."
  const { id: originalId } = config;
  const sharedState = originalId ? sharedStates[originalId] : undefinedValue;
  const {
    id,
    initialForm,
    store,
    resetAfterSubmiting,
    immediate = falseValue,
    middleware
  } = sharedState?.config || config;
  let { memorize } = promiseStatesHook();
  memorize ??= $self;
  const {
    create,
    ref,
    onMounted,
    onUnmounted,
    watch,
    objectify,
    exposeProvider,
    __referingObj: referingObject
  } = statesHookHelper(promiseStatesHook());
  const isStoreObject = isPlainObject(store);
  const enableStore = isStoreObject ? (store as StoreDetailConfig).enable : store;
  const form = create(cloneFormData(sharedState?.form || initialForm), 'form');
  const methodHandler = handler;
  const eventManager = createEventManager<{
    [RestoreEventKey]: void;
  }>();

  // Use computed properties to avoid calling methodHandler every time this use hook is executed.
  const initialMethod = ref(undefinedValue as Method | undefined);
  let storageContext = sharedState?.l2Cache;
  if (enableStore && !sharedState?.l2Cache) {
    initialMethod.current = sloughConfig(methodHandler, [form.v]);
    storageContext = getContext(initialMethod.current).l2Cache;
  }
  const storagedKey = getStoragedKey(id || initialMethod.current || '');
  const reseting = ref(falseValue);
  const serializerPerformer = ref(
    createSerializerPerformer(isStoreObject ? (store as StoreDetailConfig).serializers : undefinedValue)
  );

  // Only when there is an id, it is saved to sharedStates.
  // In react, because a new form will be generated after updating the form, it needs to be resaved every time it is called.
  if (id && !sharedStates[id]) {
    sharedStates[id] = {
      form: form.v,
      l2Cache: storageContext,
      config
    };
  }

  const originalHookProvider = useRequest((...args: Args) => methodHandler(form.v as FormData, ...args), {
    ...config,
    __referingObj: referingObject,

    // Middleware function, also supports subscriber middleware
    middleware: middleware
      ? (ctx, next) =>
          middleware(
            {
              ...ctx,
              // eslint-disable-next-line
              delegatingActions: { updateForm, reset }
            } as any,
            next
          )
      : undefinedValue,

    // 1. When persistence is required, it will be triggered after data recovery
    // 2. When there is a shared state, it means that it has been initialized before (regardless of whether there is an immediate request), and subsequent requests will no longer be automatically initiated. This is to be compatible with the issue of repeated requests when multiple forms initiate requests immediately.
    immediate: enableStore || sharedState ? falseValue : immediate
  });

  /**
   * Reset form data
   */
  const reset = () => {
    reseting.current = trueValue;
    const clonedFormData = cloneFormData(initialForm);
    clonedFormData && (form.v = clonedFormData);
    enableStore && storageContext?.remove(storagedKey);
  };

  /**
   * Update form data
   * @param newForm new form data
   */
  const updateForm = (newForm: Partial<FormData> | ((oldForm: FormData) => FormData)) => {
    form.v = {
      ...form.v,
      ...newForm
    } as FormData;
  };

  const hookProvider = exposeProvider({
    // The first parameter is fixed to form data
    ...originalHookProvider,
    ...objectify([form]),
    updateForm,
    reset,

    // Persistent data recovery event binding
    onRestore(handler: RestoreHandler) {
      eventManager.on(RestoreEventKey, handler);
    }
  });

  const sharedOffHandler = ref(noop);
  const { send, onSuccess } = hookProvider;
  onMounted(() => {
    if (id) {
      // sync form data from other compoent when previous form component is keep-alive.
      sharedOffHandler.current = sharedEventManager.on(id, formData => {
        form.v = formData;
      });
    }

    // Update data when persistence is required
    if (enableStore && storageContext && !sharedState) {
      // Get storage and update data
      // It needs to be called in onMounted, otherwise it will cause it to be called repeatedly in react.
      const storagedForm = serializerPerformer.current.deserialize(storageContext.get(storagedKey));

      // When there is draft data, the data is restored asynchronously, otherwise the on restore event cannot be bound normally.
      if (storagedForm) {
        form.v = storagedForm;
        // Trigger persistent data recovery event
        eventManager.emit(RestoreEventKey, undefinedValue);
      }
      immediate && send(...([] as unknown as [...Args, any[]]));
    }
  });

  // Monitor changes and store them synchronously. If it is triggered by reset, no further serialization is required.
  watch([form], () => {
    if (id) {
      // sync form data to other component
      sharedEventManager.emit(id, form.v);
      if (sharedStates[id]) {
        sharedStates[id].form = form.v;
      }
    }
    if (reseting.current || !enableStore) {
      reseting.current = falseValue;
      return;
    }
    storageContext?.set(storagedKey, serializerPerformer.current.serialize(form.v));
  });
  onUnmounted(() => {
    sharedOffHandler.current();
  });
  // If data needs to be cleared after submission, call reset
  onSuccess(() => {
    resetAfterSubmiting && reset();
  });

  return hookProvider;
};
