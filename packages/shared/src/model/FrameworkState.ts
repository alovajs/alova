import { GeneralState } from '@/types';

type UpdateFn<D> = (state: GeneralState<D>, newValue: D) => void;
type DehydrateFn<D> = (state: GeneralState<D>) => D;
type ExportFn<D> = (state: GeneralState<D>) => GeneralState<D>;
export class FrameworkReadableState<D> {
  s: GeneralState<D>;

  protected $dhy: DehydrateFn<D>;

  protected $exp: ExportFn<D>;

  constructor(state: GeneralState<D>, dehydrate: DehydrateFn<D>, exportState: ExportFn<D>) {
    this.s = state;
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

export class FrameworkState<D> extends FrameworkReadableState<D> {
  private $upd: UpdateFn<D>;

  constructor(state: GeneralState<D>, dehydrate: DehydrateFn<D>, exportState: ExportFn<D>, update: UpdateFn<D>) {
    super(state, dehydrate, exportState);
    this.$upd = update;
  }

  set v(newValue: D) {
    this.$upd(this.s, newValue);
  }
}
