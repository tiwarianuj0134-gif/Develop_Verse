import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get current user profile
export const getCurrentUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return {
      user,
      profile,
    };
  },
});

// Create or update user profile during onboarding
export const updateUserProfile = mutation({
  args: {
    name: v.string(),
    class: v.optional(v.string()),
    stream: v.optional(v.string()),
    examGoals: v.array(v.string()),
    preferredLanguage: v.string(),
    fitnessGoals: v.optional(v.string()),
    mentalHealthInterest: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        ...args,
        onboardingCompleted: true,
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        ...args,
        onboardingCompleted: true,
      });
    }

    return { success: true };
  },
});

// Get user progress for dashboard
export const getUserDashboardData = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) return null;

    // Get recent progress
    const recentProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_user_type", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);

    // Get today's study plan
    const today = new Date().toISOString().split('T')[0];
    const todayPlan = await ctx.db
      .query("studyPlans")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", today))
      .unique();

    return {
      profile,
      recentProgress,
      todayPlan,
    };
  },
});

// Update user progress
export const updateProgress = mutation({
  args: {
    type: v.string(),
    itemId: v.string(),
    progress: v.number(),
    timeSpent: v.number(),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_user_item", (q) => q.eq("userId", userId).eq("itemId", args.itemId))
      .unique();

    const now = Date.now();

    if (existingProgress) {
      await ctx.db.patch(existingProgress._id, {
        progress: args.progress,
        timeSpent: existingProgress.timeSpent + args.timeSpent,
        lastAccessed: now,
        completed: args.completed ?? existingProgress.completed,
      });
    } else {
      await ctx.db.insert("userProgress", {
        userId,
        type: args.type,
        itemId: args.itemId,
        progress: args.progress,
        timeSpent: args.timeSpent,
        lastAccessed: now,
        completed: args.completed ?? false,
        bookmarked: false,
      });
    }

    return { success: true };
  },
});

// Toggle bookmark
export const toggleBookmark = mutation({
  args: {
    type: v.string(),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_user_item", (q) => q.eq("userId", userId).eq("itemId", args.itemId))
      .unique();

    if (existingProgress) {
      await ctx.db.patch(existingProgress._id, {
        bookmarked: !existingProgress.bookmarked,
      });
    } else {
      await ctx.db.insert("userProgress", {
        userId,
        type: args.type,
        itemId: args.itemId,
        progress: 0,
        timeSpent: 0,
        lastAccessed: Date.now(),
        completed: false,
        bookmarked: true,
      });
    }

    return { success: true };
  },
});
