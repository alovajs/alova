import { createAlova } from 'alova';
import { createClientTokenAuthentication, useRequest } from 'alova/client';
import reactHook from 'alova/react';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { mockRequestAdapter } from '../api';
import { showToast } from '../helper';

let accessToken = '',
  refreshToken = '',
  expire = 0;
const { onAuthRequired, onResponseRefreshToken } = createClientTokenAuthentication({
  async login(response) {
    const data = await response.clone().json();
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
    expire = data.expire;
  },
  logout() {
    accessToken = '';
    refreshToken = '';
    expire = 0;
  },
  assignToken(method) {
    method.config.headers.Authorization = accessToken;
  },
  refreshToken: {
    isExpired() {
      const expired = expire < Date.now();
      if (expired) {
        showToast('token expired, refreshing it...', {
          autoDismiss: 5000
        });
      }
      return expired;
    },
    async handler() {
      const refreshInfo = await handleTokenRefresh(refreshToken);
      accessToken = refreshInfo.accessToken;
      refreshToken = refreshInfo.refreshToken;
      expire = refreshInfo.expire;
      showToast('token refreshed, re-send failed request', {
        autoDismiss: 5000
      });
    }
  }
});

const alova = createAlova({
  baseURL: 'http://example.com',
  statesHook: reactHook,
  requestAdapter: mockRequestAdapter,
  cacheFor: null,
  beforeRequest: onAuthRequired(),
  responded: onResponseRefreshToken(response => response.json())
});
const visitorRequest = () =>
  alova.Get('/visitor/info', {
    meta: {
      // set authRole to null to ignore auth check
      authRole: null
    }
  });
const login = data =>
  alova.Post(
    '/user/login',
    { ...data, client: true },
    {
      meta: {
        // set authRole to `login` to trigger login interceptor
        authRole: 'login'
      }
    }
  );
const logout = data =>
  alova.Post('/user/logout', data, {
    meta: {
      // set authRole to `logout` to trigger logout interceptor
      authRole: 'logout'
    }
  });
const handleTokenRefresh = token =>
  alova.Post(
    '/user/refresh-token',
    { accessToken: token, client: true },
    {
      meta: {
        // set authRole to `refreshToken` to refresh token
        authRole: 'refreshToken'
      }
    }
  );
// this request is token required
const userProfile = () => alova.Get('/user/profile');

function View() {
  const [isLogin, setIsLogin] = useState(false);
  return isLogin ? <Dashboard onLogout={() => setIsLogin(false)} /> : <Login onLogin={() => setIsLogin(true)} />;
}
export default View;

// Login panel
function Login({ onLogin }) {
  const [username] = useState('admin');
  const [password] = useState('123456');
  const { loading: logining, send: loginSend } = useRequest(() => login({ username, password }), {
    immediate: false
  }).onSuccess(onLogin);
  const { loading: loadingVisitorInfo, data: visitorData } = useRequest(visitorRequest);

  return (
    <nord-card>
      <h3
        slot="header"
        className="text-lg font-bold">
        Login
      </h3>
      <div className="flex flex-row justify-between">
        <div className="grid gap-y-4">
          <nord-input
            value={username}
            label="username"
            readonly></nord-input>
          <nord-input
            value={password}
            label="password"
            readonly
            type="password"></nord-input>
          <nord-button
            variant="primary"
            loading={logining || undefined}
            onClick={loginSend}>
            Login
          </nord-button>
        </div>

        {loadingVisitorInfo ? <nord-spinner /> : <p className="text-lg">{visitorData?.info}</p>}
      </div>
    </nord-card>
  );
}
Login.propTypes = {
  onLogin: PropTypes.func.isRequired
};

// the dashboard after login
function Dashboard({ onLogout }) {
  const { loading, data: profile, send } = useRequest(userProfile, { immediate: false });
  const { loading: logouting, send: logoutSend } = useRequest(logout, { immediate: false }).onSuccess(onLogout);
  return (
    <nord-card>
      <h3
        slot="header"
        className="text-lg font-bold">
        Login success!!!
      </h3>
      <nord-button
        slot="header-end"
        loading={logouting || undefined}
        onClick={() => logoutSend()}>
        Logout
      </nord-button>
      <div className="grid gap-y-2">
        <p>accessToken: {accessToken}</p>
        <p>refreshToken: {refreshToken}</p>
        {profile ? (
          <>
            <p>name: {profile.name}</p>
            <p>age: {profile.age}</p>
          </>
        ) : null}
        <nord-button
          variant="primary"
          loading={loading || undefined}
          onClick={send}>
          Please click here to show profile
        </nord-button>
      </div>
    </nord-card>
  );
}
Dashboard.propTypes = {
  onLogout: PropTypes.func.isRequired
};
