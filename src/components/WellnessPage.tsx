import { useState } from "react";

interface MeditationActivity {
  id: string;
  name: string;
  emoji: string;
  description: string;
  duration: string;
  difficulty: string;
  benefits: string[];
  guidelines: string[];
}

const meditationActivities: MeditationActivity[] = [
  {
    id: "meditation",
    name: "Meditation",
    emoji: "🧘",
    description: "Deep mindfulness meditation to calm your mind and reduce stress",
    duration: "10-30 min",
    difficulty: "Beginner to Advanced",
    benefits: [
      "Reduces anxiety and stress",
      "Improves focus and concentration",
      "Enhances emotional well-being",
      "Better sleep quality",
      "Increases self-awareness"
    ],
    guidelines: [
      "Find a quiet, comfortable place",
      "Sit  a relaxed position",
      "Close your eyes and focus on your breath",
      "Let thoughts pass without judgment",
      "Start with 5-10 minutes and gradually increase"
    ]
  },
  {
    id: "stress-relief",
    name: "Stress Relief",
    emoji: "😌",
    description: "Guided relaxation techniques to release tension and anxiety",
    duration: "15-20 min",
    difficulty: "Beginner",
    benefits: [
      "Lowers cortisol levels",
      "Reduces muscle tension",
      "Calms nervous system",
      "Improves mood",
      "Better stress management"
    ],
    guidelines: [
      "Fd a comfortable position",
      "Practice deep breathing exercises",
      "Progressive muscle relaxation",
      "Use calming music if needed",
      "Perform daily for best results"
    ]
  },
  {
    id: "focus",
    name: "Focus & Concentration",
    emoji: "🎯",
    description: "Mental exercises to boost focus and sharpen concentration for studies",
    duration: "10-15 min",
    difficulty: "Intermediate",
    benefits: [
      "Improves concentration",
      "Enhances memory retention",
      "Increases productivity",
      "Better study performance",
      "Develops mental clarity"
    ],
    guidelines: [
      "Eliminate distractions",
      "Set a clear tention",
      "Use visualization techniques",
      "Practice regularly before studies",
      "Take breaks every 45-50 mutes"
    ]
  },
  {
    id: "motivation",
    name: "Motivation & Positivity",
    emoji: "💪",
    description: "Inspiring sessions to boost confidence and positive mindset",
    duration: "10-25 min",
    difficulty: "Beginner to Intermediate",
    benefits: [
      "creases motivation",
      "Builds confidence",
      "Promotes positive thkg",
      "Improves self-belief",
      "Enhances resilience"
    ],
    guidelines: [
      "Practice affirmations daily",
      "Visualize your goals",
      "Focus on your strengths",
      "Mata gratitude practice",
      "Share positive energy with others"
    ]
  }
];

