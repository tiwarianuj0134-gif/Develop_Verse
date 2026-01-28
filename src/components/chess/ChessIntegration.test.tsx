import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ChessPage from '../ChessPage';

// Mock the Convex hooks
vi.mock('convex/react', () => ({
  useQuery: vi.fn(() => null),
  useMutation: vi.fn(() => vi.fn()),
  useAction: vi.fn(() => vi.fn()),
}));

describe('Chess Game Integration', () => {
  it('renders chess page with EduVerse styling', () => {
    render(<ChessPage />);
    
    // Check for main heading
    expect(screen.getByText(/Chess with AI/i)).toBeInTheDocument();
    
    // Check for EduVerse branding elements
    expect(screen.getByText(/EduVerse Chess Academy/i)).toBeInTheDocument();
    
    // Check for educational benefits section
    expect(screen.getByText(/Educational Benefits/i)).toBeInTheDocument();
    
    // Check for responsive design elements
    expect(screen.getByText(/Strategic Thinking/i)).toBeInTheDocument();
    expect(screen.getByText(/Quick Decision/i)).toBeInTheDocument();
    expect(screen.getByText(/Pattern Recognition/i)).toBeInTheDocument();
    expect(screen.getByText(/Concentration/i)).toBeInTheDocument();
  });

  it('displays proper navigation integration elements', () => {
    render(<ChessPage />);
    
    // Check for chess-specific icons and branding
    expect(screen.getByText('♟️')).toBeInTheDocument();
    expect(screen.getByText('🤖')).toBeInTheDocument();
    expect(screen.getByText('🇮🇳')).toBeInTheDocument();
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('includes mobile-responsive design elements', () => {
    render(<ChessPage />);
    
    // Check for responsive text sizing classes in the DOM
    const heading = screen.getByText(/Chess with AI/i);
    expect(heading).toHaveClass('text-2xl', 'sm:text-3xl', 'lg:text-4xl');
  });
});