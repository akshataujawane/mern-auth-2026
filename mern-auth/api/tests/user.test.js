import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';

describe('User API Routes', () => {

  it('GET /api/user/ should return standard message', async () => {
    const res = await request(app).get('/api/user/');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('API is working!');
  });

  describe('Protected Routes (verifyUser middleware)', () => {
    let token = '';
    let userId = '';

    // Create a real user and sign in to get a valid token cookie before each test
    beforeEach(async () => {
      await request(app).post('/api/auth/signup').send({
        username: 'protecteduser',
        email: 'protected@example.com',
        password: 'password123',
      });

      const res = await request(app).post('/api/auth/signin').send({
        email: 'protected@example.com',
        password: 'password123',
      });
      
      userId = res.body._id;

      const cookies = res.headers['set-cookie'];
      const tokenString = cookies.find(c => c.startsWith('access_token='));
      token = tokenString.split(';')[0];
    });

    it('should return 401 if no token provided', async () => {
      const res = await request(app).post(`/api/user/update/${userId}`).send({
        username: 'newusername'
      });
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('You are not authenticated!');
    });

    it('should return 403 if token is invalid', async () => {
      const res = await request(app)
        .post(`/api/user/update/${userId}`)
        .set('Cookie', ['access_token=invalidtoken123'])
        .send({ username: 'newusername' });
      
      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('Token is not valid!');
    });

    it('should return 401 if trying to update another users account', async () => {
      const wrongId = '65239b9abcd1234567890def';
      const res = await request(app)
        .post(`/api/user/update/${wrongId}`)
        .set('Cookie', [token])
        .send({ username: 'newusername' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('You can update only your account!');
    });

    it('should update user successfully when authenticated and authorized', async () => {
      const res = await request(app)
        .post(`/api/user/update/${userId}`)
        .set('Cookie', [token])
        .send({ 
            username: 'updateduser',
            password: 'newpassword123',
            profilePicture: 'https://example.com/pic.jpg'
        });

      if (res.statusCode !== 200) console.error(res.body);
      expect(res.statusCode).toBe(200);
      expect(res.body.username).toBe('updateduser');
      expect(res.body.profilePicture).toBe('https://example.com/pic.jpg');

      const dbUser = await User.findById(userId);
      expect(dbUser.username).toBe('updateduser');
      expect(bcryptjs.compareSync('newpassword123', dbUser.password)).toBe(true);
    });

    it('should return 401 if trying to delete another users account', async () => {
        const wrongId = '65239b9abcd1234567890def';
        const res = await request(app)
          .delete(`/api/user/delete/${wrongId}`)
          .set('Cookie', [token]);
  
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('You can delete only your account!');
    });

    it('should delete user successfully', async () => {
        const res = await request(app)
          .delete(`/api/user/delete/${userId}`)
          .set('Cookie', [token]);
  
        expect(res.statusCode).toBe(200);
        expect(res.body).toBe('User has been deleted...');
  
        const dbUser = await User.findById(userId);
        expect(dbUser).toBeNull();
    });

  });
});
