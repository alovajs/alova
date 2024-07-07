<template>
  <nord-spinner v-if="loading && festivals.length <= 0" />
  <span v-else-if="error">{{ error.message }}</span>
  <nord-card v-else>
    <h3 slot="header">Festivals of This Year</h3>
    <nord-banner variant="warning">
      <div>
        <nord-button
          variant="plain"
          size="s"
          @click="reloadPage">
          Reload page
        </nord-button>
        <span>, you don't need to re-request festival data until next year.</span>
      </div>
      <div>
        <nord-button
          size="s"
          variant="plain"
          class="mt-2"
          @click="invalidateOldData">
          Invalidate the persistent data
        </nord-button>
        <span> and reload page, you can see 'Loading...' again.</span>
      </div>
    </nord-banner>
    <div class="grid grid-cols-6 gap-2 mt-4">
      <nord-badge
        v-for="fes in festivals"
        :key="fes.name">
        [{{ fes.date }}] {{ fes.name }}
      </nord-badge>
    </div>
  </nord-card>
</template>

<script setup>
import { invalidateCache } from 'alova';
import { useRequest } from 'alova/client';
import { queryFestivals } from '../api/methods';

const {
  loading,
  error,
  data: festivals
} = useRequest(queryFestivals(), {
  initialData: []
});

const reloadPage = () => {
  location.reload();
};

const invalidateOldData = () => {
  invalidateCache(queryFestivals());
  reloadPage();
};
</script>
