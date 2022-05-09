import {
  AlovaOptions,
  RequestAdapter,
  RequestState,
} from '../typings';
import Connect from './methods/Connect';
import Delete from './methods/Delete';
import Get from './methods/Get';
import Head from './methods/Head';
import Method from './methods/Method';
import Options from './methods/Options';
import Patch from './methods/Patch';
import Post from './methods/Post';
import Put from './methods/Put';
import Trace from './methods/Trace';
import requestAdapter from './predefined/requestAdapter';

export class Alova<S extends RequestState> {
  private requestAdapter: RequestAdapter<any> = requestAdapter;
  public options: AlovaOptions<S>;
  constructor(options: AlovaOptions<S>) {
    this.options = options;
  }

  setRequestInterceptor() {
    
  }
  setResponseInterceptor() {
    
  }

  Get(url: string) {
    const get = new Get<S>(url);
    get.context = this;
    return get;
  }
  Post(url: string, data: any) {
    return new Post(url);
  }
  Delete(url: string, data: any) {
    return new Delete(url);
  }
  Put(url: string, data: any) {
    return new Put(url);
  }
  Head(url: string) {
    return new Head(url);
  }
  Patch(url: string, data: any) {
    return new Patch(url);
  }
  Options(url: string) {
    return new Options(url);
  }
  Trace(url: string) {
    return new Trace(url);
  }
  Connect(url: string) {
    return new Connect(url);
  }

  setAbort() {

  }
  
  invalidate(methodInstance: Method<S>) {

  }

  update(methodInstance: Method<S>, handleUpdate: (data: unknown) => unknown) {

  }
  
  fetch(methodInstance: Method<S>) {

  }
}

export default function createAlova<S extends RequestState>(options: AlovaOptions<S>) {
  return new Alova<S>(options);
}