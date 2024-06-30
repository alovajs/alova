import { defineMock } from '@alova/mock';

const storageKey = 'aloval.silent.mock.settings';
const dataSettings = JSON.parse(
  sessionStorage.getItem(storageKey) ||
    `{
  "textContent":""
}`
);
const updateStorage = () => {
  sessionStorage.setItem(storageKey, JSON.stringify(dataSettings));
};

export default defineMock({
  '/settings': dataSettings,
  '[POST]/settings': async ({ data }) => {
    const { name, value } = data;
    dataSettings[name] = value;
    updateStorage();
    return true;
  }
});
