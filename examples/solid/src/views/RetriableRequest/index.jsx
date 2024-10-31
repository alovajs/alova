import Implementation from './Implementation';

function View() {
  return (
    <div
      class="responsive"
      style={{ 'align-items': 'stretch' }}>
      <Implementation id="a" />
      <Implementation id="b" />
      <Implementation id="c" />
      <Implementation id="d" />
      <Implementation id="e" />
    </div>
  );
}

export default View;
