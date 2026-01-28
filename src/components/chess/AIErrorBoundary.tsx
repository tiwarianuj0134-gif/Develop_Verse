import React from 'react';
import { sanitizeErrorMessage } from '../../lib/utils';

interface AIErrorBoundaryProps {
  children: React.ReactNode;
  onRetryAI?: () => void;
  onContinueWithoutAI?: () => void;
  onRestartGame?: () => void;
  isAIThinking?: boolean;
  aiServiceStatus?: {
    status: string;
    message: string;
    canRetry: boolean;
    fallbackAvailable: boolean;
    retryAfter?: number;
  } | null;
}

interface AIErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
  lastErrorTime: number | null;
}

/**
 * AIErrorBoundary Component
 * 
 * A specialized error boundary for AI-related components in the chess game.
 * This boundary handles AI service failures, network issues, and provides
 * intelligent recovery strategies for AI opponent functionality.
 * 
 * Features:
 * - AI-specific error detection and handling
 * - Retry logic with exponential backoff
 * - Fallback to local-only mode
 * - Service status integration
 * - Graceful degradation when AI is unavailable
 * 
 * @param children - AI-related components to protect
 * @param onRetryAI - Callback to retry AI move generation
 * @param onContinueWithoutAI - Callback to continue in local mode
 * @param onRestartGame - Callback to restart the entire game
 * @param isAIThinking - Whether AI is currently processing
 * @param aiServiceStatus - Current AI service status information
 */
