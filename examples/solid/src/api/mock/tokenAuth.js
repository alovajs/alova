import { defineMock } from '@alova/mock';

const randomId = () => Math.random().toString(36).slice(2);
const currentUserToken = {
  accessToken: randomId(),
  refreshToken: randomId(),
  expire: Date.now()
};
export default defineMock({
  '/visitor/info': {
    info: 'This is the info which from visitor request'
  },
  '[POST]/user/login': ({ data }) => {
    // always return the expired token
    currentUserToken.expire = Date.now();
    const cloned = { ...currentUserToken };
    if (!data.client) {
      delete cloned.expire;
    }
    return cloned;
  },
  '[POST]/user/logout': { success: true },
  '[POST]/user/refresh-token': ({ data }) => {
    currentUserToken.accessToken = randomId();
    currentUserToken.refreshToken = randomId();
    currentUserToken.expire = Date.now() + 1000 * 60 * 60 * 24;
    const cloned = { ...currentUserToken };
    if (!data.client) {
      delete cloned.expire;
    }
    return cloned;
  },
  '/user/profile': () => {
    if (currentUserToken.expire <= Date.now()) {
      return {
        code: 401,
        message: 'token expired'
      };
    }
    return {
      id: 1,
      name: 'Michael',
      age: 23
    };
  }
});
