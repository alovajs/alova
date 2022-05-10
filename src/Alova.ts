import {
  AlovaOptions,
  RequestAdapter,
  RequestState,
} from '../typings';
// import Connect from './methods/Connect';
// import Delete from './methods/Delete';
import Get from './methods/Get';
// import Head from './methods/Head';
// import Method from './methods/Method';
// import Options from './methods/Options';
// import Patch from './methods/Patch';
// import Post from './methods/Post';
// import Put from './methods/Put';
// import Trace from './methods/Trace';
import requestAdapter from './predefined/requestAdapter';

export default class Alova<S extends RequestState, E extends RequestState> {
  public requestAdapter: RequestAdapter<any> = requestAdapter;
  public options: AlovaOptions<S, E>;
  constructor(options: AlovaOptions<S, E>) {
    this.options = options;
  }

  setRequestInterceptor() {
    
  }
  setResponseInterceptor() {
    
  }

  Get<R>(url: string, config: unknown) {
    const get = new Get<S, E, R>(url);
    get.context = this;
    return get;
  }
  // Post(url: string, data: any) {
  //   return new Post(url);
  // }
  // Delete(url: string, data: any) {
  //   return new Delete(url);
  // }
  // Put(url: string, data: any) {
  //   return new Put(url);
  // }
  // Head(url: string) {
  //   return new Head(url);
  // }
  // Patch(url: string, data: any) {
  //   return new Patch(url);
  // }
  // Options(url: string) {
  //   return new Options(url);
  // }
  // Trace(url: string) {
  //   return new Trace(url);
  // }
  // Connect(url: string) {
  //   return new Connect(url);
  // }

  // setAbort() {

  // }
  
  // invalidate(methodInstance: Method<S, E, unknown>) {

  // }

  // update(methodInstance: Method<S, E, unknown>, handleUpdate: (data: unknown) => unknown) {

  // }
  
  // fetch(methodInstance: Method<S, E, unknown>) {

  // }
}