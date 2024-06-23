/* eslint-disable import/prefer-default-export */
import { Method } from 'alova';

export const createServerHook = <T extends Method<any>, Fn extends (method: Method<any>, ...args: any[]) => T>(
  hookHandler: Fn
) => hookHandler;
