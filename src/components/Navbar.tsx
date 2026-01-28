import { SignOutButton } from "../SignOutButton";

interface NavbarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export default function Navbar({ currentPage, setCurrentPage }: NavbarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "🏠" },
    { id: "academics", label: "Academics", icon: "📚" },
    { id: "exams", label: "Exams", icon: "🎯" },
    { id: "fitness", label: "Fitness", icon: "💪" },
    { id: "mental-health", label: "Wellness", icon: "🧘" },
    { id: "chess", label: "Chess", icon: "♟️" },
    // Admin is hidden from navbar - only accessible via /admin URL
  ];

  const handlePageChange = (pageId: string) => {
    console.log('Changing page to:', pageId);
    
    // Update URL first
    const newPath = pageId === 'dashboard' ? '/' : `/${pageId}`;
    window.history.pushState({}, '', newPath);
    
    // Then update state
    setCurrentPage(pageId);
  };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-white via-orange-50 to-white backdrop-blur-sm border-b-2 border-orange-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => handlePageChange("dashboard")}
          >
            <span className="text-3xl">🎓</span>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
                Develop Verse
              </h2>
              <p className="text-xs text-orange-600 font-semibold">Knowledge ka boss, discipline ka king</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-bold ${
                  currentPage === item.id
                    ? "bg-gradient-to-r from-orange-200 to-green-200 text-orange-800 shadow-md border-2 border-orange-400"
                    : "text-gray-700 hover:text-orange-700 hover:bg-orange-100 border-2 border-transparent"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile Menu & Sign Out */}
          <div className="flex items-center space-x-2">
            <SignOutButton />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="grid grid-cols-3 gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                className={`flex flex-col items-center space-y-1 p-2 sm:p-3 rounded-lg transition-all duration-200 font-bold text-center ${
                  currentPage === item.id
                    ? "bg-gradient-to-r from-orange-200 to-green-200 text-orange-800 border-2 border-orange-400 shadow-md"
                    : "text-gray-700 hover:text-orange-700 hover:bg-orange-100 border-2 border-transparent"
                }`}
              >
                <span className="text-lg sm:text-xl">{item.icon}</span>
                <span className="text-xs leading-tight">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
