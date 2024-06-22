import type { AlovaGenerics } from 'alova';
import { AlovaGuardNext } from '~/typings/clienthook';

const defaultMiddleware = <AG extends AlovaGenerics>(_: any, next: AlovaGuardNext<AG>) => next();
export default defaultMiddleware;
