import React, { useState } from 'react';
import ChessErrorBoundary from './ChessErrorBoundary';
import AIErrorBoundary from './AIErrorBoundary';
import BoardErrorBoundary from './BoardErrorBoundary';

/**
 * ErrorBoundaryDemo Component
 * 
 * A demonstration component that shows how the chess error boundaries work
 * in different scenarios. This component is useful for testing and development
 * to ensure error boundaries are functioning correctly.
 * 
 * This component should be removed in production builds.
 */

interface ErrorComponentProps {
  shouldThrow: boolean;
  errorType: 'render' | 'move' | 'drag' | 'network' | 'ai' | 'generic';
}

const ErrorComponent: React.FC<ErrorComponentProps> = ({ shouldThrow, errorType }) => {
  if (!shouldThrow) {
    return <div className="p-4 bg-green-100 rounded">Component working normally</div>;
  }

  const errorMessages = {
    render: 'Cannot render DOM element',
    move: 'Invalid chess move validation failed',
    drag: 'Drag and drop event handler crashed',
    network: 'Network fetch failed to connect',
    ai: 'Gemini API quota exceeded',
    generic: 'Generic component error occurred'
  };

  throw new Error(errorMessages[errorType]);
};

export default function ErrorBoundaryDemo() {
  const [gameError, setGameError] = useState(false);
  const [boardError, setBoardError] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [errorType, setErrorType] = useState<'render' | 'move' | 'drag' | 'network' | 'ai' | 'generic'>('generic');

  const aiServiceStatus = {
    status: 'error' as const,
    message: 'AI service temporarily unavailable',
    canRetry: true,
    fallbackAvailable: true,
    retryAfter: 30
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Chess Error Boundary Demo</h2>
        <p className="text-gray-600 mb-6">
          This demo shows how different error boundaries handle various types of errors in the chess game.
        </p>

        {/* Error Type Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Error Type:
          </label>
          <select
            value={errorType}
            onChange={(e) => setErrorType(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="generic">Generic Error</option>
            <option value="render">Rendering Error</option>
            <option value="move">Move Validation Error</option>
            <option value="drag">Drag & Drop Error</option>
            <option value="network">Network Error</option>
            <option value="ai">AI Service Error</option>
          </select>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setGameError(!gameError)}
            className={`px-4 py-2 rounded ${
              gameError ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            {gameError ? 'Fix Game Error' : 'Trigger Game Error'}
          </button>
          <button
            onClick={() => setBoardError(!boardError)}
            className={`px-4 py-2 rounded ${
              boardError ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
            }`}
          >
            {boardError ? 'Fix Board Error' : 'Trigger Board Error'}
          </button>
          <button
            onClick={() => setAiError(!aiError)}
            className={`px-4 py-2 rounded ${
              aiError ? 'bg-red-600 text-white' : 'bg-orange-600 text-white'
            }`}
          >
            {aiError ? 'Fix AI Error' : 'Trigger AI Error'}
          </button>
        </div>
      </div>

      {/* Game Error Boundary Demo */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Game Error Boundary</h3>
        <ChessErrorBoundary
          section="game"
          onReset={() => {
            console.log('Game reset requested');
            setGameError(false);
          }}
          onRestart={() => {
            console.log('Game restart requested');
            setGameError(false);
          }}
        >
          <ErrorComponent shouldThrow={gameError} errorType={errorType} />
        </ChessErrorBoundary>
      </div>

      {/* Board Error Boundary Demo */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Board Error Boundary</h3>
        <BoardErrorBoundary
          onResetBoard={() => {
            console.log('Board reset requested');
            setBoardError(false);
          }}
          onRestartGame={() => {
            console.log('Game restart from board requested');
            setBoardError(false);
          }}
          currentPosition="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
          theme="light"
        >
          <ErrorComponent shouldThrow={boardError} errorType={errorType} />
        </BoardErrorBoundary>
      </div>

      {/* AI Error Boundary Demo */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">AI Error Boundary</h3>
        <AIErrorBoundary
          onRetryAI={() => {
            console.log('AI retry requested');
            setAiError(false);
          }}
          onContinueWithoutAI={() => {
            console.log('Continue without AI requested');
            setAiError(false);
          }}
          onRestartGame={() => {
            console.log('Game restart from AI requested');
            setAiError(false);
          }}
          isAIThinking={false}
          aiServiceStatus={aiError ? aiServiceStatus : null}
        >
          <ErrorComponent shouldThrow={aiError} errorType={errorType} />
        </AIErrorBoundary>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Instructions</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Select an error type from the dropdown</li>
          <li>Click the trigger buttons to simulate errors  different components</li>
          <li>Observe how each error boundary handles the error differently</li>
          <li>Try the recovery options provided by each error boundary</li>
          <li>Check the browser console for logged recovery actions</li>
        </ul>
      </div>
    </div>
  );
}