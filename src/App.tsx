import { Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, lazy, Suspense, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import Onboarding from "./components/Onboarding";
import Navbar from "./components/Navbar";
import AdminPanel from "./components/AdminPanel";
import Chatbot from "./components/Chatbot";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy load pages for code splitting and better performance
const AcademicsPage = lazy(() => import("./components/AcademicsPage").catch(err => {
  console.error('Failed to load AcademicsPage:', err);
  return { default: () => <div className="p-8 text-center text-red-600">Failed to load Academics page. Please refresh.</div> };
}));

const ExamsPage = lazy(() => import("./components/ExamsPage").catch(err => {
  console.error('Failed to load ExamsPage:', err);
  return { default: () => <div className="p-8 text-center text-red-600">Failed to load Exams page. Please refresh.</div> };
}));

const FitnessPage = lazy(() => import("./components/FitnessPage").catch(err => {
  console.error('Failed to load FitnessPage:', err);
  return { default: () => <div className="p-8 text-center text-red-600">Failed to load Fitness page. Please refresh.</div> };
}));

const WellnessPage = lazy(() => import("./components/WellnessPage").catch(err => {
  console.error('Failed to load WellnessPage:', err);
  return { default: () => <div className="p-8 text-center text-red-600">Failed to load Wellness page. Please refresh.</div> };
}));

const ChessPage = lazy(() => import("./components/ChessPage").catch(err => {
  console.error('Failed to load ChessPage:', err);
  return { default: () => <div className="p-8 text-center text-red-600">Failed to load Chess page. Please refresh.</div> };
}));

// Loading component for lazy-loaded pages
function PageLoader() {
  return (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading page...</p>
      </div>
    </div>
  );
}

// Admin Login Component
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "Anuj@1234") {
      onLogin();
      setError("");
    } else {
      setError("valid password!");
      setPassword("");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-red-200">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-red-600 mb-2">
              🔒 Admin Access
            </h1>
            <p className="text-gray-600">Enter admin password to continue</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              Access Admin Panel
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="w-full mt-2 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              Go Back
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Initialize page from URL on mount only
  useEffect(() => {
    const path = window.location.pathname;
    console.log('Initial path:', path);
    
    if (path === '/admin') {
      setCurrentPage('admin');
    } else if (path === '/academics') {
      setCurrentPage('academics');
    } else if (path === '/exams') {
      setCurrentPage('exams');
    } else if (path === '/fitness') {
      setCurrentPage('fitness');
    } else if (path === '/mental-health') {
      setCurrentPage('mental-health');
    } else if (path === '/chess') {
      setCurrentPage('chess');
    } else {
      setCurrentPage('dashboard');
    }
  }, []); // Empty dependency array - only run on mount

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      console.log('Navigation to path:', path);
      
      if (path === '/admin') {
        setCurrentPage('admin');
      } else if (path === '/academics') {
        setCurrentPage('academics');
      } else if (path === '/exams') {
        setCurrentPage('exams');
      } else if (path === '/fitness') {
        setCurrentPage('fitness');
      } else if (path === '/mental-health') {
        setCurrentPage('mental-health');
      } else if (path === '/chess') {
        setCurrentPage('chess');
      } else {
        // Reset admin auth when leaving admin page
        setIsAdminAuthenticated(false);
        setCurrentPage('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []); // Empty dependency array - no circular dependency
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-100 via-yellow-50 to-green-100" style={{
      backgroundImage: `
        linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(255, 193, 7, 0.1) 25%, rgba(34, 197, 94, 0.1) 50%, rgba(59, 130, 246, 0.1) 75%, rgba(139, 92, 246, 0.1) 100%),
        radial-gradient(circle at 20% 50%, rgba(249, 115, 22, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)
      `,
    }}>
      {/* Show admin login if on admin page and not authenticated */}
      {currentPage === 'admin' && !isAdminAuthenticated && (
        <AdminLogin onLogin={() => setIsAdminAuthenticated(true)} />
      )}

      {/* Navbar and main content always rendered (but navbar won't show admin) */}
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1">
        <Content 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage}
          isAdminAuthenticated={isAdminAuthenticated}
        />
      </main>
      <Chatbot />

      {/* Beautiful centered sign- form for unauthenticated users */}
      <Unauthenticated>
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-orange-200">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent mb-2">
                  Develop Verse
                </h1>
                <p className="text-orange-600 font-semibold">Knowledge ka boss, discipline ka king</p>
              </div>
              <SignInForm />
            </div>
          </div>
        </div>
      </Unauthenticated>
      
      <Toaster />
    </div>
  );
}

function Content({ currentPage, setCurrentPage, isAdminAuthenticated }: { 
  currentPage: string; 
  setCurrentPage: (page: string) => void;
  isAdminAuthenticated: boolean;
}) {
  const userProfile = useQuery(api.users.getCurrentUserProfile);

  console.log('Content rendering - currentPage:', currentPage, 'userProfile loaded:', !!userProfile);

  if (userProfile === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user profile...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if user hasn't completed it (except for admin page)
  if (!userProfile?.profile?.onboardingCompleted && currentPage !== 'admin') {
    console.log('Showing onboarding - profile not completed');
    return <Onboarding />;
  }

  console.log('Rendering page:', currentPage);

  // Render current page with lazy loading
  switch (currentPage) {
    case "academics":
      return (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <AcademicsPage />
          </Suspense>
        </ErrorBoundary>
      );
    case "exams":
      return (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <ExamsPage />
          </Suspense>
        </ErrorBoundary>
      );
    case "fitness":
      return (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <FitnessPage />
          </Suspense>
        </ErrorBoundary>
      );
    case "mental-health":
      return (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <WellnessPage />
          </Suspense>
        </ErrorBoundary>
      );
    case "chess":
      return (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <ChessPage />
          </Suspense>
        </ErrorBoundary>
      );
    case "admin":
      // Only show admin panel if authenticated
      if (isAdminAuthenticated) {
        return (
          <ErrorBoundary>
            <AdminPanel />
          </ErrorBoundary>
        );
      } else {
        // This will be handled by AdminLogin component
        return null;
      }
    default:
      return (
        <ErrorBoundary>
          <Dashboard setCurrentPage={setCurrentPage} />
        </ErrorBoundary>
      );
  }
}
