import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';

describe('Auth API Routes', () => {

  describe('POST /api/auth/signup', () => {
    it('should create a new user and return 201', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('User created successfully');
      
      const dbUser = await User.findOne({ email: 'test@example.com' });
      expect(dbUser).toBeTruthy();
      expect(dbUser.username).toBe('testuser');
      expect(bcryptjs.compareSync('password123', dbUser.password)).toBe(true);
    });

    it('should handle errors returning 400 when missing required fields', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        email: 'test@example.com', // Missing username and password
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 409 Conflict for MongoDB natively formatted E11000 duplicate key error (with keyValue)', async () => {
      const mockSave = vi.spyOn(User.prototype, 'save').mockImplementationOnce(() => {
        const err = new Error('Duplicate key');
        err.code = 11000;
        err.keyValue = { custom_username: 'abc' };
        throw err;
      });

      const res = await request(app).post('/api/auth/signup').send({
        username: 'mockuser',
        email: 'mock@example.com',
        password: 'password123',
      });

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toContain('The custom_username you entered is already in use');
      mockSave.mockRestore();
    });

    it('should return 409 Conflict for DocumentDB formatted E11000 duplicate key error (without keyValue)', async () => {
      const mockSave = vi.spyOn(User.prototype, 'save').mockImplementationOnce(() => {
        const err = new Error('E11000 duplicate key error collection: test.users index: custom_email_1 dup key');
        err.code = 11000;
        // Specifically testing the fallback when keyValue is omitted
        throw err;
      });

      const res = await request(app).post('/api/auth/signup').send({
        username: 'mockuser2',
        email: 'mock2@example.com',
        password: 'password123',
      });

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toContain('The custom_email you entered is already in use');
      mockSave.mockRestore();
    });
  });

  describe('POST /api/auth/signin', () => {
    it('should return 404 if user not found', async () => {
      const res = await request(app).post('/api/auth/signin').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('should return 401 on wrong password', async () => {
      await request(app).post('/api/auth/signup').send({
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password123',
      });

      const res = await request(app).post('/api/auth/signin').send({
        email: 'test2@example.com',
        password: 'wrongpassword',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('wrong credentials');
    });

    it('should return 200 and token on success', async () => {
      await request(app).post('/api/auth/signup').send({
        username: 'testuser3',
        email: 'test3@example.com',
        password: 'password123',
      });

      const res = await request(app).post('/api/auth/signin').send({
        email: 'test3@example.com',
        password: 'password123',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.username).toBe('testuser3');
      expect(res.body.password).toBeUndefined();
      
      // Cookie parsing check
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeTruthy();
      expect(cookies[0]).toContain('access_token=');
    });
  });

  describe('GET /api/auth/signout', () => {
    it('should clear cookie and return 200', async () => {
      const res = await request(app).get('/api/auth/signout');
      expect(res.statusCode).toBe(200);
      expect(res.body).toBe('Signout success!');
      
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeTruthy();
      expect(cookies[0]).toContain('access_token=;'); // Checking for cleared cookie
    });
  });
});
