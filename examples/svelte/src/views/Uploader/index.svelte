<script>
import CanvasElement from './Canvas';
import SelectFile from './SelectFile';
import WithInput from './WithInput';
</script>

<div class="responsive">
  <SelectFile></SelectFile>
  <CanvasElement></CanvasElement>
  <WithInput fileFormat="File"></WithInput>
  <WithInput fileFormat="Blob"></WithInput>
  <WithInput fileFormat="Base64"></WithInput>
  <WithInput fileFormat="ArrayBuffer"></WithInput>
</div>
