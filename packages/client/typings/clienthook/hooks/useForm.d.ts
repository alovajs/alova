import { AlovaGenerics, Method } from 'alova';
import { ExportedState, UseHookExposure } from '../general';
import { RequestHookConfig } from './useRequest';
import { DataSerializer } from './useSQRequest';

/**
 * useForm's handler function type
 */
export type FormHookHandler<AG extends AlovaGenerics, F, Args extends any[] = any[]> = (
  form: F,
  ...args: Args
) => Method<AG>;

/**
 * useForm configuration
 */
export interface StoreDetailConfig {
  /**
   * Whether to enable persistent data
   */
  enable: boolean;

  /**
   * Serializer collection, used to customize certain data that cannot be converted directly when converted to serialization
   * The key of the collection is serialized as its name. When deserializing, the value of the corresponding name will be passed into the backward function.
   * Therefore, when serializing in forward, it is necessary to determine whether it is the specified data and return the converted data, otherwise it will return undefined or not return
   * In backward, it can be identified by name, so you only need to deserialize it directly.
   * Built-in serializer:
   * 1. Date serializer is used to convert dates
   * 2. The regexp serializer is used to convert regular expressions
   *
   * >>> You can override the built-in serializer by setting a serializer with the same name
   */
  serializers?: Record<string | number, DataSerializer>;
}
export type FormHookConfig<AG extends AlovaGenerics, FormData, Args extends any[]> = {
  /**
   * Initial form data
   */
  initialForm?: FormData;

  /**
   * form id, data data with the same id is the same reference, and can be used to share the same form data in multi-page forms.
   * Single-page forms do not need to specify an id
   */
  id?: string | number;

  /**
   * Whether to persist data. If set to true, uncommitted data will be persisted in real time.
   * @default false
   */
  store?: boolean | StoreDetailConfig;

  /**
   * Reset data after submission
   * @default false
   */
  resetAfterSubmiting?: boolean;
} & RequestHookConfig<AG, Args>;

export type RestoreHandler = () => void;
/**
 * useForm return value
 */
export interface FormExposure<AG extends AlovaGenerics, F, Args extends any[] = any[]>
  extends UseHookExposure<AG, Args, FormExposure<AG, F, Args>> {
  /**
   * form data
   */
  form: ExportedState<F, AG['StatesExport']>;

  /**
   * Persistent data recovery event binding, triggered after data recovery
   */
  onRestore(handler: RestoreHandler): this;

  /**
   * Update form data, which can be passed in
   * @param newForm new form data
   */
  updateForm(newForm: Partial<F> | ((oldForm: F) => F)): void;

  /**
   * Reset to initialization data, clear if there is persistent data
   */
  reset(): void;
}

/**
 * useForm
 * Form submission hook, draft function, and data synchronization function for multi-page forms
 *
 * Applicable scenarios:
 * 1. Single form/multiple form submission, draft data persistence, data update and reset
 * 2. Conditional search input items can persist search conditions and send form data immediately
 *
 * @param handler method gets the function, you only need to pass the id when getting the synchronized data
 * @param config Configuration parameters
 * @return useForm related data and operation functions
 */
export declare function useForm<
  AG extends AlovaGenerics,
  FormData extends Record<string | symbol, any>,
  Args extends any[] = any[]
>(
  handler: FormHookHandler<AG, FormData, Args>,
  config?: FormHookConfig<AG, FormData, Args>
): FormExposure<AG, FormData, Args>;
