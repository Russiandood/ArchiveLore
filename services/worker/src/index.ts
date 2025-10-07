import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
const heartbeatQueue = new Queue('heartbeat', { connection });

new Worker('heartbeat', async job => {
  console.log('Heartbeat job', job.id, new Date().toISOString());
}, { connection });

(async () => { await heartbeatQueue.add('tick', {}, { repeat: { every: 60_000 } }); console.log('Worker running. Heartbeat scheduled every 60s.'); })();
