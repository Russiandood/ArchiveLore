import { Queue, Worker } from 'bullmq';

const url = process.env.REDIS_URL;

function idle(msg: string) {
  console.log(msg);
  setInterval(() => {}, 1 << 30); // keep process alive
}

if (!url) {
  idle('REDIS_URL missing. Set with: flyctl secrets set REDIS_URL="rediss://default:..." -a osg-worker');
} else {
  // Let BullMQ create the client with the correct options
  const connection = {
    url,
    // BullMQ requires these settings for stability (esp. with Upstash/serverless)
    maxRetriesPerRequest: null as any,
    enableReadyCheck: false,
  };

  const heartbeatQueue = new Queue('heartbeat', { connection });

  new Worker(
    'heartbeat',
    async (job) => {
      console.log('Heartbeat job', job.id, new Date().toISOString());
    },
    { connection }
  );

  (async () => {
    await heartbeatQueue.add('tick', {}, { repeat: { every: 60_000 } });
    console.log('Worker running. Heartbeat scheduled every 60s.');
  })().catch((err) => {
    idle(`Worker startup error: ${err?.message || err}`);
  });
}
