import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface DashboardProps {
  setCurrentPage: (page: string) => void;
}

export default function Dashboard({ setCurrentPage }: DashboardProps) {
  const dashboardData = useQuery(api.users.getUserDashboardData);

  // Consistent navigation helper
  const navigateToPage = (pageId: string) => {
    console.log('Dashboard navigating to:', pageId);
    
    // Update URL first
    const newPath = pageId === 'dashboard' ? '/' : `/${pageId}`;
    window.history.pushState({}, '', newPath);
    
    // Then update state
    setCurrentPage(pageId);
  };

  if (!dashboardData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { profile, recentProgress, todayPlan } = dashboardData;

  // Calculate real stats
  const totalMinutesWatched = recentProgress.reduce((sum, p) => sum + p.timeSpent, 0);
  const totalHours = Math.floor(totalMinutesWatched / 60);
  const totalMinutes = totalMinutesWatched % 60;
  const completedTasks = todayPlan ? todayPlan.tasks.filter(t => t.completed).length : 0;
  const totalTasks = todayPlan ? todayPlan.tasks.length : 0;
  const todayProgress = todayPlan && todayPlan.totalPlannedMinutes > 0 
    ? Math.round((todayPlan.completedMinutes / todayPlan.totalPlannedMinutes) * 100) 
    : 0;

  // Get real date
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Welcome Section with Tiranga theme - MOVED TO TOP */}
      <div className="mb-6 bg-gradient-to-r from-orange-50 via-white to-green-50 rounded-2xl p-6 border-4 border-orange-300 shadow-lg">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-green-600 bg-clip-text text-transparent mb-2">
          Welcome back, {profile.name}! 👋
        </h1>
        <p className="text-gray-700 text-base mb-2 font-semibold">
          Ready to continue your learning journey?
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-xl">📅</span>
          <p className="text-gray-600 italic text-base font-medium">{dateString}</p>
        </div>
      </div>

      {/* Quick Stats - NOW AT TOP WITH REAL DATA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => navigateToPage("academics")}
          className="bg-gradient-to-br from-orange-500 to-orange-700 text-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 duration-300 text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Today's Progress</p>
              <p className="text-3xl font-bold mt-2">{todayProgress}%</p>
            </div>
            <span className="text-4xl">📊</span>
          </div>
          <div className="mt-3 bg-orange-300 bg-opacity-40 rounded-full h-2">
            <div className="bg-white h-2 rounded-full transition-all duration-500" style={{ width: `${todayProgress}%` }}></div>
          </div>
        </button>

        <button
          onClick={() => navigateToPage("academics")}
          className="bg-gradient-to-br from-green-500 to-emerald-700 text-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 duration-300 text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Completed Tasks</p>
              <p className="text-3xl font-bold mt-2">{completedTasks}</p>
            </div>
            <span className="text-4xl">✅</span>
          </div>
          <p className="text-xs text-green-100 mt-2">
            {totalTasks > 0 ? `${completedTasks} of ${totalTasks} tasks` : "Great job today!"}
          </p>
        </button>

        <button
          onClick={() => navigateToPage("academics")}
          className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 duration-300 text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Study Streak</p>
              <p className="text-3xl font-bold mt-2">7 days</p>
            </div>
            <span className="text-4xl">🔥</span>
          </div>
          <p className="text-xs text-indigo-100 mt-2">Keep it up!</p>
        </button>

        <button
          onClick={() => navigateToPage("fitness")}
          className="bg-gradient-to-br from-red-500 to-pink-600 text-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 duration-300 text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Hours</p>
              <p className="text-3xl font-bold mt-2">
                {totalHours}h {totalMinutes > 0 ? `${totalMinutes}m` : ''}
              </p>
            </div>
            <span className="text-4xl">⏰</span>
          </div>
          <p className="text-xs text-red-100 mt-2">Learning + Fitness</p>
        </button>
      </div>

      {/* Patriotic Motivation Quote - MOVED UP */}
      <div className="mb-6 bg-gradient-to-r from-orange-500 via-white to-green-600 text-gray-900 rounded-xl p-6 border-2 border-orange-400 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg flex-1 text-center">Education Center Initiative</h3>
        </div>
        <p className="text-base font-semibold text-center mb-2">
          "Yaha se padhega Bharat, tabhi aage badhega Bharat"
        </p>
        <p className="text-sm text-center text-gray-700 mb-2">
          From here dia will learn, then dia will progress forward.
        </p>
        <div className="flex items-center justify-center space-x-2">
          <span className="font-bold text-orange-700">Jai</span>
          <span className="font-bold text-gray-800">Hind</span>
        </div>
      </div>

      {/* Daily Academic Motivation */}
      <div className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <span>💫</span> Daily Motivation
        </h3>
        <p className="text-sm text-indigo-100">
          "Success is not final, failure is not fatal: it is the courage to continue that counts."
        </p>
        <p className="text-xs text-indigo-200 mt-2">- Winston Churchill</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Continue Learning</h2>
            
            {recentProgress.length > 0 ? (
              <div className="space-y-4">
                {recentProgress.slice(0, 3).map((progress, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (progress.type === 'chapter') navigateToPage('academics');
                      else if (progress.type === 'exam') navigateToPage('exams');
                      else if (progress.type === 'fitness') navigateToPage('fitness');
                      else navigateToPage('mental-health');
                    }}
                    className="w-full flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl">
                          {progress.type === 'chapter' ? '📚' : 
                           progress.type === 'exam' ? '🎯' :
                           progress.type === 'fitness' ? '💪' : '🧘'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-medium text-gray-900">
                        {progress.type.charAt(0).toUpperCase() + progress.type.slice(1)} Content
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {progress.timeSpent} minutes watched
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500 font-medium">{progress.progress}%</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl mb-4 block">📚</span>
                <p className="text-gray-500">Start your learning journey!</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Today's Plan */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Plan</h2>
            
            {todayPlan && todayPlan.tasks.length > 0 ? (
              <div className="space-y-3">
                {todayPlan.tasks.slice(0, 4).map((task, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      className="w-4 h-4 text-blue-600 rounded"
                      readOnly
                    />
                    <div className="flex-1">
                      <p className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500">{task.duration} min</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No tasks planned for today</p>
            )}
          </div>

          {/* Quick Access */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Access</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigateToPage("academics")}
                className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-center"
              >
                <span className="text-2xl block mb-1">📚</span>
                <span className="text-sm font-medium text-blue-700">Academics</span>
              </button>
              
              <button
                onClick={() => navigateToPage("exams")}
                className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-center"
              >
                <span className="text-2xl block mb-1">🎯</span>
                <span className="text-sm font-medium text-green-700">Exams</span>
              </button>
              
              <button
                onClick={() => navigateToPage("fitness")}
                className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-center"
              >
                <span className="text-2xl block mb-1">💪</span>
                <span className="text-sm font-medium text-purple-700">Fitness</span>
              </button>
              
              <button
                onClick={() => navigateToPage("mental-health")}
                className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-center"
              >
                <span className="text-2xl block mb-1">🧘</span>
                <span className="text-sm font-medium text-orange-700">Wellness</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
