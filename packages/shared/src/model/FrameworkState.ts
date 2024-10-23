import { GeneralState } from '../types';

type UpdateFn<Data> = (state: GeneralState<Data>, newValue: Data) => void;
type DehydrateFn<Data> = (state: GeneralState<Data>) => Data;
type ExportFn<Data> = (state: GeneralState<Data>) => GeneralState<Data>;
export class FrameworkReadableState<Data, Key extends string> {
  s: GeneralState<Data>;

  k: Key;

  protected $dhy: DehydrateFn<Data>;

  protected $exp: ExportFn<Data>;

  constructor(state: GeneralState<Data>, key: Key, dehydrate: DehydrateFn<Data>, exportState: ExportFn<Data>) {
    this.s = state;
    this.k = key;
    this.$dhy = dehydrate;
    this.$exp = exportState;
  }

  get v() {
    return this.$dhy(this.s);
  }

  get e() {
    return this.$exp(this.s);
  }
}

export class FrameworkState<Data, Key extends string> extends FrameworkReadableState<Data, Key> {
  private $upd: UpdateFn<Data>;

  constructor(
    state: GeneralState<Data>,
    key: Key,
    dehydrate: DehydrateFn<Data>,
    exportState: ExportFn<Data>,
    update: UpdateFn<Data>
  ) {
    super(state, key, dehydrate, exportState);
    this.$upd = update;
  }

  set v(newValue: Data) {
    this.$upd(this.s, newValue);
  }

  get v() {
    return super.v;
  }
}
