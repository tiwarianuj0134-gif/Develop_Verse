import { useState, useRef, useEffect } from "react";
import { getGeminiResponse, isEducationalQuery } from "../lib/gemini-api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Namaste! 🙏 I'm AI Baba, your Develop Verse guide. Where knowledge makes you powerful, discipline makes you unstoppable. How can I help you today?",
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        chatWindowRef.current &&
        !chatWindowRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const getAIResponse = async (userMessage: string): Promise<string> => {
    // Check if it's an educational query
    if (!isEducationalQuery(userMessage)) {
      return "I'm here to help you with your studies and personal development! Ask me about academics, exams, fitness, or wellness instead. 😊";
    }

    try {
      // Use Gemini AI for intelligent responses
      const response = await getGeminiResponse(userMessage);
      return response;
    } catch (error) {
      console.error('AI Response Error:', error);
      
      // Fallback to basic responses if Gemini fails
      return getFallbackResponse(userMessage);
    }
  };

  const getFallbackResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Greeting responses
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey") || lowerMessage.includes("namaste")) {
      return "Namaste! 🙏 I'm AI Baba, your study companion at Develop Verse.\n\n🏠 **Complete Learning Platform:**\n📚 **Academics** - Classes 9-12 with video lessons\n🎯 **Exams** - JEE, NEET, UPSC, NDA, CUET prep\n💪 **Fitness** - Student workout plans\n🧘 **Wellness** - Mental health & meditation\n♟️ **Chess** - AI-powered strategic thinking\n\n**Navigation:** Use the colorful menu bar or Dashboard quick access!\n\nWhat would you like to explore today?";
    }

    // Website/Platform questions
    if (lowerMessage.includes("website") || lowerMessage.includes("platform") || lowerMessage.includes("develop verse") || lowerMessage.includes("how to use")) {
      return "🎓 **Welcome to Develop Verse - Your Complete Learning Hub!**\n\n**🏠 DASHBOARD** - Your command center:\n• Real-time progress tracking\n• Study streak counter\n• Quick access to all sections\n\n**📚 ACADEMICS** - Classes 9-12:\n• All streams: Science, Commerce, Arts\n• YouTube video lessons\n• NCERT-aligned content\n\n**🎯 EXAMS** - Competitive preparation:\n• JEE, NEET, UPSC, NDA, CUET\n• Subject-wise tutorials\n• Preparation strategies\n\n**💪 FITNESS** - Student wellness:\n• 3 difficulty levels\n• 7-day workout plans\n• Progress tracking\n\n**🧘 WELLNESS** - Mental health:\n• Meditation & stress relief\n• Focus enhancement\n\n**♟️ CHESS** - Strategic thinking with AI\n\n**Navigation:** Click the menu items or use Dashboard buttons!\n\nWhich section interests you most?";
    }

    // Study help
    if (lowerMessage.includes("study") || lowerMessage.includes("learn")) {
      return "Great! I love helping students with their studies! 📚\n\n**📖 Study Resources on Develop Verse:**\n• **Academics Section** - Video lessons for all subjects\n• **Exams Section** - Competitive exam preparation\n• **Dashboard** - Track your study progress\n• **Wellness** - Meditation breaks for better focus\n\n**🎯 Study Techniques:**\n• Pomodoro method (25 min study + 5 min break)\n• Active recall and spaced repetition\n• Use video lessons for visual learning\n• Track progress on Dashboard\n\n**📍 Quick Access:** Dashboard → Academics → Select Class → Choose Subject\n\nWhat specific topic or subject do you need help with?";
    }

    // Exam related
    if (lowerMessage.includes("exam") || lowerMessage.includes("jee") || lowerMessage.includes("neet")) {
      return "Excellent! Competitive exam preparation is my specialty! 🎯\n\n**🏆 Available on Develop Verse:**\n• **JEE Main/Advanced** - Engineering entrance\n• **NEET** - Medical entrance  \n• **UPSC** - Civil services\n• **NDA** - Defence academy\n• **CUET** - University entrance\n\n**📹 Each exam includes:**\n• Subject-wise video tutorials\n• Preparation strategies & timelines\n• Expert guidance and tips\n\n**📍 Access:** Dashboard → Exams → Select Your Target Exam\n\nWhich exam are you preparing for? I'll guide you to the right resources!";
    }

    // Platform info
    if (lowerMessage.includes("dashboard") || lowerMessage.includes("navigation") || lowerMessage.includes("menu")) {
      return "🏠 **Dashboard - Your Learning Command Center!**\n\n**✨ Key Features:**\n• **Progress Tracking** - See your daily completion %\n• **Study Streak** - 7-day learning consistency\n• **Quick Access** - One-click navigation to all sections\n• **Today's Plan** - Task management system\n• **Continue Learning** - Resume recent activities\n\n**🎯 Navigation Tips:**\n• Use colorful menu bar at top\n• Click Dashboard quick access buttons\n• All sections are just one click away!\n\n**📱 Available Sections:**\nAcademics • Exams • Fitness • Wellness • Chess\n\n**💡 Pro tip:** Your Dashboard updates automatically as you complete activities!\n\nWhich section would you like to explore first?";
    }

    // Default helpful response
    return "I'm AI Baba, your educational mentor with complete Develop Verse knowledge! 🤖\n\n**🎓 I can help you with:**\n• 📚 **Academics** - Classes 9-12 study guidance\n• 🎯 **Exams** - JEE, NEET, UPSC preparation\n• 💪 **Fitness** - Student workout plans\n• 🧘 **Wellness** - Stress management & meditation\n• ♟️ **Chess** - Strategic thinking games\n• 🏠 **Platform** - How to use Develop Verse features\n\n**🎯 Ask me questions like:**\n• \"How to access Physics videos?\"\n• \"What's in the Fitness section?\"\n• \"How does Dashboard tracking work?\"\n• \"Which exam prep is available?\"\n\n**📍 Navigation:** Use the menu bar or Dashboard quick access buttons!\n\nWhat can I help you with today? 😊";
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsTyping(true);

    try {
      // Get AI response using Gemini API
      const aiResponseText = await getAIResponse(currentInput);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponseText,
        timestamp: Date.now(),
      };
      
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Fallback message if everything fails
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having some technical difficulties right now. Please try again in a moment! 😊",
        timestamp: Date.now(),
      };
      
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-50 bg-gradient-to-r from-orange-500 to-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          aria-label="Open AI Baba Chat"
        >
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🤖</span>
            <span className="font-semibold hidden sm:inline">AI Baba</span>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          ref={chatWindowRef}
          className="fixed bottom-6 left-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col border-2 border-gray-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-green-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="font-bold">AI Baba</h3>
                <p className="text-xs text-orange-100">Develop Verse Guide</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              aria-label="Close chat"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-md"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-md">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about studies, exams, fitness..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="bg-gradient-to-r from-orange-500 to-green-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
