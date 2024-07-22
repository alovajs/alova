import Implementation from './Implementation';

function View() {
  return (
    <div
      className="responsive"
      style={{ alignItems: 'stretch' }}>
      <Implementation id="a"></Implementation>
      <Implementation id="b"></Implementation>
      <Implementation id="c"></Implementation>
      <Implementation id="d"></Implementation>
      <Implementation id="e"></Implementation>
    </div>
  );
}

export default View;
