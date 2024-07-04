import { useForm } from 'alova/client';
import { useState } from 'react';
import { submitForm } from '../../api/methods';
import FileViewer from '../../components/FileViewer';
import { useEvent } from '../../helper';

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
 * multiple steps form
 */
export default function MultiFormCard() {
  const formComponents = [<FormOne key={1} />, <FormTwo key={2} />, <FormThree key={3} />];
  const [currentStep, setCurrentStep] = useState(0);
  const addCurreentStep = () => {
    setCurrentStep(v => v + 1);
  };
  const subCurreentStep = () => {
    setCurrentStep(v => v - 1);
  };

  const { send, loading: submiting } = useForm(form => submitForm(form), {
    id: formId,
    initialForm,
    resetAfterSubmiting: true
  }).onSuccess(({ data }) => {
    console.log('Submited, request body is: ' + JSON.stringify(data));
  });

  console.log('submiting: ', submiting);
  return (
    <nord-card>
      <div slot="header">
        <FileViewer
          filePath={window.__page.source[2]}
          docPath={window.__page.doc}>
          <h3 className="title">[Multiple steps form] Fill step by step, and submit all data in final step</h3>
        </FileViewer>
      </div>
      <div className="grid gap-y-4">
        <strong>Step {currentStep + 1}</strong>
        {formComponents[currentStep]}
        <div className="grid grid-cols-[repeat(2,fit-content(100px))] gap-x-4">
          {currentStep > 0 && currentStep < formComponents.length ? (
            <nord-button onClick={subCurreentStep}>Previous</nord-button>
          ) : null}
          {currentStep < formComponents.length - 1 ? (
            <nord-button
              onClick={addCurreentStep}
              variant="primary">
              Next
            </nord-button>
          ) : (
            <nord-button
              variant="primary"
              loading={submiting || undefined}
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
  // 通过获得id为multi-form-id的共享数据
  const { form, updateForm } = useForm(form => submitForm(form), {
    id: formId
  });
  return (
    <nord-input
      label="Input something"
      value={form.input}
      onInput={({ target }) => updateForm({ input: target.value })}
    />
  );
}

function FormTwo() {
  // 通过获得id为multi-form-id的共享数据
  const { form, updateForm } = useForm(form => submitForm(form), {
    id: formId
  });
  const { ref: dateRef } = useEvent({
    change({ target }) {
      updateForm({ date: target.value });
    }
  });
  return (
    <>
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
    </>
  );
}

function FormThree() {
  // 通过获得id为multi-form-id的共享数据
  const { form, updateForm } = useForm(form => submitForm(form), {
    id: formId
  });
  return (
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
  );
}
