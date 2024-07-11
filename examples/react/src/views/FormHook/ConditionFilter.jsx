import { useForm } from 'alova/client';
import { getCityArea } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

const cityOptions = [
  {
    value: 'bj',
    label: '北京'
  },
  {
    value: 'sh',
    label: '上海'
  }
];

/**
 * Confition filter form
 */
export default function ConditionFilter() {
  const {
    form,
    send,
    updateForm,
    reset,
    data: areaList,
    loading
  } = useForm(getCityArea, {
    initialForm: {
      search: '',
      city: ''
    },
    initialData: [],
    immediate: true,
    store: true
  });

  return (
    <nord-card>
      <div slot="header">
        <FileViewer
          filePath={window.__page.source[3]}
          docPath={window.__page.doc}>
          <h3 className="title">List condition search with storing</h3>
        </FileViewer>
      </div>
      <div className="grid md:grid-cols-[repeat(3,auto)] items-end gap-4 mb-4">
        <nord-input
          label="Search Area"
          value={form.search}
          onInput={({ target }) => updateForm({ search: target.value })}
          onBlur={send}
        />
        <nord-select
          label="Select City"
          value={form.city}
          onInput={({ target }) => {
            updateForm({ city: target.value });
            send();
          }}>
          {cityOptions.map(option => (
            <option
              key={option.value}
              value={option.value}>
              {option.label}
            </option>
          ))}
        </nord-select>
        <nord-button
          loading={loading || undefined}
          onClick={() => {
            reset();
            setTimeout(send, 20);
          }}>
          Reset
        </nord-button>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,60px)] gap-2">
        {areaList.map(({ label }) => (
          <nord-badge
            key={label}
            variant="info">
            {label}
          </nord-badge>
        ))}
      </div>
    </nord-card>
  );
}
