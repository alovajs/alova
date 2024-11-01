import { objAssign } from '@alova/shared';
import { AlovaGenerics, Method } from 'alova';

type RequestHandler<Responded> = (forceRequest?: boolean) => Promise<Responded>;
export default class HookedMethod<AG extends AlovaGenerics> extends Method<AG> {
  private handler: RequestHandler<AG['Responded']>;

  constructor(entity: Method<AG>, requestHandler: RequestHandler<AG['Responded']>) {
    super(entity.type, entity.context, entity.url, { ...entity.config });
    this.handler = requestHandler;
    objAssign(this, {
      config: { ...entity.config },
      uhs: entity.uhs,
      dhs: entity.dhs
    });
  }

  public send(forceRequest?: boolean) {
    return this.handler(forceRequest);
  }
}
