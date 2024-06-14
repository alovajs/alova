import useRequest from '@/hooks/core/useRequest';
import createSerializerPerformer from '@/util/serializer';
import createEventManager from '@alova/shared/createEventManager';
import {
  $self,
  getContext,
  getMethodInternalKey,
  isPlainObject,
  sloughConfig,
  statesHookHelper,
  walkObject
} from '@alova/shared/function';
import { falseValue, isArray, trueValue, undefinedValue } from '@alova/shared/vars';
import { AlovaGenerics, Method, promiseStatesHook } from 'alova';
import { RequestHookConfig, UseHookExposure } from '~/typings';
import { DataSerializer, ExportedType, RestoreHandler } from '~/typings/general';

export interface StoreDetailConfig {
  /**
   * 是否启用持久化数据
   */
  enable: boolean;

  /**
   * 序列化器集合，用于自定义转换为序列化时某些不能直接转换的数据
   * 集合的key作为它的名字进行序列化，当反序列化时会将对应名字的值传入backward函数中
   * 因此，在forward中序列化时需判断是否为指定的数据，并返回转换后的数据，否则返回undefined或不返回
   * 而在backward中可通过名字来识别，因此只需直接反序列化即可
   * 内置的序列化器：
   * 1. date序列化器用于转换日期
   * 2. regexp序列化器用于转化正则表达式
   *
   * >>> 可以通过设置同名序列化器来覆盖内置序列化器
   */
  serializers?: Record<string | number, DataSerializer>;
}
export type FormHookConfig<AG extends AlovaGenerics, FormData> = {
  /**
   * 初始表单数据
   */
  initialForm?: FormData;

  /**
   * form id，相同id的data数据是同一份引用，可以用于在多页表单时共用同一份表单数据
   * 单页表单不需要指定id
   */
  id?: string | number;

  /**
   * 是否持久化保存数据，设置为true后将实时持久化未提交的数据
   * @default false
   */
  store?: boolean | StoreDetailConfig;

  /**
   * 提交后重置数据
   * @default false
   */
  resetAfterSubmiting?: boolean;
} & RequestHookConfig<AG>;

/**
 * useForm返回值
 */
export type FormExposure<AG extends AlovaGenerics, F> = UseHookExposure<AG> & {
  /**
   * 表单数据
   */
  form: ExportedType<F, AG['State']>;

  /**
   * 持久化数据恢复事件绑定，数据恢复后触发
   */
  onRestore(handler: RestoreHandler): void;

  /**
   * 更新表单数据，可传入
   * @param newForm 新表单数据
   */
  updateForm(newForm: Partial<F> | ((oldForm: F) => F)): void;

  /**
   * 重置为初始化数据，如果有持久化数据则清空
   */
  reset(): void;
};

export type FormHookHandler<AG extends AlovaGenerics, F> = (form: F, ...args: any[]) => Method<AG>;

const RestoreEventKey = Symbol('FormRestore');
const getStoragedKey = <AG extends AlovaGenerics>(methodInstance: Method<AG>, id?: ID) =>
  `alova/form-${id || getMethodInternalKey(methodInstance)}`;
type ID = NonNullable<FormHookConfig<AlovaGenerics, any>['id']>;

const sharedStates = {};
const cloneFormData = <T>(form: T): T => {
  const shallowClone = (value: any) => (isArray(value) ? [...value] : isPlainObject(value) ? { ...value } : value);
  return walkObject(shallowClone(form), shallowClone);
};

/**
 * useForm
 * 表单的提交hook，具有草稿功能，以及多页表单的数据同步功能
 *
 * 适用场景：
 * 1. 单表单/多表单提交、草稿数据持久化、数据更新和重置
 * 2. 条件搜索输入项，可持久化搜索条件，可立即发送表单数据
 *
 * @param handler method获取函数，只需要获取同步数据时可传id
 * @param config 配置参数
 * @return useForm相关数据和操作函数
 */
