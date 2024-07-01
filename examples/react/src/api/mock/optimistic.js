import { defineMock } from '@alova/mock';

const settingsStorageKey = 'aloval.silent.mock.settings';
const dataSettings = JSON.parse(
  sessionStorage.getItem(settingsStorageKey) ||
    `{
  "textContent":""
}`
);
const updateSettingStorage = () => {
  sessionStorage.setItem(settingsStorageKey, JSON.stringify(dataSettings));
};

const simpleListStorageKey = 'aloval.silent.mock.todos';
const allTodos = JSON.parse(sessionStorage.getItem(simpleListStorageKey) || '[]');
const updateSimpleListStorage = () => {
  sessionStorage.setItem(simpleListStorageKey, JSON.stringify(allTodos));
};

export default defineMock({
  // settings
  '/settings': dataSettings,
  '[POST]/settings': async ({ data }) => {
    const { name, value } = data;
    dataSettings[name] = value;
    updateSettingStorage();
    return true;
  },

  // simple-list
  '/query-todo': ({ query }) => {
    let { keyword = '' } = query;
    return allTodos
      .filter(({ content }) => (keyword ? content.toLowerCase().indexOf(content.toLowerCase()) >= 0 : true))
      .reverse();
  },
  '/todo/{id}': async ({ params }) => {
    return allTodos.find(({ id }) => params.id === id.toString()) || null;
  },
  '[POST]/todo': async ({ data }) => {
    const { id, content, time } = data;
    const index = allTodos.findIndex(s => s.id == id);
    let newId = null;
    if (index >= 0) {
      allTodos.splice(index, 1, { id, content, time });
    } else {
      const lastId = Number(allTodos[allTodos.length - 1]?.id || 0);
      newId = lastId + 1;
      allTodos.push({ id: newId, content, time });
    }
    updateSimpleListStorage();
    return { id: newId };
  },
  '[DELETE]/todo': async ({ data }) => {
    const index = allTodos.findIndex(s => s.id === data.id);
    allTodos.splice(index, 1);
    updateSimpleListStorage();
    return true;
  }
});
