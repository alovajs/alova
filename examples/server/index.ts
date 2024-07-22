import { createNodeSharedCacheSynchronizer } from '@alova/psc';
import cluster from 'cluster';

const processesNumber = 3;
if (cluster.isPrimary) {
  console.log('Master starting...');
  // ensure start synchronizer in master process
  createNodeSharedCacheSynchronizer();
  for (let i = 0; i < processesNumber; i++) {
    cluster.fork();
  }

  cluster.on('exit', worker => {
    console.log(`Process id:${worker.process.pid} is restarted`);
    setTimeout(function () {
      cluster.fork();
    }, 2000);
  });
} else {
  require('./server');
}
