const logs = [] as any[];

export const pushLog = (...newLogs: any[]) => {
  logs.push(...newLogs);
};
export const clearLogs = () => {
  logs.splice(0, logs.length);
};
export const flushLogs = () => {
  const currentLogs = [...logs];
  clearLogs();
  return currentLogs;
};
