<template>
  <div class="responsive">
    <select-file></select-file>
    <canvas-element></canvas-element>
    <with-input fileFormat="File"></with-input>
    <with-input fileFormat="Blob"></with-input>
    <with-input fileFormat="Base64"></with-input>
    <with-input fileFormat="ArrayBuffer"></with-input>
  </div>
</template>

<script setup>
import CanvasElement from './Canvas';
import SelectFile from './SelectFile';
import WithInput from './WithInput';
</script>
