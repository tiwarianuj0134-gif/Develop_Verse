import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BoardErrorBoundary from './BoardErrorBoundary';

// Mock the utils module
jest.mock('../../lib/utils', () => ({
  sanitizeErrorMessage: jest.fn((message: string) => message)
}));

// Component that throws an error for testing
const ThrowError = ({ shouldThrow, errorMessage }: { shouldThrow: boolean; errorMessage?: string }) => {
  if (shouldThrow) {
    throw new Error(errorMessage || 'Test board error');
  }
  return <div>Board working normally</div>;
};

describe('BoardErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <BoardErrorBoundary>
        <div>Board component working</div>
      </BoardErrorBoundary>
    );

    expect(screen.getByText('Board component working')).toBeInTheDocument();
  });

  it('displays board error UI when child component throws', () => {
    render(
      <BoardErrorBoundary>
        <ThrowError shouldThrow={true} />
      </BoardErrorBoundary>
    );

    expect(screen.getByText('Chess Board Error')).toBeInTheDocument();
    expect(screen.getByText(/The chess board encountered an unexpected error/)).toBeInTheDocument();
  });

  it('detects rendering errors correctly', () => {
    render(
      <BoardErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Cannot render component" />
      </BoardErrorBoundary>
    );

    expect(screen.getByText('Board Display Error')).toBeInTheDocument();
    expect(screen.getByText(/The chess board display encountered a rendering error/)).toBeInTheDocument();
  });

  it('detects move validation errors correctly', () => {
    render(
      <BoardErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Invalid chess move detected" />
      </BoardErrorBoundary>
    );

    expect(screen.getByText('Move Validation Error')).toBeInTheDocument();
    expect(screen.getByText(/A move validation error occurred/)).toBeInTheDocument();
  });

  it('detects drag and drop errors correctly', () => {
    render(
      <BoardErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Drag event handler failed" />
      </BoardErrorBoundary>
    );

    expect(screen.getByText('Interaction Error')).toBeInTheDocument();
    expect(screen.getByText(/An interaction error occurred while moving pieces/)).toBeInTheDocument();
  });

  it('calls onResetBoard when Reset Board Display button is clicked', () => {
    const onResetBoard = jest.fn();
    render(
      <BoardErrorBoundary onResetBoard={onResetBoard}>
        <ThrowError shouldThrow={true} />
      </BoardErrorBoundary>
    );

    fireEvent.click(screen.getByText('Reset Board Display'));
    expect(onResetBoard).toHaveBeenCalled();
  });

  it('calls onRestartGame when Restart Game button is clicked', () => {
    const onRestartGame = jest.fn();
    render(
      <BoardErrorBoundary onRestartGame={onRestartGame}>
        <ThrowError shouldThrow={true} />
      </BoardErrorBoundary>
    );

    fireEvent.click(screen.getByText('Restart Game'));
    expect(onRestartGame).toHaveBeenCalled();
  });

  it('displays fallback board with light theme', () => {
    render(
      <BoardErrorBoundary theme="light">
        <ThrowError shouldThrow={true} />
      </BoardErrorBoundary>
    );

    // Should render fallback board with light theme colors
    const boardContainer = screen.getByText('Board Error').closest('.absolute')?.previousSibling;
    expect(boardContainer).toHaveClass('border-amber-900');
  });

  it('displays fallback board with dark theme', () => {
    render(
      <BoardErrorBoundary theme="dark">
        <ThrowError shouldThrow={true} />
      </BoardErrorBoundary>
    );

    // Should render fallback board with dark theme colors
    const boardContainer = screen.getByText('Board Error').closest('.absolute')?.previousSibling;
    expect(boardContainer).toHaveClass('border-slate-900');
  });

  it('preserves current position information', () => {
    const testPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    render(
      <BoardErrorBoundary currentPosition={testPosition}>
        <ThrowError shouldThrow={true} />
      </BoardErrorBoundary>
    );

    expect(screen.getByText(/Game position preserved:/)).toBeInTheDocument();
    expect(screen.getByText(/rnbqkbnr\/pppppppp\/8\/8\/8\/8\/PPPPPPPP\/RNBQKBNR/)).toBeInTheDocument();
  });

  it('displays appropriate recovery instructions for different error types', () => {
    const errorTypes = [
      { 
        message: 'render failed', 
        instruction: 'Try refreshing the board display or switching themes.' 
      },
      { 
        message: 'invalid move', 
        instruction: 'Try making a different move or reset the board if the position seems incorrect.' 
      },
      { 
        message: 'drag failed', 
        instruction: 'Try using click-to-move instead of drag-and-drop.' 
      }
    ];

    errorTypes.forEach(({ message, instruction }) => {
      const { unmount } = render(
        <BoardErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage={message} />
        </BoardErrorBoundary>
      );

      expect(screen.getByText(instruction)).toBeInTheDocument();
      unmount();
    });
  });

  it('shows chess king icon', () => {
    render(
      <BoardErrorBoundary>
        <ThrowError shouldThrow={true} />
      </BoardErrorBoundary>
    );

    expect(screen.getByText('♔')).toBeInTheDocument();
  });

  it('displays error timestamp', () => {
    render(
      <BoardErrorBoundary>
        <ThrowError shouldThrow={true} />
      </BoardErrorBoundary>
    );

    expect(screen.getByText(/Error type:.*Time:/)).toBeInTheDocument();
  });

  it('shows all recovery buttons when callbacks are provided', () => {
    const onResetBoard = jest.fn();
    const onRestartGame = jest.fn();
    
    render(
      <BoardErrorBoundary onResetBoard={onResetBoard} onRestartGame={onRestartGame}>
        <ThrowError shouldThrow={true} />
      </BoardErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Reset Board Display')).toBeInTheDocument();
    expect(screen.getByText('Restart Game')).toBeInTheDocument();
  });

  it('hides optional buttons when callbacks are not provided', () => {
    render(
      <BoardErrorBoundary>
        <ThrowError shouldThrow={true} />
      </BoardErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.queryByText('Reset Board Display')).not.toBeInTheDocument();
    expect(screen.queryByText('Restart Game')).not.toBeInTheDocument();
  });

  it('resets error state when Try Again is clicked', () => {
    const { rerender } = render(
      <BoardErrorBoundary>
        <ThrowError shouldThrow={true} />
      </BoardErrorBoundary>
    );

    expect(screen.getByText('Chess Board Error')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Try Again'));

    rerender(
      <BoardErrorBoundary>
        <ThrowError shouldThrow={false} />
      </BoardErrorBoundary>
    );

    expect(screen.getByText('Board working normally')).toBeInTheDocument();
  });

  it('renders fallback board with 8x8 grid', () => {
    render(
      <BoardErrorBoundary>
        <ThrowError shouldThrow={true} />
      </BoardErrorBoundary>
    );

    // Should render 8 rows of 8 squares each (64 total squares)
    const squares = screen.getAllByRole('generic').filter(el => 
      el.className.includes('w-12') && el.className.includes('h-12')
    );
    expect(squares).toHaveLength(64);
  });

  it('displays error overlay on fallback board', () => {
    render(
      <BoardErrorBoundary>
        <ThrowError shouldThrow={true} />
      </BoardErrorBoundary>
    );

    expect(screen.getByText('Board Error')).toBeInTheDocument();
  });

  it('handles different error message types', () => {
    const errorMessages = [
      'DOM manipulation failed',
      'Chess position invalid',
      'Mouse event error',
      'Unknown board error'
    ];

    errorMessages.forEach((message) => {
      const { unmount } = render(
        <BoardErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage={message} />
        </BoardErrorBoundary>
      );

      expect(screen.getByText(/Chess Board Error|Board Display Error|Move Validation Error|Interaction Error/)).toBeInTheDocument();
      unmount();
    });
  });
});