// =============================================================================
// Component Tests — SignUp Page
// =============================================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignUp from '../pages/SignUp';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

function renderSignUp() {
  return render(
    <MemoryRouter>
      <SignUp />
    </MemoryRouter>
  );
}

describe('SignUp Page', () => {
  it('renders the Sign Up heading', () => {
    renderSignUp();
    expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
  });

  it('renders username, email, and password inputs', () => {
    renderSignUp();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('renders the Sign In link', () => {
    renderSignUp();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('updates form fields on change', () => {
    renderSignUp();
    const usernameInput = screen.getByPlaceholderText('Username');
    fireEvent.change(usernameInput, { target: { id: 'username', value: 'testuser' } });
    expect(usernameInput.value).toBe('testuser');
  });

  it('navigates to /sign-in on successful sign up', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ message: 'User created successfully' }),
    });
    renderSignUp();
    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { id: 'username', value: 'testuser' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { id: 'email', value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { id: 'password', value: 'password123' },
    });
    fireEvent.submit(screen.getByRole('button').closest('form'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/sign-in'));
  });

  it('shows error when API returns success: false', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ success: false, message: 'Email already in use' }),
    });
    renderSignUp();
    fireEvent.submit(screen.getByRole('button').closest('form'));
    await waitFor(() =>
      expect(screen.getByText('Email already in use')).toBeInTheDocument()
    );
  });

  it('shows error on fetch network failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    renderSignUp();
    fireEvent.submit(screen.getByRole('button').closest('form'));
    await waitFor(() =>
      expect(screen.getByText('Network error or server is unreachable. Please try again.')).toBeInTheDocument()
    );
  });

  it('shows loading state while submitting', async () => {
    let resolve;
    global.fetch.mockReturnValueOnce(new Promise((r) => { resolve = r; }));
    renderSignUp();
    fireEvent.submit(screen.getByRole('button').closest('form'));
    expect(screen.getByRole('button')).toHaveTextContent('Loading...');
    expect(screen.getByRole('button')).toBeDisabled();
    resolve({ json: async () => ({}) });
  });
});
