import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // User profiles and preferences
  userProfiles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    class: v.optional(v.string()), // "9", "10", "11", "12"
    stream: v.optional(v.string()), // "Science", "Commerce", "Arts"
    examGoals: v.array(v.string()), // ["JEE", "NEET", "CUET", etc.]
    preferredLanguage: v.string(),
    onboardingCompleted: v.boolean(),
    fitnessGoals: v.optional(v.string()), // "Home", "Gym", "Both"
    mentalHealthInterest: v.boolean(),
  }).index("by_user", ["userId"]),

  // Academic structure
  classes: defineTable({
    name: v.string(), // "Class 9", "Class 10", etc.
    description: v.string(),
    streams: v.array(v.string()), // ["Science", "Commerce", "Arts"]
    isActive: v.boolean(),
  }),

  subjects: defineTable({
    name: v.string(), // "Mathematics", "Physics", etc.
    classId: v.id("classes"),
    stream: v.string(),
    description: v.string(),
    icon: v.string(), // emoji or icon name
    color: v.string(), // hex color
    isActive: v.boolean(),
  }).index("by_class_stream", ["classId", "stream"]),

  chapters: defineTable({
    name: v.string(),
    subjectId: v.id("subjects"),
    chapterNumber: v.number(),
    description: v.string(),
    difficulty: v.string(), // "Beginner", "Intermediate", "Advanced"
    estimatedHours: v.number(),
    isActive: v.boolean(),
  }).index("by_subject", ["subjectId"]),

  videos: defineTable({
    title: v.string(),
    chapterId: v.optional(v.id("chapters")),
    examId: v.optional(v.id("exams")),
    fitnessId: v.optional(v.id("fitnessWorkouts")),
    mentalHealthId: v.optional(v.id("mentalHealthSessions")),
    youtubeUrl: v.string(),
    duration: v.number(), // in minutes
    difficulty: v.string(),
    description: v.string(),
    tags: v.array(v.string()),
    isActive: v.boolean(),
  })
    .index("by_chapter", ["chapterId"])
    .index("by_exam", ["examId"])
    .index("by_fitness", ["fitnessId"])
    .index("by_mental_health", ["mentalHealthId"]),

  // Competitive exams
  exams: defineTable({
    name: v.string(), // "JEE Main", "NEET", etc.
    fullName: v.string(),
    description: v.string(),
    category: v.string(), // "Engineering", "Medical", "Government", etc.
    eligibility: v.string(),
    examPattern: v.string(),
    syllabus: v.array(v.string()),
    importantDates: v.string(),
    isActive: v.boolean(),
  }),

  examSubjects: defineTable({
    examId: v.id("exams"),
    name: v.string(),
    topics: v.array(v.string()),
    weightage: v.string(),
    isActive: v.boolean(),
  }).index("by_exam", ["examId"]),

  // Fitness module
  fitnessWorkouts: defineTable({
    name: v.string(),
    type: v.string(), // "Home", "Gym"
    category: v.string(), // "Cardio", "Strength", "Flexibility"
    difficulty: v.string(), // "Beginner", "Intermediate", "Advanced"
    duration: v.number(), // in minutes
    equipment: v.array(v.string()),
    targetMuscles: v.array(v.string()),
    calories: v.optional(v.number()),
    description: v.string(),
    instructions: v.array(v.string()),
    isActive: v.boolean(),
  }),

  // Mental health module
  mentalHealthSessions: defineTable({
    name: v.string(),
    type: v.string(), // "Meditation", "Motivation", "Stress Relief", "Focus"
    duration: v.number(), // in minutes
    difficulty: v.string(), // "Beginner", "Intermediate", "Advanced"
    description: v.string(),
    benefits: v.array(v.string()),
    instructions: v.array(v.string()),
    isActive: v.boolean(),
  }),

  // Progress tracking
  userProgress: defineTable({
    userId: v.id("users"),
    type: v.string(), // "chapter", "exam", "fitness", "mental_health"
    itemId: v.string(), // ID of the item being tracked
    progress: v.number(), // 0-100
    timeSpent: v.number(), // in minutes
    lastAccessed: v.number(),
    completed: v.boolean(),
    bookmarked: v.boolean(),
  })
    .index("by_user_type", ["userId", "type"])
    .index("by_user_item", ["userId", "itemId"]),

  // Daily study plans
  studyPlans: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
    tasks: v.array(v.object({
      type: v.string(), // "chapter", "exam", "fitness", "mental_health"
      itemId: v.string(),
      title: v.string(),
      duration: v.number(),
      completed: v.boolean(),
    })),
    totalPlannedMinutes: v.number(),
    completedMinutes: v.number(),
  }).index("by_user_date", ["userId", "date"]),

  // Admin content management
  banners: defineTable({
    title: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    isActive: v.boolean(),
    priority: v.number(), // for ordering
  }),

  // Analytics
  analytics: defineTable({
    date: v.string(), // YYYY-MM-DD
    totalUsers: v.number(),
    activeUsers: v.number(),
    newSignups: v.number(),
    popularContent: v.array(v.object({
      type: v.string(),
      itemId: v.string(),
      views: v.number(),
    })),
  }).index("by_date", ["date"]),

  // Chess game module
  chessGames: defineTable({
    userId: v.id("users"),
    fen: v.string(), // Current board position in FEN notation
    moveHistory: v.array(v.object({
      from: v.string(),
      to: v.string(),
      san: v.string(), // Standard Algebraic Notation
      promotion: v.optional(v.string()),
      timestamp: v.number(),
    })),
    currentPlayer: v.string(), // "white" or "black"
    gameStatus: v.string(), // "playing", "check", "checkmate", "stalemate", "draw"
    difficulty: v.string(), // "easy", "medium", "hard"
    playerColor: v.string(), // "white" or "black"
    gameResult: v.optional(v.object({
      winner: v.string(), // "white", "black", or "draw"
      reason: v.string(), // "checkmate", "stalemate", "draw", "resignation", "timeout"
      moveCount: v.number(),
      duration: v.number(), // in seconds
    })),
    isCompleted: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "gameStatus"])
    .index("by_user_completed", ["userId", "isCompleted"]),

  // Chess game statistics
  chessStats: defineTable({
    userId: v.id("users"),
    totalGames: v.number(),
    wins: v.number(),
    losses: v.number(),
    draws: v.number(),
    winRate: v.number(), // percentage
    averageGameDuration: v.number(), // in seconds
    averageMovesPerGame: v.number(),
    favoriteOpening: v.optional(v.string()),
    longestGame: v.optional(v.object({
      gameId: v.id("chessGames"),
      moves: v.number(),
      duration: v.number(),
    })),
    bestWin: v.optional(v.object({
      gameId: v.id("chessGames"),
      moves: v.number(),
      difficulty: v.string(),
    })),
    difficultyStats: v.object({
      easy: v.object({
        games: v.number(),
        wins: v.number(),
        winRate: v.number(),
      }),
      medium: v.object({
        games: v.number(),
        wins: v.number(),
        winRate: v.number(),
      }),
      hard: v.object({
        games: v.number(),
        wins: v.number(),
        winRate: v.number(),
      }),
    }),
    lastUpdated: v.number(),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
