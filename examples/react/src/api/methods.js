import { alova } from '.';

export const getData = () => alova.Get('/get-list');

export const addFruit = fruit => alova.Post('/add-fruit', { item: fruit });

export const queryStudents = (page, pageSize, studentName, clsName) =>
  alova.Get('/query-students', {
    params: { page, pageSize, studentName, clsName }
  });
export const queryStudentDetail = id => alova.Get(`/student/${id}`);
export const editStudent = (name, cls, id) =>
  alova.Post('/student', {
    id,
    name,
    cls
  });
export const removeStudent = id => alova.Delete('/student', { id });
