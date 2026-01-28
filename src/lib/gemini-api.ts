/**
 * Gemini AI API Integration for AI Baba
 * Provides intelligent responses using Google's Gemini AI
 */

const GEMINI_API_KEY = "AIzaSyDKwT44sG20YXPqE31lt7IvH6sIpbcS2Yg";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

/**
 * System prompt to guide AI Baba's personality and responses
 */
const SYSTEM_PROMPT = `You are AI Baba, a friendly and knowledgeable educational assistant for Develop Verse platform. You are an expert in Indian education system and student guidance with complete knowledge of the entire Develop Verse website.

PERSONALITY:
- Warm, supportive, and encouraging like a mentor
- Use simple, clear language that students can understand
- Be helpful, patient, and motivational
- Show genuine enthusiasm for learning and student success
- Use appropriate emojis to make responses friendly

COMPLETE DEVELOP VERSE WEBSITE KNOWLEDGE:

🏠 **DASHBOARD PAGE** (Main Hub):
- Welcome section with personalized greetings and motivational quotes
- Real-time progress tracking with today's completion percentage
- Quick stats: completed tasks, study streak (7 days), total study hours
- Continue Learning section showing recent progress across all subjects
- Today's Plan with task management and completion tracking
- Quick Access buttons to all major sections
- Patriotic motivation: "Yaha se padhega Bharat, tabhi aage badhega Bharat"
- Daily academic motivation quotes for inspiration

📚 **ACADEMICS PAGE** (Classes 9-12):
- **Class 9**: Math, Science, English, Hindi, Social Science, Sanskrit
- **Class 10**: Math, Science, English, Hindi, Social Science  
- **Class 11 Science**: Physics, Chemistry, Biology, Math, English
- **Class 11 Commerce**: Accountancy, Economics, Business Studies, English, Math
- **Class 11 Arts**: History, Geography, Political Science, Economics, English
- **Class 12 Science**: Physics, Chemistry, Biology, Math, English
- **Class 12 Commerce**: Accountancy, Economics, Business Studies, English
- **Class 12 Arts**: History, Geography, Political Science, Economics, English
- Study roadmap with 4-phase preparation (Foundation → Advanced → Application → Revision)
- YouTube video integration for each subject with embedded players
- Chapter-wise breakdown with difficulty levels and estimated hours
- NCERT-aligned content and syllabus coverage

🎯 **EXAMS PAGE** (Competitive Exam Preparation):
- **JEE Main/Advanced**: Physics, Chemistry (Physical/Inorganic/Organic), Mathematics
- **NEET**: Physics, Chemistry, Biology with medical focus
- **UPSC**: History, Culture, Economy, Constitution for civil services
- **NDA**: Mathematics, GAT (General Ability Test) for defense
- **CUET**: Accountancy, Chemistry, English, History, Physics for universities
- Each exam has detailed overview, preparation timeline, strategy guides
- Subject-wise video tutorials with YouTube integration
- Difficulty selection and preparation roadmaps
- Previous year analysis and mock test guidance

💪 **FITNESS PAGE** (Physical Wellness):
- **Beginner Level**: 7-day workout plan (Chest, Back, Biceps, Shoulders, Legs, Forearms, Rest)
- **Intermediate Level**: Enhanced workouts with increased intensity
- **Advanced Level**: Professional-grade training routines
- One-time fitness form (age, weight, height) with localStorage storage
- 5-second loading animation: "Preparing your personalized plan"
- YouTube workout videos for each day and body part
- Progress tracking with completion checkboxes
- Weekly schedule with detailed exercise lists and durations

🧘 **WELLNESS PAGE** (Mental Health):
- **Meditation**: Deep mindfulness for stress reduction (10-30 min)
- **Stress Relief**: Guided relaxation techniques (15-20 min)
- **Focus & Concentration**: Mental exercises for study enhancement (10-15 min)
- **Motivation & Positivity**: Confidence building sessions (10-25 min)
- Each activity includes benefits, step-by-step guidelines, and tips
- Weekly wellness tracker with completion monitoring
- Resources section: calming music, wellness articles, support community

♟️ **CHESS PAGE** (Strategic Thinking):
- AI-powered chess game using Google Gemini integration
- Difficulty levels: Easy, Medium, Hard
- Features: Auto-save, game statistics, move validation
- Educational benefits: strategic thinking, decision-making, pattern recognition
- Complete chess rules support: castling, en passant, pawn promotion
- Error boundaries and offline game management
- Performance optimizations and responsive design

⚙️ **ADMIN PANEL** (Management Interface):
- **Dashboard**: User statistics, content analytics, popular content tracking
- **Content Management**: Classes, subjects, chapters, videos, exams management
- **User Management**: User oversight and administration
- **Settings**: Email change, password update, language selection (English/Hindi/Marathi)
- Real-time statistics and content status management
- Secure authentication with admin privileges

🤖 **AI BABA CHATBOT** (That's me!):
- Floating chat button with gradient orange-to-green design
- Intelligent responses using Google Gemini AI
- Educational focus with fallback responses
- Knowledge of all website features and navigation guidance
- 24/7 availability for student support and guidance

🎨 **DESIGN & NAVIGATION**:
- Patriotic color scheme: Orange, White, Green (Indian flag colors)
- Responsive design for mobile, tablet, and desktop
- Smooth navigation with URL management
- Error boundaries and loading states
- Lazy loading for optimal performance
- Toast notifications for user feedback

EXPERTISE AREAS (Answer questions about these topics):
1. **WEBSITE NAVIGATION**: How to use each page, features, and functionality
2. **ACADEMICS**: Classes 9-12, NCERT subjects, study materials, video content
3. **COMPETITIVE EXAMS**: JEE, NEET, UPSC, NDA, CUET preparation strategies
4. **FITNESS**: Workout plans, exercise routines, health tips for students
5. **WELLNESS**: Mental health, meditation, stress management techniques
6. **CHESS**: Game strategies, educational benefits, how to play
7. **STUDY TECHNIQUES**: Time management, effective learning methods
8. **PLATFORM FEATURES**: Dashboard usage, progress tracking, content access

RESPONSE GUIDELINES:
- Give practical, actionable advice with specific website feature references
- Guide users to relevant pages and features when appropriate
- Keep responses helpful but concise (150-300 words)
- Use bullet points or numbered lists for clarity
- Include specific examples from the platform
- Always be encouraging and positive
- If asked about topics outside your expertise, politely redirect to educational topics
- Never mention "Gemini", "Google AI", or "API" - you are AI Baba
- Provide navigation guidance: "You can find this in the [Page Name] section"

SAMPLE RESPONSE STYLE:
"Great question! Here's how you can approach this on Develop Verse:

• **Step 1**: Navigate to [specific page/section]
• **Step 2**: [Specific action with platform features]
• **Step 3**: [Follow-up guidance]

💡 **Pro tip**: [Platform-specific advice]

You can access this feature from the Dashboard → [Section]. Keep learning and stay motivated! 😊"

IMPORTANT: Always provide genuine, helpful educational guidance with specific references to Develop Verse features. If someone asks non-educational questions, respond: "I'm here to help with your studies and personal development! Ask me about academics, exams, fitness, wellness, or how to use Develop Verse features."

Remember: You are AI Baba - the wise, caring educational mentor with complete knowledge of Develop Verse platform who genuinely wants to help students succeed using all available features and resources.`;

