import { useState, useEffect } from "react";
import YouTubePlayer from "./YouTubePlayer";
import { getYouTubeEmbedUrl } from "../lib/youtube-utils";

interface WorkoutDay {
  day: string;
  emoji: string;
  bodyPart: string;
  exercises: string[];
  duration: string;
  difficulty: string;
  videoUrl?: string;
}

const fitnessLevels = {
  beginner: {
    name: "Beginner",
    emoji: "🌱",
    description: "Perfect for starting your fitness journey",
    schedule: [
      {
        day: "Monday",
        emoji: "💪",
        bodyPart: "Chest",
        exercises: ["Push-ups", "Chest Press", "Dumbbell Flyes"],
        duration: "30-40 min",
        difficulty: "Beginner",
        videoUrl: "https://youtu.be/uD-fVJr9MZM"
      },
      {
        day: "Tuesday",
        emoji: "🔙",
        bodyPart: "Back",
        exercises: ["Pull-ups", "Rows", "Lat Pulldown"],
        duration: "30-40 min",
        difficulty: "Beginner",
        videoUrl: "https://youtu.be/JQeOhQoi3GY"
      },
      {
        day: "Wednesday",
        emoji: "💪",
        bodyPart: "Biceps",
        exercises: ["Dumbbell Curls", "Barbell Curls", "Cable Curls"],
        duration: "25-30 min",
        difficulty: "Beginner",
        videoUrl: "https://youtu.be/0ZCR45rFdTc"
      },
      {
        day: "Thursday",
        emoji: "🎯",
        bodyPart: "Shoulder",
        exercises: ["Shoulder Press", "Lateral Raises", "Face Pulls"],
        duration: "30-40 min",
        difficulty: "Beginner",
        videoUrl: "https://youtu.be/kfP_9z-BtmA"
      },
      {
        day: "Friday",
        emoji: "🦵",
        bodyPart: "Legs",
        exercises: ["Squats", "Lunges", "Leg Press"],
        duration: "40-50 min",
        difficulty: "Beginner",
        videoUrl: "https://youtu.be/BQwDU7SHe30"
      },
      {
        day: "Saturday",
        emoji: "✋",
        bodyPart: "Forearms",
        exercises: ["Wrist Curls", "Reverse Curls", "Hammer Curls"],
        duration: "20-25 min",
        difficulty: "Beginner",
        videoUrl: "https://youtu.be/P5SKBRXAR1Q"
      },
      {
        day: "Sunday",
        emoji: "😴",
        bodyPart: "Rest",
        exercises: ["Recovery & Stretching", "Light Walk", "Yoga"],
        duration: "20-30 min",
        difficulty: "Rest"
      }
    ]
  },
  intermediate: {
    name: "Intermediate",
    emoji: "💪",
    description: "Build on your existing fitness base",
    schedule: [
      {
        day: "Monday",
        emoji: "💪",
        bodyPart: "Chest",
        exercises: ["Incline Press", "Cable Flyes", "Machine Press", "Push-ups"],
        duration: "50-60 min",
        difficulty: "Intermediate",
        videoUrl: "https://youtu.be/-y9OT-2O7zs"
      },
      {
        day: "Tuesday",
        emoji: "🔙",
        bodyPart: "Back",
        exercises: ["Deadlifts", "Weighted Pull-ups", "Barbell Rows", "Machine Rows"],
        duration: "50-60 min",
        difficulty: "Intermediate",
        videoUrl: "https://youtu.be/voVM_Re7nOQ"
      },
      {
        day: "Wednesday",
        emoji: "💪",
        bodyPart: "Biceps",
        exercises: ["Weighted Dips", "EZ Bar Curls", "Preacher Curls", "Concentration Curls"],
        duration: "40-50 min",
        difficulty: "Intermediate",
        videoUrl: "https://youtu.be/pH5bl36t-ik"
      },
      {
        day: "Thursday",
        emoji: "🎯",
        bodyPart: "Shoulder",
        exercises: ["Military Press", "Machine Press", "Shrugs", "Upright Rows"],
        duration: "50-60 min",
        difficulty: "Intermediate",
        videoUrl: "https://youtu.be/7kD8cR9s6mA"
      },
      {
        day: "Friday",
        emoji: "🦵",
        bodyPart: "Legs",
        exercises: ["Leg Extensions", "Leg Curls", "Calf Raises", "Wall Sits"],
        duration: "60-75 min",
        difficulty: "Intermediate",
        videoUrl: "https://youtu.be/kwP0TgcsnVg"
      },
      {
        day: "Saturday",
        emoji: "✋",
        bodyPart: "Forearms",
        exercises: ["Wrist Curls with Weight", "Reverse Curls", "Farmer Carries"],
        duration: "30-40 min",
        difficulty: "Intermediate",
        videoUrl: "https://youtu.be/Y9x4z6V5mU8"
      },
      {
        day: "Sunday",
        emoji: "😴",
        bodyPart: "Rest",
        exercises: ["Active Recovery", "Swimming", "Yoga", "Stretching"],
        duration: "30-45 min",
        difficulty: "Rest"
      }
    ]
  },
  advanced: {
    name: "Advanced",
    emoji: "🏆",
    description: "Push your limits with intense workouts",
    schedule: [
      {
        day: "Monday",
        emoji: "💪",
        bodyPart: "Chest",
        exercises: ["Weighted Incline Press", "Decline Bench", "Flye Machine", "Dips"],
        duration: "60-75 min",
        difficulty: "Advanced",
        videoUrl: "https://youtu.be/2z8JmcrW-As"
      },
      {
        day: "Tuesday",
        emoji: "🔙",
        bodyPart: "Back",
        exercises: ["Heavy Deadlifts", "Weighted Pull-ups", "T-Bar Rows", "Smith Machine"],
        duration: "60-75 min",
        difficulty: "Advanced",
        videoUrl: "https://youtu.be/eGo4IYlbE5g"
      },
      {
        day: "Wednesday",
        emoji: "💪",
        bodyPart: "Biceps",
        exercises: ["Weighted Dips", "Barbell Curls", "Machine Curls", "Drop Sets"],
        duration: "50-60 min",
        difficulty: "Advanced",
        videoUrl: "https://youtu.be/ykJmrZ5v0Oo"
      },
      {
        day: "Thursday",
        emoji: "🎯",
        bodyPart: "Shoulder",
        exercises: ["Heavy Military Press", "Weighted Dips", "Plate Raises", "Machine Press"],
        duration: "60-75 min",
        difficulty: "Advanced",
        videoUrl: "https://youtu.be/9Jk4k2Z8h98"
      },
      {
        day: "Friday",
        emoji: "🦵",
        bodyPart: "Legs",
        exercises: ["Heavy Squats", "Leg Press Max", "Leg Curls", "Jump Squats"],
        duration: "75-90 min",
        difficulty: "Advanced",
        videoUrl: "https://youtu.be/1f8yoFFdkcY"
      },
      {
        day: "Saturday",
        emoji: "✋",
        bodyPart: "Forearms",
        exercises: ["Weighted Wrist Curls", "Farmer Carries", "Reverse Dumbbell Curls"],
        duration: "40-50 min",
        difficulty: "Advanced",
        videoUrl: "https://youtu.be/syKzj4mQZ9Y"
      },
      {
        day: "Sunday",
        emoji: "😴",
        bodyPart: "Rest",
        exercises: ["Complete Rest", "Meal Planning", "Recovery Focus"],
        duration: "Flexible",
        difficulty: "Rest"
      }
    ]
  }
};

