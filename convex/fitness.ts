import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all fitness workouts
export const getWorkouts = query({
  args: {
    type: v.optional(v.string()), // "Home" or "Gym"
    category: v.optional(v.string()),
    difficulty: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("fitnessWorkouts");
    
    if (args.type || args.category || args.difficulty) {
      query = query.filter((q) => {
        let filter = q.eq(q.field("isActive"), true);
        if (args.type) {
          filter = q.and(filter, q.eq(q.field("type"), args.type));
        }
        if (args.category) {
          filter = q.and(filter, q.eq(q.field("category"), args.category));
        }
        if (args.difficulty) {
          filter = q.and(filter, q.eq(q.field("difficulty"), args.difficulty));
        }
        return filter;
      });
    } else {
      query = query.filter((q) => q.eq(q.field("isActive"), true));
    }

    const workouts = await query.collect();
    const userId = await getAuthUserId(ctx);

    // Get progress for each workout if user is logged in
    if (userId) {
      const workoutsWithProgress = await Promise.all(
        workouts.map(async (workout) => {
          const progress = await ctx.db
            .query("userProgress")
            .withIndex("by_user_item", (q) => 
              q.eq("userId", userId).eq("itemId", workout._id)
            )
            .unique();

          return {
            ...workout,
            progress: progress?.progress || 0,
            completed: progress?.completed || false,
            bookmarked: progress?.bookmarked || false,
          };
        })
      );
      return workoutsWithProgress;
    }

    return workouts;
  },
});

// Get workout details
export const getWorkoutDetails = query({
  args: {
    workoutId: v.id("fitnessWorkouts"),
  },
  handler: async (ctx, args) => {
    const workout = await ctx.db.get(args.workoutId);
    if (!workout) return null;

    const videos = await ctx.db
      .query("videos")
      .withIndex("by_fitness", (q) => q.eq("fitnessId", args.workoutId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return {
      ...workout,
      videos,
    };
  },
});

// Get workout categories
export const getWorkoutCategories = query({
  args: {},
  handler: async (ctx) => {
    const workouts = await ctx.db
      .query("fitnessWorkouts")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const categories = [...new Set(workouts.map(w => w.category))];
    const types = [...new Set(workouts.map(w => w.type))];
    const difficulties = [...new Set(workouts.map(w => w.difficulty))];

    return {
      categories,
      types,
      difficulties,
    };
  },
});
