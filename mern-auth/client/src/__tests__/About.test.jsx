// =============================================================================
// Component Tests — About Page
// =============================================================================
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import About from '../pages/About';

describe('About Page', () => {
  it('renders the About heading', () => {
    render(<About />);
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('describes the MERN stack', () => {
    render(<About />);
    expect(
      screen.getByText(/MongoDB, Express, React, Node\.js/i)
    ).toBeInTheDocument();
  });

  it('mentions authentication features', () => {
    render(<About />);
    expect(screen.getByText(/sign up, log in, and log out/i)).toBeInTheDocument();
  });

  it('mentions JWT authentication', () => {
    render(<About />);
    expect(
      screen.getByText(/JSON Web Tokens \(JWT\)/i)
    ).toBeInTheDocument();
  });
});
