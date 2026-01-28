import { useState } from "react";

interface DaySchedule {
  day: string;
  focus: string;
  emoji: string;
  isRest: boolean;
}

const weeklySchedule: DaySchedule[] = [
  { day: "Monday", focus: "Chest", emoji: "💪", isRest: false },
  { day: "Tuesday", focus: "Back", emoji: "🏋️", isRest: false },
  { day: "Wednesday", focus: "Biceps", emoji: "💪", isRest: false },
  { day: "Thursday", focus: "Shoulder", emoji: "🤸", isRest: false },
  { day: "Friday", focus: "Legs", emoji: "🦵", isRest: false },
  { day: "Saturday", focus: "Forearms", emoji: "💪", isRest: false },
  { day: "Sunday", focus: "Rest", emoji: "😴", isRest: true },
];

interface WeeklyScheduleProps {
  fitnessLevel: string;
}

export default function WeeklySchedule({ fitnessLevel }: WeeklyScheduleProps) {
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());

  const toggleDay = (day: string) => {
    const newCompleted = new Set(completedDays);
    if (newCompleted.has(day)) {
      newCompleted.delete(day);
    } else {
      newCompleted.add(day);
    }
    setCompletedDays(newCompleted);
  };

  const completedCount = completedDays.size;
  const totalWorkoutDays = weeklySchedule.filter((d) => !d.isRest).length;
  const progressPercentage = Math.round((completedCount / totalWorkoutDays) * 100);

  return (
    <div className="space-y-6">
      {/* Progress Tracker */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Weekly Progress - {fitnessLevel} Level
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              {completedCount} of {totalWorkoutDays} workouts completed
            </span>
            <span className="font-semibold text-purple-600">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {weeklySchedule.map((schedule) => (
          <div
            key={schedule.day}
            className={`rounded-xl p-6 border-2 transition-all ${
              schedule.isRest
                ? "bg-gray-50 border-gray-200"
                : completedDays.has(schedule.day)
                ? "bg-gradient-to-br from-green-50 to-green-100 border-green-500"
                : "bg-white border-gray-200 hover:border-purple-300 hover:shadow-md"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">{schedule.day}</h4>
                <p
                  className={`text-sm ${
                    schedule.isRest ? "text-gray-500" : "text-purple-600"
                  } font-medium`}
                >
                  {schedule.focus}
                </p>
              </div>
              <span className="text-3xl">{schedule.emoji}</span>
            </div>

            {!schedule.isRest && (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p>• Warm-up: 5-10 minutes</p>
                  <p>• Main workout: 30-45 minutes</p>
                  <p>• Cool down: 5-10 minutes</p>
                </div>

                <button
                  onClick={() => toggleDay(schedule.day)}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                    completedDays.has(schedule.day)
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-purple-500 text-white hover:bg-purple-600"
                  }`}
                >
                  {completedDays.has(schedule.day) ? "✓ Completed" : "Mark Complete"}
                </button>
              </div>
            )}

            {schedule.isRest && (
              <div className="text-sm text-gray-500">
                <p>Recovery day - let your muscles rest and rebuild!</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Motivational Message */}
      {progressPercentage === 100 && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 text-center">
          <span className="text-4xl block mb-2">🎉</span>
          <h3 className="text-xl font-bold mb-2">Amazing Work!</h3>
          <p>You've completed all workouts this week. Keep up the great work!</p>
        </div>
      )}
    </div>
  );
}
