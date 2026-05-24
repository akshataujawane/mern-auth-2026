// =============================================================================
// Integration Test — App Component (Router + Redux)
//
// Tests the full App component including React Router and Redux Provider.
// Uses a test-specific Redux store (not the persisted one from main.jsx).
// =============================================================================
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import userReducer from '../redux/user/userSlice';
import Header from '../components/Header';
import Home from '../pages/Home';
import About from '../pages/About';
import SignIn from '../pages/SignIn';

// Helper: create a fresh Redux store for each test
function createTestStore(preloadedState) {
  return configureStore({
    reducer: { user: userReducer },
    preloadedState,
  });
}

// Helper: render with Router + Redux
function renderWithProviders(ui, { route = '/', store } = {}) {
  const testStore = store || createTestStore({ user: { currentUser: null, loading: false, error: false } });
  return render(
    <Provider store={testStore}>
      <MemoryRouter initialEntries={[route]}>
        {ui}
      </MemoryRouter>
    </Provider>
  );
}

describe('Header Component', () => {
  it('renders the app title', () => {
    renderWithProviders(<Header />);
    expect(screen.getByText('Auth App')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderWithProviders(<Header />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('shows Sign In when user is not logged in', () => {
    renderWithProviders(<Header />);
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('shows profile picture when user is logged in', () => {
    const store = createTestStore({
      user: {
        currentUser: {
          username: 'testuser',
          email: 'test@example.com',
          profilePicture: 'https://example.com/profile.jpg',
        },
        loading: false,
        error: false,
      },
    });
    renderWithProviders(<Header />, { store });
    const img = screen.getByAltText('profile');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/profile.jpg');
  });
});

describe('App Routing', () => {
  it('renders Home page on / route', () => {
    renderWithProviders(
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>,
      { route: '/' }
    );
    expect(screen.getByText(/Welcome to my Auth App!/i)).toBeInTheDocument();
  });

  it('renders About page on /about route', () => {
    renderWithProviders(
      <Routes>
        <Route path="/about" element={<About />} />
      </Routes>,
      { route: '/about' }
    );
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('renders SignIn page on /sign-in route', () => {
    renderWithProviders(
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
      </Routes>,
      { route: '/sign-in' }
    );
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });
});
