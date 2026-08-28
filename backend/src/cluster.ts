import cluster from 'node:cluster';
import os from 'node:os';

if (cluster.isPrimary) {
  const numCPUs = Math.max(1, Math.min(os.cpus().length, 8));
  console.log(`⚡ [Cluster Primary] Spawning ${numCPUs} Watch Party worker instances (PID: ${process.pid})...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('online', (worker) => {
    console.log(`✅ [Worker ${worker.id}] Online (PID: ${worker.process.pid})`);
  });

  cluster.on('exit', (worker, code, signal) => {
    console.warn(`⚠️ [Worker ${worker.id}] Exited (${signal || code}). Spawning replacement worker...`);
    cluster.fork();
  });
} else {
  // Start the server within worker
  import('./index.js').catch((err) => {
    console.error(`[Worker ${process.pid}] Fatal start error:`, err);
    process.exit(1);
  });
}
