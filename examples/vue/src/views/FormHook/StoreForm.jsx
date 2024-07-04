import { useForm } from 'alova/client';
import { submitForm } from '../../api/methods';
import FileViewer from '../../components/FileViewer';
import { useEvent } from '../../helper';

const options = ['Option 1', 'Option 2', 'Option 3'];
const checklist = ['apple', 'banana', 'grape'];
/**
 * form with draft
 */
export default function StoreFormCard() {
  const {
    form,
    send,
    updateForm,
    reset,
    loading: submiting
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
    alert('Submited, request body is: ' + JSON.stringify(data));
  });
  const { ref: dateRef } = useEvent({
    change({ target }) {
      updateForm({ date: target.value });
    }
  });

  return (
    <nord-card>
      <div slot="header">
        <FileViewer
          filePath={window.__page.source[0]}
          docPath={window.__page.doc}>
          <h3 className="title">[Draft form] Data will be stored until submit them</h3>
        </FileViewer>
      </div>
      <div className="grid gap-y-4">
        <nord-input
          label="Input something"
          value={form.input}
          onInput={({ target }) => updateForm({ input: target.value })}
        />
        <nord-select
          label="Select"
          value={form.select}
          placeholder="not selected"
          onInput={({ target }) => updateForm({ select: target.value })}>
          {options.map(option => (
            <option
              key={option}
              value={option}>
              {option}
            </option>
          ))}
        </nord-select>
        <nord-date-picker
          label="Date"
          placeholder="YYYY-MM-DD"
          value={form.date}
          ref={dateRef}
        />
        <nord-toggle
          checked={form.switch || undefined}
          label="Switch this"
          onInput={({ target }) => {
            setTimeout(() => {
              updateForm({ switch: target.checked });
            });
          }}
        />
        <div className="flex">
          {checklist.map(item => (
            <nord-checkbox
              class="mr-4"
              label={item}
              key={item}
              value={item}
              checked={form.checkbox.includes(item) || undefined}
              onInput={({ target }) => {
                setTimeout(() => {
                  if (target.checked) {
                    form.checkbox.push(target.value);
                  } else {
                    form.checkbox = form.checkbox.filter(item => item !== target.value);
                  }
                  updateForm({
                    checkbox: [...form.checkbox]
                  });
                });
              }}></nord-checkbox>
          ))}
        </div>
        <div className="grid grid-cols-[repeat(2,fit-content(100px))] gap-x-4">
          <nord-button
            variant="primary"
            loading={submiting || undefined}
            onClick={send}>
            Submit
          </nord-button>
          <nord-button onClick={reset}>Reset</nord-button>
        </div>
      </div>
    </nord-card>
  );
}
