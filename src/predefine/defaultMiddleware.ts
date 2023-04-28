import { AlovaMiddleware } from '~/typings';

const defaultMiddleware: AlovaMiddleware<any, any, any, any, any, any, any> = (_, next) => next();

export default defaultMiddleware;
