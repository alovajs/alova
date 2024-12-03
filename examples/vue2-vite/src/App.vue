<template>
  <div id="app">
    <test-comp v-if="aaa"></test-comp>
    <div>
      <button @click="aaa = true">创建</button>
      <button @click="aaa = false">卸载</button>
      <button @click="handleModifyData">修改data</button>
    </div>
  </div>
</template>

<script>
import { updateState } from 'alova';
import TestComp from './TestComp.vue';
import { getData } from './api';

export default {
  components: {
    TestComp
  },
  data() {
    return {
      aaa: false
    }
  },
  methods: {
    handleModifyData() {
      updateState(getData(), data => {
        console.log('data', data);
        return {
          ...data,
          extra: 'grape'
        };
      })
    }
  }
}
</script>

<style>
#app {
  padding: 10px;
}
</style>
