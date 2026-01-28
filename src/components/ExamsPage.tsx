import { useState } from "react";
import YouTubePlayer from "./YouTubePlayer";
import { getEmbedUrlFromLocalPath } from "../lib/youtube-utils";

interface ExamCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
  subjects: string[];
  timeline: string;
}

interface SubjectVideo {
  id: string;
  title: string;
  subject: string;
  topic: string;
  videoPath: string;
  duration: string;
  description?: string;
  examId: string;
}

const examCategories: ExamCategory[] = [
  {
    id: "jee-mains",
    name: "JEE Mains",
    emoji: "⚙️",
    description: "Engineering entrance exam",
    subjects: ["Physics", "Chemistry", "Mathematics"],
    timeline: "12-16 months"
  },
  {
    id: "jee-advanced",
    name: "JEE Advanced",
    emoji: "🔧",
    description: "Top-tier engineering entrance",
    subjects: ["Physics", "Chemistry", "Mathematics"],
    timeline: "6-8 months (after JEE Mains)"
  },
  {
    id: "neet",
    name: "NEET",
    emoji: "🏥",
    description: "Medical entrance exam",
    subjects: ["Physics", "Chemistry", "Biology"],
    timeline: "12-18 months"
  },
  {
    id: "nda",
    name: "NDA",
    emoji: "🪖",
    description: "National Defence Academy",
    subjects: ["Mathematics", "GAT"],
    timeline: "8-12 months"
  },
  {
    id: "cuet",
    name: "CUET",
    emoji: "🎓",
    description: "Central University Entrance Test",
    subjects: ["Accountancy", "Chemistry", "English", "History", "Physics"],
    timeline: "6-10 months"
  },
  {
    id: "upsc",
    name: "UPSC",
    emoji: "🏛️",
    description: "Union Public Service Commission",
    subjects: ["Constitution", "Culture", "Economy", "History"],
    timeline: "12-18 months"
  }
];

