import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all classes
export const getClasses = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("classes")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get subjects for a class and stream
export const getSubjects = query({
  args: {
    classId: v.id("classes"),
    stream: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subjects")
      .withIndex("by_class_stream", (q) => 
        q.eq("classId", args.classId).eq("stream", args.stream)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get chapters for a subject
export const getChapters = query({
  args: {
    subjectId: v.id("subjects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();

    // Get progress for each chapter if user is logged in
    if (userId) {
      const chaptersWithProgress = await Promise.all(
        chapters.map(async (chapter) => {
          const progress = await ctx.db
            .query("userProgress")
            .withIndex("by_user_item", (q) => 
              q.eq("userId", userId).eq("itemId", chapter._id)
            )
            .unique();

          return {
            ...chapter,
            progress: progress?.progress || 0,
            completed: progress?.completed || false,
            bookmarked: progress?.bookmarked || false,
            timeSpent: progress?.timeSpent || 0,
          };
        })
      );
      return chaptersWithProgress;
    }

    return chapters;
  },
});

// Get videos for a chapter
export const getChapterVideos = query({
  args: {
    chapterId: v.id("chapters"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    const videos = await ctx.db
      .query("videos")
      .withIndex("by_chapter", (q) => q.eq("chapterId", args.chapterId))
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

// Get subject details with progress
export const getSubjectDetails = query({
  args: {
    subjectId: v.id("subjects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    const subject = await ctx.db.get(args.subjectId);
    if (!subject) return null;

    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    let totalProgress = 0;
    let completedChapters = 0;

    if (userId) {
      const progressData = await Promise.all(
        chapters.map(async (chapter) => {
          const progress = await ctx.db
            .query("userProgress")
            .withIndex("by_user_item", (q) => 
              q.eq("userId", userId).eq("itemId", chapter._id)
            )
            .unique();
          return progress?.progress || 0;
        })
      );

      totalProgress = progressData.reduce((sum, p) => sum + p, 0) / chapters.length;
      completedChapters = progressData.filter(p => p === 100).length;
    }

    return {
      ...subject,
      totalChapters: chapters.length,
      completedChapters,
      overallProgress: totalProgress,
    };
  },
});
