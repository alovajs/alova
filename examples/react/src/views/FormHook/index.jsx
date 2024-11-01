import ConditionFilter from './ConditionFilter';
import EditForm from './EditForm';
import MultiForm from './MultiForm';
import StoreForm from './StoreForm';

function View() {
  return (
    <div className="responsive">
      <StoreForm />
      <EditForm />
      <MultiForm />
      <ConditionFilter />
    </div>
  );
}

export default View;
