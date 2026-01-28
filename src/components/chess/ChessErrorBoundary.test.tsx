import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChessErrorBoundary from './ChessErrorBoundary';

// Mock the utils module
jest.mock('../../lib/utils', () => ({
  sanitizeErrorMessage: jest.fn((message: string) => message)
}));

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

describe('ChessErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    render(
      <ChessErrorBoundary section="game">
        <div>Test content</div>
      </ChessErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('displays error UI when child component throws', () => {
    render(
      <ChessErrorBoundary section="game">
        <ThrowError shouldThrow={true} />
      </ChessErrorBoundary>
    );

    expect(screen.getByText('Chess Game Error')).toBeInTheDocument();
    expect(screen.getByText(/The chess game encountered an error/)).toBeInTheDocument();
  });

  it('displays section-specific error messages', () => {
    render(
      <ChessErrorBoundary section="board">
        <ThrowError shouldThrow={true} />
      </ChessErrorBoundary>
    );

    expect(screen.getByText('Chess Board Error')).toBeInTheDocument();
    expect(screen.getByText(/The chess board display encountered an error/)).toBeInTheDocument();
  });

  it('displays AI-specific error messages', () => {
    render(
      <ChessErrorBoundary section="ai">
        <ThrowError shouldThrow={true} />
      </ChessErrorBoundary>
    );

    expect(screen.getByText('AI Opponent Error')).toBeInTheDocument();
    expect(screen.getByText(/The AI opponent encountered an error/)).toBeInTheDocument();
  });

  it('displays controls-specific error messages', () => {
    render(
      <ChessErrorBoundary section="controls">
        <ThrowError shouldThrow={true} />
      </ChessErrorBoundary>
    );

    expect(screen.getByText('Game Controls Error')).toBeInTheDocument();
    expect(screen.getByText(/The game controls encountered an error/)).toBeInTheDocument();
  });

  it('displays persistence-specific error messages', () => {
    render(
      <ChessErrorBoundary section="persistence">
        <ThrowError shouldThrow={true} />
      </ChessErrorBoundary>
    );

    expect(screen.getByText('Game Save/Load Error')).toBeInTheDocument();
    expect(screen.getByText(/Game save\/load functionality encountered an error/)).toBeInTheDocument();
  });

  it('calls onReset when Try Again button is clicked', () => {
    const onReset = jest.fn();
    render(
      <ChessErrorBoundary section="game" onReset={onReset}>
        <ThrowError shouldThrow={true} />
      </ChessErrorBoundary>
    );

    fireEvent.click(screen.getByText('Try Again'));
    expect(onReset).toHaveBeenCalled();
  });

  it('calls onRestart when Start New Game button is clicked', () => {
    const onRestart = jest.fn();
    render(
      <ChessErrorBoundary section="game" onRestart={onRestart}>
        <ThrowError shouldThrow={true} />
      </ChessErrorBoundary>
    );

    fireEvent.click(screen.getByText('Start New Game'));
    expect(onRestart).toHaveBeenCalled();
  });

  it('shows appropriate recovery options for game section', () => {
    const onReset = jest.fn();
    const onRestart = jest.fn();
    
    render(
      <ChessErrorBoundary section="game" onReset={onReset} onRestart={onRestart}>
        <ThrowError shouldThrow={true} />
      </ChessErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Reset Current Game')).toBeInTheDocument();
    expect(screen.getByText('Start New Game')).toBeInTheDocument();
  });

  it('shows appropriate recovery options for AI section', () => {
    const onRestart = jest.fn();
    
    render(
      <ChessErrorBoundary section="ai" onRestart={onRestart}>
        <ThrowError shouldThrow={true} />
      </ChessErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Continue Without AI')).toBeInTheDocument();
    expect(screen.getByText('Restart Game')).toBeInTheDocument();
  });

  it('shows appropriate recovery options for persistence section', () => {
    render(
      <ChessErrorBoundary section="persistence">
        <ThrowError shouldThrow={true} />
      </ChessErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Continue Without Saving')).toBeInTheDocument();
  });

  it('displays error ID for support', () => {
    render(
      <ChessErrorBoundary section="game">
        <ThrowError shouldThrow={true} />
      </ChessErrorBoundary>
    );

    expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
  });

  it('uses custom fallback component when provided', () => {
    const CustomFallback = ({ error, resetError, section }: any) => (
      <div>
        Custom fallback for {section}: {error.message}
        <button onClick={resetError}>Custom Reset</button>
      </div>
    );

    render(
      <ChessErrorBoundary section="game" fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ChessErrorBoundary>
    );

    expect(screen.getByText('Custom fallback for game: Test error message')).toBeInTheDocument();
    expect(screen.getByText('Custom Reset')).toBeInTheDocument();
  });

  it('resets error state when resetError is called', () => {
    const { rerender } = render(
      <ChessErrorBoundary section="game">
        <ThrowError shouldThrow={true} />
      </ChessErrorBoundary>
    );

    expect(screen.getByText('Chess Game Error')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Try Again'));

    rerender(
      <ChessErrorBoundary section="game">
        <ThrowError shouldThrow={false} />
      </ChessErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('displays appropriate section icons', () => {
    const sections = [
      { section: 'game', icon: '♟️' },
      { section: 'board', icon: '♔' },
      { section: 'controls', icon: '🎮' },
      { section: 'ai', icon: '🤖' },
      { section: 'persistence', icon: '💾' }
    ];

    sections.forEach(({ section, icon }) => {
      const { unmount } = render(
        <ChessErrorBoundary section={section as any}>
          <ThrowError shouldThrow={true} />
        </ChessErrorBoundary>
      );

      expect(screen.getByText(icon)).toBeInTheDocument();
      unmount();
    });
  });
});