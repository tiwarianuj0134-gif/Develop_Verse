# Chess Game API Documentation

## Overview

This document describes the chess game management API functions implemented in `convex/chess.ts`. These functions provide comprehensive backend support for chess game management, including move validation, game state tracking, and user statistics.

## API Functions

### Game Management

#### `createGame`
Creates a new chess game for the authenticated user.

**Type**: Mutation
**Parameters**:
- `difficulty`: "easy" | "medium" | "hard"
- `playerColor`: "white" | "black"

**Returns**: Game ID

**Example**:
```typescript
const gameId = await createGame({
  difficulty: "medium",
  playerColor: "white"
});
```

#### `getGame`
Retrieves a specific chess game by ID.

**Type**: Query
**Parameters**:
- `gameId`: ID of the game to retrieve

**Returns**: Complete game object with current state

#### `getActiveGame`
Gets the user's most recent active (incomplete) game.

**Type**: Query
**Parameters**: None

**Returns**: Active game object or null

#### `resetGame`
Resets a game to the initial chess position.

**Type**: Mutation
**Parameters**:
- `gameId`: ID of the game to reset

**Returns**: Success confirmation

#### `deleteGame`
Deletes a chess game.

**Type**: Mutation
**Parameters**:
- `gameId`: ID of the game to delete

**Returns**: Success confirmation

### Move Management

#### `makeMove`
Makes a move in a chess game with server-side validation.

**Type**: Mutation
**Parameters**:
- `gameId`: ID of the game
- `move`: Object containing:
  - `from`: Source square (e.g., "e2")
  - `to`: Destination square (e.g., "e4")
  - `promotion`: Optional promotion piece ("q", "r", "b", "n")

**Returns**: Move result with game status and validation info

**Features**:
- Server-side move validation using chess.js
- Automatic game state detection (check, checkmate, stalemate)
- Move history tracking with timestamps
- Game completion handling
- User statistics updates

**Example**:
```typescript
const result = await makeMove({
  gameId: "game123",
  move: {
    from: "e2",
    to: "e4"
  }
});
```

#### `validateMoveOnly`
Validates a move without executing it.

**Type**: Query
**Parameters**:
- `gameId`: ID of the game
- `move`: Move object to validate

**Returns**: Validation result with error details if invalid

#### `undoMove`
Undoes the last move(s) in a game.

**Type**: Mutation
**Parameters**:
- `gameId`: ID of the game
- `undoCount`: Optional number of moves to undo (default: 1)

**Returns**: Success confirmation with new move count

**Features**:
- Reconstructs position by replaying moves
- Validates move history integrity
- Updates game state after undo

#### `getValidMoves`
Gets valid moves for the current position.

**Type**: Query
**Parameters**:
- `gameId`: ID of the game
- `square`: Optional specific square to get moves for

**Returns**: Array of valid moves or destinations

### Game History and Statistics

#### `getGameHistory`
Retrieves the user's game history.

**Type**: Query
**Parameters**:
- `limit`: Optional limit on number of games (default: 20)
- `offset`: Optional offset for pagination

**Returns**: Array of completed games

#### `getUserStats`
Gets comprehensive chess statistics for a user.

**Type**: Query
**Parameters**:
- `userId`: ID of the user

**Returns**: Statistics object including:
- Total games, wins, losses, draws
- Win rate and averages
- Difficulty-specific statistics

#### `updateUserStats` (Internal)
Updates user statistics after game completion.

**Type**: Action (Internal use)
**Parameters**:
- `userId`: User ID
- `gameResult`: Game outcome details
- `difficulty`: Game difficulty level

### AI Integration (Placeholder)

#### `requestAIMove`
Requests an AI move from Gemini (placeholder for future implementation).

**Type**: Action
**Parameters**:
- `gameId`: ID of the game
- `difficulty`: AI difficulty level

**Returns**: Currently throws "not implemented" error

**Note**: This function will be implemented in task 7.2 when Gemini integration is added.

## Server-Side Validation

### Move Validation Logic
The API implements comprehensive server-side move validation:

1. **Chess Rules Validation**: Uses chess.js to validate all moves according to official chess rules
2. **Game State Detection**: Automatically detects check, checkmate, stalemate, and draw conditions
3. **Turn Validation**: Ensures moves are made by the correct player
4. **Game Completion**: Prevents moves in completed games

### Error Handling
- **Authentication**: All functions require user authentication
- **Authorization**: Users can only access their own games
- **Validation Errors**: Detailed error messages for invalid moves
- **Game State Errors**: Prevents invalid operations (e.g., moves in completed games)

## Data Models

### Game Object
```typescript
{
  _id: string;
  userId: string;
  fen: string;                    // Current position in FEN notation
  moveHistory: Move[];            // Complete move history
  currentPlayer: "white" | "black";
  gameStatus: "playing" | "check" | "checkmate" | "stalemate" | "draw";
  difficulty: "easy" | "medium" | "hard";
  playerColor: "white" | "black";
  gameResult?: GameResult;        // Set when game completes
  isCompleted: boolean;
  createdAt: number;
  updatedAt: number;
}
```

### Move Object
```typescript
{
  from: string;        // Source square (e.g., "e2")
  to: string;          // Destination square (e.g., "e4")
  san: string;         // Standard Algebraic Notation (e.g., "e4")
  promotion?: string;  // Promotion piece if applicable
  timestamp: number;   // Move timestamp
}
```

### Game Result Object
```typescript
{
  winner: "white" | "black" | "draw";
  reason: "checkmate" | "stalemate" | "draw" | "resignation" | "timeout";
  moveCount: number;
  duration: number;    // Game duration in seconds
}
```

## Security Features

1. **Authentication Required**: All functions require valid user authentication
2. **Authorization Checks**: Users can only access their own games
3. **Input Validation**: All parameters are validated using Convex validators
4. **Server-Side Validation**: All moves are re-validated on the server
5. **Data Integrity**: Move history and game state consistency is maintained

## Performance Considerations

1. **Efficient Queries**: Proper database indexes for fast game retrieval
2. **Minimal Data Transfer**: Only necessary data is returned
3. **Caching**: Game state is efficiently cached and updated
4. **Batch Operations**: Statistics updates are batched for performance

## Integration with Frontend

The API is designed to work seamlessly with the existing frontend chess components:

1. **GameManager Integration**: Frontend can call API functions directly
2. **Real-time Updates**: Convex provides real-time updates to game state
3. **Error Handling**: Comprehensive error messages for frontend display
4. **Offline Support**: Frontend can cache moves and sync when online

## Testing

The API includes comprehensive test coverage:

1. **Unit Tests**: Test individual validation functions
2. **Integration Tests**: Test complete API workflows
3. **Edge Cases**: Test error conditions and boundary cases
4. **Performance Tests**: Verify response times and scalability

## Future Enhancements

1. **Gemini AI Integration**: Complete AI opponent implementation
2. **Multiplayer Support**: Add support for human vs human games
3. **Tournament Mode**: Support for tournament-style play
4. **Advanced Analytics**: More detailed game analysis and statistics
5. **Opening Book**: Integration with chess opening databases

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 5.2**: Server-side move validation with comprehensive error handling
- **Requirement 6.2**: Complete game management API with CRUD operations
- **Requirement 4.1-4.6**: Game state management and persistence
- **Requirement 7.1-7.6**: Error handling and resilience
- **Requirement 6.1-6.6**: Platform integration with existing Convex architecture

The API provides a solid foundation for the chess game feature and is ready for frontend integration and AI opponent implementation.