// Subject videos data - including Organic Chemistry and Inorganic Chemistry videos
const subjectVideos: SubjectVideo[] = [
  // JEE MAINS VIDEOS
  // Organic Chemistry Videos (from JEE_Organin_Videos folder)
  {
    id: "org-chem-1",
    title: "Complete Organic Chemistry JEE main",
    subject: "Chemistry",
    topic: "Organic Chemistry",
    videoPath: "/JEE_Organin_Videos/1.mp4",
    duration: "6hr 38min",
    description: "Complete organic chemistry course for JEE Main preparation",
    examId: "jee-mains"
  },
  // Inorganic Chemistry Videos (from JEE_Inorganic_Videos folder)
  {
    id: "inorg-chem-1",
    title: "Complete organic Chemistry  one shot",
    subject: "Chemistry",
    topic: "Inorganic Chemistry",
    videoPath: "/JEE_Inorganic_Videos/1.mp4",
    duration: "10hr 45min",
    description: "Complete inorganic chemistry course for JEE Main preparation",
    examId: "jee-mains"
  },
  // Physical Chemistry Videos (from JEE_Physical_Videos folder)
  {
    id: "phys-chem-1",
    title: "Complete Physical Chemistry JEE main",
    subject: "Chemistry",
    topic: "Physical Chemistry",
    videoPath: "/JEE_Physical_Videos/1.mp4",
    duration: "6hr 25min",
    description: "Complete physical chemistry course for JEE Main preparation",
    examId: "jee-mains"
  },
  // Mathematics Videos (from JEE_Maths_Videos folder)
  {
    id: "maths-jee-1",
    title: "complete maths  one shot for JEE mas",
    subject: "Mathematics",
    topic: "Mathematics",
    videoPath: "/JEE_Maths_Videos/1.mp4",
    duration: "10hr 9min",
    description: "Complete mathematics course for JEE Main preparation",
    examId: "jee-mains"
  },
  // Physics Videos (from JEE_Physics_Videos folder)
  {
    id: "phys-jee-1",
    title: "Complete Physics  one shot for JEE mas",
    subject: "Physics",
    topic: "Physics",
    videoPath: "/JEE_Physics_Videos/1.mp4",
    duration: "9hr 7min",
    description: "Complete physics course for JEE Main preparation",
    examId: "jee-mains"
  },
  
  // JEE ADVANCED VIDEOS
  // Organic Chemistry Videos (from JEE_Organin_Videos folder)
  {
    id: "org-chem-adv-1",
    title: "Complete Organic Chemistry JEE Advance",
    subject: "Chemistry",
    topic: "Organic Chemistry",
    videoPath: "/JEE_Organin_Videos/1.mp4",
    duration: "6hr 38min",
    description: "Complete organic chemistry course for JEE Advance preparation",
    examId: "jee-advanced"
  },
  // Inorganic Chemistry Videos (from JEE_Inorganic_Videos folder)
  {
    id: "inorg-chem-adv-1",
    title: "Complete organic Chemistry  one shot for JEE Advance",
    subject: "Chemistry",
    topic: "Inorganic Chemistry",
    videoPath: "/JEE_Inorganic_Videos/1.mp4",
    duration: "10hr 45min",
    description: "Complete inorganic chemistry course for JEE Advance preparation",
    examId: "jee-advanced"
  },
  // Physical Chemistry Videos (from JEE_Physical_Videos folder)
  {
    id: "phys-chem-adv-1",
    title: "Complete Physical Chemistry JEE Advance",
    subject: "Chemistry",
    topic: "Physical Chemistry",
    videoPath: "/JEE_Physical_Videos/1.mp4",
    duration: "6hr 25min",
    description: "Complete physical chemistry course for JEE Advance preparation",
    examId: "jee-advanced"
  },
  // Mathematics Videos (from JEE_Maths_Videos folder)
  {
    id: "maths-jee-adv-1",
    title: "complete maths  one shot for JEE Advance",
    subject: "Mathematics",
    topic: "Mathematics",
    videoPath: "/JEE_Maths_Videos/1.mp4",
    duration: "10hr 9min",
    description: "Complete mathematics course for JEE Advance preparation",
    examId: "jee-advanced"
  },
  // Physics Videos (from JEE_Physics_Videos folder)
  {
    id: "phys-jee-adv-1",
    title: "Complete Physics  one shot for JEE Advance",
    subject: "Physics",
    topic: "Physics",
    videoPath: "/JEE_Physics_Videos/1.mp4",
    duration: "9hr 7min",
    description: "Complete physics course for JEE Advance preparation",
    examId: "jee-advanced"
  },
  
  // NEET VIDEOS
  // Biology Videos (from NEET_Biology_Videos folder)
  {
    id: "bio-neet-1",
    title: "Complete Biology  one shot for NEET",
    subject: "Biology",
    topic: "Biology",
    videoPath: "/NEET_Biology_Videos/1.mp4",
    duration: "9hr 43min",
    description: "Complete biology course for NEET preparation",
    examId: "neet"
  },
  // Chemistry Videos (from NEET_Chemistry_Videos folder)
  {
    id: "chem-neet-1",
    title: "Complete Chemistry  one shot for NEET",
    subject: "Chemistry",
    topic: "Chemistry",
    videoPath: "/NEET_Chemistry_Videos/1.mp4",
    duration: "6hr 18min",
    description: "Complete chemistry course for NEET preparation",
    examId: "neet"
  },
  // Physics Videos (from NEET_Physics_Videos folder)
  {
    id: "phys-neet-1",
    title: "Complete Physics  one shot for NEET",
    subject: "Physics",
    topic: "Physics",
    videoPath: "/NEET_Physics_Videos/1.mp4",
    duration: "8hr 29min",
    description: "Complete physics course for NEET preparation",
    examId: "neet"
  },
  
  // NDA VIDEOS
  // Mathematics Videos (from NDA_Maths_Videos folder)
  {
    id: "maths-nda-1",
    title: "Complete Mathematics  one shot for NDA",
    subject: "Mathematics",
    topic: "Mathematics",
    videoPath: "/NDA_Maths_Videos/1.mp4",
    duration: "10hr 29min",
    description: "Complete mathematics course for NDA preparation",
    examId: "nda"
  },
  // GAT Videos (from NDA_GAT_Videos folder)
  {
    id: "gat-nda-1",
    title: "Complete GAT  one shot for NDA",
    subject: "GAT",
    topic: "GAT",
    videoPath: "/NDA_GAT_Videos/1.mp4",
    duration: "10hr 29min",
    description: "Complete GAT course for NDA preparation",
    examId: "nda"
  },
  
  // CUET VIDEOS
  // Accountancy Videos (from CUET_Accountancy_Videos folder)
  {
    id: "acc-cuet-1",
    title: "Complete Accountancy  one shot for CUET",
    subject: "Accountancy",
    topic: "Accountancy",
    videoPath: "/CUET_Accountancy_Videos/1.mp4",
    duration: "2hr 4min",
    description: "Complete accountancy course for CUET preparation",
    examId: "cuet"
  },
  // Chemistry Videos (from CUET_Chemistry_Videos folder)
  {
    id: "chem-cuet-1",
    title: "Complete Chemistry  one shot for CUET",
    subject: "Chemistry",
    topic: "Chemistry",
    videoPath: "/CUET_Chemistry_Videos/1.mp4",
    duration: "4hr 34min",
    description: "Complete chemistry course for CUET preparation",
    examId: "cuet"
  },
  // English Videos (from CUET_English_Videos folder)
  {
    id: "eng-cuet-1",
    title: "Complete English  one shot for CUET",
    subject: "English",
    topic: "English",
    videoPath: "/CUET_English_Videos/1.mp4",
    duration: "3hr 52min",
    description: "Complete english course for CUET preparation",
    examId: "cuet"
  },
  // History Videos (from CUET_History_Videos folder)
  {
    id: "hist-cuet-1",
    title: "Complete History  one shot for CUET",
    subject: "History",
    topic: "History",
    videoPath: "/CUET_History_Videos/1.mp4",
    duration: "3hr 34min",
    description: "Complete history course for CUET preparation",
    examId: "cuet"
  },
  // Physics Videos (from CUET_Physics_Videos folder)
  {
    id: "phys-cuet-1",
    title: "Complete Physics  one shot for CUET",
    subject: "Physics",
    topic: "Physics",
    videoPath: "/CUET_Physics_Videos/1.mp4",
    duration: "3hr 48min",
    description: "Complete physics course for CUET preparation",
    examId: "cuet"
  },
  
  // UPSC VIDEOS
  // Constitution Videos (from UPSC_Constitution_Videos folder)
  {
    id: "const-upsc-1",
    title: "Complete Constitution  one shot for UPSC",
    subject: "Constitution",
    topic: "Constitution",
    videoPath: "/UPSC_Constitution_Videos/1.mp4",
    duration: "3hr 35min",
    description: "Complete constitution course for UPSC preparation",
    examId: "upsc"
  },
  // Culture Videos (from UPSC_Culture_Videos folder)
  {
    id: "cult-upsc-1",
    title: "Complete Culture  one shot for UPSC",
    subject: "Culture",
    topic: "Culture",
    videoPath: "/UPSC_Culture_Videos/1.mp4",
    duration: "7hr 54min",
    description: "Complete culture course for UPSC preparation",
    examId: "upsc"
  },
  // Economy Videos (from UPSC_Economy_Videos folder)
  {
    id: "econ-upsc-1",
    title: "Complete Economy  one shot for UPSC",
    subject: "Economy",
    topic: "Economy",
    videoPath: "/UPSC_Economy_Videos/1.mp4",
    duration: "7hr 2min",
    description: "Complete economy course for UPSC preparation",
    examId: "upsc"
  },
  // History Videos (from UPSC_History_Videos folder)
  {
    id: "hist-upsc-1",
    title: "Complete History  one shot for UPSC",
    subject: "History",
    topic: "History",
    videoPath: "/UPSC_History_Videos/1.mp4",
    duration: "11hr 27min",
    description: "Complete history course for UPSC preparation",
    examId: "upsc"
  }
];

