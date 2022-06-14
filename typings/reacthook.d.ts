import { FrontRequestState } from '.';

type Dispatch<A> = (value: A) => void;
type SetStateAction<S> = S | ((prevState: S) => S);
type ReactState<D> = [D, Dispatch<SetStateAction<D>>];
interface ReactHook {
  create: (data: any) => [any, Dispatch<any>];
  export: <D>(state: ReactState<D>) => D;
  update: (newVal: Partial<FrontRequestState>, state: FrontRequestState<ReactState<unknown>>) => void;
  effectRequest(handler: () => void, removeStates: () => void, watchedStates?: any[], immediate?: boolean): void;
};
declare const reactHook: ReactHook;
export default reactHook;