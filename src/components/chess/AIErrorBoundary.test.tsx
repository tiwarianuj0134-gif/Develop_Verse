import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIErrorBoundary from './AIErrorBoundary';

// Mock the utils module
jest.mock('../../lib/utils', () => ({
  sanitizeErrorMessage: jest.fn((message: string) => message)
}));

// Component that throws an error for testing
const ThrowError = ({ shouldThrow, errorMessage }: { shouldThrow: boolean; errorMessage?: string }) => {
  if (shouldThrow) {
    throw new Error(errorMessage || 'Test AI error');
  }
  return <div>AI working normally</div>;
};

describe('AIErrorBoundary', () => {
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
      <AIErrorBoundary>
        <div>AI component working</div>
      </AIErrorBoundary>
    );

    expect(screen.getByText('AI component working')).toBeInTheDocument();
  });

  it('displays AI error UI when child component throws', () => {
    render(
      <AIErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AIErrorBoundary>
    );

    expect(screen.getByText('AI Opponent Error')).toBeInTheDocument();
    expect(screen.getByText(/The AI opponent encountered an unexpected error/)).toBeInTheDocument();
  });

  it('detects network errors correctly', () => {
    render(
      <AIErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Network connection failed" />
      </AIErrorBoundary>
    );

    expect(screen.getByText('Connection Error')).toBeInTheDocument();
    expect(screen.getByText(/Unable to connect to the AI service/)).toBeInTheDocument();
  });

  it('detects AI service errors correctly', () => {
    render(
      <AIErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Gemini API quota exceeded" />
      </AIErrorBoundary>
    );

    expect(screen.getByText('AI Service Error')).toBeInTheDocument();
    expect(screen.getByText(/The AI service is temporarily unavailable/)).toBeInTheDocument();
  });

  it('calls onRetryAI when Retry AI Move button is clicked', () => {
    const onRetryAI = jest.fn();
    render(
      <AIErrorBoundary onRetryAI={onRetryAI}>
        <ThrowError shouldThrow={true} />
      </AIErrorBoundary>
    );

    fireEvent.click(screen.getByText('Retry AI Move'));
    expect(onRetryAI).toHaveBeenCalled();
  });

  it('calls onContinueWithoutAI when Continue Without AI button is clicked', () => {
    const onContinueWithoutAI = jest.fn();
    render(
      <AIErrorBoundary onContinueWithoutAI={onContinueWithoutAI}>
        <ThrowError shouldThrow={true} />
      </AIErrorBoundary>
    );

    fireEvent.click(screen.getByText('Continue Without AI'));
    expect(onContinueWithoutAI).toHaveBeenCalled();
  });

  it('calls onRestartGame when Restart Game button is clicked', () => {
    const onRestartGame = jest.fn();
    render(
      <AIErrorBoundary onRestartGame={onRestartGame}>
        <ThrowError shouldThrow={true} />
      </AIErrorBoundary>
    );

    fireEvent.click(screen.getByText('Restart Game'));
    expect(onRestartGame).toHaveBeenCalled();
  });

  it('displays AI service status when provided', () => {
    const aiServiceStatus = {
      status: 'error',
      message: 'Gemini API is down for maintenance',
      canRetry: true,
      fallbackAvailable: true
    };

    render(
      <AIErrorBoundary aiServiceStatus={aiServiceStatus}>
        <ThrowError shouldThrow={true} />
      </AIErrorBoundary>
    );

    expect(screen.getByText('Status: Gemini API is down for maintenance')).toBeInTheDocument();
  });

  it('displays fallback status correctly', () => {
    const aiServiceStatus = {
      status: 'fallback',
      message: 'Using local AI fallback',
      canRetry: true,
      fallbackAvailable: true
    };

    render(
      <AIErrorBoundary aiServiceStatus={aiServiceStatus}>
        <ThrowError shouldThrow={true} />
      </AIErrorBoundary>
    );

    expect(screen.getByText('Status: Using local AI fallback')).toBeInTheDocument();
  });

  it('shows thinking indicator when AI is processing', () => {
    render(
      <AIErrorBoundary isAIThinking={true}>
        <ThrowError shouldThrow={true} />
      </AIErrorBoundary>
    );

    // The error boundary should still show even when AI is thinking
    expect(screen.getByText('AI Opponent Error')).toBeInTheDocument();
  });

  it('hides retry button when service cannot retry', () => {
    const aiServiceStatus = {
      status: 'error',
      message: 'Permanent API failure',
      canRetry: false,
      fallbackAvailable: true
    };

    render(
      <AIErrorBoundary aiServiceStatus={aiServiceStatus}>
        <ThrowError shouldThrow={true} />
      </AIErrorBoundary>
    );

    expect(screen.queryByText('Retry AI Move')).not.toBeInTheDocument();
  });

  it('hides continue without AI button when fallback is not available', () => {
    const aiServiceStatus = {
      status: 'error',
      message: 'No fallback available',
      canRetry: true,
      fallbackAvailable: false
    };

    render(
      <AIErrorBoundary aiServiceStatus={aiServiceStatus}>
        <ThrowError shouldThrow={true} />
      </AIErrorBoundary>
    );

    expect(screen.queryByText('Continue Without AI')).not.toBeInTheDocument();
  });

  it('displays error count for repeated failures', () => {
    const { rerender } = render(
      <AIErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AIErrorBoundary>
    );

    // Simulate multiple errors by re-rendering with different error messages
    rerender(
      <AIErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Second error" />
      </AIErrorBoundary>
    );

    expect(screen.getByText(/Error occurred .* times/)).toBeInTheDocument();
  });

  it('shows AI robot icon', () => {
    render(
      <AIErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AIErrorBoundary>
    );

    expect(screen.getByText('🤖')).toBeInTheDocument();
  });

  it('resets error state when resetError is called', () => {
    const { rerender } = render(
      <AIErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AIErrorBoundary>
    );

    expect(screen.getByText('AI Opponent Error')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Dismiss Error'));

    rerender(
      <AIErrorBoundary>
        <ThrowError shouldThrow={false} />
      </AIErrorBoundary>
    );

    expect(screen.getByText('AI working normally')).toBeInTheDocument();
  });

  it('displays retry delay information', () => {
    const aiServiceStatus = {
      status: 'error',
      message: 'Rate limited',
      canRetry: true,
      fallbackAvailable: true,
      retryAfter: 30
    };

    render(
      <AIErrorBoundary aiServiceStatus={aiServiceStatus}>
        <ThrowError shouldThrow={true} />
      </AIErrorBoundary>
    );

    // Should show retry delay information
    expect(screen.getByText(/seconds/)).toBeInTheDocument();
  });

  it('handles different error types with appropriate messages', () => {
    const errorTypes = [
      { message: 'fetch failed', expectedTitle: 'Connection Error' },
      { message: 'timeout error', expectedTitle: 'Connection Error' },
      { message: 'gemini api error', expectedTitle: 'AI Service Error' },
      { message: 'quota exceeded', expectedTitle: 'AI Service Error' },
      { message: 'unknown error', expectedTitle: 'AI Opponent Error' }
    ];

    errorTypes.forEach(({ message, expectedTitle }) => {
      const { unmount } = render(
        <AIErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage={message} />
        </AIErrorBoundary>
      );

      expect(screen.getByText(expectedTitle)).toBeInTheDocument();
      unmount();
    });
  });
});