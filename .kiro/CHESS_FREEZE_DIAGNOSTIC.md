# Chess Game Freeze - Diagnostic Guide

## Issue Fixed: Test File Errors ✅
The TypeScript errors in `convex/chess.test.ts` have been fixed by adding the proper Vitest imports:
```typescript
import { describe, test, expect } from 'vitest';
```

## Chess Game Freezing - Diagnostic Steps

### Step 1: Check Browser Console
Open browser console (F12) and look for:
1. **JavaScript errors** (red text)
2. **Network errors** (failed requests)
3. **React errors** (component crashes)
4. **Performance warnings**

### Step 2: Common Causes of Game Freezing

#### A. Infinite Loop in React Components
**Symptoms**: Browser becomes unresponsive, high CPU usage
**Check**: Look for `Maximum update depth exceeded` errors

#### B. Network Request Hanging
**Symptoms**: Game loads but doesn't respond to clicks
**Check**: Network tab for pending requests

#### C. Chess Engine Errors
**Symptoms**: Pieces don't move, board doesn't update
**Check**: Console for chess.js or ChessEngine errors

#### D. State Update Loops
**Symptoms**: Game works initially then freezes
**Check**: React DevTools for excessive re-renders

### Step 3: Quick Tests

#### Test 1: Basic Interaction
1. Open chess game
2. Click "New Game" in dialog
3. Try clicking on a piece
4. **Expected**: Piece should highlight valid moves
5. **If frozen**: Check console for errors

#### Test 2: Component Loading
1. Open browser DevTools
2. Go to Elements tab
3. Look for chess board elements
4. **Expected**: Should see chess squares and pieces
5. **If missing**: Component failed to render

#### Test 3: Network Status
1. Open Network tab in DevTools
2. Refresh chess page
3. Look for failed requests (red entries)
4. **Expected**: All requests should succeed
5. **If failing**: Backend/API issues

### Step 4: Emergency Fixes

#### Fix 1: Clear Browser Cache
```
Ctrl+Shift+R (hard refresh)
or
Clear browser cache and cookies
```

#### Fix 2: Disable Browser Extensions
```
Open incognito/private window
Test chess game there
```

#### Fix 3: Check for Memory Issues
```
Task Manager → Browser process
Check if using excessive RAM/CPU
```

### Step 5: Report Findings

When reporting the freeze issue, include:
1. **Browser console errors** (copy exact text)
2. **Network tab status** (any failed requests?)
3. **When freeze occurs** (immediately, after clicking, etc.)
4. **Browser and version** (Chrome 120, Firefox 121, etc.)
5. **Steps to reproduce** (exact sequence of actions)

## Most Likely Causes

### 1. Component Re-render Loop
The chess game has complex state management. If there's a circular dependency in useEffect hooks, it can cause infinite re-renders.

### 2. Chess.js Library Issues
If the chess.js library encounters an invalid position or move, it might throw an error that crashes the component.

### 3. Network Service Conflicts
The OfflineGameManager and NetworkService might be conflicting, causing the game to get stuck in a sync loop.

### 4. Memory Leak
Performance optimizations might have introduced a memory leak that causes the browser to freeze.

## Quick Debug Commands

Open browser console and run:

```javascript
// Check if chess game component is mounted
document.querySelector('[data-chess-board="true"]')

// Check for React errors
console.error.toString()

// Check memory usage
performance.memory

// Check network status
navigator.onLine
```

## Next Steps

1. ✅ **Test file errors fixed** - TypeScript should be clean now
2. 🔍 **Check browser console** - Look for runtime errors
3. 📊 **Monitor performance** - Check CPU/memory usage
4. 🐛 **Report specific errors** - Share exact console output

The test file fix should resolve the TypeScript errors, but if the game is still freezing, we need to look at runtime issues in the browser console.
