import { defineMock } from '@alova/mock';

export default defineMock({
  '/query-students': ({ query }) => {
    let { page = 1, pageSize = 10, studentName, clsName } = query;
    page = Number(page);
    pageSize = Number(pageSize);
    const start = (page - 1) * pageSize;
    const filteredStudents = allStudents
      .slice()
      .reverse()
      .filter(
        ({ name, cls }) =>
          (studentName ? name.toLocaleLowerCase().indexOf(studentName.toLocaleLowerCase()) >= 0 : true) &&
          (clsName ? clsName === cls : true)
      );

    return {
      total: filteredStudents.length,
      list: filteredStudents.slice(start, start + pageSize)
    };
  },
  '/student/{id}': ({ params }) => allStudents.find(({ id }) => params.id === id.toString()) || null,
  '[POST]/student': ({ data }) => {
    const { id, name, cls } = data;
    const index = allStudents.findIndex(s => s.id === id);
    if (index >= 0) {
      allStudents.splice(index, 1, { id, name, cls });
      return true;
    } else {
      const newId = allStudents[allStudents.length - 1].id + 1;
      allStudents.push({ id: newId, name, cls });
      return newId;
    }
  },
  '[DELETE]/student': ({ data }) => {
    const index = allStudents.findIndex(s => s.id === data.id);
    allStudents.splice(index, 1);
    return true;
  }
});

const allStudents = [
  {
    name: 'August',
    cls: 'class1'
  },
  {
    name: 'Marshall',
    cls: 'class3'
  },
  {
    name: 'Maxwell',
    cls: 'class1'
  },
  {
    name: 'Kevin',
    cls: 'class1'
  },
  {
    name: 'Julian',
    cls: 'class2'
  },
  {
    name: 'Maxwell',
    cls: 'class2'
  },
  {
    name: 'August',
    cls: 'class1'
  },
  {
    name: 'Maxwell',
    cls: 'class3'
  },
  {
    name: 'Marshall',
    cls: 'class1'
  },
  {
    name: 'William',
    cls: 'class1'
  },
  {
    name: 'Maxwell',
    cls: 'class3'
  },
  {
    name: 'Marshall',
    cls: 'class1'
  },
  {
    name: 'Kevin',
    cls: 'class1'
  },
  {
    name: 'Julian',
    cls: 'class2'
  },
  {
    name: 'Maxwell',
    cls: 'class2'
  },
  {
    name: 'Marshall',
    cls: 'class3'
  },
  {
    name: 'Maxwell',
    cls: 'class1'
  },
  {
    name: 'Kevin',
    cls: 'class1'
  },
  {
    name: 'Julian',
    cls: 'class2'
  },
  {
    name: 'Maxwell',
    cls: 'class2'
  },
  {
    name: 'Kevin',
    cls: 'class1'
  },
  {
    name: 'Julian',
    cls: 'class2'
  },
  {
    name: 'Maxwell',
    cls: 'class2'
  },
  {
    name: 'Kevin',
    cls: 'class1'
  },
  {
    name: 'Kevin',
    cls: 'class1'
  },
  {
    name: 'Julian',
    cls: 'class2'
  },
  {
    name: 'Maxwell',
    cls: 'class2'
  },
  {
    name: 'Kevin',
    cls: 'class1'
  },
  {
    name: 'Kevin',
    cls: 'class1'
  },
  {
    name: 'Julian',
    cls: 'class2'
  },
  {
    name: 'Kevin',
    cls: 'class1'
  },
  {
    name: 'Julian',
    cls: 'class2'
  },
  {
    name: 'Kevin',
    cls: 'class1'
  },
  {
    name: 'Julian',
    cls: 'class2'
  },
  {
    name: 'Maxwell',
    cls: 'class2'
  },
  {
    name: 'Julian',
    cls: 'class2'
  },
  {
    name: 'Kevin',
    cls: 'class1'
  },
  {
    name: 'Kevin',
    cls: 'class1'
  },
  {
    name: 'Julian',
    cls: 'class2'
  },
  {
    name: 'Kevin',
    cls: 'class1'
  }
].map((item, i) => ({
  id: i + 1,
  ...item
}));
