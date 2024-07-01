import { alova, alovaIndexedDB } from '.';
import { createIndexedDBAdapter } from './IndexedDBAdapter';

export const getData = () => alova.Get('/get-list');

export const addFruit = fruit => alova.Post('/add-fruit', { item: fruit });

export const queryStudents = (page, pageSize, studentName, clsName) =>
  alova.Get('/query-students', {
    hitSource: /^student-/,
    params: { page, pageSize, studentName, clsName }
  });
export const queryStudentDetail = id =>
  alova.Get(`/student/${id}`, {
    hitSource: 'student-' + id
  });
export const editStudent = (name, cls, id) =>
  alova.Post(
    '/student',
    {
      id,
      name,
      cls
    },
    {
      name: 'student-' + id
    }
  );
export const removeStudent = id => alova.Delete('/student', { id });

export const queryRandom = () => alova.Get('/query-random');

export const queryFestivals = () => {
  const expireDate = new Date();
  expireDate.setMonth(11, 31);
  expireDate.setHours(23, 59, 59, 999);
  return alova.Get('/query-festivals', {
    // set cache mode to 'STORAGE_RESTORE', It is generally used for data that remains unchanged for a certain period of time
    cacheFor: {
      mode: 'restore',
      expire: expireDate
    }
  });
};

const transformBlob2Base64 = blob => {
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  return new Promise(resolve => {
    reader.onload = ({ target }) => {
      resolve(target.result);
    };
  });
};
export const imagePlain = fileName =>
  alovaIndexedDB.Get(`/image/${fileName}`, {
    cacheFor: {
      mode: 'restore',
      expire: 300000
    },
    meta: {
      dataType: 'blob'
    },
    transform: transformBlob2Base64
  });
const adapter = createIndexedDBAdapter();
export const imageWithControlledCache = fileName =>
  alovaIndexedDB.Get(`/image/${fileName}`, {
    meta: {
      dataType: 'blob'
    },
    cacheFor() {
      return adapter.get(fileName);
    },
    async transform(imgBlob) {
      const base64Img = await transformBlob2Base64(imgBlob);
      // save the image data to IndexedDB
      await adapter.set(fileName, base64Img);
      return base64Img;
    }
  });

export const getSettings = () => alova.Get('/settings');
export const updateSetting = (name, value) => alova.Post('/settings', { name, value });

export const queryTodo = keyword =>
  alova.Get('/query-todo', {
    params: { keyword }
  });
export const todoDetail = id => alova.Get(`/todo/` + id);
export const editTodo = (content, time, id) =>
  alova.Post('/todo', {
    id,
    content,
    time
  });
export const removeTodo = id => alova.Delete('/todo', { id });
