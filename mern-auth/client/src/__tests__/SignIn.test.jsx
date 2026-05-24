// =============================================================================
// Component Tests — SignIn Page
// =============================================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import userReducer from '../redux/user/userSlice';
import SignIn from '../pages/SignIn';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

function createTestStore(overrides = {}) {
  return configureStore({
    reducer: { user: userReducer },
    preloadedState: {
      user: { currentUser: null, loading: false, error: false, ...overrides },
    },
  });
}

function renderSignIn(stateOverrides = {}) {
  const store = createTestStore(stateOverrides);
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter>
          <SignIn />
        </MemoryRouter>
      </Provider>
    ),
  };
}

describe('SignIn Page', () => {
  it('renders the Sign In heading', () => {
    renderSignIn();
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders email and password inputs', () => {
    renderSignIn();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('renders the Sign Up link', () => {
    renderSignIn();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });

  it('updates form data on input change', () => {
    renderSignIn();
    const emailInput = screen.getByPlaceholderText('Email');
    fireEvent.change(emailInput, { target: { id: 'email', value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');
  });

  it('navigates to / on successful sign in', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ _id: '123', username: 'testuser', email: 'test@example.com' }),
    });
    renderSignIn();
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { id: 'email', value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { id: 'password', value: 'password123' },
    });
    fireEvent.submit(screen.getByRole('button').closest('form'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('does not navigate when API returns success: false', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ success: false, message: 'wrong credentials' }),
    });
    renderSignIn();
    fireEvent.submit(screen.getByRole('button').closest('form'));
    await waitFor(() => expect(mockNavigate).not.toHaveBeenCalled());
  });

  it('does not navigate on network failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network failure'));
    renderSignIn();
    fireEvent.submit(screen.getByRole('button').closest('form'));
    await waitFor(() => expect(mockNavigate).not.toHaveBeenCalled());
  });

  it('shows loading state when store loading is true', () => {
    renderSignIn({ loading: true });
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Loading...');
    expect(button).toBeDisabled();
  });

  it('shows error message from store error state', () => {
    renderSignIn({ error: { message: 'wrong credentials' } });
    expect(screen.getByText('wrong credentials')).toBeInTheDocument();
  });

  it('shows generic message when error has no message property', () => {
    renderSignIn({ error: true });
    expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
  });
});
