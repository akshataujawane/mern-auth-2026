// =============================================================================
// Component Tests — Home Page
// =============================================================================
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '../pages/Home';

describe('Home Page', () => {
  it('renders the welcome heading', () => {
    render(<Home />);
    expect(screen.getByText(/Welcome to my Auth App!/i)).toBeInTheDocument();
  });

  it('renders description paragraphs', () => {
    render(<Home />);
    expect(screen.getAllByText(/full-stack web application/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/MERN.*stack/i)[0]).toBeInTheDocument();
  });

  it('mentions key technologies', () => {
    render(<Home />);
    expect(screen.getAllByText(/MongoDB/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/React/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Node\.js/i)[0]).toBeInTheDocument();
  });

  it('renders the template invitation paragraph', () => {
    render(<Home />);
    expect(
      screen.getByText(/starting point for building full-stack/i)
    ).toBeInTheDocument();
  });
});
