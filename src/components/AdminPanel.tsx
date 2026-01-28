import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import AccessDenied from "./AccessDenied";

/**
 * AdminPanel Component
 * 
 * Provides administrative interface for managing the Develop Verse platform.
 * Displays system statistics, content management, user management, and settings.
 * 
 * Features:
 * - Dashboard with user and content statistics
 * - Content management (classes, subjects, chapters, videos, exams)
 * - User management interface
 * - Account settings (email, password, language)
 * 
 * Error Handling:
 * - Displays loading spinner while fetching admin data
 * - Shows AccessDenied component for unauthorized users
 * - Handles query errors gracefully without crashing
 * - Distinguishes between authorization errors and other errors
 * 
 * Authorization:
 * - Requires admin privileges to access
 * - Non-admin users see AccessDenied UI
 * - Protected by backend authorization checks
 * 
 * @returns Admin panel interface or AccessDenied component
 */
export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [contentType, setContentType] = useState("classes");

  const adminStats = useQuery(api.admin.getAdminStats);
  const allContent = useQuery(api.admin.getAllContent, { type: contentType });
  
  const addClass = useMutation(api.admin.addClass);
  const addSubject = useMutation(api.admin.addSubject);
  const addChapter = useMutation(api.admin.addChapter);
  const addVideo = useMutation(api.admin.addVideo);
  const addExam = useMutation(api.admin.addExam);
  const toggleContentStatus = useMutation(api.admin.toggleContentStatus);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // Settings states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(localStorage.getItem("appLanguage") || "english");

  /**
   * Handles adding new content based on the selected content type.
   * Calls the appropriate mutation and displays success/error toast.
   */
  const handleAddContent = async () => {
    try {
      switch (contentType) {
        case "classes":
          await addClass(formData);
          break;
        case "subjects":
          await addSubject(formData);
          break;
        case "chapters":
          await addChapter(formData);
          break;
        case "videos":
          await addVideo(formData);
          break;
        case "exams":
          await addExam(formData);
          break;
      }
      toast.success("Content added successfully!");
      setShowAddForm(false);
      setFormData({});
    } catch (error) {
      toast.error("Failed to add content");
    }
  };

  /**
   * Toggles the active/inactive status of content items.
   * 
   * @param id - The ID of the content item to toggle
   */
  const handleToggleStatus = async (id: string) => {
    try {
      await toggleContentStatus({ type: contentType, id });
      toast.success("Status updated successfully!");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  /**
   * Handles email change request with validation.
   * Validates email format before processing.
   */
  const handleChangeEmail = () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    // In a real app, this would call an API to update email
    toast.success("Email change request sent! Check your inbox to verify.");
    setShowEmailModal(false);
    setNewEmail("");
  };

  /**
   * Handles password change with validation.
   * Validates password strength and confirmation match.
   */
  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    // In a real app, this would call an API to change password
    toast.success("Password changed successfully!");
    setShowPasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  /**
   * Handles language change and persists to localStorage.
   * Reloads the page to apply language changes.
   */
  const handleChangeLanguage = () => {
    localStorage.setItem("appLanguage", selectedLanguage);
    toast.success(`Language changed to ${selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)}`);
    setShowLanguageModal(false);
    // In a real app, this would trigger a re-render with new language
    window.location.reload();
  };

  // Check for loading state
  if (adminStats === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check for error states
  // Convex queries can return errors as Error objects or as objects with error properties
  const hasError = adminStats instanceof Error || 
                   (adminStats && typeof adminStats === 'object' && 'message' in adminStats && !('totalUsers' in adminStats));
  
  if (hasError) {
    // Extract error message - handle both Error objects and ConvexError format
    let errorMessage = 'An error occurred';
    
    if (adminStats instanceof Error) {
      errorMessage = adminStats.message;
      // ConvexError messages often contain JSON with code and message
      try {
        const match = errorMessage.match(/\{"code":"([^"]+)","message":"([^"]+)"\}/);
        if (match) {
          errorMessage = match[2]; // Extract the actual message
        }
      } catch (e) {
        // If parsing fails, use the original message
      }
    } else if ((adminStats as any).message) {
      errorMessage = (adminStats as any).message;
    }
    
    // Check if it's an authorization error
    const isAuthError = errorMessage.toLowerCase().includes('unauthorized') || 
                       errorMessage.toLowerCase().includes('forbidden') ||
                       errorMessage.toLowerCase().includes('access denied') ||
                       errorMessage.toLowerCase().includes('admin privileges') ||
                       errorMessage.toLowerCase().includes('admin privilege');
    
    if (isAuthError) {
      // Render AccessDenied component for authorization errors
      return <AccessDenied />;
    }
    
    // Render generic error UI for other errors
    return <AccessDenied message={`Error: ${errorMessage}`} />;
  }

  // Success state - render admin dashboard
  if (!adminStats) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Admin Panel</h1>
        <p className="text-gray-600">
          Manage content, users, and platform analytics
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "dashboard", label: "Dashboard", icon: "📊" },
              { id: "content", label: "Content Management", icon: "📝" },
              { id: "users", label: "User Management", icon: "👥" },
              { id: "settings", label: "Settings", icon: "⚙️" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Total Users</p>
                      <p className="text-2xl font-bold">{adminStats.totalUsers}</p>
                    </div>
                    <span className="text-3xl">👥</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Active Users</p>
                      <p className="text-2xl font-bold">{adminStats.activeUsers}</p>
                    </div>
                    <span className="text-3xl">✅</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">New Signups</p>
                      <p className="text-2xl font-bold">{adminStats.newSignups}</p>
                    </div>
                    <span className="text-3xl">🆕</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">Total Content</p>
                      <p className="text-2xl font-bold">
                        {Object.values(adminStats.contentStats).reduce((a, b) => a + b, 0)}
                      </p>
                    </div>
                    <span className="text-3xl">📚</span>
                  </div>
                </div>
              </div>

              {/* Content Stats */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{adminStats.contentStats.classes}</p>
                    <p className="text-sm text-gray-600">Classes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{adminStats.contentStats.exams}</p>
                    <p className="text-sm text-gray-600">Exams</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{adminStats.contentStats.workouts}</p>
                    <p className="text-sm text-gray-600">Workouts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{adminStats.contentStats.mentalHealthSessions}</p>
                    <p className="text-sm text-gray-600">Wellness Sessions</p>
                  </div>
                </div>
              </div>

              {/* Popular Content */}
              {adminStats.popularContent.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Content Today</h3>
                  <div className="space-y-3">
                    {adminStats.popularContent.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <span className="font-medium text-gray-900">{item.type}</span>
                        </div>
                        <span className="text-sm text-gray-500">{item.views} views</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content Management Tab */}
          {activeTab === "content" && (
            <div className="space-y-6">
              {/* Content Type Selector */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {["classes", "subjects", "chapters", "videos", "exams"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setContentType(type)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm ${
                        contentType === type
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add New {contentType.slice(0, -1)}
                </button>
              </div>

              {/* Content List */}
              {allContent && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {contentType.charAt(0).toUpperCase() + contentType.slice(1)} ({allContent.length})
                  </h3>
                  
                  {allContent.length > 0 ? (
                    <div className="space-y-3">
                      {allContent.map((item: any) => (
                        <div
                          key={item._id}
                          className="flex items-center justify-between bg-white p-4 rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium text-gray-900">{item.name || item.title}</h4>
                            <p className="text-sm text-gray-600">
                              {item.description || `Created: ${new Date(item._creationTime).toLocaleDateString()}`}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {item.isActive ? "Active" : "Inactive"}
                            </span>
                            <button
                              onClick={() => handleToggleStatus(item._id)}
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              Toggle Status
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      No {contentType} found. Add some content to get started.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="text-center py-12">
              <span className="text-6xl block mb-4">👥</span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">User Management</h3>
              <p className="text-gray-600">User management features coming soon...</p>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h3>
              
              {/* Profile Settings */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <span>👤</span> Profile Settings
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">Manage your email and profile information</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="w-full bg-white border-2 border-blue-200 text-blue-700 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  📧 Change Email Address
                </button>
              </div>

              {/* Security Settings */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <span>🔒</span> Security
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">Update your password and security settings</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full bg-white border-2 border-green-200 text-green-700 px-6 py-3 rounded-lg hover:bg-green-50 transition-colors font-medium"
                >
                  🔑 Change Password
                </button>
              </div>

              {/* Language Settings */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <span>🌐</span> Language
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">Choose your preferred language</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLanguageModal(true)}
                  className="w-full bg-white border-2 border-purple-200 text-purple-700 px-6 py-3 rounded-lg hover:bg-purple-50 transition-colors font-medium"
                >
                  🗣️ Change Language (Current: {selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Change Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📧</span> Change Email Address
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Email Address</label>
                <input
                  type="email"
                  placeholder="Enter new email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {setShowEmailModal(false); setNewEmail("");}}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeEmail}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Update Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>🔑</span> Change Password
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Language Change Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>🌐</span> Select Language
            </h3>
            
            <div className="space-y-3">
              {[
                { value: "english", label: "English", flag: "🇬🇧" },
                { value: "hindi", label: "हिंदी (Hindi)", flag: "🇮🇳" },
                { value: "marathi", label: "मराठी (Marathi)", flag: "🇮🇳" },
              ].map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setSelectedLanguage(lang.value)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
                    selectedLanguage === lang.value
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="font-medium text-gray-900">{lang.label}</span>
                  </span>
                  {selectedLanguage === lang.value && (
                    <span className="text-purple-600">✓</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowLanguageModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeLanguage}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Apply Language
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Content Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add New {contentType.slice(0, -1)}
            </h3>
            
            <div className="space-y-4">
              {contentType === "classes" && (
                <>
                  <input
                    type="text"
                    placeholder="Class Name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <textarea
                    placeholder="Description"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </>
              )}
              
              {contentType === "exams" && (
                <>
                  <input
                    type="text"
                    placeholder="Exam Name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.fullName || ""}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <textarea
                    placeholder="Description"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    value={formData.category || ""}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {setShowAddForm(false); setFormData({});}}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddContent}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add {contentType.slice(0, -1)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
