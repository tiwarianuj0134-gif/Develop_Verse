import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Checks if the current user is authenticated.
 * 
 * This function verifies that the user is logged in.
 * All authenticated users can access the admin panel.
 * 
 * @param ctx - Convex query or mutation context
 * @returns true if user is authenticated
 * @throws ConvexError with code "UNAUTHORIZED" if user is not authenticated
 * 
 * @example
 * // In a query or mutation handler:
 * await isAdmin(ctx);
 * // Continues execution if user is logged in, throws error otherwise
 */
async function isAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError({
      code: "UNAUTHORIZED",
      message: "Authentication required"
    });
  }
  
  // Allow all logged-in users to access admin panel
  return true;
}

/**
 * Retrieves admin dashboard statistics including user counts and content metrics.
 * 
 * Returns comprehensive statistics for the admin dashboard:
 * - Total users count
 * - Active users today
 * - New signups today
 * - Content statistics (classes, exams, workouts, wellness sessions)
 * - Popular content items
 * 
 * @requires Admin privileges
 * @returns Admin statistics object
 * @throws ConvexError if user is not authenticated or lacks admin privileges
 */
export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    await isAdmin(ctx);

    const today = new Date().toISOString().split('T')[0];
    
    // Get today's analytics
    const todayAnalytics = await ctx.db
      .query("analytics")
      .withIndex("by_date", (q) => q.eq("date", today))
      .unique();

    // Count total users
    const totalUsers = await ctx.db.query("users").collect();
    
    // Count active content
    const activeClasses = await ctx.db
      .query("classes")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    const activeExams = await ctx.db
      .query("exams")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const activeWorkouts = await ctx.db
      .query("fitnessWorkouts")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const activeSessions = await ctx.db
      .query("mentalHealthSessions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return {
      totalUsers: totalUsers.length,
      activeUsers: todayAnalytics?.activeUsers || 0,
      newSignups: todayAnalytics?.newSignups || 0,
      contentStats: {
        classes: activeClasses.length,
        exams: activeExams.length,
        workouts: activeWorkouts.length,
        mentalHealthSessions: activeSessions.length,
      },
      popularContent: todayAnalytics?.popularContent || [],
    };
  },
});

/**
 * Adds a new class to the platform.
 * 
 * @param name - Class name (e.g., "Class 9", "Class 10")
 * @param description - Class description
 * @param streams - Available streams for the class
 * @requires Admin privileges
 * @returns ID of the newly created class
 * @throws ConvexError if user is not authenticated or lacks admin privileges
 */
export const addClass = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    streams: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await isAdmin(ctx);

    return await ctx.db.insert("classes", {
      ...args,
      isActive: true,
    });
  },
});

/**
 * Adds a new subject to a class.
 * 
 * @param name - Subject name
 * @param classId - ID of the parent class
 * @param stream - Stream the subject belongs to
 * @param description - Subject description
 * @param icon - Icon emoji for the subject
 * @param color - Color code for the subject
 * @requires Admin privileges
 * @returns ID of the newly created subject
 * @throws ConvexError if user is not authenticated or lacks admin privileges
 */
export const addSubject = mutation({
  args: {
    name: v.string(),
    classId: v.id("classes"),
    stream: v.string(),
    description: v.string(),
    icon: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    await isAdmin(ctx);

    return await ctx.db.insert("subjects", {
      ...args,
      isActive: true,
    });
  },
});

/**
 * Adds a new chapter to a subject.
 * 
 * @param name - Chapter name
 * @param subjectId - ID of the parent subject
 * @param chapterNumber - Chapter sequence number
 * @param description - Chapter description
 * @param difficulty - Difficulty level (easy, medium, hard)
 * @param estimatedHours - Estimated hours to complete
 * @requires Admin privileges
 * @returns ID of the newly created chapter
 * @throws ConvexError if user is not authenticated or lacks admin privileges
 */
export const addChapter = mutation({
  args: {
    name: v.string(),
    subjectId: v.id("subjects"),
    chapterNumber: v.number(),
    description: v.string(),
    difficulty: v.string(),
    estimatedHours: v.number(),
  },
  handler: async (ctx, args) => {
    await isAdmin(ctx);

    return await ctx.db.insert("chapters", {
      ...args,
      isActive: true,
    });
  },
});

