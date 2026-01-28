import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function MentalHealthPage() {
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");

  const sessionCategories = useQuery(api.mentalHealth.getSessionCategories);
  const sessions = useQuery(api.mentalHealth.getSessions, {
    type: selectedType || undefined,
    difficulty: selectedDifficulty || undefined,
  });
  const sessionDetails = useQuery(
    api.mentalHealth.getSessionDetails,
    selectedSession ? { sessionId: selectedSession as any } : "skip"
  );

  if (!sessionCategories || !sessions) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedSession && sessionDetails) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Session Details */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{sessionDetails.name}</h2>
            <button
              onClick={() => setSelectedSession("")}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              ← Back to Sessions
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">About This Session</h3>
                  <p className="text-gray-600">{sessionDetails.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Benefits</h3>
                  <ul className="space-y-2">
                    {sessionDetails.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span className="text-gray-600">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Instructions</h3>
                  <ol className="space-y-2">
                    {sessionDetails.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="text-gray-600">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-4">Session Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <span className="font-medium text-gray-900">{sessionDetails.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="font-medium text-gray-900">{sessionDetails.duration} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Difficulty:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      sessionDetails.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                      sessionDetails.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {sessionDetails.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              <button className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all">
                Start Session 🧘
              </button>
            </div>
          </div>

          {/* Videos */}
          {sessionDetails.videos && sessionDetails.videos.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Guided Sessions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sessionDetails.videos.map((video) => (
                  <div
                    key={video._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                  >
                    <h4 className="font-medium text-gray-900 mb-2">{video.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{video.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{video.duration} min</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        video.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                        video.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {video.difficulty}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🧘 Mental Wellness</h1>
        <p className="text-gray-600">
          Take care of your mental health with guided meditation, stress relief, and motivation
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Find Your Perfect Session</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Type
            </label>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedType("")}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedType === "" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                }`}
              >
                All Types
              </button>
              {sessionCategories.types.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedType === type ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                  }`}
                >
                  {type === "Meditation" ? "🧘" :
                   type === "Motivation" ? "💪" :
                   type === "Stress Relief" ? "😌" :
                   type === "Focus" ? "🎯" : "🧠"} {type}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level
            </label>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedDifficulty("")}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedDifficulty === "" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                }`}
              >
                All Levels
              </button>
              {sessionCategories.difficulties.map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => setSelectedDifficulty(difficulty)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedDifficulty === difficulty ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    difficulty === "Beginner" ? "bg-green-500" :
                    difficulty === "Intermediate" ? "bg-yellow-500" : "bg-red-500"
                  }`}></span>
                  {difficulty}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <div
            key={session._id}
            onClick={() => setSelectedSession(session._id)}
            className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all cursor-pointer"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">
                      {session.type === "Meditation" ? "🧘" :
                       session.type === "Motivation" ? "💪" :
                       session.type === "Stress Relief" ? "😌" :
                       session.type === "Focus" ? "🎯" : "🧠"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{session.name}</h3>
                    <p className="text-sm text-gray-500">{session.type}</p>
                  </div>
                </div>
                {(session as any).bookmarked && (
                  <span className="text-yellow-500">⭐</span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {session.description}
              </p>

              {/* Benefits */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Key Benefits:</h4>
                <div className="flex flex-wrap gap-1">
                  {session.benefits.slice(0, 2).map((benefit, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"
                    >
                      {benefit}
                    </span>
                  ))}
                  {session.benefits.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      +{session.benefits.length - 2} more
                    </span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">{session.duration} min</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    session.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                    session.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {session.difficulty}
                  </span>
                </div>
                {(session as any).completed && (
                  <span className="text-green-500">✓</span>
                )}
              </div>

              {/* Progress */}
              {(session as any).progress > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{(session as any).progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(session as any).progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-12">
          <span className="text-6xl block mb-4">🧘</span>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No sessions found</h3>
          <p className="text-gray-600">Try adjusting your filters to find more sessions</p>
        </div>
      )}
    </div>
  );
}