export default function WellnessPage() {
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set());

  const activity = meditationActivities.find(a => a.id === selectedActivity);

  const toggleActivityComplete = (activityId: string) => {
    const newCompleted = new Set(completedActivities);
    if (newCompleted.has(activityId)) {
      newCompleted.delete(activityId);
    } else {
      newCompleted.add(activityId);
    }
    setCompletedActivities(newCompleted);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header with attractive background */}
      <div className="mb-8 bg-gradient-to-r from-orange-50 via-white to-green-50 rounded-2xl p-8 border-4 border-orange-300 shadow-lg">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent mb-2">🧘 Wellness & Meditation</h1>
        <p className="text-gray-700 text-lg font-semibold">
          Take care of your mental health with guided meditation and wellness activities
        </p>
      </div>

      {/* Welcome Section */}
      {!selectedActivity && (
        <div className="bg-gradient-to-r from-orange-50 via-white to-green-100 rounded-xl p-8 mb-8 border-2 border-orange-200 shadow-lg">
          <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text mb-4">Welcome to Your Wellness Journey</h2>
          <p className="text-gray-800 mb-4 font-semibold">
            Alongside your academic and fitness pursuits, it's crucial to take care of your mental and emotional health. 
            Our wellness program provides guided meditation and mindfulness activities designed specifically for students 
            to manage stress, improve focus, and maintain a positive mindset.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="text-3xl mb-2">✨</div>
              <p className="text-sm font-bold text-orange-900">Mental Clarity</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-lg p-4 border border-indigo-200">
              <div className="text-3xl mb-2">🧠</div>
              <p className="text-sm font-bold text-indigo-900">Better Focus</p>
            </div>
            <div className="bg-gradient-to-br from-pink-100 to-pink-50 rounded-lg p-4 border border-pink-200">
              <div className="text-3xl mb-2">❤️</div>
              <p className="text-sm font-bold text-pink-900">Emotional Health</p>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-emerald-50 rounded-lg p-4 border border-green-200">
              <div className="text-3xl mb-2">😴</div>
              <p className="text-sm font-bold text-green-900">Better Sleep</p>
            </div>
          </div>
        </div>
      )}

      {/* Activity Selection */}
      {!selectedActivity && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🌟 Our Wellness Activities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {meditationActivities.map((act) => (
              <button
                key={act.id}
                onClick={() => setSelectedActivity(act.id)}
                className="bg-white rounded-xl border-2 border-orange-200 p-6 hover:border-green-500 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 hover:shadow-xl transition-all text-center group"
              >
                <div className="text-5xl mb-3">{act.emoji}</div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-700 mb-2">
                  {act.name}
                </h3>
                <p className="text-xs text-gray-600 mb-3">{act.description}</p>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded font-bold">
                    {act.duration}
                  </span>
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded font-bold">
                    {act.difficulty}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Activity Details */}
      {selectedActivity && activity && (
        <div className="space-y-6">
          {/* Activity Header */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="text-5xl">{activity.emoji}</div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{activity.name}</h2>
                  <p className="text-gray-600 text-sm">{activity.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedActivity("")}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm px-4 py-2 rounded-lg hover:bg-purple-50"
              >
                ← Back
              </button>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 font-medium mb-1">DURATION</p>
                <p className="text-lg font-bold text-blue-600">{activity.duration}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 font-medium mb-1">DIFFICULTY</p>
                <p className="text-lg font-bold text-purple-600">{activity.difficulty}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 font-medium mb-1">FREQUENCY</p>
                <p className="text-lg font-bold text-green-600">Daily</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 font-medium mb-1">STATUS</p>
                <p className="text-lg font-bold text-orange-600">
                  {completedActivities.has(selectedActivity) ? "✓ Done" : "Pending"}
                </p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">✨ Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activity.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                    ✓
                  </span>
                  <p className="text-gray-700">{benefit}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📋 How to Practice</h3>
            <div className="space-y-3">
              {activity.guidelines.map((guideline, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 text-purple-600 font-bold text-sm">
                      {index + 1}
                    </div>
                  </div>
                  <p className="text-gray-700 pt-1">{guideline}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Ready to Start?</h3>
                <p className="text-gray-600 text-sm">
                  Find a quiet place, sit comfortably, and dedicate {activity.duration} to your wellness
                </p>
              </div>
              <button
                onClick={() => toggleActivityComplete(selectedActivity)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  completedActivities.has(selectedActivity)
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg"
                }`}
              >
                {completedActivities.has(selectedActivity) ? "✓ Completed Today" : "Start Session"}
              </button>
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
            <h4 className="text-lg font-bold text-blue-900 mb-3">💡 Tips for Success</h4>
            <ul className="space-y-2 text-blue-800">
              <li>• Practice at the same time daily for consistency</li>
              <li>• Start with shorter sessions if you're a beginner</li>
              <li>• Use headphones if you want to follow guided sessions</li>
              <li>• Be patient with yourself - progress takes time</li>
              <li>• Combine with deep breathing for better results</li>
            </ul>
          </div>

          {/* Weekly Tracker */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📊 This Week's Wellness</h3>
            <div className="grid grid-cols-7 gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                <div key={day} className="text-center">
                  <p className="text-xs font-semibold text-gray-600 mb-2">{day}</p>
                  <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center hover:bg-purple-100 transition-colors cursor-pointer">
                    {index < 3 && (
                      <span className="text-xl">✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-4">
              3 sessions completed this week. Keep up the great work! 🌟
            </p>
          </div>
        </div>
      )}

      {/* Wellness Resources */}
      {!selectedActivity && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📚 Wellness Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border p-6">
              <div className="text-3xl mb-3">🎵</div>
              <h3 className="font-bold text-gray-900 mb-2">Calming Music & Sounds</h3>
              <p className="text-sm text-gray-600 mb-4">
                Listen to carefully curated playlists designed to promote relaxation and focus
              </p>
              <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                Explore Playlists →
              </button>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <div className="text-3xl mb-3">📖</div>
              <h3 className="font-bold text-gray-900 mb-2">Wellness Articles</h3>
              <p className="text-sm text-gray-600 mb-4">
                Read expert tips on stress management, mindfulness, and maintaining mental health
              </p>
              <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                Read Articles →
              </button>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <div className="text-3xl mb-3">🤝</div>
              <h3 className="font-bold text-gray-900 mb-2">Support Community</h3>
              <p className="text-sm text-gray-600 mb-4">
                Connect with other students  our wellness community for support and motivation
              </p>
              <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                Join Community →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
