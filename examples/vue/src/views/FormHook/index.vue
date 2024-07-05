<template>
  <div class="responsive">
    <store-form></store-form>
    <edit-form></edit-form>
    <multi-form></multi-form>
    <condition-filter></condition-filter>
  </div>
</template>

<script setup>
import ConditionFilter from './ConditionFilter';
import EditForm from './EditForm';
import MultiForm from './MultiForm';
import StoreForm from './StoreForm';
</script>
