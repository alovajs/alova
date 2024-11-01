import { useForm } from 'alova/client';
import { For } from 'solid-js';
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
 * Condition filter form
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
          <h3 class="title">List condition search with storing</h3>
        </FileViewer>
      </div>
      <div class="grid md:grid-cols-[repeat(3,auto)] items-end gap-4 mb-4">
        <nord-input
          label="Search Area"
          value={form().search}
          onInput={({ target }) => updateForm({ search: target.value })}
          onBlur={send}
        />
        <nord-select
          label="Select City"
          placeholder="not selected"
          value={form().city}
          onInput={({ target }) => {
            updateForm({ city: target.value });
            send();
          }}>
          <For each={cityOptions}>{option => <option value={option.value}>{option.label}</option>}</For>
        </nord-select>
        <nord-button
          loading={loading() || undefined}
          onClick={() => {
            reset();
            setTimeout(send, 20);
          }}>
          Reset
        </nord-button>
      </div>
      <div class="grid grid-cols-[repeat(auto-fill,60px)] gap-2">
        <For each={areaList()}>{({ label }) => <nord-badge variant="info">{label}</nord-badge>}</For>
      </div>
    </nord-card>
  );
}
