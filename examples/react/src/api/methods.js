import { alova } from '.';

export const getData = () => alova.Get('/get-list');

export const addFruit = fruit => alova.Post('/add-fruit', { item: fruit });

export const queryStudents = (page, pageSize, studentName, clsName) =>
  alova.Get('/query-students', {
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
