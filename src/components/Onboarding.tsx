import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    class: "",
    stream: "",
    examGoals: [] as string[],
    preferredLanguage: "English",
    fitnessGoals: "",
    mentalHealthInterest: false,
  });

  const updateProfile = useMutation(api.users.updateUserProfile);

  const classes = ["9", "10", "11", "12"];
  const streams = ["Science", "Commerce", "Arts"];
  const exams = [
    "JEE Main", "JEE Advanced", "NEET", "CUET", "BITSAT",
    "CA Foundation", "CA Intermediate", "CA Final",
    "UPSC Civil Services", "NDA", "SSC CGL", "Banking Exams",
    "State Engineering Exams", "Medical Entrance Exams"
  ];
  const languages = ["English", "Hindi", "Hinglish"];
  const fitnessOptions = ["Home Workouts", "Gym Training", "Both", "Not Interested"];

  const handleExamToggle = (exam: string) => {
    setFormData(prev => ({
      ...prev,
      examGoals: prev.examGoals.includes(exam)
        ? prev.examGoals.filter(e => e !== exam)
        : [...prev.examGoals, exam]
    }));
  };

  const handleSubmit = async () => {
    try {
      await updateProfile(formData);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-orange-200">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span className="font-bold">Step {step} of 4</span>
              <span className="font-bold">{Math.round((step / 4) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gradient-to-r from-orange-100 to-green-100 rounded-full h-3 border border-orange-200">
              <div 
                className="bg-gradient-to-r from-orange-500 via-yellow-500 to-green-500 h-3 rounded-full transition-all duration-300 shadow-lg"
                style={{ width: `${(step / 4) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent mb-2">Welcome to Develop Verse! 🎓</h2>
                <p className="text-gray-700 font-semibold">Knowledge ka boss, discipline ka king</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's your name?
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Which class are you ?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {classes.map((cls) => (
                    <button
                      key={cls}
                      onClick={() => setFormData(prev => ({ ...prev, class: cls }))}
                      className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                        formData.class === cls
                          ? "border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700"
                          : "border-gray-300 hover:border-orange-300 hover:bg-orange-50"
                      }`}
                    >
                      Class {cls}
                    </button>
                  ))}
                </div>
              </div>

              {formData.class && (
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Select your stream
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {streams.map((stream) => (
                      <button
                        key={stream}
                        onClick={() => setFormData(prev => ({ ...prev, stream }))}
                        className={`p-3 rounded-lg border-2 transition-all font-semibold ${
                          formData.stream === stream
                            ? "border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700"
                            : "border-gray-300 hover:border-orange-300 hover:bg-orange-50"
                        }`}
                      >
                        {stream}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.class}
                className="w-full bg-gradient-to-r from-orange-500 to-green-500 text-white py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Exam Goals */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent mb-2">Competitive Exam Goals 🎯</h2>
                <p className="text-gray-700 font-semibold">Select the exams you want to prepare for (optional)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {exams.map((exam) => (
                  <button
                    key={exam}
                    onClick={() => handleExamToggle(exam)}
                    className={`p-4 rounded-lg border-2 text-left transition-all font-semibold ${
                      formData.examGoals.includes(exam)
                        ? "border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700"
                        : "border-gray-300 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{exam}</span>
                      {formData.examGoals.includes(exam) && (
                        <span className="text-orange-600">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-400 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-green-500 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent mb-2">Learning Preferences 🌟</h2>
                <p className="text-gray-700 font-semibold">Help us customize your experience</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Preferred Language
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setFormData(prev => ({ ...prev, preferredLanguage: lang }))}
                      className={`p-3 rounded-lg border-2 transition-all font-semibold ${
                        formData.preferredLanguage === lang
                          ? "border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700"
                          : "border-gray-300 hover:border-orange-300 hover:bg-orange-50"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Fitness Interest
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {fitnessOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => setFormData(prev => ({ ...prev, fitnessGoals: option }))}
                      className={`p-3 rounded-lg border-2 transition-all font-semibold ${
                        formData.fitnessGoals === option
                          ? "border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700"
                          : "border-gray-300 hover:border-orange-300 hover:bg-orange-50"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-400 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-green-500 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all"
                >
                  Next
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Mental Health */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Mental Wellness 🧘</h2>
                <p className="text-gray-600">Take care of your mind along with your studies</p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <span className="text-3xl">🧠</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Mental Health & Wellness Support
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Access guided meditation, stress management techniques, motivation sessions, 
                      and mental wellness content to support your academic journey.
                    </p>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.mentalHealthInterest}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          mentalHealthInterest: e.target.checked 
                        }))}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700">
                        Yes, I'm terested  mental wellness content
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-400 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-green-500 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all"
                >
                  Complete Setup 🚀
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
