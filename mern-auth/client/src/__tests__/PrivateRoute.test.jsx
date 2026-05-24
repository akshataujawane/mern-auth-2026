// =============================================================================
// Component Tests — PrivateRoute
// =============================================================================
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import userReducer from '../redux/user/userSlice';
import PrivateRoute from '../components/PrivateRoute';

const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  username: 'testuser',
  email: 'test@example.com',
  profilePicture: 'https://example.com/avatar.png',
};

function createTestStore(currentUser = null) {
  return configureStore({
    reducer: { user: userReducer },
    preloadedState: {
      user: { currentUser, loading: false, error: false },
    },
  });
}

function renderPrivateRoute(currentUser = null) {
  const store = createTestStore(currentUser);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path='/profile' element={<div>Protected Content</div>} />
          </Route>
          <Route path='/sign-in' element={<div>Sign In Page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('PrivateRoute', () => {
  it('redirects to /sign-in when user is not logged in', () => {
    renderPrivateRoute(null);
    expect(screen.getByText('Sign In Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders the protected route when user is logged in', () => {
    renderPrivateRoute(mockUser);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Sign In Page')).not.toBeInTheDocument();
  });
});
