import React from 'react';
import { sanitizeErrorMessage } from '../../lib/utils';

interface BoardErrorBoundaryProps {
  children: React.ReactNode;
  onResetBoard?: () => void;
  onRestartGame?: () => void;
  currentPosition?: string; // FEN notation
  theme?: 'light' | 'dark';
}

interface BoardErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorTimestamp: number | null;
  positionAtError: string | null;
}

/**
 * BoardErrorBoundary Component
 * 
 * A specialized error boundary for chess board rendering and interaction errors.
 * This boundary handles issues with board display, piece rendering, move validation,
 * and user interactions while preserving game state when possible.
 * 
 * Features:
 * - Board-specific error handling and recovery
 * - Position preservation during errors
 * - Theme-aware fallback UI
 * - Move validation error recovery
 * - Drag-and-drop error handling
 * 
 * @param children - Board-related components to protect
 * @param onResetBoard - Callback to reset board display
 * @param onRestartGame - Callback to restart the entire game
 * @param currentPosition - Current board position in FEN notation
 * @param theme - Current board theme
 */
class BoardErrorBoundary extends React.Component<BoardErrorBoundaryProps, BoardErrorBoundaryState> {
  constructor(props: BoardErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorTimestamp: null,
      positionAtError: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<BoardErrorBoundaryState> {
    return {
      hasError: true,
      error: error,
      errorTimestamp: Date.now(),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Capture the board position when error occurred
    this.setState({
      positionAtError: this.props.currentPosition || null
    });

    // Log board-specific error details
    console.error('BoardErrorBoundary caught board-related error:', error);
    console.error('Component stack:', errorInfo.componentStack);
    console.error('Board position at error:', this.props.currentPosition);
    console.error('Board theme:', this.props.theme);
    
    // Log additional board context
    const boardElement = document.querySelector('[data-chess-board]');
    if (boardElement) {
      console.error('Board DOM element:', boardElement);
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorTimestamp: null,
      positionAtError: null,
    });
  };

  handleResetBoard = (): void => {
    this.props.onResetBoard?.();
    this.resetError();
  };

  handleRestartGame = (): void => {
    this.props.onRestartGame?.();
    this.resetError();
  };

  isRenderingError = (error: Error): boolean => {
    const message = error.message.toLowerCase();
    return message.includes('render') || 
           message.includes('dom') || 
           message.includes('element') ||
           message.includes('component') ||
           message.includes('props');
  };

  isMoveError = (error: Error): boolean => {
    const message = error.message.toLowerCase();
    return message.includes('move') || 
           message.includes('chess') || 
           message.includes('position') ||
           message.includes('fen') ||
           message.includes('validation');
  };

  isDragDropError = (error: Error): boolean => {
    const message = error.message.toLowerCase();
    return message.includes('drag') || 
           message.includes('drop') || 
           message.includes('mouse') ||
           message.includes('touch') ||
           message.includes('event');
  };

  getErrorType = (): 'rendering' | 'move' | 'dragdrop' | 'unknown' => {
    if (!this.state.error) return 'unknown';
    
    if (this.isRenderingError(this.state.error)) return 'rendering';
    if (this.isMoveError(this.state.error)) return 'move';
    if (this.isDragDropError(this.state.error)) return 'dragdrop';
    return 'unknown';
  };

  getErrorTitle = (): string => {
    const errorType = this.getErrorType();
    switch (errorType) {
      case 'rendering':
        return 'Board Display Error';
      case 'move':
        return 'Move Validation Error';
      case 'dragdrop':
        return 'Interaction Error';
      default:
        return 'Chess Board Error';
    }
  };

  getErrorMessage = (): string => {
    const errorType = this.getErrorType();
    switch (errorType) {
      case 'rendering':
        return 'The chess board display encountered a rendering error. The game state should be preserved.';
      case 'move':
        return 'A move validation error occurred. Your game position is preserved and you can continue playing.';
      case 'dragdrop':
        return 'An interaction error occurred while moving pieces. You can try clicking to move instead of dragging.';
      default:
        return 'The chess board encountered an unexpected error. Your game should be preserved.';
    }
  };

  getRecoveryInstructions = (): string => {
    const errorType = this.getErrorType();
    switch (errorType) {
      case 'rendering':
        return 'Try refreshing the board display or switching themes.';
      case 'move':
        return 'Try making a different move or reset the board if the position seems incorrect.';
      case 'dragdrop':
        return 'Try using click-to-move instead of drag-and-drop.';
      default:
        return 'Try refreshing the board or restarting the game if the problem persists.';
    }
  };

  renderFallbackBoard = (): React.ReactNode => {
    const theme = this.props.theme || 'light';
    const position = this.state.positionAtError || this.props.currentPosition;
    
    return (
      <div className={`inline-block border-4 rounded-lg shadow-lg ${
        theme === 'light' ? 'border-amber-900 bg-amber-900' : 'border-slate-900 bg-slate-900'
      }`}>
        <div className="p-2">
          {/* Simple 8x8 grid fallback */}
          {Array.from({ length: 8 }, (_, rank) => (
            <div key={rank} className="flex">
              {Array.from({ length: 8 }, (_, file) => {
                const isLight = (rank + file) % 2 === 0;
                const squareColor = theme === 'light' 
                  ? (isLight ? 'bg-amber-100' : 'bg-amber-800')
                  : (isLight ? 'bg-slate-300' : 'bg-slate-700');
                
                return (
                  <div
                    key={file}
                    className={`w-12 h-12 flex items-center justify-center ${squareColor}`}
                  >
                    {/* Show basic position info if available */}
                    {position && rank === 0 && file === 0 && (
                      <span className="text-xs text-gray-500">♔</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Error overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
          <div className="bg-white rounded-lg p-4 text-center">
            <span className="text-2xl mb-2 block">⚠️</span>
            <p className="text-sm font-medium">Board Error</p>
          </div>
        </div>
      </div>
    );
  };

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      const errorTitle = this.getErrorTitle();
      const errorMessage = this.getErrorMessage();
      const recoveryInstructions = this.getRecoveryInstructions();
      const sanitizedErrorMessage = sanitizeErrorMessage(this.state.error.message || '');
      const errorType = this.getErrorType();

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
          {/* Fallback board display */}
          <div className="relative mb-6">
            {this.renderFallbackBoard()}
          </div>

          {/* Error details */}
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border-2 border-red-200 p-6">
            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">♔</span>
              </div>
            </div>

            {/* Error Title */}
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              {errorTitle}
            </h2>

            {/* Error Message */}
            <p className="text-gray-600 text-center mb-3 text-sm">
              {errorMessage}
            </p>

            {/* Recovery Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-blue-700 text-sm text-center">
                💡 {recoveryInstructions}
              </p>
            </div>

            {/* Position Information */}
            {this.state.positionAtError && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                <p className="text-gray-600 text-xs text-center">
                  Game position preserved: {this.state.positionAtError.split(' ')[0]}
                </p>
              </div>
            )}

            {/* Technical Error Details */}
            {sanitizedErrorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-700 text-xs text-center">
                  {sanitizedErrorMessage}
                </p>
              </div>
            )}

            {/* Recovery Options */}
            <div className="space-y-2">
              {/* Try Again */}
              <button
                onClick={this.resetError}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Try Again
              </button>

              {/* Reset Board */}
              {this.props.onResetBoard && (
                <button
                  onClick={this.handleResetBoard}
                  className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-medium text-sm"
                >
                  Reset Board Display
                </button>
              )}

              {/* Restart Game */}
              {this.props.onRestartGame && (
                <button
                  onClick={this.handleRestartGame}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  Restart Game
                </button>
              )}
            </div>

            {/* Error Type Info */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Error type: {errorType} • Time: {this.state.errorTimestamp ? new Date(this.state.errorTimestamp).toLocaleTimeString() : 'Unknown'}
              </p>
            </div>

            {/* Help Text */}
            <div className="mt-2">
              <p className="text-xs text-gray-500 text-center">
                Your game progress should be preserved. If problems persist, try refreshing the page.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

export default BoardErrorBoundary;