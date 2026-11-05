import serverless from 'serverless-http';
import express from 'express';
import { apiRouter } from '../../server/routes.ts';
import { initDatabase } from '../../server/db.ts';

const app = express();
app.use(express.json());

// Support both /api and root when routed through Netlify rewrites
app.use('/api', apiRouter);
app.use('/.netlify/functions/api', apiRouter);

let initialized = false;
let initPromise: Promise<void> | null = null;

async function ensureDb() {
  if (initialized) return;
  if (!initPromise) {
    initPromise = initDatabase()
      .then(() => {
        initialized = true;
      })
      .catch((err) => {
        console.error('[Netlify Function] Database init error:', err);
        initPromise = null;
        throw err;
      });
  }
  await initPromise;
}

const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
  // Prevent function freeze before background queries complete
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    await ensureDb();
  } catch (err: any) {
    console.error('[Netlify Function] Failed to initialize DB:', err);
  }
  return serverlessHandler(event, context);
};
