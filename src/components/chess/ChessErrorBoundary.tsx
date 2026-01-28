import React from 'react';
import { sanitizeErrorMessage } from '../../lib/utils';

interface ChessErrorBoundaryProps {
  children: React.ReactNode;
  section: 'game' | 'board' | 'controls' | 'ai' | 'persistence';
  onReset?: () => void;
  onRestart?: () => void;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void; section: string }>;
}

interface ChessErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

/**
 * ChessErrorBoundary Component
 * 
 * A specialized React Error Boundary for chess game components that provides
 * chess-specific error handling and recovery options. This boundary is designed
 * to handle different types of chess-related errors gracefully while maintaining
 * game state integrity.
 * 
 * Features:
 * - Section-specific error handling (game, board, controls, AI, persistence)
 * - Chess-specific fallback UI with game recovery options
 * - Error reporting with sanitized messages
 * - Integration with game restart and reset functionality
 * - Maintains chess game context during error recovery
 * 
 * @param children - The chess component tree to protect
 * @param section - The chess game section this boundary protects
 * @param onReset - Optional callback to reset the current game state
 * @param onRestart - Optional callback to restart the entire game
 * @param fallback - Optional custom fallback component
 */
class ChessErrorBoundary extends React.Component<ChessErrorBoundaryProps, ChessErrorBoundaryState> {
  constructor(props: ChessErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): ChessErrorBoundaryState {
    // Generate unique error ID for tracking
    const errorId = `chess-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error: error,
      errorId: errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log chess-specific error details
    console.error(`ChessErrorBoundary caught error in ${this.props.section} section:`, error);
    console.error('Component stack:', errorInfo.componentStack);
    console.error('Error ID:', this.state.errorId);
    
    // Log additional chess context if available
    if (typeof window !== 'undefined' && (window as any).chessGameState) {
      console.error('Chess game state at error:', (window as any).chessGameState);
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    });
  };

  handleGameReset = (): void => {
    this.props.onReset?.();
    this.resetError();
  };

  handleGameRestart = (): void => {
    this.props.onRestart?.();
    this.resetError();
  };

  getSectionDisplayName = (): string => {
    switch (this.props.section) {
      case 'game': return 'Chess Game';
      case 'board': return 'Chess Board';
      case 'controls': return 'Game Controls';
      case 'ai': return 'AI Opponent';
      case 'persistence': return 'Game Save/Load';
      default: return 'Chess Component';
    }
  };

  getSectionIcon = (): string => {
    switch (this.props.section) {
      case 'game': return '♟️';
      case 'board': return '♔';
      case 'controls': return '🎮';
      case 'ai': return '🤖';
      case 'persistence': return '💾';
      default: return '⚠️';
    }
  };

  getSectionSpecificMessage = (): string => {
    switch (this.props.section) {
      case 'game':
        return 'The chess game encountered an error. Your game progress may be preserved.';
      case 'board':
        return 'The chess board display encountered an error. The game state should be preserved.';
      case 'controls':
        return 'The game controls encountered an error. You can try refreshing or restarting the game.';
      case 'ai':
        return 'The AI opponent encountered an error. You can continue  local mode or restart the game.';
      case 'persistence':
        return 'Game save/load functionality encountered an error. Your current game may not be saved.';
      default:
        return 'A chess component encountered an error.';
    }
  };

  getRecoveryOptions = () => {
    const options = [];
    
    // Always provide basic reset option
    options.push({
      label: 'Try Again',
      action: this.resetError,
      className: 'bg-blue-600 hover:bg-blue-700',
      primary: true
    });

    // Section-specific recovery options
    switch (this.props.section) {
      case 'game':
      case 'board':
        if (this.props.onReset) {
          options.push({
            label: 'Reset Current Game',
            action: this.handleGameReset,
            className: 'bg-yellow-600 hover:bg-yellow-700',
            primary: false
          });
        }
        if (this.props.onRestart) {
          options.push({
            label: 'Start New Game',
            action: this.handleGameRestart,
            className: 'bg-green-600 hover:bg-green-700',
            primary: false
          });
        }
        break;
      
      case 'ai':
        options.push({
          label: 'Continue Without AI',
          action: this.resetError,
          className: 'bg-orange-600 hover:bg-orange-700',
          primary: false
        });
        if (this.props.onRestart) {
          options.push({
            label: 'Restart Game',
            action: this.handleGameRestart,
            className: 'bg-green-600 hover:bg-green-700',
            primary: false
          });
        }
        break;
      
      case 'controls':
        if (this.props.onReset) {
          options.push({
            label: 'Reset Game State',
            action: this.handleGameReset,
            className: 'bg-yellow-600 hover:bg-yellow-700',
            primary: false
          });
        }
        break;
      
      case 'persistence':
        options.push({
          label: 'Continue Without Saving',
          action: this.resetError,
          className: 'bg-orange-600 hover:bg-orange-700',
          primary: false
        });
        break;
    }

    return options;
  };

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      // If a custom fallback component is provided, use it
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error} 
            resetError={this.resetError}
            section={this.props.section}
          />
        );
      }

      const errorMessage = this.state.error.message || '';
      const sanitizedErrorMessage = sanitizeErrorMessage(errorMessage);
      const sectionName = this.getSectionDisplayName();
      const sectionIcon = this.getSectionIcon();
      const sectionMessage = this.getSectionSpecificMessage();
      const recoveryOptions = this.getRecoveryOptions();

      // Chess-specific fallback UI
      return (
        <div className="flex items-center justify-center min-h-[300px] p-4">
          <div className="max-w-lg w-full bg-white rounded-xl shadow-lg border-2 border-red-200 p-6">
            {/* Error Icon and Section */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">{sectionIcon}</span>
              </div>
            </div>

            {/* Error Title */}
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              {sectionName} Error
            </h2>

            {/* Section-specific message */}
            <p className="text-gray-600 text-center mb-3 text-sm">
              {sectionMessage}
            </p>

            {/* Sanitized error message */}
            {sanitizedErrorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-700 text-sm text-center">
                  {sanitizedErrorMessage}
                </p>
              </div>
            )}

            {/* Error ID for support */}
            {this.state.errorId && (
              <p className="text-xs text-gray-400 text-center mb-4">
                Error ID: {this.state.errorId}
              </p>
            )}

            {/* Recovery Options */}
            <div className="space-y-2">
              {recoveryOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={option.action}
                  className={`w-full text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm ${option.className}`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Additional help */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                If this problem persists, try refreshing the page or contact support.
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

export default ChessErrorBoundary;