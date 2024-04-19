import { AlovaGuardNext } from '~/typings';

const defaultMiddleware = (_: any, next: AlovaGuardNext<any, any, any, any, any, any, any>) => next();
export default defaultMiddleware;
