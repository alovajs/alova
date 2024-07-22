<template>
  <div class="grid gap-y-4">
    <nord-segmented-control @input="handleSegmentChange">
      <nord-segmented-control-item
        v-for="item in segmentKeys"
        :key="item"
        :label="item"
        name="group"
        :value="item"
        :checked="item === checkedSeg ? true : undefined" />
    </nord-segmented-control>
    <nord-card>
      <component :is="segmentGroup[checkedSeg]" />
    </nord-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import BrowserVisibility from './BrowserVisibility.vue';
import Interval from './Interval.vue';
import Network from './Network.vue';
import PageFocus from './PageFocus.vue';

const segmentGroup = {
  Interval,
  Network,
  'Browser Visibility': BrowserVisibility,
  'Page Focus': PageFocus
};
const segmentKeys = Object.keys(segmentGroup);
const checkedSeg = ref(segmentKeys[0]);

const handleSegmentChange = event => {
  checkedSeg.value = event.target.value;
};
</script>
