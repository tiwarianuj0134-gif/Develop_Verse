import { sanitizeErrorMessage } from "../lib/utils";

interface AccessDeniedProps {
  message?: string;
  onNavigateBack?: () => void;
}

/**
 * AccessDenied Component
 * 
 * Displays a user-friendly "Access Denied" message when users attempt to access
 * restricted content without proper authorization. Provides navigation options
 * to return to the main application.
 * 
 * @param message - Optional custom error message (defaults to standard access denied message)
 * @param onNavigateBack - Optional custom navigation handler (defaults to reloading the page to home)
 */
export default function AccessDenied({ 
  message = "Access Denied. You need administrator privileges to view this page.",
  onNavigateBack
}: AccessDeniedProps) {
  // Sanitize the error message to remove technical details
  const sanitizedMessage = sanitizeErrorMessage(message);
  
  const handleGoBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      // Default behavior: reload the page which will show the dashboard
      window.location.href = "/";
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border-2 border-red-200 p-8">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-5xl">🚫</span>
          </div>
        </div>

        {/* Error Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
          Access Denied
        </h2>

        {/* Error Message */}
        <p className="text-gray-600 text-center mb-6">
          {sanitizedMessage}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGoBack}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
          >
            ← Go Back to Home
          </button>
          
          <p className="text-sm text-gray-500 text-center">
            If you believe you should have access, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
