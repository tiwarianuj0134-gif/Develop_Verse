import { useState } from "react";
import YouTubePlayer from "./YouTubePlayer";
import { getYouTubeEmbedUrl } from "../lib/youtube-utils";

interface ClassOption {
  id: string;
  name: string;
  description: string;
  emoji: string;
  subjects: string[];
  timeline: string;
}

interface SubjectVideo {
  id: string;
  title: string;
  subject: string;
  videoUrl: string;
  description: string;
  classId: string;
}

const subjectMap: { [key: string]: { icon: string; color: string } } = {
  "Mathematics": { icon: "🔢", color: "#3b82f6" },
  "Physics": { icon: "⚛️", color: "#ec4899" },
  "Chemistry": { icon: "🧪", color: "#8b5cf6" },
  "Biology": { icon: "🦠", color: "#06b6d4" },
  "Science": { icon: "🔬", color: "#10b981" },
  "English": { icon: "📖", color: "#f59e0b" },
  "Hindi": { icon: "🇮🇳", color: "#ef4444" },
  "Social Science": { icon: "🌍", color: "#10b981" },
  "History": { icon: "📜", color: "#b45309" },
  "Geography": { icon: "🗺️", color: "#059669" },
  "Political Science": { icon: "⚖️", color: "#6366f1" },
  "Economics": { icon: "💹", color: "#0891b2" },
  "Accountancy": { icon: "📊", color: "#7c3aed" },
  "Business Studies": { icon: "💼", color: "#059669" },
};

const classOptions: ClassOption[] = [
  { 
    id: "9", 
    name: "Class 9", 
    description: "Foundation Building", 
    emoji: "🌱", 
    subjects: ["Mathematics", "Science", "English", "Hindi", "Social Science"],
    timeline: "Foundation Year"
  },
  { 
    id: "10", 
    name: "Class 10", 
    description: "Board Foundation", 
    emoji: "📚", 
    subjects: ["Mathematics", "Science", "English", "Hindi", "Social Science"],
    timeline: "Board Exam Year"
  },
  { 
    id: "11-science", 
    name: "Class 11 Science", 
    description: "Science Stream", 
    emoji: "🔬", 
    subjects: ["Physics", "Chemistry", "Biology", "Mathematics", "English"],
    timeline: "Pre-Board Year"
  },
  { 
    id: "11-commerce", 
    name: "Class 11 Commerce", 
    description: "Commerce Stream", 
    emoji: "💼", 
    subjects: ["Accountancy", "Economics", "Business Studies", "English", "Mathematics"],
    timeline: "Pre-Board Year"
  },
  { 
    id: "11-arts", 
    name: "Class 11 Arts", 
    description: "Arts Stream", 
    emoji: "🎨", 
    subjects: ["History", "Geography", "Political Science", "Economics", "English"],
    timeline: "Pre-Board Year"
  },
  { 
    id: "12-science", 
    name: "Class 12 Science", 
    description: "Science Stream", 
    emoji: "🔭", 
    subjects: ["Physics", "Chemistry", "Biology", "Mathematics", "English"],
    timeline: "Board Exam Year"
  },
  { 
    id: "12-commerce", 
    name: "Class 12 Commerce", 
    description: "Commerce Stream", 
    emoji: "📊", 
    subjects: ["Accountancy", "Economics", "Business Studies", "English"],
    timeline: "Board Exam Year"
  },
  { 
    id: "12-arts", 
    name: "Class 12 Arts", 
    description: "Arts Stream", 
    emoji: "📖", 
    subjects: ["History", "Geography", "Political Science", "Economics", "English"],
    timeline: "Board Exam Year"
  },
];

