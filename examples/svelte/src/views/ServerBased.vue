<template>
  <!-- login card -->
  <nord-card v-if="!isLogin">
    <h3
      slot="header"
      class="text-lg font-bold">
      Login
    </h3>
    <div class="flex flex-row justify-between">
      <div class="grid gap-y-4">
        <nord-input
          :value="username"
          label="username"
          readonly></nord-input>
        <nord-input
          :value="password"
          label="password"
          readonly
          type="password"></nord-input>
        <nord-button
          variant="primary"
          :loading="logining"
          @click="loginSend">
          Login
        </nord-button>
      </div>

      <nord-spinner v-if="loadingVisitorInfo" />
      <p
        v-else
        class="text-lg">
        {{ visitorData?.info }}
      </p>
    </div>
  </nord-card>

  <!-- dashedboard panel -->
  <nord-card v-else>
    <h3
      slot="header"
      class="text-lg font-bold">
      Login success!!!
    </h3>
    <nord-button
      slot="header-end"
      :loading="logouting"
      @click="logoutSend">
      Logout
    </nord-button>
    <div class="grid gap-y-2">
      <p>accessToken: {{ accessToken }}</p>
      <p>refreshToken: {{ refreshToken }}</p>
      <template v-if="profile">
        <p>name: {{ profile.name }}</p>
        <p>age: {{ profile.age }}</p>
      </template>
      <nord-button
        variant="primary"
        :loading="loading"
        @click="send">
        Please click here to show profile
      </nord-button>
    </div>
  </nord-card>
</template>

<script setup>
import { createAlova } from 'alova';
import { createServerTokenAuthentication, useRequest } from 'alova/client';
import { ref } from 'vue';
import config from '../../config';
import { mockRequestAdapter } from '../api';
import { showToast } from '../helper';

const accessToken = ref('');
const refreshToken = ref('');
const { onAuthRequired, onResponseRefreshToken } = createServerTokenAuthentication({
  async login(response) {
    const data = await response.clone().json();
    accessToken.value = data.accessToken;
    refreshToken.value = data.refreshToken;
  },
  logout() {
    accessToken.value = '';
    refreshToken.value = '';
  },
  assignToken(method) {
    method.config.headers.Authorization = accessToken.value;
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
      const refreshInfo = await handleTokenRefresh(refreshToken.value);
      accessToken.value = refreshInfo.accessToken;
      refreshToken.value = refreshInfo.refreshToken;
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

const isLogin = ref(false);
const username = ref('admin');
const password = ref('123456');

const { loading: logining, send: loginSend } = useRequest(
  () => login({ username: username.value, password: password.value }),
  {
    immediate: false
  }
).onSuccess(() => {
  isLogin.value = true;
});
const { loading: loadingVisitorInfo, data: visitorData } = useRequest(visitorRequest);
const { loading, data: profile, send } = useRequest(userProfile, { immediate: false });
const { loading: logouting, send: logoutSend } = useRequest(logout, { immediate: false }).onSuccess(() => {
  isLogin.value = false;
});
</script>
