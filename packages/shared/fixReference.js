import fs from 'fs';
import { join } from 'path';

const getDeclareFiles = targetPath => {
  const targetFiles = [];
  const filepaths = fs.readdirSync(targetPath);
  for (const path of filepaths) {
    const filesrc = join(targetPath, path);
    const stats = fs.statSync(filesrc);
    if (stats.isDirectory()) {
      const subTargetFiles = getDeclareFiles(filesrc);
      targetFiles.push(...subTargetFiles);
    } else if (/\.d\.ts$/.test(path)) {
      targetFiles.push(filesrc);
    }
  }
  return targetFiles;
};

const targetFiles = getDeclareFiles('./dist');
const replacingMap = {
  '../../alova/typings': 'alova',
  '../../client/typings/clienthook': 'alova/client'
};
targetFiles.forEach(file => {
  let content = fs.readFileSync(file, { encoding: 'utf8' });
  for (const path in replacingMap) {
    content = content.replace(new RegExp(path, 'g'), replacingMap[path]);
  }
  fs.writeFileSync(file, content);
});
