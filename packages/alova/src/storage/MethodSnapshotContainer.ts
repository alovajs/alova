import myAssert from '@/utils/myAssert';
import {
  RegExpCls,
  filterItem,
  forEach,
  getConfig,
  instanceOf,
  isFn,
  isPlainObject,
  isString,
  newInstance,
  objectKeys
} from '@alova/shared';
import { AlovaGenerics, Method, MethodDetaiedFilter, MethodFilter, MethodFilterHandler } from '~/typings';

const SetCls = Set;

export default class MethodSnapshotContainer<AG extends AlovaGenerics> {
  /**
   * Method instance snapshot collection, method instances that have sent requests will be saved
   */
  records: Record<string, Set<Method<AG>>> = {};

  capacity: number;

  occupy = 0;

  constructor(capacity: number) {
    myAssert(capacity >= 0, 'expected snapshots limit to be >= 0');
    this.capacity = capacity;
  }

  /**
   * Save method instance snapshot
   * @param methodInstance method instance
   */
  save(methodInstance: Method<AG>) {
    const { name } = getConfig(methodInstance);
    const { records, occupy, capacity } = this;
    if (name && occupy < capacity) {
      // Using the name of the method as the key, save the method instance to the snapshot
      const targetSnapshots = (records[name] = records[name] || newInstance(SetCls));
      targetSnapshots.add(methodInstance);

      // Statistical quantity
      this.occupy += 1;
    }
  }

  /**
   * Get a Method instance snapshot, which will filter out the corresponding Method instance based on the matcher
   * @param matcher Matching snapshot name, which can be a string or regular expression, or an object with a filter function
   * @returns Array of matched Method instance snapshots
   */
  match<M extends boolean = true>(matcher: MethodFilter<AG>, matchAll: M = true as M) {
    // Unify the filter parameters into name matcher and match handler
    let nameString: string | undefined;
    let nameReg: RegExp | undefined;
    let matchHandler: MethodFilterHandler<AG> | undefined;
    let nameMatcher: any = matcher;
    if (isPlainObject(matcher)) {
      nameMatcher = (matcher as MethodDetaiedFilter<AG>).name;
      matchHandler = (matcher as MethodDetaiedFilter<AG>).filter;
    }

    if (instanceOf(nameMatcher, RegExpCls)) {
      nameReg = nameMatcher;
    } else if (isString(nameMatcher)) {
      nameString = nameMatcher;
    }

    const { records } = this;
    // Get the corresponding method instance snapshot through the deconstructed name matcher and filter handler
    let matches = newInstance(SetCls<Method<AG>>);

    // If the namespace parameter is provided, it will only be searched in this namespace, otherwise it will be searched in all cached data.
    if (nameString) {
      matches = records[nameString] || matches;
    } else if (nameReg) {
      forEach(
        filterItem(objectKeys(records), methodName => nameReg.test(methodName)),
        methodName => {
          records[methodName].forEach(method => matches.add(method));
        }
      );
    }

    const fromMatchesArray = isFn(matchHandler) ? filterItem([...matches], matchHandler) : [...matches];
    return (matchAll ? fromMatchesArray : fromMatchesArray[0]) as M extends true
      ? Method<AG>[]
      : Method<AG> | undefined;
  }
}