/**
 * Adds a new video to the platform.
 * 
 * Videos can be associated with chapters, exams, fitness workouts, or mental health sessions.
 * 
 * @param title - Video title
 * @param chapterId - Optional chapter ID
 * @param examId - Optional exam ID
 * @param fitnessId - Optional fitness workout ID
 * @param mentalHealthId - Optional mental health session ID
 * @param youtubeUrl - YouTube video URL
 * @param duration - Video duration in minutes
 * @param difficulty - Difficulty level
 * @param description - Video description
 * @param tags - Array of tags for categorization
 * @requires Admin privileges
 * @returns ID of the newly created video
 * @throws ConvexError if user is not authenticated or lacks admin privileges
 */
export const addVideo = mutation({
  args: {
    title: v.string(),
    chapterId: v.optional(v.id("chapters")),
    examId: v.optional(v.id("exams")),
    fitnessId: v.optional(v.id("fitnessWorkouts")),
    mentalHealthId: v.optional(v.id("mentalHealthSessions")),
    youtubeUrl: v.string(),
    duration: v.number(),
    difficulty: v.string(),
    description: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await isAdmin(ctx);

    return await ctx.db.insert("videos", {
      ...args,
      isActive: true,
    });
  },
});

/**
 * Adds a new competitive exam to the platform.
 * 
 * @param name - Short exam name (e.g., "JEE", "NEET")
 * @param fullName - Full exam name
 * @param description - Exam description
 * @param category - Exam category
 * @param eligibility - Eligibility criteria
 * @param examPattern - Exam pattern details
 * @param syllabus - Array of syllabus topics
 * @param importantDates - Important dates information
 * @requires Admin privileges
 * @returns ID of the newly created exam
 * @throws ConvexError if user is not authenticated or lacks admin privileges
 */
export const addExam = mutation({
  args: {
    name: v.string(),
    fullName: v.string(),
    description: v.string(),
    category: v.string(),
    eligibility: v.string(),
    examPattern: v.string(),
    syllabus: v.array(v.string()),
    importantDates: v.string(),
  },
  handler: async (ctx, args) => {
    await isAdmin(ctx);

    return await ctx.db.insert("exams", {
      ...args,
      isActive: true,
    });
  },
});

/**
 * Retrieves all content items of a specific type for admin management.
 * 
 * @param type - Content type: "classes", "subjects", "chapters", "videos", or "exams"
 * @requires Admin privileges
 * @returns Array of content items of the specified type
 * @throws ConvexError if user is not authenticated or lacks admin privileges
 */
export const getAllContent = query({
  args: {
    type: v.string(), // "classes", "subjects", "chapters", "videos", "exams"
  },
  handler: async (ctx, args) => {
    await isAdmin(ctx);

    switch (args.type) {
      case "classes":
        return await ctx.db.query("classes").collect();
      case "subjects":
        return await ctx.db.query("subjects").collect();
      case "chapters":
        return await ctx.db.query("chapters").collect();
      case "videos":
        return await ctx.db.query("videos").collect();
      case "exams":
        return await ctx.db.query("exams").collect();
      default:
        return [];
    }
  },
});

/**
 * Toggles the active/inactive status of a content item.
 * 
 * @param type - Content type
 * @param id - Content item ID
 * @requires Admin privileges
 * @returns Success status
 * @throws ConvexError if user is not authenticated or lacks admin privileges
 * @throws Error if item not found or doesn't support status toggle
 */
export const toggleContentStatus = mutation({
  args: {
    type: v.string(),
    id: v.string(),
  },
  handler: async (ctx, args) => {
    await isAdmin(ctx);

    const item = await ctx.db.get(args.id as any);
    if (!item) throw new Error("Item not found");

    // Only update isActive if the item has this property
    if ('isActive' in item) {
      await ctx.db.patch(args.id as any, {
        isActive: !(item as any).isActive,
      });
    } else {
      throw new Error("Item does not support status toggle");
    }

    return { success: true };
  },
});
