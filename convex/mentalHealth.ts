import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all mental health sessions
export const getSessions = query({
  args: {
    type: v.optional(v.string()), // "Meditation", "Motivation", etc.
    difficulty: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("mentalHealthSessions");
    
    if (args.type || args.difficulty) {
      query = query.filter((q) => {
        let filter = q.eq(q.field("isActive"), true);
        if (args.type) {
          filter = q.and(filter, q.eq(q.field("type"), args.type));
        }
        if (args.difficulty) {
          filter = q.and(filter, q.eq(q.field("difficulty"), args.difficulty));
        }
        return filter;
      });
    } else {
      query = query.filter((q) => q.eq(q.field("isActive"), true));
    }

    const sessions = await query.collect();
    const userId = await getAuthUserId(ctx);

    // Get progress for each session if user is logged in
    if (userId) {
      const sessionsWithProgress = await Promise.all(
        sessions.map(async (session) => {
          const progress = await ctx.db
            .query("userProgress")
            .withIndex("by_user_item", (q) => 
              q.eq("userId", userId).eq("itemId", session._id)
            )
            .unique();

          return {
            ...session,
            progress: progress?.progress || 0,
            completed: progress?.completed || false,
            bookmarked: progress?.bookmarked || false,
          };
        })
      );
      return sessionsWithProgress;
    }

    return sessions;
  },
});

// Get session details with videos
export const getSessionDetails = query({
  args: {
    sessionId: v.id("mentalHealthSessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const videos = await ctx.db
      .query("videos")
      .withIndex("by_mental_health", (q) => q.eq("mentalHealthId", args.sessionId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return {
      ...session,
      videos,
    };
  },
});

// Get sessions by type
export const getSessionsByType = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db
      .query("mentalHealthSessions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Group by type
    const sessionsByType = sessions.reduce((acc, session) => {
      if (!acc[session.type]) {
        acc[session.type] = [];
      }
      acc[session.type].push(session);
      return acc;
    }, {} as Record<string, typeof sessions>);

    return sessionsByType;
  },
});

// Get session types and difficulties
export const getSessionCategories = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db
      .query("mentalHealthSessions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const types = [...new Set(sessions.map(s => s.type))];
    const difficulties = [...new Set(sessions.map(s => s.difficulty))];

    return {
      types,
      difficulties,
    };
  },
});