export default function FitnessPage() {
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<string>>(new Set());
  const [playingVideoId, setPlayingVideoId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userAge, setUserAge] = useState("");
  const [userWeight, setUserWeight] = useState("");
  const [userHeight, setUserHeight] = useState("");

  // Check if user has already filled the form
  useEffect(() => {
    const fitnessData = localStorage.getItem('fitnessUserData');
    if (!fitnessData) {
      setShowForm(true);
    }
  }, []);

  const selectedLevelData = selectedLevel 
    ? fitnessLevels[selectedLevel as keyof typeof fitnessLevels]
    : null;

  const playingVideo = selectedLevelData?.schedule.find(day => 
    `${selectedLevel}-${day.day}` === playingVideoId
  );

  const handleFormSubmit = () => {
    if (!userAge || !userWeight || !userHeight) {
      alert("Please fill all fields - age, weight, and height!");
      return;
    }
    
    // Save to localStorage so we don't ask again
    const userData = {
      age: userAge,
      weight: userWeight,
      height: userHeight,
      timestamp: Date.now()
    };
    localStorage.setItem('fitnessUserData', JSON.stringify(userData));
    
    setIsLoading(true);
    
    // Show loading for 5 seconds
    setTimeout(() => {
      setIsLoading(false);
      setShowForm(false);
    }, 5000);
  };

  const toggleWorkoutComplete = (workoutId: string) => {
    const newCompleted = new Set(completedWorkouts);
    if (newCompleted.has(workoutId)) {
      newCompleted.delete(workoutId);
    } else {
      newCompleted.add(workoutId);
    }
    setCompletedWorkouts(newCompleted);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header with attractive background */}
      <div className="mb-8 bg-gradient-to-r from-green-50 via-white to-emerald-50 rounded-2xl p-8 border-4 border-green-300 shadow-lg">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">💪 Fitness & Wellness</h1>
        <p className="text-gray-700 text-lg font-semibold">
          Stay physically fit with structured workout schedules tailored to your fitness level
        </p>
      </div>

      {/* Age/Weight Form */}
      {showForm && !isLoading && (
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            🏋️ Let's Personalize Your Fitness Journey
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Tell us a bit about yourself to create the perfect workout plan
          </p>
          
          <div className="max-w-md mx-auto space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Age
              </label>
              <input
                type="number"
                value={userAge}
                onChange={(e) => setUserAge(e.target.value)}
                placeholder="Enter your age"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="10"
                max="100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Weight (kg)
              </label>
              <input
                type="number"
                value={userWeight}
                onChange={(e) => setUserWeight(e.target.value)}
                placeholder="Enter your weight in kg"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="20"
                max="200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Height (cm)
              </label>
              <input
                type="number"
                value={userHeight}
                onChange={(e) => setUserHeight(e.target.value)}
                placeholder="Enter your height in cm"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="100"
                max="250"
              />
            </div>
            
            <button
              onClick={handleFormSubmit}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Create My Fitness Plan 🚀
            </button>
          </div>
        </div>
      )}

      {/* Loading Screen */}
      {isLoading && (
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto mb-6"></div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              🔄 Preparing Your Personalized Plan
            </h2>
            <p className="text-gray-600 mb-4">
              Analyzing your profile and creating the perfect workout routine...
            </p>
            <div className="bg-gray-200 rounded-full h-2 w-full max-w-md mx-auto">
              <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
          </div>
        </div>
      )}

      {/* Fitness Level Selection */}
      {!selectedLevel && !showForm && !isLoading && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            🏋️ Select Your Fitness Level
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(fitnessLevels).map(([key, level]) => (
              <button
                key={key}
                onClick={() => setSelectedLevel(key)}
                className="p-8 border-2 border-green-200 rounded-xl hover:border-emerald-500 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 hover:shadow-xl transition-all text-center group"
              >
                <span className="text-5xl block mb-4">{level.emoji}</span>
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-green-700 mb-2">
                  {level.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{level.description}</p>
                <span className="inline-block px-4 py-2 bg-green-200 text-green-800 rounded-lg text-xs font-bold">
                  7-Day Plan
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Schedule */}
      {selectedLevel && selectedLevelData && !showForm && !isLoading && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {selectedLevelData.name} - Weekly Workout Schedule
              </h2>
              <p className="text-gray-600">Track your progress and mark workouts as completed</p>
            </div>
            <button
              onClick={() => {
                setSelectedLevel("");
                setCompletedWorkouts(new Set());
              }}
              className="text-green-600 hover:text-green-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-50"
            >
              ← Change Level
            </button>
          </div>

          {/* Weekly Schedule Grid */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {selectedLevelData.schedule.map((daySchedule, index) => {
              const workoutId = `${selectedLevel}-day-${index}`;
              const isCompleted = completedWorkouts.has(workoutId);

              return (
                <div
                  key={daySchedule.day}
                  className={`rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                    isCompleted
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-white hover:border-purple-500 hover:shadow-md"
                  }`}
                >
                  <button
                    onClick={() => toggleWorkoutComplete(workoutId)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{daySchedule.emoji}</span>
                      {isCompleted && <span className="text-green-500 font-bold">✓</span>}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{daySchedule.day}</h3>
                    <p className="text-sm font-semibold text-purple-600 mb-2">{daySchedule.bodyPart}</p>
                    {daySchedule.bodyPart !== "Rest" && (
                      <div className="space-y-1 mb-3">
                        {daySchedule.exercises.slice(0, 2).map((exercise, idx) => (
                          <p key={idx} className="text-xs text-gray-600">• {exercise}</p>
                        ))}
                        {daySchedule.exercises.length > 2 && (
                          <p className="text-xs text-gray-500">+{daySchedule.exercises.length - 2} more</p>
                        )}
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-500">{daySchedule.duration}</p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* YouTube Video Player */}
          {playingVideoId && playingVideo && playingVideo.videoUrl && (
            <div className="mb-6">
              {(() => {
                const embedUrl = getYouTubeEmbedUrl(playingVideo.videoUrl);
                if (!embedUrl) {
                  return (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700">❌ Video not available. Please contact support.</p>
                    </div>
                  );
                }
                
                return (
                  <YouTubePlayer
                    embedUrl={embedUrl}
                    title={`${playingVideo.day} - ${playingVideo.bodyPart} Workout`}
                    description={`${playingVideo.difficulty} level workout for ${playingVideo.bodyPart.toLowerCase()}`}
                    onClose={() => setPlayingVideoId("")}
                  />
                );
              })()}
            </div>
          )}

          {/* Detailed Schedule View */}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">📋 Detailed Workout Schedule</h3>
            <div className="space-y-4">
              {selectedLevelData.schedule.map((daySchedule, index) => {
                const workoutId = `${selectedLevel}-day-${index}`;
                const isCompleted = completedWorkouts.has(workoutId);

                return (
                  <div
                    key={daySchedule.day}
                    className={`bg-white rounded-xl border-2 p-6 transition-all ${
                      isCompleted ? "border-green-300 bg-green-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="text-3xl">{daySchedule.emoji}</span>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">{daySchedule.day}</h4>
                          <p className="text-sm text-purple-600 font-semibold">{daySchedule.bodyPart}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {daySchedule.videoUrl && (
                          <button
                            onClick={() => setPlayingVideoId(`${selectedLevel}-${daySchedule.day}`)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              playingVideoId === `${selectedLevel}-${daySchedule.day}`
                                ? "bg-red-500 text-white"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                            }`}
                          >
                            {playingVideoId === `${selectedLevel}-${daySchedule.day}` ? "🎬 Playing" : "▶ Watch Video"}
                          </button>
                        )}
                        <button
                          onClick={() => toggleWorkoutComplete(workoutId)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            isCompleted
                              ? "bg-green-500 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-purple-500 hover:text-white"
                          }`}
                        >
                          {isCompleted ? "✓ Completed" : "Mark Complete"}
                        </button>
                      </div>
                    </div>

                    {daySchedule.bodyPart !== "Rest" && (
                      <div className="mb-4">
                        <h5 className="text-sm font-semibold text-gray-900 mb-2">Exercises:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {daySchedule.exercises.map((exercise, idx) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg"
                            >
                              <input
                                type="checkbox"
                                className="cursor-pointer"
                              />
                              <span className="text-sm text-gray-700">{exercise}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-6 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">DURATION</p>
                        <p className="text-sm font-semibold text-gray-900">{daySchedule.duration}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">DIFFICULTY</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          daySchedule.difficulty === "Beginner"
                            ? "bg-green-100 text-green-700"
                            : daySchedule.difficulty === "Intermediate"
                            ? "bg-yellow-100 text-yellow-700"
                            : daySchedule.difficulty === "Advanced"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {daySchedule.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress Summary */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📊 This Week's Progress</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-500 text-xs font-medium">COMPLETED WORKOUTS</p>
                <p className="text-2xl font-bold text-purple-600">{completedWorkouts.size}/7</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium">COMPLETION RATE</p>
                <p className="text-2xl font-bold text-purple-600">{Math.round((completedWorkouts.size / 7) * 100)}%</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium">TOTAL DURATION</p>
                <p className="text-2xl font-bold text-purple-600">~5.5h</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium">ESTIMATED CALORIES</p>
                <p className="text-2xl font-bold text-purple-600">~2,500</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}