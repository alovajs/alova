import type { AlovaGenerics, AlovaGuardNext } from 'alova';

const defaultMiddleware = <AG extends AlovaGenerics>(_: any, next: AlovaGuardNext<AG>) => next();
export default defaultMiddleware;
