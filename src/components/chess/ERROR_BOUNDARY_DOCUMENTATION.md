# Chess Game Error Boundaries Documentation

## Overview

The chess game implements comprehensive error boundaries to handle different types of errors gracefully while maintaining game state integrity and providing good user experience during failures. This document describes the error boundary system and how to use it effectively.

## Error Boundary Components

### 1. ChessErrorBoundary

**Purpose**: General-purpose error boundary for chess game sections with section-specific error handling.

**Features**:
- Section-specific error messages and recovery options
- Chess-specific fallback UI with game recovery options
- Error reporting with sanitized messages
- Integration with game restart and reset functionality

**Usage**:
```tsx
<ChessErrorBoundary
  section="game" // 'game' | 'board' | 'controls' | 'ai' | 'persistence'
  onReset={() => resetGameState()}
  onRestart={() => startNewGame()}
>
  <ChessComponent />
</ChessErrorBoundary>
```

**Sections**:
- `game`: Main chess game component
- `board`: Chess board display and interaction
- `controls`: Game controls (buttons, settings)
- `ai`: AI opponent functionality
- `persistence`: Save/load functionality

### 2. AIErrorBoundary

**Purpose**: Specialized error boundary for AI-related components with intelligent recovery strategies.

**Features**:
- AI-specific error detection (network, service, quota)
- Retry logic with exponential backoff
- Service status integration
- Fallback to local-only mode
- Auto-retry for transient errors

**Usage**:
```tsx
<AIErrorBoundary
  onRetryAI={() => retryAIMove()}
  onContinueWithoutAI={() => switchToLocalMode()}
  onRestartGame={() => restartGame()}
  isAIThinking={isProcessing}
  aiServiceStatus={serviceStatus}
>
  <AIComponent />
</AIErrorBoundary>
```

**Error Types Detected**:
- Network errors (connection, timeout, offline)
- AI service errors (Gemini API, quota, rate limits)
- Generic AI component errors

### 3. BoardErrorBoundary

**Purpose**: Specialized error boundary for chess board rendering and interaction errors.

**Features**:
- Board-specific error handling and recovery
- Position preservation during errors
- Theme-aware fallback UI
- Fallback board rendering
- Move validation error recovery

**Usage**:
```tsx
<BoardErrorBoundary
  onResetBoard={() => resetBoardDisplay()}
  onRestartGame={() => restartGame()}
  currentPosition={fenString}
  theme="light"
>
  <ChessBoard />
</BoardErrorBoundary>
```

**Error Types Detected**:
- Rendering errors (DOM, component, props)
- Move validation errors (chess rules, position)
- Interaction errors (drag-and-drop, mouse, touch)

## Error Boundary Hierarchy

The error boundaries are organized in a hierarchical structure:

```
ChessPage
└── ChessErrorBoundary (section="game")
    └── ChessGame
        ├── BoardErrorBoundary
        │   └── ChessboardWrapper
        │       └── Chessboard
        └── ChessErrorBoundary (section="controls")
            ├── GameStatus
            │   └── AIErrorBoundary
            │       └── AI Error Handling
            ├── GameControls
            └── MoveHistory
```

## Error Recovery Strategies

### 1. Automatic Recovery
- **Auto-retry**: For transient network and AI service errors
- **Exponential backoff**: Prevents overwhelming failed services
- **Service status monitoring**: Intelligent retry decisions

### 2. User-Initiated Recovery
- **Try Again**: Reset error state and retry operation
- **Reset Component**: Reset specific component state
- **Restart Game**: Full game restart with clean state
- **Continue Without Feature**: Graceful degradation

### 3. Fallback UI
- **Fallback Board**: Simple 8x8 grid when board fails
- **Error Messages**: User-friendly error descriptions
- **Recovery Instructions**: Specific guidance for each error type
- **Progress Preservation**: Game state maintained when possible

## Error Types and Handling

### Network Errors
- **Detection**: Connection failures, timeouts, offline status
- **Recovery**: Auto-retry with backoff, offline mode
- **User Options**: Retry, continue offline, restart

