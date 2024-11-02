import { useForm } from 'alova/client';
import { For } from 'solid-js';
import { submitForm } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

const options = ['Option 1', 'Option 2', 'Option 3'];
const checklist = ['apple', 'banana', 'grape'];

/**
 * Draft form component with storage until submission
 */
export default function StoreFormCard() {
  const {
    form,
    send,
    updateForm,
    reset,
    loading: submitting
  } = useForm(form => submitForm(form), {
    initialForm: {
      input: '',
      select: '',
      date: undefined,
      switch: false,
      checkbox: []
    },
    store: true,
    resetAfterSubmiting: true
  }).onSuccess(({ data }) => {
    alert('Submitted, request body is: ' + JSON.stringify(data));
  });

  return (
    <nord-card>
      <div slot="header">
        <FileViewer
          filePath={window.__page.source[0]}
          docPath={window.__page.doc}>
          <h3 class="title">[Draft form] Data will be stored until submitted</h3>
        </FileViewer>
      </div>
      <div class="grid gap-y-4">
        <nord-input
          label="Input something"
          value={form().input}
          onInput={({ target }) => updateForm({ input: target.value })}
        />
        <nord-select
          label="Select"
          value={form().select}
          placeholder="not selected"
          onInput={({ target }) => updateForm({ select: target.value })}>
          <For each={options}>{option => <option value={option}>{option}</option>}</For>
        </nord-select>
        <nord-date-picker
          label="Date"
          placeholder="YYYY-MM-DD"
          value={form().date}
          onChange={({ target }) => {
            updateForm({ date: target.value });
          }}
        />
        <nord-toggle
          checked={form().switch || undefined}
          label="Switch this"
          onInput={({ target }) => {
            setTimeout(() => {
              updateForm({ switch: target.checked });
            });
          }}
        />
        <div class="flex">
          <For each={checklist}>
            {item => (
              <nord-checkbox
                class="mr-4"
                label={item}
                value={item}
                checked={form().checkbox.includes(item) || undefined}
                onInput={({ target }) => {
                  setTimeout(() => {
                    const updatedCheckbox = target.checked
                      ? [...form().checkbox, target.value]
                      : form().checkbox.filter(i => i !== target.value);
                    updateForm({ checkbox: updatedCheckbox });
                  });
                }}
              />
            )}
          </For>
        </div>
        <div class="grid grid-cols-[repeat(2,fit-content(100px))] gap-x-4">
          <nord-button
            variant="primary"
            loading={submitting() || undefined}
            onClick={send}>
            Submit
          </nord-button>
          <nord-button onClick={reset}>Reset</nord-button>
        </div>
      </div>
    </nord-card>
  );
}
