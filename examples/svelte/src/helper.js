export const provideToast = { instance: undefined };
export const showToast = (message, config = {}) => {
  provideToast.instance?.current?.addToast(message, {
    autoDismiss: 2000,
    ...config
  });
};

/**
 * format Date object to yyyy-MM-dd hh:mm:ss
 */
export const formatDate = date => {
  const fillZero = num => (num < 10 ? `0${num}` : num);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  return `${year}-${fillZero(month)}-${fillZero(day)} ${fillZero(hour)}:${fillZero(minute)}:${fillZero(second)}`;
};
