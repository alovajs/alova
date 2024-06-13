import { AlovaGenerics, Method, ProgressHandler } from 'alova';

type RequestHandler<Responded> = (forceRequest?: boolean) => Promise<Responded>;
export default class HookedMethod<AG extends AlovaGenerics = any> implements Method<AG> {
  private entity: Method<AG>;

  private handler: RequestHandler<AG['Responded']>;

  constructor(entity: Method<AG>, requestHandler: RequestHandler<AG['Responded']>) {
    this.entity = entity;
    this.handler = requestHandler;
  }

  public get type() {
    return this.entity.type;
  }

  public get config() {
    return this.entity.config;
  }

  public get baseURL() {
    return this.entity.baseURL;
  }

  public get context() {
    return this.entity.context;
  }

  public get url() {
    return this.entity.url;
  }

  public get data() {
    return this.entity.data;
  }

  public get meta() {
    return this.entity.meta;
  }

  public get hitSource() {
    return this.entity.hitSource;
  }

  public get __key__() {
    return this.entity.__key__;
  }

  public get abort() {
    return this.entity.abort;
  }

  public get dhs() {
    return this.entity.dhs;
  }

  public get uhs() {
    return this.entity.uhs;
  }

  public get fromCache() {
    return this.entity.fromCache;
  }

  public setName(name: string | number) {
    return this.entity.setName(name);
  }

  public send(forceRequest?: boolean) {
    return this.handler(forceRequest);
  }

  public onDownload(downloadHandler: ProgressHandler) {
    return this.entity.onDownload(downloadHandler);
  }

  public onUpload(uploadHandler: ProgressHandler) {
    return this.entity.onUpload(uploadHandler);
  }

  public then<TResult1 = AG['Responded'], TResult2 = never>(
    onfulfilled?: (value: AG['Responded']) => TResult1 | PromiseLike<TResult1>,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ) {
    return this.entity.then(onfulfilled, onrejected);
  }

  catch(onrejected: Parameters<Method<AG>['catch']>[0]) {
    return this.entity.catch(onrejected);
  }

  finally(onfinally: Parameters<Method<AG>['finally']>[0]) {
    return this.entity.finally(onfinally);
  }
}
