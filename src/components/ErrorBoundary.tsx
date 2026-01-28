import React from "react";
import { sanitizeErrorMessage } from "../lib/utils";
import AccessDenied from "./AccessDenied";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary Component
 * 
 * A React Error Boundary that catches JavaScript errors anywhere in the child
 * component tree, logs those errors, and displays a fallback UI instead of
 * crashing the entire component tree.
 * 
 * This component implements the Error Boundary pattern to prevent blank white
 * screens when errors occur, providing a graceful degradation of functionality.
 * 
 * @param children - The component tree to protect with error boundary
 * @param fallback - Optional custom fallback component to render on error
 * 
 * Features:
 * - Catches errors during rendering, in lifecycle methods, and in constructors
 * - Logs error details to console for debugging
 * - Provides reset mechanism to attempt recovery
 * - Renders fallback UI when errors occur
 * - Detects authorization errors and shows AccessDenied component
 * 
 * Note: Does NOT catch errors in:
 * - Event handlers (handle those with try-catch)
 * - Asynchronous code (setTimeout, promises)
 * - Server-side rendering
 * - Errors thrown in the error boundary itself
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  /**
   * Static lifecycle method called when an error is thrown in a descendant component.
   * Updates state to trigger fallback UI rendering.
   * 
   * @param error - The error that was thrown
   * @returns New state object with error information
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error: error,
    };
  }

  /**
   * Lifecycle method called after an error has been thrown by a descendant component.
   * Used for logging error information for debugging purposes.
   * 
   * @param error - The error that was thrown
   * @param errorInfo - Object containing component stack trace
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details to console for debugging
    console.error("ErrorBoundary caught an error:", error);
    console.error("Component stack:", errorInfo.componentStack);
  }

  /**
   * Resets the error boundary state, allowing the component tree to remount
   * and attempt to render normally again. This provides a recovery mechanism
   * for transient errors.
   */
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      const errorMessage = this.state.error.message || '';
      
      // Check if this is an authorization error (ConvexError with FORBIDDEN or UNAUTHORIZED)
      const isAuthError = errorMessage.includes('"code":"FORBIDDEN"') || 
                         errorMessage.includes('"code":"UNAUTHORIZED"') ||
                         errorMessage.toLowerCase().includes('admin privileges') ||
                         errorMessage.toLowerCase().includes('access denied');
      
      // If it's an authorization error, show AccessDenied component
      if (isAuthError) {
        return <AccessDenied />;
      }
      
      // Sanitize error message to remove technical details
      const sanitizedErrorMessage = sanitizeErrorMessage(errorMessage);
      
      // If a custom fallback component is provided, use it
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      // Default fallback UI for non-authorization errors
      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border-2 border-red-200 p-8">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-5xl">⚠️</span>
              </div>
            </div>

            {/* Error Title */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
              Something Went Wrong
            </h2>

            {/* Error Message - Sanitized */}
            <p className="text-gray-600 text-center mb-6">
              {sanitizedErrorMessage || "We encountered an unexpected error. Please try again or return to the home page."}
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.resetError}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.href = "/"}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
              >
                ← Go Back to Home
              </button>
              
              <p className="text-sm text-gray-500 text-center mt-4">
                If this problem persists, please contact support.
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

export default ErrorBoundary;
