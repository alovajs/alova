import { queryCache } from 'alova';
import { equals } from 'alova/client';
import { alova, alovaIndexedDB } from '.';
import { createIndexedDBAdapter } from './IndexedDBAdapter';

export const getData = params => alova.Get('/get-list', { params });

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

// Settings
export const getSettings = () => alova.Get('/settings');
export const updateSetting = (name, value) => alova.Post('/settings', { name, value });

// SimpleList
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

// Editor
export const queryNotes = () => alova.Get('/note');
export const noteDetail = id =>
  alova.Get(`/note/${id}`, {
    async cacheFor() {
      // 自定义获取缓存，有则返回否则不返回
      const storageNoteList = await queryCache(queryNotes());
      if (storageNoteList) {
        return storageNoteList.find(noteItem => equals(noteItem.id, id));
      }
    }
  });
export const editNote = (content, id) =>
  alova.Post(
    '/note',
    { content, id },
    {
      meta: {
        silentDelay: 5000
      },
      name: id ? 'methodEditNote' + id : undefined
    }
  );
export const removeNote = id => alova.Delete('/note', { id });

// other strategies
export const getConfiguration = () => alova.Get('/configuration');
export const submitForm = data => alova.Post('/form', data);
export const getCityArea = params =>
  alova.Get('/cityArea', {
    params
  });

export const getLatestTime = () =>
  alova.Get('/latestTime', {
    cacheFor: null
  });

export const sendCaptcha = phoneNumber => alova.Post('/captcha', { phoneNumber });

export const getRetryData = params => alova.Get('/retryData', { params, cacheFor: null });

export const uploadFiles = ({ file, name }) => {
  const formData = new FormData();
  formData.append(name, file);
  return alova.Post('/upload', formData);
};

// sse
export const sseTest = () => alova.Get('https://sse.dev/test');
