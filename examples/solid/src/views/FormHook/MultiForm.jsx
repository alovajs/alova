import { useForm } from 'alova/client';
import { For, createSignal } from 'solid-js';
import { submitForm } from '../../api/methods';
import FileViewer from '../../components/FileViewer';

const initialForm = {
  input: '',
  select: '',
  date: undefined,
  switch: false,
  checkbox: []
};
const formId = 'multi-form-id';
const options = ['Option 1', 'Option 2', 'Option 3'];
const checklist = ['apple', 'banana', 'grape'];

/**
 * Multi-step form component
 */
export default function MultiFormCard() {
  const formComponents = [FormOne, FormTwo, FormThree];
  const [currentStep, setCurrentStep] = createSignal(0);

  const addCurrentStep = () => setCurrentStep(v => v + 1);
  const subCurrentStep = () => setCurrentStep(v => v - 1);

  const { send, loading: submitting } = useForm(form => submitForm(form), {
    id: formId,
    initialForm,
    resetAfterSubmiting: true
  }).onSuccess(({ data }) => {
    alert(`Submitted, request body is: ${JSON.stringify(data)}`);
  });

  return (
    <nord-card>
      <div slot="header">
        <FileViewer
          filePath={window.__page.source[2]}
          docPath={window.__page.doc}>
          <h3 class="title">[Multiple steps form] Fill step by step, and submit all data in final step</h3>
        </FileViewer>
      </div>
      <div class="grid gap-y-4">
        <strong>Step {currentStep() + 1}</strong>
        {formComponents[currentStep()]()}
        <div class="grid grid-cols-[repeat(2,fit-content(100px))] gap-x-4">
          {currentStep() > 0 && currentStep() < formComponents.length ? (
            <nord-button onClick={subCurrentStep}>Previous</nord-button>
          ) : null}
          {currentStep() < formComponents.length - 1 ? (
            <nord-button
              onClick={addCurrentStep}
              variant="primary">
              Next
            </nord-button>
          ) : (
            <nord-button
              variant="primary"
              loading={submitting() || undefined}
              onClick={send}>
              Submit
            </nord-button>
          )}
        </div>
      </div>
    </nord-card>
  );
}

function FormOne() {
  const { form, updateForm } = useForm(form => submitForm(form), { id: formId });
  return (
    <nord-input
      label="Input something"
      value={form().input}
      onInput={({ target }) => updateForm({ input: target.value })}
    />
  );
}

function FormTwo() {
  const { form, updateForm } = useForm(form => submitForm(form), { id: formId });
  return (
    <>
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
    </>
  );
}

function FormThree() {
  const { form, updateForm } = useForm(form => submitForm(form), { id: formId });
  return (
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
  );
}