### AI Service Errors
- **Detection**: API failures, quota exceeded, rate limits
- **Recovery**: Service status checking, fallback AI
- **User Options**: Retry, use fallback, continue without AI

### Rendering Errors
- **Detection**: Component crashes, DOM errors, prop issues
- **Recovery**: Fallback UI, component reset
- **User Options**: Refresh display, reset component, restart

### Move Validation Errors
- **Detection**: Invalid moves, position errors, rule violations
- **Recovery**: Position preservation, move rollback
- **User Options**: Try different move, reset position

### Interaction Errors
- **Detection**: Drag-and-drop failures, event handler crashes
- **Recovery**: Alternative input methods, event cleanup
- **User Options**: Use click-to-move, reset interactions

## Implementation Guidelines

### 1. Error Boundary Placement
- Place error boundaries around logical component groups
- Use specific error boundaries for specialized functionality
- Avoid over-wrapping with too many nested boundaries

### 2. Error Detection
- Implement error type detection for appropriate handling
- Use error message analysis for classification
- Provide fallback for unknown error types

### 3. Recovery Options
- Always provide a "Try Again" option
- Offer specific recovery actions for each error type
- Include escalation options (reset → restart)

### 4. User Experience
- Use clear, non-technical error messages
- Provide specific recovery instructions
- Maintain game context and progress when possible

### 5. Error Reporting
- Log detailed error information for debugging
- Include error IDs for support tracking
- Sanitize error messages for user display

## Testing Error Boundaries

### Manual Testing
Use the `ErrorBoundaryDemo` component to test different error scenarios:

```tsx
import ErrorBoundaryDemo from './chess/ErrorBoundaryDemo';

// Add to your development routes
<ErrorBoundaryDemo />
```

### Error Simulation
Trigger different error types:
- Rendering errors: Component crashes, prop issues
- Network errors: API failures, connection issues
- AI errors: Service unavailable, quota exceeded
- Board errors: Invalid positions, interaction failures

### Recovery Testing
Test all recovery options:
- Verify error state resets correctly
- Ensure callbacks are called properly
- Check fallback UI displays correctly
- Validate game state preservation

## Best Practices

### 1. Error Prevention
- Validate props and state before rendering
- Handle async operations with proper error catching
- Use TypeScript for compile-time error prevention

### 2. Error Handling
- Catch errors as close to the source as possible
- Provide meaningful error messages and recovery options
- Log errors for debugging and monitoring

### 3. User Experience
- Never show technical error details to users
- Always provide a way to recover or continue
- Preserve user progress when possible

### 4. Development
- Test error boundaries during development
- Use error boundary demo for comprehensive testing
- Monitor error logs for patterns and improvements

## Error Boundary API Reference

### ChessErrorBoundary Props
```typescript
interface ChessErrorBoundaryProps {
  children: React.ReactNode;
  section: 'game' | 'board' | 'controls' | 'ai' | 'persistence';
  onReset?: () => void;
  onRestart?: () => void;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void; section: string }>;
}
```

### AIErrorBoundary Props
```typescript
interface AIErrorBoundaryProps {
  children: React.ReactNode;
  onRetryAI?: () => void;
  onContinueWithoutAI?: () => void;
  onRestartGame?: () => void;
  isAIThinking?: boolean;
  aiServiceStatus?: {
    status: string;
    message: string;
    canRetry: boolean;
    fallbackAvailable: boolean;
    retryAfter?: number;
  } | null;
}
```

### BoardErrorBoundary Props
```typescript
interface BoardErrorBoundaryProps {
  children: React.ReactNode;
  onResetBoard?: () => void;
  onRestartGame?: () => void;
  currentPosition?: string; // FEN notation
  theme?: 'light' | 'dark';
}
```

## Conclusion

The chess game error boundary system provides comprehensive error handling that maintains game integrity while offering excellent user experience during failures. The hierarchical structure ensures appropriate error handling at each level, while specialized boundaries provide targeted recovery strategies for different types of errors.

For development and testing, use the provided demo component and follow the testing guidelines to ensure robust error handling throughout the chess game.