const subjectVideos: SubjectVideo[] = [
  // Class 9 Videos
  { id: "v-9-1", title: "Complete Mathematics Course - Class 9", subject: "Mathematics", videoUrl: "https://www.youtube.com/live/35IP0ggmkjM?si=sO7oXMtqw6k5MAn9", description: "Algebra, Geometry, Trigonometry basics", classId: "9" },
  { id: "v-9-2", title: "Complete Science Course - Class 9", subject: "Science", videoUrl: "https://www.youtube.com/live/ebWSohpyoKs?si=1-whI74ntLuA5L-w", description: "Physics, Chemistry, Biology fundamentals", classId: "9" },
  { id: "v-9-3", title: "Complete English Course - Class 9", subject: "English", videoUrl: "https://youtu.be/0VAkuxxCvnI?si=xqfAgyEdESq8KZvN", description: "Literature, Grammar, Communication", classId: "9" },
  { id: "v-9-4", title: "Complete Hindi Course - Class 9", subject: "Hindi", videoUrl: "https://www.youtube.com/live/rkfThHzr9Cg?si=wfQp3_iGRuflbc9z", description: "Grammar, Literature, Composition", classId: "9" },
  { id: "v-9-5", title: "Complete Social Science Course - Class 9", subject: "Social Science", videoUrl: "https://www.youtube.com/live/PO0ZncbzEmM?si=EKmQah12TQRaETJu", description: "History, Geography, Civics", classId: "9" },
  
  // Class 10 Videos
  { id: "v-10-1", title: "Complete Mathematics Course - Class 10", subject: "Mathematics", videoUrl: "https://www.youtube.com/live/VkcAiDhJAsY?si=5dZ22LOr0mSRNf23", description: "Algebra, Geometry, Trigonometry, Statistics", classId: "10" },
  { id: "v-10-2", title: "Complete Science Course - Class 10", subject: "Science", videoUrl: "https://youtu.be/PFIEngxrsPY?si=cA5YoN8J8IYBiDFX", description: "Physics, Chemistry, Biology advanced", classId: "10" },
  { id: "v-10-3", title: "Complete English Course - Class 10", subject: "English", videoUrl: "https://youtu.be/2uH9d_7uoyA?si=yVRyvr76VikdWB5R", description: "Literature, Grammar, Writing skills", classId: "10" },
  { id: "v-10-4", title: "Complete Hindi Course - Class 10", subject: "Hindi", videoUrl: "https://youtu.be/-7war963jLQ?si=YosS6xVFtOSAtX7r", description: "Grammar, Literature, Communication", classId: "10" },
  { id: "v-10-5", title: "Complete Social Science Course - Class 10", subject: "Social Science", videoUrl: "https://youtu.be/F95MS4lAmFo?si=Ccn47_lsEGhn5DaW", description: "History, Geography, Civics, Economics", classId: "10" },
  
  // Class 11 Science Videos
  { id: "v-11sci-1", title: "Complete Physics Course - Class 11", subject: "Physics", videoUrl: "https://www.youtube.com/live/MCFrSja9aBI?si=oLG9CwSs9GspWMbP", description: "Mechanics, Waves, Electricity, Optics", classId: "11-science" },
  { id: "v-11sci-2", title: "Complete Chemistry Course - Class 11", subject: "Chemistry", videoUrl: "https://youtu.be/r81DgNDaz6Y?si=howOBC-wQBQVm3_A", description: "Atomic structure, Bonding, Reactions", classId: "11-science" },
  { id: "v-11sci-3", title: "Complete Biology Course - Class 11", subject: "Biology", videoUrl: "https://www.youtube.com/live/ag0-UKanJbo?si=ewn7yiFQ-Da95x4z", description: "Cell biology, Genetics, Ecology", classId: "11-science" },
  { id: "v-11sci-4", title: "Complete Mathematics Course - Class 11", subject: "Mathematics", videoUrl: "https://www.youtube.com/live/pUbswqWsOI0?si=LIFtFmGCCFVE4HeX", description: "Calculus, Algebra, Trigonometry", classId: "11-science" },
  { id: "v-11sci-5", title: "Complete English Course - Class 11", subject: "English", videoUrl: "https://youtu.be/GjXMdGY7Ke4?si=8aS36RljlSZke5Ws", description: "Literature, Writing, Communication", classId: "11-science" },
  
  // Class 11 Commerce Videos
  { id: "v-11com-1", title: "Complete Accountancy Course - Class 11", subject: "Accountancy", videoUrl: "https://www.youtube.com/live/QIHbsjEmdoY?si=qjZr6YH8dr8C6lbk", description: "Journal, Ledger, Trial Balance", classId: "11-commerce" },
  { id: "v-11com-2", title: "Complete Economics Course - Class 11", subject: "Economics", videoUrl: "https://www.youtube.com/live/F2OIY3Jx8h0?si=SXXjqiD7v8KABmwd", description: "Micro, Macro, Indian Economy", classId: "11-commerce" },
  { id: "v-11com-3", title: "Complete Business Studies Course - Class 11", subject: "Business Studies", videoUrl: "https://youtu.be/dPI651wjBXU?si=1qfbQ5dGatuQBR42", description: "Management, Entrepreneurship", classId: "11-commerce" },
  { id: "v-11com-4", title: "Complete English Course - Class 11", subject: "English", videoUrl: "https://youtu.be/GjXMdGY7Ke4?si=8aS36RljlSZke5Ws", description: "Literature, Writing, Communication", classId: "11-commerce" },
  { id: "v-11com-5", title: "Complete Mathematics Course - Class 11", subject: "Mathematics", videoUrl: "https://youtu.be/AzUnbPcNwkA?si=83KhKu_Inex4YnLC", description: "Sets, Relations, Functions", classId: "11-commerce" },
  
  // Class 12 Science Videos
  { id: "v-12sci-1", title: "Complete Physics Course - Class 12", subject: "Physics", videoUrl: "https://www.youtube.com/live/ZQKkUA8MgsE?si=wTTAkPo6BheTEYEV", description: "Electromagnetism, Modern physics, Optics", classId: "12-science" },
  { id: "v-12sci-2", title: "Complete Chemistry Course - Class 12", subject: "Chemistry", videoUrl: "https://www.youtube.com/live/hi6aHdmH3oI?si=U0LyUflKzAX-MMPR", description: "Organic, Inorganic, Physical chemistry", classId: "12-science" },
  { id: "v-12sci-3", title: "Complete Biology Course - Class 12", subject: "Biology", videoUrl: "https://www.youtube.com/live/G0oXZ8tUCbI?si=FJcDy3cUGQLkmO8G", description: "Human body, Genetics, Evolution", classId: "12-science" },
  { id: "v-12sci-4", title: "Complete Mathematics Course - Class 12", subject: "Mathematics", videoUrl: "https://www.youtube.com/live/7E4uQ5FPSZk?si=fKysoodpjXwPn_Jx", description: "Integration, Differential equations, Vectors", classId: "12-science" },
  { id: "v-12sci-5", title: "Complete English Course - Class 12", subject: "English", videoUrl: "https://www.youtube.com/live/oNdLZvFzTRU?si=3_mg5M1xZtSqzzsV", description: "Literature, Writing, Communication", classId: "12-science" },
  
  // Class 12 Commerce Videos
  { id: "v-12com-4", title: "Complete English Course - Class 12", subject: "English", videoUrl: "https://www.youtube.com/live/oNdLZvFzTRU?si=3_mg5M1xZtSqzzsV", description: "Literature, Writing, Communication", classId: "12-commerce" },
];

