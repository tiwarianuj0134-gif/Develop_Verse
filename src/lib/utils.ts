import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitizes error messages by removing technical implementation details
 * that should not be exposed to end users.
 * 
 * Removes:
 * - Stack traces (lines starting with "at " or containing file paths)
 * - File paths (absolute and relative paths with extensions)
 * - Function names in error context
 * - Line and column numbers
 * - ConvexError technical details (Request IDs, server errors)
 * 
 * @param message - The raw error message to sanitize
 * @returns A user-friendly error message without technical details
 * 
 * @example
 * sanitizeErrorMessage("Error at getUserData (src/api/user.ts:42:15)")
 * // Returns: "Error"
 * 
 * @example
 * sanitizeErrorMessage("Cannot read property 'name' of undefined\n    at Object.render (Dashboard.tsx:123)")
 * // Returns: "Cannot read property 'name' of undefined"
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message) {
    return "An error occurred";
  }

  // Convert to string if it's an Error object
  let messageStr = typeof message === 'string' ? message : String(message);

  // Handle ConvexError format - extract the actual user-friendly message
  // Format: [CONVEX Q(admin:getAdminStats)] [Request ID: xxx] Server Error\nUncaught ConvexError: {"code":"FORBIDDEN","message":"Admin privileges required"}
  const convexErrorMatch = messageStr.match(/\{"code":"([^"]+)","message":"([^"]+)"\}/);
  if (convexErrorMatch) {
    const code = convexErrorMatch[1];
    const userMessage = convexErrorMatch[2];
    
    // Return user-friendly message based on error code
    if (code === "FORBIDDEN") {
      return "Access Denied. You need administrator privileges to view this page.";
    } else if (code === "UNAUTHORIZED") {
      return "Please log  to access this page.";
    } else {
      return userMessage;
    }
  }

  // Remove ConvexError technical prefixes
  messageStr = messageStr.replace(/\[CONVEX [^\]]+\]\s*/g, '');
  messageStr = messageStr.replace(/\[Request ID: [^\]]+\]\s*/g, '');
  messageStr = messageStr.replace(/Server Error\s*/g, '');
  messageStr = messageStr.replace(/Uncaught ConvexError:\s*/g, '');
  messageStr = messageStr.replace(/Called by client\s*/g, '');

  // Split by newlines to process line by line
  const lines = messageStr.split('\n');
  
  // Filter out stack trace lines
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    
    // Remove lines that are part of stack traces
    if (trimmed.startsWith('at ')) return false;
    if (trimmed.startsWith('in ')) return false;
    if (trimmed.startsWith('Called by')) return false;
    
    // Remove lines containing file paths with extensions
    if (/\.(tsx?|jsx?|js|ts|mjs|cjs):\d+/.test(trimmed)) return false;
    
    // Remove lines that look like file paths
    if (/[\/\\][\w-]+\.(tsx?|jsx?|js|ts|mjs|cjs)/.test(trimmed)) return false;
    
    return true;
  });

  // Join remaining lines
  let sanitized = filteredLines.join(' ').trim();

  // Remove function names in parentheses (e.g., "Error in render()")
  sanitized = sanitized.replace(/\s+in\s+\w+\(\)/g, '');
  
  // Remove file path references (e.g., "at src/components/File.tsx")
  sanitized = sanitized.replace(/\s+at\s+[\w\/\\.:-]+/g, '');
  
  // Remove line:column references (e.g., ":123:45")
  sanitized = sanitized.replace(/:\d+:\d+/g, '');
  
  // Remove standalone file paths
  sanitized = sanitized.replace(/[\w\/\\-]+\.(tsx?|jsx?|js|ts|mjs|cjs)/g, '');
  
  // Clean up extra whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // If we've removed everything, return a generic message
  if (!sanitized || sanitized.length === 0) {
    return "An error occurred";
  }

  return sanitized;
}
