// =============================================================================
// Unit Tests — Redux User Slice
//
// Tests all reducer actions in userSlice.js to validate state transitions.
// These are pure function tests (no DOM, no React) — the backbone of coverage.
// =============================================================================
import { describe, it, expect } from 'vitest';
import userReducer, {
  signInStart,
  signInSuccess,
  signInFailure,
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  deleteUserFailure,
  signOut,
} from '../redux/user/userSlice';

const initialState = {
  currentUser: null,
  loading: false,
  error: false,
};

const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  username: 'testuser',
  email: 'test@example.com',
  profilePicture: 'https://example.com/avatar.png',
};

describe('userSlice', () => {
  // ── Sign In ─────────────────────────────────────────────────────────────
  it('should return the initial state', () => {
    expect(userReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle signInStart', () => {
    const state = userReducer(initialState, signInStart());
    expect(state.loading).toBe(true);
    expect(state.currentUser).toBeNull();
  });

  it('should handle signInSuccess', () => {
    const state = userReducer(
      { ...initialState, loading: true },
      signInSuccess(mockUser)
    );
    expect(state.currentUser).toEqual(mockUser);
    expect(state.loading).toBe(false);
    expect(state.error).toBe(false);
  });

  it('should handle signInFailure', () => {
    const error = { message: 'Invalid credentials' };
    const state = userReducer(
      { ...initialState, loading: true },
      signInFailure(error)
    );
    expect(state.loading).toBe(false);
    expect(state.error).toEqual(error);
    expect(state.currentUser).toBeNull();
  });

  // ── Update User ─────────────────────────────────────────────────────────
  it('should handle updateUserStart', () => {
    const state = userReducer(
      { ...initialState, currentUser: mockUser },
      updateUserStart()
    );
    expect(state.loading).toBe(true);
    expect(state.currentUser).toEqual(mockUser);
  });

  it('should handle updateUserSuccess', () => {
    const updatedUser = { ...mockUser, username: 'updateduser' };
    const state = userReducer(
      { ...initialState, currentUser: mockUser, loading: true },
      updateUserSuccess(updatedUser)
    );
    expect(state.currentUser.username).toBe('updateduser');
    expect(state.loading).toBe(false);
    expect(state.error).toBe(false);
  });

  it('should handle updateUserFailure', () => {
    const error = { message: 'Update failed' };
    const state = userReducer(
      { ...initialState, currentUser: mockUser, loading: true },
      updateUserFailure(error)
    );
    expect(state.loading).toBe(false);
    expect(state.error).toEqual(error);
    expect(state.currentUser).toEqual(mockUser); // user preserved on failure
  });

  // ── Delete User ─────────────────────────────────────────────────────────
  it('should handle deleteUserStart', () => {
    const state = userReducer(
      { ...initialState, currentUser: mockUser },
      deleteUserStart()
    );
    expect(state.loading).toBe(true);
  });

  it('should handle deleteUserSuccess', () => {
    const state = userReducer(
      { ...initialState, currentUser: mockUser, loading: true },
      deleteUserSuccess()
    );
    expect(state.currentUser).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBe(false);
  });

  it('should handle deleteUserFailure', () => {
    const error = { message: 'Delete failed' };
    const state = userReducer(
      { ...initialState, currentUser: mockUser, loading: true },
      deleteUserFailure(error)
    );
    expect(state.loading).toBe(false);
    expect(state.error).toEqual(error);
  });

  // ── Sign Out ────────────────────────────────────────────────────────────
  it('should handle signOut', () => {
    const state = userReducer(
      { currentUser: mockUser, loading: false, error: false },
      signOut()
    );
    expect(state.currentUser).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBe(false);
  });

  // ── Edge cases ──────────────────────────────────────────────────────────
  it('should handle sequential sign-in flows (start → failure → start → success)', () => {
    let state = userReducer(initialState, signInStart());
    expect(state.loading).toBe(true);

    state = userReducer(state, signInFailure({ message: 'wrong password' }));
    expect(state.loading).toBe(false);
    expect(state.error.message).toBe('wrong password');

    state = userReducer(state, signInStart());
    expect(state.loading).toBe(true);

    state = userReducer(state, signInSuccess(mockUser));
    expect(state.currentUser).toEqual(mockUser);
    expect(state.error).toBe(false);
  });
});
