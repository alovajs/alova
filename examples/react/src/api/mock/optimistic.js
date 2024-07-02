import { defineMock } from '@alova/mock';

const createStorageHelper = (key, defaultValue) => {
  let data = sessionStorage.getItem(key);
  data = data ? JSON.parse(data) : defaultValue;
  return {
    data,
    update: () => sessionStorage.setItem(key, JSON.stringify(data))
  };
};

const { data: dataSettings, update: updateSettingStorage } = createStorageHelper('aloval.silent.mock.settings', {
  textContent: ''
});
const { data: allTodos, update: updateSimpleListStorage } = createStorageHelper('aloval.silent.mock.todos', []);
const { data: allNotes, update: updateNoteStorage } = createStorageHelper('aloval.silent.mock.notes', [
  { id: 1, content: 'example note', updateTime: '2022-12-31 00:00:00' }
]);

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
  },

  '/note': () => {
    return [...allNotes].reverse();
  },
  '/note/{id}': async ({ params }) => {
    return allNotes.find(({ id }) => params.id === id.toString()) || null;
  },
  '[POST]/note': async ({ data }) => {
    const { id, content } = data;
    const updateTime = new Date().toISOString();
    const foundNote = allNotes.find(s => s.id.toString() === id?.toString());
    let newId = null;
    if (foundNote) {
      foundNote.content = content;
      foundNote.updateTime = updateTime;
    } else {
      const lastId = allNotes[allNotes.length - 1]?.id || 0;
      newId = lastId + 1;
      allNotes.push({ id: newId, content, updateTime });
    }
    updateNoteStorage();
    return { id: newId };
  },
  '[DELETE]/note': async ({ data }) => {
    const index = allNotes.findIndex(s => s.id.toString() === data.id.toString());
    allNotes.splice(index, 1);
    updateNoteStorage();
    return true;
  }
});
