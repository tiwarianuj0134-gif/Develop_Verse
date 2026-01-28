import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all competitive exams
export const getExams = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("exams")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get exam details with subjects
export const getExamDetails = query({
  args: {
    examId: v.id("exams"),
  },
  handler: async (ctx, args) => {
    const exam = await ctx.db.get(args.examId);
    if (!exam) return null;

    const subjects = await ctx.db
      .query("examSubjects")
      .withIndex("by_exam", (q) => q.eq("examId", args.examId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return {
      ...exam,
      subjects,
    };
  },
});

// Get videos for an exam
export const getExamVideos = query({
  args: {
    examId: v.id("exams"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    const videos = await ctx.db
      .query("videos")
      .withIndex("by_exam", (q) => q.eq("examId", args.examId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get progress for each video if user is logged in
    if (userId) {
      const videosWithProgress = await Promise.all(
        videos.map(async (video) => {
          const progress = await ctx.db
            .query("userProgress")
            .withIndex("by_user_item", (q) => 
              q.eq("userId", userId).eq("itemId", video._id)
            )
            .unique();

          return {
            ...video,
            progress: progress?.progress || 0,
            completed: progress?.completed || false,
            bookmarked: progress?.bookmarked || false,
          };
        })
      );
      return videosWithProgress;
    }

    return videos;
  },
});

// Get exams by category
export const getExamsByCategory = query({
  args: {},
  handler: async (ctx) => {
    const exams = await ctx.db
      .query("exams")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Group by category
    const examsByCategory = exams.reduce((acc, exam) => {
      if (!acc[exam.category]) {
        acc[exam.category] = [];
      }
      acc[exam.category].push(exam);
      return acc;
    }, {} as Record<string, typeof exams>);

    return examsByCategory;
  },
});
