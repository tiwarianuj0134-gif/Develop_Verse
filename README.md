<<<<<<< HEAD
# Develop Verse - Complete Digital Education Ecosystem
  
**"Yaha se padhega Bharat, tabhi aage badhega Bharat"**

Develop Verse is a comprehensive digital education platform built with [Convex](https://convex.dev) as its backend and React + TypeScript for the frontend. This platform provides structured learning for Classes 9-12, competitive exam preparation, fitness tracking, and mental wellness support.

This project is connected to the Convex deployment named [`academic-lemur-543`](https://dashboard.convex.dev/d/academic-lemur-543).

## Features

- **Academics**: Structured learning paths for Classes 9-12 with NCERT-aligned content
- **Competitive Exams**: Preparation materials for JEE, NEET, NDA, CUET, UPSC, and CA
- **Fitness**: Weekly workout schedules and tracking
- **Mental Wellness**: Meditation and stress relief sessions
- **AI Assistant**: AI Baba chatbot for platform guidance
- **Admin Panel**: Administrative interface for content and user management
- **Robust Error Handling**: Graceful error handling with user-friendly messages

## Error Handling

Develop Verse implements a comprehensive error handling strategy to ensure users never encounter blank white screens:

### Multi-Layered Protection

1. **Error Boundaries**: React Error Boundaries wrap critical components to catch and handle unexpected errors
2. **Query Error Handling**: Convex queries explicitly check for error states before rendering
3. **Authorization Errors**: Non-admin users see clear "Access Denied" messages instead of crashes
4. **User-Friendly Messages**: All error messages are sanitized to remove technical details

### Key Components

- **ErrorBoundary** (`src/components/ErrorBoundary.tsx`): Catches JavaScript errors in component trees
- **AccessDenied** (`src/components/AccessDenied.tsx`): Displays user-friendly access denied messages
- **Error Sanitization** (`src/lib/utils.ts`): Removes technical details from error messages

### Backend Error Handling

The backend uses structured `ConvexError` objects with consistent error codes:
- `UNAUTHORIZED`: User is not authenticated
- `FORBIDDEN`: User lacks required privileges
- Clear, descriptive error messages for all failure cases
  
## Project structure
  
The frontend code is in the `src` directory and is built with [Vite](https://vitejs.dev/).
  
The backend code is in the `convex` directory.
  
`npm run dev` will start the frontend and backend servers.

## App authentication

Develop Verse uses [Convex Auth](https://auth.convex.dev/) with Anonymous auth for easy sign in. You may wish to change this before deploying your app.

## Developing and deploying your app

Check out the [Convex docs](https://docs.convex.dev/) for more information on how to develop with Convex.
* If you're new to Convex, the [Overview](https://docs.convex.dev/understanding/) is a good place to start
* Check out the [Hosting and Deployment](https://docs.convex.dev/production/) docs for how to deploy your app
* Read the [Best Practices](https://docs.convex.dev/understanding/best-practices/) guide for tips on how to improve your app further

## HTTP API

User-defined http routes are defined in the `convex/router.ts` file. We split these routes into a separate file from `convex/http.ts` to allow us to prevent the LLM from modifying the authentication routes.

## Jai Hind 🇮🇳
=======
# Develop_Verse
>>>>>>> 9a7384ebdf7d7a430f0e733e3b0ab679be9a89c6