export default function AcademicsPage() {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [playingVideoId, setPlayingVideoId] = useState<string>("");

  const selectedClass = classOptions.find(c => c.id === selectedClassId);
  
  // Filter videos based on selected class and subject
  const filteredVideos = selectedClassId && selectedSubject
    ? subjectVideos.filter(video => 
        video.classId === selectedClassId && video.subject === selectedSubject
      )
    : [];
  
  const playingVideo = subjectVideos.find(v => v.id === playingVideoId);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header with attractive background */}
      <div className="mb-8 bg-gradient-to-r from-orange-100 via-white to-orange-100 rounded-2xl p-8 border-4 border-orange-400 shadow-xl">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-2">📚 Academics</h1>
        <p className="text-gray-700 text-lg font-semibold">
          Select your class and stream to access NCERT-aligned content, study roadmaps, and video tutorials
        </p>
      </div>

      {/* Class Selection */}
      {!selectedClassId && (
        <div className="bg-white rounded-2xl shadow-xl border-2 border-orange-200 p-8 mb-6">
          <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text mb-6">📖 Select Your Class & Stream</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {classOptions.map((classOpt) => (
              <button
                key={classOpt.id}
                onClick={() => setSelectedClassId(classOpt.id)}
                className="p-6 border-3 border-gray-300 rounded-2xl hover:border-green-500 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 hover:shadow-xl transition-all text-center group bg-gradient-to-br from-gray-50 to-white"
              >
                <span className="text-5xl block mb-3 group-hover:scale-125 transition-transform">{classOpt.emoji}</span>
                <span className="font-bold text-gray-900 group-hover:text-green-700 text-lg">{classOpt.name}</span>
                <p className="text-xs text-gray-600 mt-2 group-hover:text-green-600">{classOpt.description}</p>
                <div className="mt-3">
                  <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded font-semibold">
                    {classOpt.subjects.length} Subjects
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Class Details & Subject Selection */}
      {selectedClassId && selectedClass && (
        <div className="space-y-6">
          {/* Class Info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="text-5xl">{selectedClass.emoji}</div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{selectedClass.name}</h2>
                  <p className="text-gray-600 text-sm">{selectedClass.description}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedClassId("");
                  setSelectedSubject("");
                  setPlayingVideoId("");
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ← Back to Classes
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Overview */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Class Overview</h3>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {selectedClass.name} is designed to build strong foundations in core subjects. 
                      Our comprehensive video courses cover the complete NCERT syllabus with expert explanations.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">📚 Available Subjects:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedClass.subjects.map((subject, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedSubject(subject);
                            setPlayingVideoId("");
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedSubject === subject
                              ? "bg-green-600 text-white shadow-lg"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          }`}
                        >
                          {subjectMap[subject]?.icon} {subject}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">⏱️ Study Timeline:</h4>
                    <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
                      <p className="text-gray-900 font-medium">{selectedClass.timeline}</p>
                      <p className="text-gray-600 text-sm mt-1">Complete syllabus coverage with practice</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">🎯 Study Strategy:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start space-x-3">
                        <span className="text-blue-600 font-bold">1.</span>
                        <span className="text-gray-700">Watch complete video courses for conceptual clarity</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="text-blue-600 font-bold">2.</span>
                        <span className="text-gray-700">Take notes and practice problems regularly</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="text-blue-600 font-bold">3.</span>
                        <span className="text-gray-700">Solve NCERT exercises and previous year questions</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="text-blue-600 font-bold">4.</span>
                        <span className="text-gray-700">Regular revision and mock tests</span>
                      </li>
                    </ul>
                  </div>

                  {/* Video Tutorials Section */}
                  {selectedSubject && (
                    <div className="border-t-2 border-gray-200 pt-6">
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
                                title={playingVideo.title}
                                description={playingVideo.description}
                                onClose={() => setPlayingVideoId("")}
                              />
                            );
                          })()}
                        </div>
                      )}

                      {/* Videos List */}
                      {filteredVideos.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4">🎬 {selectedSubject} Video Courses</h4>
                          <div className="space-y-3">
                            {filteredVideos.map((video, index) => (
                              <div
                                key={video.id}
                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                  playingVideoId === video.id
                                    ? "border-purple-600 bg-purple-50"
                                    : "border-gray-200 bg-white hover:border-purple-400"
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      <span className="text-lg font-bold text-purple-600">{index + 1}</span>
                                      <div>
                                        <h5 className="font-semibold text-gray-900">{video.title}</h5>
                                        <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right ml-4">
                                    <button
                                      onClick={() => setPlayingVideoId(video.id)}
                                      className={`px-4 py-2 rounded font-medium text-sm transition ${
                                        playingVideoId === video.id
                                          ? "bg-purple-600 text-white"
                                          : "bg-purple-600 hover:bg-purple-700 text-white"
                                      }`}
                                    >
                                      {playingVideoId === video.id ? "▶ Playing" : "▶ Play"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Select subject prompt */}
                      {!selectedSubject && (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-600 text-sm">👆 Select a subject above to view video courses</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4">
                  <div className="text-3xl font-bold mb-1">8</div>
                  <p className="text-blue-100 text-sm">Class Options</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4">
                  <div className="text-3xl font-bold mb-1">{selectedClass.subjects.length}</div>
                  <p className="text-green-100 text-sm">Core Subjects</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-4">
                  <div className="text-lg font-semibold mb-1">Timeline</div>
                  <p className="text-orange-100 text-sm">{selectedClass.timeline}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4">
                  <div className="text-sm font-semibold">✅ Ready to Learn?</div>
                  <button className="mt-2 w-full bg-white text-purple-600 py-2 rounded-lg font-medium text-sm hover:bg-purple-50 transition">
                    Start Learning
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