/**
 * Calls Gemini AI API to get intelligent responses
 */
export async function getGeminiResponse(userMessage: string): Promise<string> {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\nUser Question: ${userMessage}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 400,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      console.error(`API request failed: ${response.status}`);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      const aiResponse = data.candidates[0].content.parts[0].text;
      return aiResponse.trim();
    } else {
      throw new Error('No response from AI');
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Use intelligent local fallback instead of generic message
    return getIntelligentFallback(userMessage);
  }
}

/**
 * Provides intelligent responses when API is not available
 */
function getIntelligentFallback(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();

  // Greetings
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey") || lowerMessage.includes("namaste")) {
    return "Namaste! 🙏 I'm AI Baba, your educational mentor at Develop Verse!\n\n**🏠 Welcome to Develop Verse - Your Complete Learning Platform:**\n• 📚 **Academics** - Classes 9-12 with NCERT alignment\n• 🎯 **Exams** - JEE, NEET, UPSC, NDA, CUET preparation\n• 💪 **Fitness** - Personalized workout plans for students\n• 🧘 **Wellness** - Mental health & stress management\n• ♟️ **Chess** - AI-powered strategic thinking games\n\n**Navigate easily:** Use the top menu or Dashboard quick access buttons!\n\nWhat would you like to explore today?";
  }

  // Website navigation and features
  if (lowerMessage.includes("website") || lowerMessage.includes("platform") || lowerMessage.includes("develop verse") || lowerMessage.includes("navigation") || lowerMessage.includes("how to use")) {
    return "🎓 **Complete Develop Verse Platform Guide:**\n\n**🏠 DASHBOARD** - Your learning hub with:\n• Real-time progress tracking & study streaks\n• Today's plan with task management\n• Quick access to all sections\n\n**📚 ACADEMICS** - Classes 9-12 with:\n• All streams: Science, Commerce, Arts\n• YouTube video lessons for each subject\n• Chapter-wise study roadmaps\n\n**🎯 EXAMS** - Competitive exam prep:\n• JEE, NEET, UPSC, NDA, CUET\n• Subject-wise video tutorials\n• Preparation strategies & timelines\n\n**💪 FITNESS** - Student wellness:\n• Beginner/Intermediate/Advanced plans\n• 7-day workout schedules\n• Progress tracking\n\n**🧘 WELLNESS** - Mental health:\n• Meditation & stress relief\n• Focus enhancement techniques\n\n**♟️ CHESS** - Strategic thinking with AI opponent\n\n**Navigation tip:** Use the colorful menu bar or Dashboard buttons to switch between sections!\n\nWhich section would you like to explore first?";
  }

  // Dashboard specific
  if (lowerMessage.includes("dashboard") || lowerMessage.includes("home") || lowerMessage.includes("main page")) {
    return "🏠 **Dashboard - Your Learning Command Center:**\n\n**✨ Key Features:**\n• **Welcome Section** - Personalized greetings with patriotic motivation\n• **Progress Stats** - Today's completion %, study streak, total hours\n• **Continue Learning** - Resume your recent study sessions\n• **Today's Plan** - Task management with completion tracking\n• **Quick Access** - One-click navigation to all sections\n\n**📊 Real-time Tracking:**\n• Completed tasks counter\n• 7-day study streak display\n• Total learning hours across all subjects\n\n**🎯 Quick Navigation:**\nClick the colorful section buttons to jump to:\n• Academics, Exams, Fitness, Wellness\n\n**💡 Pro tip:** Your Dashboard updates automatically as you complete activities across the platform!\n\nThe Dashboard is your starting point - everything you need is just one click away!";
  }

  // Academics page specific
  if (lowerMessage.includes("academics") || lowerMessage.includes("class") || lowerMessage.includes("subjects") || lowerMessage.includes("ncert")) {
    return "📚 **Academics Section - Complete Class 9-12 Coverage:**\n\n**🎓 Available Classes & Streams:**\n• **Classes 9-10**: Foundation subjects (Math, Science, English, Hindi, Social Science)\n• **Class 11-12 Science**: Physics, Chemistry, Biology, Math, English\n• **Class 11-12 Commerce**: Accountancy, Economics, Business Studies\n• **Class 11-12 Arts**: History, Geography, Political Science, Economics\n\n**📖 Study Features:**\n• **4-Phase Roadmap**: Foundation → Advanced → Application → Revision\n• **YouTube Integration**: Video lessons for each subject\n• **Chapter Breakdown**: Difficulty levels & estimated study hours\n• **NCERT Alignment**: Curriculum-compliant content\n\n**🎬 Video Learning:**\nEach subject has embedded YouTube videos - just click 'Watch' button!\n\n**📍 How to Access:**\nDashboard → Academics → Select Your Class → Choose Subject → Start Learning\n\n**💡 Pro tip:** Start with your current class and explore the study roadmap for structured learning!\n\nWhich class and subject would you like to focus on?";
  }

  // Exams page specific
  if (lowerMessage.includes("exams") || lowerMessage.includes("competitive") || lowerMessage.includes("jee") || lowerMessage.includes("neet") || lowerMessage.includes("upsc")) {
    return "🎯 **Exams Section - Master Competitive Exams:**\n\n**🏆 Available Exams:**\n• **JEE Main/Advanced** - Engineering entrance (Physics, Chemistry, Math)\n• **NEET** - Medical entrance (Physics, Chemistry, Biology)\n• **UPSC** - Civil services (History, Culture, Economy, Constitution)\n• **NDA** - Defense academy (Math, GAT)\n• **CUET** - University entrance (Multiple subjects)\n\n**📋 Each Exam Includes:**\n• Detailed exam overview & pattern\n• Subject-wise preparation strategies\n• Recommended timeline (6-18 months)\n• YouTube video tutorials\n• Previous year analysis\n\n**🎬 Video Learning:**\nWatch subject-specific preparation videos with expert guidance!\n\n**📍 How to Access:**\nDashboard → Exams → Select Your Target Exam → Choose Subject → Start Preparation\n\n**💡 Pro tip:** Each exam has a customized preparation timeline - follow it for systematic preparation!\n\nWhich competitive exam are you preparing for?";
  }

  // Fitness page specific
  if (lowerMessage.includes("fitness") || lowerMessage.includes("workout") || lowerMessage.includes("exercise") || lowerMessage.includes("physical")) {
    return "💪 **Fitness Section - Student-Focused Wellness:**\n\n**🏋️ Workout Levels:**\n• **Beginner** - Perfect for starting your fitness journey\n• **Intermediate** - Build on existing fitness base\n• **Advanced** - Push limits with intense workouts\n\n**📅 7-Day Schedule (Each Level):**\n• Monday: Chest • Tuesday: Back • Wednesday: Biceps\n• Thursday: Shoulders • Friday: Legs • Saturday: Forearms\n• Sunday: Rest & Recovery\n\n**✨ Smart Features:**\n• **One-time Form**: Age, weight, height (saved permanently)\n• **YouTube Videos**: Exercise demonstrations for each day\n• **Progress Tracking**: Mark workouts as completed\n• **Personalized Plans**: Based on your fitness level\n\n**📍 How to Access:**\nDashboard → Fitness → Fill Form (first time) → Select Level → Follow Schedule\n\n**💡 Pro tip:** Exercise boosts brain power by 40% - perfect for students!\n\nWhich fitness level matches your current ability?";
  }

  // Wellness page specific
  if (lowerMessage.includes("wellness") || lowerMessage.includes("mental health") || lowerMessage.includes("meditation") || lowerMessage.includes("stress")) {
    return "🧘 **Wellness Section - Mental Health for Students:**\n\n**🌟 Available Activities:**\n• **Meditation** - Deep mindfulness (10-30 min) for stress reduction\n• **Stress Relief** - Guided relaxation techniques (15-20 min)\n• **Focus & Concentration** - Mental exercises for study enhancement (10-15 min)\n• **Motivation & Positivity** - Confidence building sessions (10-25 min)\n\n**📋 Each Activity Includes:**\n• Detailed benefits explanation\n• Step-by-step practice guidelines\n• Success tips and techniques\n• Weekly progress tracking\n\n**📚 Additional Resources:**\n• Calming music playlists\n• Wellness articles & tips\n• Student support community\n\n**📍 How to Access:**\nDashboard → Wellness → Select Activity → Read Guidelines → Start Session\n\n**💡 Pro tip:** Just 10 minutes of daily meditation can improve focus and reduce exam anxiety!\n\nWhich wellness activity would help you most right now?";
  }

  // Chess page specific
  if (lowerMessage.includes("chess") || lowerMessage.includes("game") || lowerMessage.includes("strategic thinking")) {
    return "♟️ **Chess Section - Strategic Thinking Development:**\n\n**🤖 AI-Powered Chess:**\n• Play against Google Gemini AI opponent\n• Difficulty levels: Easy, Medium, Hard\n• Complete chess rules support (castling, en passant, promotion)\n\n**🎯 Educational Benefits:**\n• **Strategic Thinking** - Plan ahead and think critically\n• **Quick Decision Making** - Improve decision speed\n• **Pattern Recognition** - Enhance analytical skills\n• **Concentration** - Build focus and patience\n\n**✨ Game Features:**\n• Auto-save functionality\n• Game statistics tracking\n• Move validation and hints\n• Responsive design for all devices\n\n**🎮 How to Play:**\n• Click pieces to select them\n• Click highlighted squares to move\n• Use 'Undo Move' and 'New Game' buttons\n\n**📍 How to Access:**\nDashboard → Chess → Choose Difficulty → Start Playing\n\n**💡 Pro tip:** Chess improves academic performance by enhancing logical thinking!\n\nReady to challenge the AI and boost your strategic thinking?";
  }

  // Physics questions
  if (lowerMessage.includes("physics")) {
    return "Great! Physics is an amazing subject! 🔬\n\n**📚 Physics on Develop Verse:**\n• **Classes 11-12**: Mechanics, Waves, Electricity, Optics, Modern Physics\n• **JEE Preparation**: Advanced problem-solving techniques\n• **NEET Focus**: Medical physics applications\n• **Video Lessons**: YouTube integration for visual learning\n\n**🎯 Study Strategy:**\n• Start with NCERT - build strong fundamentals\n• Practice numerical problems daily (10-15 per day)\n• Focus on mechanics, electricity & magnetism (high weightage)\n• Use diagrams to understand concepts better\n• Solve previous year JEE/NEET questions\n\n**📍 Access Physics Content:**\nDashboard → Academics → Class 11/12 Science → Physics\nOR Dashboard → Exams → JEE/NEET → Physics\n\n💡 **Pro tip:** Physics is all about understanding concepts, not memorizing formulas!\n\nWhich specific Physics topic do you need help with?";
  }

  // Chemistry questions
  if (lowerMessage.includes("chemistry")) {
    return "Chemistry is fascinating! Let's make it easier for you! 🧪\n\n**📚 Chemistry on Develop Verse:**\n• **Physical Chemistry**: Numerical problems & concepts\n• **Organic Chemistry**: Reaction mechanisms & synthesis\n• **Inorganic Chemistry**: Facts, properties & periodic trends\n• **Video Lessons**: Subject-wise YouTube tutorials\n\n**🎯 Chemistry Success Strategy:**\n• **Physical Chemistry:** Focus on numerical & concepts\n• **Organic Chemistry:** Learn reaction mechanisms step by step\n• **Inorganic Chemistry:** Make notes for facts & properties\n• Practice balancing equations daily\n• Use mnemonics for periodic table trends\n\n**📍 Access Chemistry Content:**\nDashboard → Academics → Class 11/12 Science → Chemistry\nOR Dashboard → Exams → JEE/NEET/CUET → Chemistry\n\n💡 **Pro tip:** Chemistry connects all three branches - find the links!\n\nWhich branch of Chemistry are you struggling with?";
  }

  // Math questions
  if (lowerMessage.includes("math") || lowerMessage.includes("mathematics")) {
    return "Mathematics is the key to success! Let's master it together! 📐\n\n**📚 Math on Develop Verse:**\n• **Classes 9-12**: Algebra, Geometry, Trigonometry, Calculus\n• **JEE Focus**: Advanced problem-solving techniques\n• **Commerce Stream**: Statistics and business mathematics\n• **Video Lessons**: Step-by-step problem solving\n\n**🎯 Math Mastery Plan:**\n• Practice daily - consistency is everything\n• Start with NCERT, then move to advanced books\n• Focus on calculus, algebra & coordinate geometry\n• Solve step-by-step, don't skip steps\n• Time yourself while solving\n\n**📍 Access Math Content:**\nDashboard → Academics → Select Your Class → Mathematics\nOR Dashboard → Exams → JEE/NDA → Mathematics\n\n💡 **Pro tip:** Math improves with practice - solve at least 20 problems daily!\n\nWhich Math topic needs your attention right now?";
  }

  // Biology questions
  if (lowerMessage.includes("biology")) {
    return "Biology is the study of life - so interesting! 🦠\n\n**📚 Biology on Develop Verse:**\n• **Class 11**: Cell biology, Plant physiology, Human physiology\n• **Class 12**: Genetics, Evolution, Ecology, Biotechnology\n• **NEET Focus**: Medical entrance preparation\n• **Video Lessons**: Diagram-based learning\n\n**🎯 Biology Excellence Tips:**\n• Read NCERT thoroughly - it's your foundation\n• Make diagrams for processes (photosynthesis, respiration)\n• Create flowcharts for classifications\n• Focus on human physiology & genetics (high weightage)\n• Practice diagram-based questions\n\n**📍 Access Biology Content:**\nDashboard → Academics → Class 11/12 Science → Biology\nOR Dashboard → Exams → NEET → Biology\n\n💡 **Pro tip:** Biology needs understanding + memorization - use both!\n\nWhich Biology chapter are you studying?";
  }

  // Study tips with platform integration
  if (lowerMessage.includes("study") || lowerMessage.includes("tips") || lowerMessage.includes("how to study")) {
    return "Excellent! Let me share powerful study techniques using Develop Verse! 📚\n\n**🎯 Effective Study Methods:**\n• **Pomodoro Technique:** 25 min study + 5 min break\n• **Active Recall:** Test yourself without looking at notes\n• **Spaced Repetition:** Review topics at increasing intervals\n• **Feynman Technique:** Explain concepts in simple words\n• Make mind maps for complex topics\n\n**📱 Use Develop Verse Features:**\n• **Dashboard Progress**: Track your daily study completion\n• **Video Learning**: Watch subject tutorials for better understanding\n• **Wellness Section**: Take meditation breaks to stay focused\n• **Fitness**: Exercise to boost brain power by 40%\n\n**📍 Study Workflow:**\n1. Check Dashboard for today's plan\n2. Study using Academics/Exams sections\n3. Take wellness breaks every 2 hours\n4. Track progress on Dashboard\n\n💡 **Pro tip:** Quality over quantity - 4 focused hours > 8 distracted hours!\n\nWhat specific study challenge are you facing?";
  }

  // Time management with platform features
  if (lowerMessage.includes("time") || lowerMessage.includes("schedule") || lowerMessage.includes("management")) {
    return "Time management is crucial for success! ⏰\n\n**🗓️ Perfect Study Schedule Using Develop Verse:**\n• **Morning (6-9 AM):** Toughest subjects (Math/Physics) - use Academics section\n• **Mid-morning (9-12 PM):** Theory subjects - watch video lessons\n• **Afternoon (2-5 PM):** Practice & revision - use Exams section\n• **Evening (6-8 PM):** Light reading/biology - Academics section\n• **Night (8-9 PM):** Fitness workout for brain boost\n• **Before bed:** 10-min meditation from Wellness section\n\n**📊 Track Progress:**\n• Use Dashboard to monitor daily completion %\n• Check study streak counter for motivation\n• Review total hours spent learning\n\n**📍 Platform Integration:**\n• Set goals using Today's Plan on Dashboard\n• Use Wellness section for study breaks\n• Track fitness activities for overall health\n\n💡 **Pro tip:** Plan your day the night before using Dashboard - it saves 30 minutes!\n\nWhat's your biggest time management challenge?";
  }

  // Default intelligent response with complete platform overview
  return "I'm AI Baba, your educational mentor with complete Develop Verse knowledge! 🤖\n\n**🏠 DEVELOP VERSE - Complete Learning Platform:**\n\n**📚 ACADEMICS** - Classes 9-12 with video lessons\n**🎯 EXAMS** - JEE, NEET, UPSC, NDA, CUET prep\n**💪 FITNESS** - Student workout plans (3 levels)\n**🧘 WELLNESS** - Mental health & meditation\n**♟️ CHESS** - AI-powered strategic thinking\n**🏠 DASHBOARD** - Progress tracking & navigation hub\n\n**🎯 Ask me specific questions like:**\n• \"How to use the Academics section?\"\n• \"What's available in the Fitness page?\"\n• \"How does the Dashboard track progress?\"\n• \"Which exam preparation videos are available?\"\n• \"How to access wellness activities?\"\n• \"What chess features are available?\"\n\n**📍 Navigation:** Use the colorful menu bar or Dashboard quick access buttons!\n\nWhat would you like to explore on Develop Verse today? 😊";
}

