import CanvasElement from './Canvas';
import SelectFile from './SelectFile';
import WithInput from './WithInput';

const View = () => {
  return (
    <div className="responsive">
      <SelectFile />
      <CanvasElement />
      <WithInput fileFormat="File" />
      <WithInput fileFormat="Blob" />
      <WithInput fileFormat="Base64" />
      <WithInput fileFormat="ArrayBuffer" />
    </div>
  );
};

export default View;