const useForm = <AG extends AlovaGenerics, FormData extends Record<string | symbol, any>>(
  handler: FormHookHandler<AG, FormData | undefined>,
  config: FormHookConfig<AG, FormData> = {}
) => {
  const typedSharedStates = sharedStates as Record<
    ID,
    {
      hookProvider: FormExposure<AG, any>;
      config: FormHookConfig<AG, any>;
    }
  >;

  const { id, initialForm, store, resetAfterSubmiting, immediate = falseValue, middleware } = config;
  let { memorize } = promiseStatesHook();
  memorize ??= $self;
  const {
    create: $,
    ref: useFlag$,
    onMounted: onMounted$,
    watch: watch$,
    objectify,
    exposeProvider,
    __referingObj: referingObject
  } = statesHookHelper(promiseStatesHook());
  const isStoreObject = isPlainObject(store);
  const enableStore = isStoreObject ? (store as StoreDetailConfig).enable : store;
  // 如果config中的id也有对应的共享状态，则也会返回它
  // 继续往下执行是为了兼容react的hook执行数不能变的问题，否则会抛出"Rendered fewer hooks than expected. This may be caused by an accidental early return statement."
  const sharedState = id ? typedSharedStates[id] : undefinedValue;
  const form = $(cloneFormData(initialForm), 'form');
  const methodHandler = handler;
  const eventManager = createEventManager<{
    [RestoreEventKey]: void;
  }>();
  // 使用计算属性，避免每次执行此use hook都调用一遍methodHandler
  const initialMethodInstance = useFlag$(sloughConfig(methodHandler, [form.v]));
  const storageContext = getContext(initialMethodInstance.current).l2Cache;
  const storagedKey = getStoragedKey(initialMethodInstance.current, id);
  const reseting = useFlag$(falseValue);
  const serializerPerformer = useFlag$(
    createSerializerPerformer(isStoreObject ? (store as StoreDetailConfig).serializers : undefinedValue)
  );
  // 是否由当前hook发起创建的共享状态，发起创建的hook需要返回最新的状态，否则会因为在react中hook被调用，导致发起获得的hook中无法获得最新的状态
  const isCreateShardState = useFlag$(false);
  const originalHookProvider = useRequest((...args: any[]) => methodHandler(form.v, ...args), {
    ...config,
    __referingObj: referingObject,

    // 中间件函数，也支持subscriberMiddleware
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

    // 1. 当需要持久化时，将在数据恢复后触发
    // 2. 当已有共享状态时，表示之前已有初始化（无论有无立即发起请求），后面的不再自动发起请求，这是为了兼容多表单立即发起请求时，重复发出请求的问题
    immediate: enableStore || sharedState ? falseValue : immediate
  });

  /**
   * 重置form数据
   */
  const reset = memorize(() => {
    reseting.current = trueValue;
    const clonedFormData = cloneFormData(initialForm);
    clonedFormData && (form.v = clonedFormData);
    enableStore && storageContext.remove(storagedKey);
  });

  /**
   * 更新form数据
   * @param newForm 新表单数据
   */
  const updateForm = memorize((newForm: Partial<FormData> | ((oldForm: FormData) => FormData)) => {
    form.v = {
      ...form.v,
      ...newForm
    } as FormData;
  });

  const hookProvider = exposeProvider({
    // 第一个参数固定为form数据
    ...originalHookProvider,
    ...objectify([form]),
    updateForm,
    reset,

    // 持久化数据恢复事件绑定
    onRestore(handler: RestoreHandler) {
      eventManager.on(RestoreEventKey, handler);
    }
  });

  // 有id时，才保存到sharedStates中
  // 在react中，因为更新form后会产生新的form，因此需要每次调用重新保存
  if (id) {
    // 还没有共享状态则表示当前hook是创建的hook
    if (!sharedState) {
      isCreateShardState.current = trueValue;
    }

    // 只保存创建hook的共享状态
    if (isCreateShardState.current) {
      typedSharedStates[id] = {
        hookProvider: hookProvider as FormExposure<AG, any>,
        config
      };
    }
  }
  const { send, onSuccess } = hookProvider;
  onMounted$(() => {
    // 需要持久化时更新data
    if (enableStore && !sharedState) {
      // 获取存储并更新data
      // 需要在onMounted中调用，否则会导致在react中重复被调用
      const storagedForm = serializerPerformer.current.deserialize(storageContext.get(storagedKey));

      // 有草稿数据时，异步恢复数据，否则无法正常绑定onRetore事件
      if (storagedForm) {
        form.v = storagedForm;
        // 触发持久化数据恢复事件
        eventManager.emit(RestoreEventKey, undefinedValue);
        enableStore && immediate && send();
      }
    }
  });

  // 监听变化同步存储，如果是reset触发的则不需要再序列化
  watch$([form], () => {
    if (reseting.current || !enableStore) {
      reseting.current = falseValue;
      return;
    }
    storageContext.set(storagedKey, serializerPerformer.current.serialize(form.v));
  });
  // 如果在提交后需要清除数据，则调用reset
  onSuccess(() => {
    resetAfterSubmiting && reset();
  });

  // 有已保存的sharedState，则返回它
  // 如果是当前hook创建的共享状态，则返回最新的而非缓存的
  return (sharedState && !isCreateShardState.current ? sharedState.hookProvider : hookProvider) as FormExposure<
    AG,
    FormData
  >;
};

export default useForm;
