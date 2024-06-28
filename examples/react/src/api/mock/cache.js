import { defineMock } from '@alova/mock';

export default defineMock({
  '/query-festivals': () => {
    return festivals;
  },
  '/image/{fileName}': ({ params }) => {
    const xhr = new XMLHttpRequest();
    xhr.open('get', `/${params.fileName}`, true);
    xhr.responseType = 'blob';
    return new Promise(resolve => {
      xhr.send();
      xhr.onload = function () {
        resolve(xhr.response);
      };
    });
  }
});

const festivals = [
  {
    name: "New Year's Day",
    date: '01-01'
  },
  {
    name: "Valentine's Day",
    date: '02-14'
  },
  {
    name: "Women's Day",
    date: '03-08'
  },
  {
    name: "April Fools' Day",
    date: '04-01'
  },
  {
    name: 'May Day',
    date: '05-01'
  },
  {
    name: 'Dragon Boat Festival',
    date: '05-05'
  },
  {
    name: 'Mid-Autumn Festival',
    date: '08-15'
  },
  {
    name: "Motherland's National Day",
    date: '10-01'
  },
  {
    name: 'Christmas Day',
    date: '12-25'
  }
];