class AIErrorBoundary extends React.Component<AIErrorBoundaryProps, AIErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: AIErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
      lastErrorTime: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AIErrorBoundaryState> {
    return {
      hasError: true,
      error: error,
      errorCount: 0, // Will be incremented in componentDidCatch
      lastErrorTime: Date.now(),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Increment error count for retry logic
    this.setState(prevState => ({
      errorCount: prevState.errorCount + 1
    }));

    // Log AI-specific error details
    console.error('AIErrorBoundary caught AI-related error:', error);
    console.error('Component stack:', errorInfo.componentStack);
    console.error('Error count:', this.state.errorCount + 1);
    console.error('AI service status:', this.props.aiServiceStatus);
    
    // Log AI context
    if (this.props.isAIThinking) {
      console.error('Error occurred while AI was thinking');
    }
  }

  componentWillUnmount(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorCount: 0,
      lastErrorTime: null,
    });
  };

  handleRetryAI = (): void => {
    this.props.onRetryAI?.();
    this.resetError();
  };

  handleContinueWithoutAI = (): void => {
    this.props.onContinueWithoutAI?.();
    this.resetError();
  };

  handleRestartGame = (): void => {
    this.props.onRestartGame?.();
    this.resetError();
  };

  handleAutoRetry = (): void => {
    const retryDelay = Math.min(1000 * Math.pow(2, this.state.errorCount), 30000); // Max 30 seconds
    
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetryAI();
    }, retryDelay);
  };

  isNetworkError = (error: Error): boolean => {
    const message = error.message.toLowerCase();
    return message.includes('network') || 
           message.includes('fetch') || 
           message.includes('timeout') ||
           message.includes('connection') ||
           message.includes('offline');
  };

  isAIServiceError = (error: Error): boolean => {
    const message = error.message.toLowerCase();
    return message.includes('gemini') || 
           message.includes('ai') || 
           message.includes('api') ||
           message.includes('quota') ||
           message.includes('rate limit');
  };

  getErrorType = (): 'network' | 'ai-service' | 'unknown' => {
    if (!this.state.error) return 'unknown';
    
    if (this.isNetworkError(this.state.error)) return 'network';
    if (this.isAIServiceError(this.state.error)) return 'ai-service';
    return 'unknown';
  };

  getErrorTitle = (): string => {
    const errorType = this.getErrorType();
    switch (errorType) {
      case 'network':
        return 'Connection Error';
      case 'ai-service':
        return 'AI Service Error';
      default:
        return 'AI Opponent Error';
    }
  };

  getErrorMessage = (): string => {
    const errorType = this.getErrorType();
    const serviceStatus = this.props.aiServiceStatus;
    
    if (serviceStatus?.message) {
      return serviceStatus.message;
    }
    
    switch (errorType) {
      case 'network':
        return 'Unable to connect to the AI service. Please check your internet connection.';
      case 'ai-service':
        return 'The AI service is temporarily unavailable. You can continue playing without AI or try again later.';
      default:
        return 'The AI opponent encountered an unexpected error.';
    }
  };

  shouldShowAutoRetry = (): boolean => {
    const errorType = this.getErrorType();
    const serviceStatus = this.props.aiServiceStatus;
    
    return (
      this.state.errorCount < 3 && // Don't auto-retry after 3 failures
      (errorType === 'network' || (serviceStatus?.canRetry ?? false)) &&
      !this.retryTimeoutId // Don't show if already retrying
    );
  };

  getRetryDelay = (): number => {
    const serviceStatus = this.props.aiServiceStatus;
    if (serviceStatus?.retryAfter) {
      return serviceStatus.retryAfter * 1000;
    }
    return Math.min(1000 * Math.pow(2, this.state.errorCount), 30000);
  };

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      const errorTitle = this.getErrorTitle();
      const errorMessage = this.getErrorMessage();
      const sanitizedErrorMessage = sanitizeErrorMessage(this.state.error.message || '');
      const shouldShowAutoRetry = this.shouldShowAutoRetry();
      const retryDelay = Math.ceil(this.getRetryDelay() / 1000);
      const serviceStatus = this.props.aiServiceStatus;

      return (
        <div className="flex items-center justify-center min-h-[200px] p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border-2 border-orange-200 p-6">
            {/* AI Error Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">🤖</span>
              </div>
            </div>

            {/* Error Title */}
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              {errorTitle}
            </h2>

            {/* Error Message */}
            <p className="text-gray-600 text-center mb-4 text-sm">
              {errorMessage}
            </p>

            {/* Service Status */}
            {serviceStatus && (
              <div className={`rounded-lg p-3 mb-4 ${
                serviceStatus.status === 'error' ? 'bg-red-50 border border-red-200' :
                serviceStatus.status === 'fallback' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <p className={`text-sm text-center ${
                  serviceStatus.status === 'error' ? 'text-red-700' :
                  serviceStatus.status === 'fallback' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>
                  Status: {serviceStatus.message}
                </p>
              </div>
            )}

            {/* Technical Error Details (if different from user message) */}
            {sanitizedErrorMessage && sanitizedErrorMessage !== errorMessage && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                <p className="text-gray-600 text-xs text-center">
                  Technical details: {sanitizedErrorMessage}
                </p>
              </div>
            )}

            {/* Auto-retry notification */}
            {shouldShowAutoRetry && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-blue-700 text-sm text-center">
                  Auto-retrying in {retryDelay} seconds...
                </p>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${((retryDelay - (Date.now() - (this.state.lastErrorTime || 0)) / 1000) / retryDelay) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Recovery Options */}
            <div className="space-y-2">
              {/* Retry AI */}
              {(serviceStatus?.canRetry ?? true) && (
                <button
                  onClick={this.handleRetryAI}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  Retry AI Move
                </button>
              )}

              {/* Continue without AI */}
              {serviceStatus?.fallbackAvailable !== false && (
                <button
                  onClick={this.handleContinueWithoutAI}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  Continue Without AI
                </button>
              )}

              {/* Restart Game */}
              <button
                onClick={this.handleRestartGame}
                className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm"
              >
                Restart Game
              </button>

              {/* Basic reset */}
              <button
                onClick={this.resetError}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
              >
                Dismiss Error
              </button>
            </div>

            {/* Error Statistics */}
            {this.state.errorCount > 1 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Error occurred {this.state.errorCount} times. Consider restarting the game.
                </p>
              </div>
            )}

            {/* Help Text */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                You can continue playing without AI or try refreshing the page.
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

export default AIErrorBoundary;