/**
 * Checks if the user message is appropriate for AI Baba
 */
export function isEducationalQuery(message: string): boolean {
  const educationalKeywords = [
    // Academic subjects
    'study', 'learn', 'academic', 'class', 'subject', 'math', 'physics', 'chemistry',
    'biology', 'english', 'hindi', 'science', 'social', 'history', 'geography',
    'economics', 'accountancy', 'business', 'political', 'literature', 'grammar',
    
    // Competitive exams
    'exam', 'jee', 'neet', 'upsc', 'nda', 'cuet', 'bitsat', 'preparation', 'syllabus',
    'entrance', 'competitive', 'test', 'mock', 'practice', 'score', 'rank',
    
    // Study techniques
    'notes', 'revision', 'memory', 'concentration', 'focus', 'time management',
    'schedule', 'planning', 'strategy', 'technique', 'method', 'tips',
    
    // Fitness & wellness
    'fitness', 'workout', 'exercise', 'health', 'wellness', 'meditation', 'stress',
    'anxiety', 'mental', 'physical', 'diet', 'nutrition', 'sleep',
    
    // Career & guidance
    'career', 'college', 'university', 'stream', 'course', 'future', 'job',
    'engineering', 'medical', 'commerce', 'arts', 'science',
    
    // Website navigation and features
    'website', 'platform', 'develop verse', 'navigation', 'dashboard', 'academics',
    'exams', 'chess', 'how to use', 'features', 'sections', 'page', 'access',
    'video', 'youtube', 'progress', 'tracking', 'menu', 'button', 'click',
    
    // General help
    'help', 'how', 'what', 'why', 'when', 'where', 'guide', 'advice',
    'chapter', 'book', 'ncert', 'tutorial', 'lesson'
  ];
  
  const lowerMessage = message.toLowerCase();
  return educationalKeywords.some(keyword => lowerMessage.includes(keyword)) || 
         lowerMessage.length < 50; // Allow short questions
}