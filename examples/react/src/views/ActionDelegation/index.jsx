import Controller from './Controller';
import Target from './Target';

function View() {
  return (
    <div className="responsive">
      <Target />
      <Controller />
    </div>
  );
}

export default View;