export default function ExamsPage() {
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [playingVideoId, setPlayingVideoId] = useState<string>("");

  const selectedExam = examCategories.find(e => e.id === selectedExamId);
  
  // Get unique topics for selected subject and exam
  const topics = selectedSubject && selectedExamId
    ? [...new Set(subjectVideos
        .filter(v => v.subject === selectedSubject && v.examId === selectedExamId)
        .map(v => v.topic))]
    : [];
  
  // Filter videos based on subject, topic, and exam
  const filteredVideos = selectedSubject && selectedTopic && selectedExamId
    ? subjectVideos.filter(video => 
        video.subject === selectedSubject && video.topic === selectedTopic && video.examId === selectedExamId
      )
    : [];
  
  const playingVideo = subjectVideos.find(v => v.id === playingVideoId);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header with attractive background */}
      <div className="mb-8 bg-gradient-to-r from-orange-50 via-red-50 to-orange-50 rounded-2xl p-8 border-2 border-orange-200">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">🎯 Competitive Exams</h1>
        <p className="text-gray-600 text-lg">
          Comprehensive preparation for 7 major competitive exams with detailed overviews, subjects, and timelines
        </p>
      </div>

      {/* Exam Selection */}
      {!selectedExamId && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">📝 Select Your Competitive Exam</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {examCategories.map((exam) => (
              <button
                key={exam.id}
                onClick={() => setSelectedExamId(exam.id)}
                className="p-6 border-2 border-orange-200 rounded-xl hover:border-green-500 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 hover:shadow-xl transition-all text-center group"
              >
                <span className="text-4xl block mb-3">{exam.emoji}</span>
                <h3 className="font-bold text-gray-900 group-hover:text-green-700 text-lg mb-1">
                  {exam.name}
                </h3>
                <p className="text-xs text-gray-600 mb-3">{exam.description}</p>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded font-semibold">
                    {exam.subjects.length} Subjects
                  </span>
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded font-semibold">
                    {exam.timeline}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exam Details */}
      {selectedExamId && selectedExam && (
        <div className="space-y-6">
          {/* Exam Info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="text-5xl">{selectedExam.emoji}</div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{selectedExam.name}</h2>
                  <p className="text-gray-600 text-sm">{selectedExam.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedExamId("")}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ← Back to Exams
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Overview */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Exam Overview</h3>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {selectedExam.name} is a comprehensive entrance examination designed to assess your proficiency 
                      across multiple subjects. This exam requires dedicated preparation and strategic planning.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">📚 Subjects Covered:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedExam.subjects.map((subject, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedSubject(subject);
                            setSelectedTopic("");
                            setPlayingVideoId("");
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedSubject === subject
                              ? "bg-green-600 text-white shadow-lg"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          }`}
                        >
                          {subject}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">⏱️ Preparation Timeline:</h4>
                    <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
                      <p className="text-gray-900 font-medium">{selectedExam.timeline}</p>
                      <p className="text-gray-600 text-sm mt-1">Recommended duration for comprehensive preparation</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">🎯 Preparation Strategy:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start space-x-3">
                        <span className="text-blue-600 font-bold">1.</span>
                        <span className="text-gray-700">Understand the exam pattern and syllabus thoroughly</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="text-blue-600 font-bold">2.</span>
                        <span className="text-gray-700">Study each subject systematically with focus on concepts</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="text-blue-600 font-bold">3.</span>
                        <span className="text-gray-700">Practice previous year questions and mock tests</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="text-blue-600 font-bold">4.</span>
                        <span className="text-gray-700">Analyze performance and focus on weak areas</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="text-blue-600 font-bold">5.</span>
                        <span className="text-gray-700">Revise regularly and maintain discipline</span>
                      </li>
                    </ul>
                  </div>

                  {/* Video Tutorials Section */}
                  {selectedSubject && (
                    <div className="border-t-2 border-gray-200 pt-6">
                      {/* Topic Selection */}
                      {topics.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3">📖 Topics</h4>
                          <div className="flex flex-wrap gap-2">
                            {topics.map((topic) => (
                              <button
                                key={topic}
                                onClick={() => {
                                  setSelectedTopic(topic);
                                  setPlayingVideoId("");
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                  selectedTopic === topic
                                    ? "bg-purple-600 text-white shadow-lg"
                                    : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                                }`}
                              >
                                {topic}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* YouTube Video Player - Embedded */}
                      {playingVideoId && playingVideo && playingVideo.videoPath && (
                        <div className="mb-6">
                          {(() => {
                            const embedUrl = getEmbedUrlFromLocalPath(playingVideo.videoPath);
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
                      {selectedTopic && filteredVideos.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4">🎬 {selectedTopic} Videos</h4>
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
                                        {video.description && (
                                          <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                                        )}
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

                      {/* Select topic prompt */}
                      {selectedSubject && !selectedTopic && (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-600 text-sm">👆 Select a topic above to view videos</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4">
                  <div className="text-3xl font-bold mb-1">7</div>
                  <p className="text-blue-100 text-sm">Major Exam Categories</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4">
                  <div className="text-3xl font-bold mb-1">{selectedExam.subjects.length}</div>
                  <p className="text-green-100 text-sm">Core Subjects</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-4">
                  <div className="text-lg font-semibold mb-1">Preparation</div>
                  <p className="text-orange-100 text-sm">{selectedExam.timeline}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4">
                  <div className="text-sm font-semibold">✅ Ready to Start?</div>
                  <button className="mt-2 w-full bg-white text-purple-600 py-2 rounded-lg font-medium text-sm hover:bg-purple-50 transition">
                    Begin Preparation
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
