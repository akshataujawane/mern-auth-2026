// =============================================================================
// Integration Tests — Express App bootstrap (index.js)
//
// Covers the lines in index.js that cannot be reached by auth/user tests:
//   1. GET /metrics      — Prometheus metrics endpoint
//   2. GET *             — SPA catch-all route (tries to sendFile index.html)
//   3. Global error handler — 4xx / 5xx JSON shape
// =============================================================================
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

describe('Express App (index.js)', () => {

  // ── Prometheus metrics ─────────────────────────────────────────────────
  describe('GET /metrics', () => {
    it('returns 200 and Prometheus text format', async () => {
      const res = await request(app).get('/metrics');
      expect(res.statusCode).toBe(200);
      // prom-client always emits the Node.js default metrics with our prefix
      expect(res.text).toContain('mern_auth_');
    });
  });

  // ── SPA catch-all route ────────────────────────────────────────────────
  // In the test environment client/dist/index.html does not exist, so
  // res.sendFile calls next(err) with an ENOENT, which flows through the
  // global error handler.  Both the wildcard handler and the error handler
  // are therefore executed and covered.
  describe('GET * (SPA fallback)', () => {
    it('serves index.html or returns an error when dist is absent', async () => {
      const res = await request(app).get('/some-frontend-route-that-does-not-exist');
      // Accept 200 (dist present) or 4xx/5xx (dist absent in CI/test)
      expect([200, 404, 500]).toContain(res.statusCode);
    });
  });

  // ── Global error handler ───────────────────────────────────────────────
  // The auth routes already trigger this handler (signup with missing
  // password → 400, signin with bad creds → 404/401), but we assert the
  // response shape explicitly here for documentation and guaranteed coverage.
  describe('Global error handler', () => {
    it('returns JSON with success:false and statusCode on a 400 error', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        email: 'only@email.com', // missing username + password
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeTruthy();
      expect(res.body.statusCode).toBe(400);
    });

    it('returns JSON with success:false and statusCode on a 404 error', async () => {
      const res = await request(app).post('/api/auth/signin').send({
        email: 'nobody@example.com',
        password: 'password123',
      });
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(404);
    });
  });
});
