import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import promBundle from 'express-prom-bundle';
import promClient from 'prom-client';
dotenv.config();

// MongoDB connection is established AFTER the server starts listening so that
// the HTTP port is immediately available for health-checks and readiness probes.
// In test mode (unit/integration via vitest + mongodb-memory-server), this block
// is skipped entirely and connection is managed by the test setup.

const __dirname = path.resolve();

const app = express();
app.disable('x-powered-by');

// ── Prometheus Observability ──────────────────────────────────────────────────
// Collects default Node.js process metrics (heap, CPU, event-loop lag, etc.)
promClient.collectDefaultMetrics({ prefix: 'mern_auth_' });

// Auto-instruments all routes with http_request_duration_seconds histogram
// and http_requests_total counter. Exposes GET /metrics for Prometheus scraping.
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: { app: 'mern-auth', env: process.env.NODE_ENV || 'production' },
  promClient: { collectDefaultMetrics: {} },
  metricsPath: '/metrics',
});
app.use(metricsMiddleware);
// ─────────────────────────────────────────────────────────────────────────────

app.use(express.json());
app.use(cookieParser());

app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'mern-auth',
    mongoState: mongoose.connection.readyState,
  });
});

app.use(express.static(path.join(__dirname, '/client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

app.use((err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle MongoDB Duplicate Key Error (e.g. Username/Email taken)
  if (err.code === 11000) {
    statusCode = 409;
    let duplicateField = 'value';
    if (err.keyValue) {
      duplicateField = Object.keys(err.keyValue)[0];
    } else if (err.message && err.message.includes('index:')) {
      // DocumentDB E11000 format: "E11000 duplicate key error collection: test.users index: username_1 dup key: ..."
      const match = err.message.match(/index:\s+([a-zA-Z0-9_]+)_1/);
      if (match) duplicateField = match[1];
    }
    message = `The ${duplicateField} you entered is already in use. Please try another one.`;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
});

/* istanbul ignore next */
if (process.env.NODE_ENV !== 'test') {
  // ── Step 1: Bind HTTP port FIRST ─────────────────────────────────────────
  // We await the listen Promise so we are CERTAIN port 9191 is open before
  // any async DB work begins. This guarantees the K8s startupProbe always
  // gets a valid HTTP response, even when DocumentDB is temporarily unavailable.
  const port = process.env.PORT || 9191;

  await new Promise((resolve, reject) =>
    app.listen(port, (err) => (err ? reject(err) : resolve()))
      .on('error', reject)
  );
  console.log(`Server listening on port ${port}`);

  // ── Step 2: Connect to DocumentDB asynchronously ─────────────────────────
  // Do NOT call process.exit on initial connect failure — Mongoose has built-in
  // retry logic (serverSelectionTimeoutMS). If the DB is temporarily unreachable
  // the app stays alive, the startupProbe/readinessProbe stay green for the HTTP
  // layer, and DB-dependent routes will return errors until reconnection occurs.
  // The 'error' event handler below handles persistent failures after initial
  // connection loss (post-startup), which is the correct signal to restart.
  // Port is bound above so the event loop is free during this await —
  // Express continues serving HTTP (startup probe gets 200) while we wait.
  // Do NOT rethrow on failure: Mongoose retries automatically in the background.
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,   // 30 s per selection attempt
      connectTimeoutMS:         10000,   // 10 s TCP connect timeout
      socketTimeoutMS:          45000,   // 45 s socket idle timeout
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    // Log but do NOT exit — Mongoose will keep retrying in the background.
    // If you need hard failure, let the liveness probe kill the pod after
    // the grace period instead of killing it before the port is even open.
    console.error('WARNING: Initial MongoDB connection failed (will retry):', err.message);
  }

  // Crash signal only after we are already serving traffic and the DB
  // connection is then permanently lost (not just slow to start).
  mongoose.connection.on('error', (err) => {
    console.error('FATAL: Lost MongoDB connection after startup:', err.message);
    process.exit(1);
  });
}

export default app;
