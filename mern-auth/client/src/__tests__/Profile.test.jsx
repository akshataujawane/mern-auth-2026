// =============================================================================
// Component Tests — Profile Page
// =============================================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import userReducer from '../redux/user/userSlice';
import Profile from '../pages/Profile';

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  username: 'testuser',
  email: 'test@example.com',
  profilePicture: 'https://example.com/avatar.png',
};

function createTestStore(overrides = {}) {
  return configureStore({
    reducer: { user: userReducer },
    preloadedState: {
      user: { currentUser: mockUser, loading: false, error: false, ...overrides },
    },
  });
}

function renderProfile(stateOverrides = {}) {
  const store = createTestStore(stateOverrides);
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      </Provider>
    ),
  };
}

describe('Profile Page', () => {
  it('renders the Profile heading', () => {
    renderProfile();
    expect(screen.getByRole('heading', { name: /profile/i })).toBeInTheDocument();
  });

  it('renders profile picture', () => {
    renderProfile();
    const img = screen.getByAltText('profile');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', mockUser.profilePicture);
  });

  it('pre-fills username and email from current user', () => {
    renderProfile();
    expect(screen.getByDisplayValue(mockUser.username)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockUser.email)).toBeInTheDocument();
  });

  it('renders Update, Delete Account, and Sign out buttons', () => {
    renderProfile();
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('shows loading state on Update button while updating', () => {
    renderProfile({ loading: true });
    expect(screen.getByRole('button', { name: /loading/i })).toBeInTheDocument();
  });

  it('shows success message after successful update', async () => {
    const updatedUser = { ...mockUser, username: 'updateduser' };
    global.fetch.mockResolvedValueOnce({
      json: async () => updatedUser,
    });
    renderProfile();
    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { id: 'username', value: 'updateduser' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /update/i }).closest('form'));
    await waitFor(() =>
      expect(screen.getByText('User is updated successfully!')).toBeInTheDocument()
    );
  });

  it('dispatches updateUserFailure when API returns success: false on update', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ success: false, message: 'Update failed' }),
    });
    const { store } = renderProfile();
    fireEvent.submit(screen.getByRole('button', { name: /update/i }).closest('form'));
    await waitFor(() => {
      const state = store.getState().user;
      expect(state.error).toBeTruthy();
    });
  });

  it('shows error message when store error is set', () => {
    renderProfile({ error: true });
    expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
  });

  it('dispatches deleteUserSuccess and clears user on successful delete', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({}),
    });
    const { store } = renderProfile();
    fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
    await waitFor(() => {
      const state = store.getState().user;
      expect(state.currentUser).toBeNull();
    });
  });

  it('dispatches deleteUserFailure when delete API returns success: false', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ success: false, message: 'Delete failed' }),
    });
    const { store } = renderProfile();
    fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
    await waitFor(() => {
      const state = store.getState().user;
      expect(state.error).toBeTruthy();
    });
  });

  it('dispatches signOut and clears user on sign out', async () => {
    global.fetch.mockResolvedValueOnce({ json: async () => ({}) });
    const { store } = renderProfile();
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    await waitFor(() => {
      const state = store.getState().user;
      expect(state.currentUser).toBeNull();
    });
  });

  it('dispatches updateUserFailure on network error during update', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    const { store } = renderProfile();
    fireEvent.submit(screen.getByRole('button', { name: /update/i }).closest('form'));
    await waitFor(() => {
      const state = store.getState().user;
      expect(state.error).toBeTruthy();
    });
  });

  it('dispatches deleteUserFailure on network error during delete', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    const { store } = renderProfile();
    fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
    await waitFor(() => {
      const state = store.getState().user;
      expect(state.error).toBeTruthy();
    });
  });

  it('handles signout fetch failure gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    const { store } = renderProfile();
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    // User should remain signed in when signout fetch fails
    await waitFor(() => {
      const state = store.getState().user;
      expect(state.currentUser).not.toBeNull();
    });
  });
});
