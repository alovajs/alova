import type { AlovaGenerics } from 'alova';
import { AlovaGuardNext } from '~/typings';

const defaultMiddleware = <AG extends AlovaGenerics>(_: any, next: AlovaGuardNext<AG>) => next();
export default defaultMiddleware;
