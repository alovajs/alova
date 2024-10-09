import { AlovaGenerics, Method } from 'alova';
import { ExportedState, UseHookExposure } from '../general';
import { RequestHookConfig } from './useRequest';
import { DataSerializer } from './useSQRequest';

/**
 * useForm的handler函数类型
 */
export type FormHookHandler<AG extends AlovaGenerics, F, Args extends any[] = any[]> = (
  form: F,
  ...args: Args
) => Method<AG>;

/**
 * useForm配置
 */
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

export type RestoreHandler = () => void;
/**
 * useForm返回值
 */
export interface FormExposure<AG extends AlovaGenerics, F, Args extends any[] = any[]>
  extends UseHookExposure<AG, Args, FormExposure<AG, F, Args>> {
  /**
   * 表单数据
   */
  form: ExportedState<F, AG['StatesExport']>;

  /**
   * 持久化数据恢复事件绑定，数据恢复后触发
   */
  onRestore(handler: RestoreHandler): this;

  /**
   * 更新表单数据，可传入
   * @param newForm 新表单数据
   */
  updateForm(newForm: Partial<F> | ((oldForm: F) => F)): void;

  /**
   * 重置为初始化数据，如果有持久化数据则清空
   */
  reset(): void;
}

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
export declare function useForm<
  AG extends AlovaGenerics,
  FormData extends Record<string | symbol, any>,
  Args extends any[] = any[]
>(
  handler: FormHookHandler<AG, FormData, Args>,
  config?: FormHookConfig<AG, FormData>
): FormExposure<AG, FormData, Args>;
