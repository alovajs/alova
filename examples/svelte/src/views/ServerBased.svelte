<script>
  import { createAlova } from 'alova';
  import { createServerTokenAuthentication, useRequest } from 'alova/client';
  import config from '../../config';
  import { mockRequestAdapter } from '../api';
  import { showToast } from '../helper';

  let accessToken = '';
  let refreshToken = '';
  let isLogin = false;
  let username = 'admin';
  let password = '123456';

  const { onAuthRequired, onResponseRefreshToken } = createServerTokenAuthentication({
    async login(response) {
      const data = await response.clone().json();
      accessToken = data.accessToken;
      refreshToken = data.refreshToken;
    },
    logout() {
      accessToken = '';
      refreshToken = '';
    },
    assignToken(method) {
      method.config.headers.Authorization = accessToken;
    },
    refreshTokenOnSuccess: {
      async isExpired(response) {
        const data = await response.clone().json();
        const expired = data.code === 401;
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
        showToast('token refreshed, re-send failed request', {
          autoDismiss: 5000
        });
      }
    }
  });

  // apis
  const alova = createAlova({
    baseURL: 'http://example.com',
    statesHook: config.alovaStatesHook,
    requestAdapter: mockRequestAdapter,
    cacheFor: null,
    beforeRequest: onAuthRequired(),
    responded: onResponseRefreshToken(response => response.json())
  });

  const visitorRequest = () =>
    alova.Get('/visitor/info', {
      meta: {
        authRole: null
      }
    });

  const login = data =>
    alova.Post('/user/login', data, {
      meta: {
        authRole: 'login'
      }
    });

  const logout = data =>
    alova.Post('/user/logout', data, {
      meta: {
        authRole: 'logout'
      }
    });

  const handleTokenRefresh = token =>
    alova.Post(
      '/user/refresh-token',
      { accessToken: token },
      {
        meta: {
          authRole: 'refreshToken'
        }
      }
    );

  const userProfile = () => alova.Get('/user/profile');

  const { loading: logining, send: loginSend } = useRequest(() => login({ username, password }), {
    immediate: false
  }).onSuccess(() => {
    isLogin = true;
  });

  const { loading: loadingVisitorInfo, data: visitorData } = useRequest(visitorRequest);
  const { loading, data: profile, send } = useRequest(userProfile, { immediate: false });
  const { loading: logouting, send: logoutSend } = useRequest(logout, { immediate: false }).onSuccess(() => {
    isLogin = false;
  });
</script>

{#if !isLogin}
  <!-- login card -->
  <nord-card>
    <h3
      slot="header"
      class="text-lg font-bold">
      Login
    </h3>
    <div class="flex flex-row justify-between">
      <div class="grid gap-y-4">
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
          loading={$logining}
          on:click={loginSend}>
          Login
        </nord-button>
      </div>

      {#if $loadingVisitorInfo}
        <nord-spinner />
      {:else}
        <p class="text-lg">
          {$visitorData?.info}
        </p>
      {/if}
    </div>
  </nord-card>
{:else}
  <!-- dashedboard panel -->
  <nord-card>
    <h3
      slot="header"
      class="text-lg font-bold">
      Login success!!!
    </h3>
    <nord-button
      slot="header-end"
      loading={$logouting}
      on:click={logoutSend}>
      Logout
    </nord-button>
    <div class="grid gap-y-2">
      <p>accessToken: {accessToken}</p>
      <p>refreshToken: {refreshToken}</p>
      {#if $profile}
        <p>name: {$profile.name}</p>
        <p>age: {$profile.age}</p>
      {/if}
      <nord-button
        variant="primary"
        loading={$loading}
        on:click={send}>
        Please click here to show profile
      </nord-button>
    </div>
  </nord-card>
{/if}
