import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Chess } from "chess.js";
import { GoogleGenAI } from "@google/genai";

// Gemini API configuration and prompt engineering
const GEMINI_CHESS_PROMPTS = {
  systemInstruction: `You are a professional chess engine. You must respond with only a valid chess move in standard algebraic notation (SAN).

Rules:
- Analyze the board position provided in FEN notation
- Generate only legal moves according to chess rules
- Consider the specified difficulty level
- Respond with only the move (e.g., "Nf3", "e4", "O-O", "Qxd7+")
- Never explain your reasoning, only provide the move
- If castling, use "O-O" for kingside and "O-O-O" for queenside
- For pawn promotion, include the piece (e.g., "e8=Q")
- For captures, use "x" (e.g., "Nxf7")
- For check, add "+" (e.g., "Qh5+")
- For checkmate, add "#" (e.g., "Qh7#")`,

  difficultyPrompts: {
    easy: `Play at beginner level:
- Make reasonable but not optimal moves
- Occasionally miss simple tactical opportunities
- Focus on basic piece development
- Don't calculate deeply
- Make some positional mistakes`,

    medium: `Play at intermediate level:
- Look for basic tactics (pins, forks, skewers)
- Consider positional principles
- Calculate 2-3 moves ahead
- Make good but not perfect moves
- Occasionally miss complex tactics`,

    hard: `Play at advanced level:
- Calculate deeply (4-6 moves ahead)
- Find the best moves in most positions
- Exploit all tactical and positional opportunities
- Consider long-term strategic plans
- Play near-optimal moves`
  }
};

// Initialize Gemini AI client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenAI({ apiKey });
}

// Enhanced error types for better error handling
interface AIError {
  type: 'quota_exceeded' | 'api_unavailable' | 'network_error' | 'invalid_response' | 'unknown';
  message: string;
  retryable: boolean;
  retryAfter?: number; // seconds to wait before retry
}

// Parse and categorize API errors
function parseAPIError(error: any): AIError {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  
  // Quota exceeded errors
  if (error?.status === 429 || errorMessage.includes('quota') || errorMessage.includes('limit')) {
    return {
      type: 'quota_exceeded',
      message: 'AI service quota exceeded. Please try again in a few minutes.',
      retryable: false,
      retryAfter: 300 // 5 minutes
    };
  }
  
  // Network/connectivity errors
  if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED' || 
      errorMessage.includes('network') || errorMessage.includes('timeout') ||
      errorMessage.includes('fetch')) {
    return {
      type: 'network_error',
      message: 'Network connection issue. Please check your internet connection.',
      retryable: true,
      retryAfter: 5
    };
  }
  
  // API service unavailable
  if (error?.status >= 500 || errorMessage.includes('service unavailable') ||
      errorMessage.includes('internal server error')) {
    return {
      type: 'api_unavailable',
      message: 'AI service is temporarily unavailable. Using fallback AI.',
      retryable: true,
      retryAfter: 10
    };
  }
  
  // Invalid API response
  if (errorMessage.includes('invalid') || errorMessage.includes('malformed') ||
      errorMessage.includes('parse')) {
    return {
      type: 'invalid_response',
      message: 'AI service returned an invalid response. Using fallback AI.',
      retryable: true,
      retryAfter: 2
    };
  }
  
  // Unknown error
  return {
    type: 'unknown',
    message: 'AI service encountered an unexpected error. Using fallback AI.',
    retryable: true,
    retryAfter: 5
  };
}

// Generate chess move using Gemini AI with enhanced error handling
async function generateAIMove(
  fen: string, 
  difficulty: "easy" | "medium" | "hard",
  moveHistory: string[] = [],
  attempt: number = 1
): Promise<{ move: string; usedFallback: boolean; error?: AIError }> {
  const maxAttempts = 3;
  const baseDelay = 1000; // 1 second base delay
  
  try {
    const client = getGeminiClient();

    // Build the prompt with current position and difficulty
    const difficultyInstruction = GEMINI_CHESS_PROMPTS.difficultyPrompts[difficulty];
    const recentMoves = moveHistory.slice(-10).join(" "); // Last 10 moves for context
    
    const prompt = `${GEMINI_CHESS_PROMPTS.systemInstruction}

${difficultyInstruction}

Current position (FEN): ${fen}
Recent moves: ${recentMoves || "Game start"}

Your move:`;

    // Try different models in order of preference
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    let lastError: any = null;
    
    for (const modelName of modelsToTry) {
      try {
        const result = await client.models.generateContent({
          model: modelName,
          contents: [{
            role: "user",
            parts: [{ text: prompt }]
          }]
        });

        const moveText = result.text?.trim() || "";
        
        if (moveText) {
          // Clean up the response - remove any extra text, just get the move
          const moveMatch = moveText.match(/^([KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?|O-O(?:-O)?)/);
          if (moveMatch) {
            return { move: moveMatch[1], usedFallback: false };
          }

          // If no valid move pattern found, return the cleaned text
          const cleanedMove = moveText.replace(/[^a-zA-Z0-9+#=\-xO]/g, '');
          if (cleanedMove) {
            return { move: cleanedMove, usedFallback: false };
          }
        }
        
        // If we get here, the response was empty or invalid
        lastError = new Error(`Model ${modelName} returned empty or invalid response`);
        
      } catch (modelError: any) {
        console.warn(`Model ${modelName} failed (attempt ${attempt}):`, modelError?.message || modelError);
        lastError = modelError;
        
        const parsedError = parseAPIError(modelError);
        
        // If quota exceeded, don't try other models - fail immediately
        if (parsedError.type === 'quota_exceeded') {
          console.warn("Quota exceeded, using fallback AI immediately");
          const fallbackMove = generateFallbackAIMove(fen, difficulty);
          return { 
            move: fallbackMove, 
            usedFallback: true, 
            error: parsedError 
          };
        }
        
        // Continue to next model for other errors
        continue;
      }
    }
    
    // If all models failed but errors are retryable, try again with exponential backoff
    if (attempt < maxAttempts && lastError) {
      const parsedError = parseAPIError(lastError);
      
      if (parsedError.retryable) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
        console.warn(`All models failed (attempt ${attempt}), retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return generateAIMove(fen, difficulty, moveHistory, attempt + 1);
      }
    }
    
    // If all Gemini models failed and no more retries, use fallback AI
    console.warn("All Gemini models failed after all attempts, using fallback AI");
    const fallbackMove = generateFallbackAIMove(fen, difficulty);
    const parsedError = parseAPIError(lastError);
    
    return { 
      move: fallbackMove, 
      usedFallback: true, 
      error: parsedError 
    };
    
  } catch (error) {
    console.error("Gemini API error:", error);
    const parsedError = parseAPIError(error);
    
    // If retryable and we haven't exceeded max attempts, retry
    if (parsedError.retryable && attempt < maxAttempts) {
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 10000);
      console.warn(`Gemini API error (attempt ${attempt}), retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateAIMove(fen, difficulty, moveHistory, attempt + 1);
    }
    
    // Use fallback AI
    console.warn("Using fallback AI due to Gemini API error");
    const fallbackMove = generateFallbackAIMove(fen, difficulty);
    
    return { 
      move: fallbackMove, 
      usedFallback: true, 
      error: parsedError 
    };
  }
}

// Enhanced fallback AI that generates reasonable chess moves with better check handling
function generateFallbackAIMove(fen: string, difficulty: "easy" | "medium" | "hard"): string {
  try {
    const chess = new Chess(fen);
    const allMoves = chess.moves();
    
    if (allMoves.length === 0) {
      throw new Error("No legal moves available");
    }
    
    // Check if we're in check - this affects move selection priority
    const isInCheck = chess.inCheck();
    
    // Enhanced AI logic based on difficulty
    switch (difficulty) {
      case "easy":
        // When in check, just pick any legal move (they all get out of check)
        if (isInCheck) {
          return allMoves[Math.floor(Math.random() * allMoves.length)];
        }
        
        // Random move with slight preference for captures
        const captures = allMoves.filter(move => move.includes('x'));
        if (captures.length > 0 && Math.random() < 0.3) {
          return captures[Math.floor(Math.random() * captures.length)];
        }
        return allMoves[Math.floor(Math.random() * allMoves.length)];
        
      case "medium":
        // When in check, prefer moves that also attack or capture
        if (isInCheck) {
          const checkEscapes = allMoves.filter(move => move.includes('x') || move.includes('+'));
          if (checkEscapes.length > 0) {
            return checkEscapes[Math.floor(Math.random() * checkEscapes.length)];
          }
          return allMoves[Math.floor(Math.random() * allMoves.length)];
        }
        
        // Normal medium difficulty logic
        const mediumCaptures = allMoves.filter(move => move.includes('x'));
        const checks = allMoves.filter(move => move.includes('+'));
        const castling = allMoves.filter(move => move === 'O-O' || move === 'O-O-O');
        
        // Prioritize checkmate moves
        const checkmates = allMoves.filter(move => move.includes('#'));
        if (checkmates.length > 0) {
          return checkmates[0];
        }
        
        // Prioritize captures (70% chance)
        if (mediumCaptures.length > 0 && Math.random() < 0.7) {
          return mediumCaptures[Math.floor(Math.random() * mediumCaptures.length)];
        }
        
        // Consider checks (50% chance)
        if (checks.length > 0 && Math.random() < 0.5) {
          return checks[Math.floor(Math.random() * checks.length)];
        }
        
        // Consider castling in early game (if available and safe)
        if (castling.length > 0 && chess.history().length < 15 && Math.random() < 0.6) {
          return castling[Math.floor(Math.random() * castling.length)];
        }
        
        return allMoves[Math.floor(Math.random() * allMoves.length)];
        
      case "hard":
        // When in check, find the best escape move
        if (isInCheck) {
          const checkEscapes = allMoves.filter(move => move.includes('x') || move.includes('+') || move.includes('#'));
          if (checkEscapes.length > 0) {
            // Prefer checkmate, then check, then capture
            const escapeCheckmates = checkEscapes.filter(move => move.includes('#'));
            const escapeChecks = checkEscapes.filter(move => move.includes('+'));
            const escapeCaptures = checkEscapes.filter(move => move.includes('x'));
            
            if (escapeCheckmates.length > 0) {
              return escapeCheckmates[0];
            } else if (escapeChecks.length > 0) {
              return escapeChecks[0];
            } else if (escapeCaptures.length > 0) {
              return escapeCaptures[0];
            }
          }
          // If no good escape moves, just pick any legal move
          return allMoves[Math.floor(Math.random() * allMoves.length)];
        }
        
        // More sophisticated move selection with tactical awareness
        const hardCaptures = allMoves.filter(move => move.includes('x'));
        const hardChecks = allMoves.filter(move => move.includes('+'));
        const hardCheckmates = allMoves.filter(move => move.includes('#'));
        const promotions = allMoves.filter(move => move.includes('='));
        
        // Always play checkmate if available
        if (hardCheckmates.length > 0) {
          return hardCheckmates[0];
        }
        
        // Prioritize pawn promotions
        if (promotions.length > 0) {
          return promotions[0];
        }
        
        // Evaluate moves more carefully
        const goodMoves = [];
        
        // Add all captures (high priority)
        goodMoves.push(...hardCaptures.map(move => ({ move, priority: 3 })));
        
        // Add checks (medium-high priority)
        goodMoves.push(...hardChecks.map(move => ({ move, priority: 2 })));
        
        // Add development moves in opening (medium priority)
        if (chess.history().length < 12) {
          const developmentMoves = allMoves.filter(move => 
            move.startsWith('N') || move.startsWith('B') || 
            move === 'O-O' || move === 'O-O-O'
          );
          goodMoves.push(...developmentMoves.map(move => ({ move, priority: 2 })));
        }
        
        // Add center control moves in opening/middlegame
        if (chess.history().length < 20) {
          const centerMoves = allMoves.filter(move => 
            move.includes('e4') || move.includes('e5') || 
            move.includes('d4') || move.includes('d5')
          );
          goodMoves.push(...centerMoves.map(move => ({ move, priority: 1 })));
        }
        
        // Select move based on priority
        if (goodMoves.length > 0) {
          // Sort by priority (highest first)
          goodMoves.sort((a, b) => b.priority - a.priority);
          
          // Select from top priority moves
          const topPriority = goodMoves[0].priority;
          const topMoves = goodMoves.filter(m => m.priority === topPriority);
          const selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)];
          return selectedMove.move;
        }
        
        // Fallback to random move
        return allMoves[Math.floor(Math.random() * allMoves.length)];
        
      default:
        return allMoves[Math.floor(Math.random() * allMoves.length)];
    }
  } catch (error) {
    console.error("Error in generateFallbackAIMove:", error);
    // Ultimate fallback - try to return any legal move
    try {
      const chess = new Chess(fen);
      const moves = chess.moves();
      if (moves.length > 0) {
        return moves[0]; // Return the first legal move
      }
    } catch (fallbackError) {
      console.error("Ultimate fallback also failed:", fallbackError);
    }
    throw new Error("Unable to generate any valid move");
  }
}
// Validate AI-generated move with timeout protection
function validateAIMove(fen: string, aiMove: string): {
  isValid: boolean;
  error?: string;
  resultingFen?: string;
  gameStatus?: string;
  san?: string;
} {
  try {
    // Add basic input validation
    if (!fen || !aiMove) {
      return {
        isValid: false,
        error: 'Invalid input: FEN or move is empty'
      };
    }

    // Trim whitespace from move
    const cleanMove = aiMove.trim();
    
    const chess = new Chess(fen);
    
    // Check if the position is valid before attempting move
    if (!chess.isGameOver() && chess.moves().length === 0) {
      return {
        isValid: false,
        error: 'No legal moves available in current position'
      };
    }
    
    // Try to make the move - chess.js will parse SAN notation
    const result = chess.move(cleanMove);
    
    if (!result) {
      // Get available moves for better error reporting
      const availableMoves = chess.moves();
      return {
        isValid: false,
        error: `Invalid AI move: "${cleanMove}" is not legal in the current position. Available moves: ${availableMoves.slice(0, 5).join(', ')}${availableMoves.length > 5 ? '...' : ''}`
      };
    }
    
    // Determine game status after the move
    let gameStatus = "playing";
    if (chess.isCheckmate()) {
      gameStatus = "checkmate";
    } else if (chess.isStalemate()) {
      gameStatus = "stalemate";
    } else if (chess.isDraw()) {
      gameStatus = "draw";
    } else if (chess.inCheck()) {
      gameStatus = "check";
    }
    
    return {
      isValid: true,
      resultingFen: chess.fen(),
      gameStatus,
      san: result.san
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('validateAIMove error:', errorMessage, 'for move:', aiMove, 'in position:', fen);
    
    return {
      isValid: false,
      error: `Failed to validate AI move: ${errorMessage}`
    };
  }
}

// Server-side move validation helper
function validateMove(fen: string, move: { from: string; to: string; promotion?: string }) {
  try {
    const chess = new Chess(fen);
    
    // Attempt to make the move
    const result = chess.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion
    });
    
    if (!result) {
      return {
        isValid: false,
        error: "Invalid move: Move is not legal in the current position",
        resultingFen: fen,
        gameStatus: "playing"
      };
    }
    
    // Determine game status
    let gameStatus = "playing";
    if (chess.isCheckmate()) {
      gameStatus = "checkmate";
    } else if (chess.isStalemate()) {
      gameStatus = "stalemate";
    } else if (chess.isDraw()) {
      gameStatus = "draw";
    } else if (chess.isCheck()) {
      gameStatus = "check";
    }
    
    return {
      isValid: true,
      error: null,
      resultingFen: chess.fen(),
      gameStatus,
      san: result.san,
      capturedPiece: result.captured || null
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid move: ${error instanceof Error ? error.message : 'Unknown error'}`,
      resultingFen: fen,
      gameStatus: "playing"
    };
  }
}

// Helper to determine game result from status
function getGameResult(gameStatus: string, currentPlayer: string): {
  winner: 'white' | 'black' | 'draw';
  reason: 'checkmate' | 'stalemate' | 'draw';
} | null {
  switch (gameStatus) {
    case "checkmate":
      // If it's checkmate, the current player (who can't move) loses
      return {
        winner: currentPlayer === "white" ? "black" : "white",
        reason: "checkmate"
      };
    case "stalemate":
      return {
        winner: "draw",
        reason: "stalemate"
      };
    case "draw":
      return {
        winner: "draw",
        reason: "draw"
      };
    default:
      return null;
  }
}

// Create a new chess game
export const createGame = mutation({
  args: {
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    playerColor: v.union(v.literal("white"), v.literal("black")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Initial chess position in FEN notation
    const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    // Validate the initial position (should always be valid, but good practice)
    try {
      new Chess(initialFen);
    } catch (error) {
      throw new Error("Failed to create game: Invalid initial position");
    }

    const gameId = await ctx.db.insert("chessGames", {
      userId,
      fen: initialFen,
      moveHistory: [],
      currentPlayer: "white",
      gameStatus: "playing",
      difficulty: args.difficulty,
      playerColor: args.playerColor,
      isCompleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return gameId;
  },
});

// Reset/restart a chess game
export const resetGame = mutation({
  args: {
    gameId: v.id("chessGames"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Verify the game belongs to the current user
    if (game.userId !== userId) {
      throw new Error("Unauthorized: This game belongs to another user");
    }

    // Reset to initial position
    const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    await ctx.db.patch(args.gameId, {
      fen: initialFen,
      moveHistory: [],
      currentPlayer: "white",
      gameStatus: "playing",
      gameResult: undefined,
      isCompleted: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Undo the last move(s) in a chess game
export const undoMove = mutation({
  args: {
    gameId: v.id("chessGames"),
    undoCount: v.optional(v.number()), // Number of moves to undo (default 1)
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Verify the game belongs to the current user
    if (game.userId !== userId) {
      throw new Error("Unauthorized: This game belongs to another user");
    }

    // Check if game is completed
    if (game.isCompleted) {
      throw new Error("Cannot undo moves: Game is already completed");
    }

    const undoCount = args.undoCount || 1;
    
    // Check if there are enough moves to undo
    if (game.moveHistory.length < undoCount) {
      throw new Error(`Cannot undo ${undoCount} moves: Only ${game.moveHistory.length} moves have been made`);
    }

    // Reconstruct the position by replaying moves up to the undo point
    try {
      const chess = new Chess();
      const newMoveHistory = game.moveHistory.slice(0, -undoCount);
      
      // Replay all moves except the ones being undone
      for (const move of newMoveHistory) {
        const result = chess.move({
          from: move.from,
          to: move.to,
          promotion: move.promotion
        });
        
        if (!result) {
          throw new Error("Failed to reconstruct position: Invalid move in history");
        }
      }
      
      // Determine game status after undo
      let gameStatus = "playing";
      if (chess.isCheck()) {
        gameStatus = "check";
      }
      
      // Update the game
      await ctx.db.patch(args.gameId, {
        fen: chess.fen(),
        moveHistory: newMoveHistory,
        currentPlayer: chess.turn() === 'w' ? 'white' : 'black',
        gameStatus,
        gameResult: undefined, // Clear any game result
        isCompleted: false,
        updatedAt: Date.now(),
      });

      return { 
        success: true, 
        undoCount,
        newMoveCount: newMoveHistory.length 
      };
    } catch (error) {
      throw new Error(`Failed to undo move: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get a chess game by ID
export const getGame = query({
  args: { gameId: v.id("chessGames") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Verify the game belongs to the current user
    if (game.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return game;
  },
});

// Get user's active chess game
export const getActiveGame = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Find the most recent active game
    const activeGame = await ctx.db
      .query("chessGames")
      .withIndex("by_user_completed", (q) =>
        q.eq("userId", userId).eq("isCompleted", false)
      )
      .order("desc")
      .first();

    return activeGame;
  },
});

// Validate a move without making it
export const validateMoveOnly = query({
  args: {
    gameId: v.id("chessGames"),
    move: v.object({
      from: v.string(),
      to: v.string(),
      promotion: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Verify the game belongs to the current user
    if (game.userId !== userId) {
      throw new Error("Unauthorized: This game belongs to another user");
    }

    // Validate the move
    const validation = validateMove(game.fen, args.move);
    
    return {
      isValid: validation.isValid,
      error: validation.error,
      gameStatus: validation.gameStatus,
      san: validation.san || null
    };
  },
});

// Get valid moves for a position
export const getValidMoves = query({
  args: {
    gameId: v.id("chessGames"),
    square: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Verify the game belongs to the current user
    if (game.userId !== userId) {
      throw new Error("Unauthorized: This game belongs to another user");
    }

    try {
      const chess = new Chess(game.fen);
      
      if (args.square) {
        // Get moves for a specific square - need to cast to Square type
        const moves = chess.moves({ square: args.square as any, verbose: true });
        return (moves as any[]).map(move => move.to);
      } else {
        // Get all possible moves
        const moves = chess.moves({ verbose: true });
        return (moves as any[]).map(move => ({
          from: move.from,
          to: move.to,
          san: move.san,
          piece: move.piece,
          captured: move.captured || null
        }));
      }
    } catch (error) {
      throw new Error(`Failed to get valid moves: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Make a move in a chess game with server-side validation
export const makeMove = mutation({
  args: {
    gameId: v.id("chessGames"),
    move: v.object({
      from: v.string(),
      to: v.string(),
      promotion: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Verify the game belongs to the current user
    if (game.userId !== userId) {
      throw new Error("Unauthorized: This game belongs to another user");
    }

    // Check if game is already completed
    if (game.isCompleted) {
      throw new Error("Cannot make move: Game is already completed");
    }

    // Validate the move on the server
    const validation = validateMove(game.fen, args.move);
    
    if (!validation.isValid) {
      throw new Error(validation.error || "Invalid move");
    }

    // Create move record with timestamp and SAN notation
    const moveWithTimestamp = {
      from: args.move.from,
      to: args.move.to,
      san: validation.san!,
      promotion: args.move.promotion,
      timestamp: Date.now(),
    };

    // Determine if game is completed
    const gameResult = getGameResult(validation.gameStatus, game.currentPlayer);
    const isCompleted = gameResult !== null;

    // Calculate game duration if completed
    let finalGameResult = null;
    if (gameResult) {
      const duration = Math.floor((Date.now() - game.createdAt) / 1000);
      finalGameResult = {
        ...gameResult,
        moveCount: game.moveHistory.length + 1,
        duration
      };
    }

    // Update the game
    await ctx.db.patch(args.gameId, {
      fen: validation.resultingFen,
      moveHistory: [...game.moveHistory, moveWithTimestamp],
      currentPlayer: validation.resultingFen.split(' ')[1] === 'w' ? 'white' : 'black',
      gameStatus: validation.gameStatus,
      gameResult: finalGameResult || undefined,
      isCompleted,
      updatedAt: Date.now(),
    });

    // Update user statistics if game is completed
    if (finalGameResult) {
      await ctx.scheduler.runAfter(0, api.chess.updateUserStats, {
        userId,
        gameResult: finalGameResult,
        difficulty: game.difficulty,
      });
    }

    return {
      success: true,
      gameStatus: validation.gameStatus,
      gameResult: finalGameResult,
      capturedPiece: validation.capturedPiece,
      san: validation.san
    };
  },
});

// Update user chess statistics
export const updateUserStats = action({
  args: {
    userId: v.id("users"),
    gameResult: v.object({
      winner: v.string(),
      reason: v.string(),
      moveCount: v.number(),
      duration: v.number(),
    }),
    difficulty: v.string(),
  },
  handler: async (ctx, args) => {
    // Get existing stats
    const existingStats = await ctx.runQuery(api.chess.getUserStats, {
      userId: args.userId,
    });

    let stats;
    if (existingStats) {
      // Update existing stats
      const isWin = args.gameResult.winner === 'white'; // Assuming player is always white
      const isDraw = args.gameResult.winner === 'draw';
      
      const newTotalGames = existingStats.totalGames + 1;
      const newWins = existingStats.wins + (isWin ? 1 : 0);
      const newLosses = existingStats.losses + (!isWin && !isDraw ? 1 : 0);
      const newDraws = existingStats.draws + (isDraw ? 1 : 0);
      
      // Update difficulty-specific stats
      const difficultyStats = { ...existingStats.difficultyStats };
      const diffKey = args.difficulty as 'easy' | 'medium' | 'hard';
      difficultyStats[diffKey] = {
        games: difficultyStats[diffKey].games + 1,
        wins: difficultyStats[diffKey].wins + (isWin ? 1 : 0),
        winRate: ((difficultyStats[diffKey].wins + (isWin ? 1 : 0)) / (difficultyStats[diffKey].games + 1)) * 100,
      };

      stats = {
        totalGames: newTotalGames,
        wins: newWins,
        losses: newLosses,
        draws: newDraws,
        winRate: (newWins / newTotalGames) * 100,
        averageGameDuration: ((existingStats.averageGameDuration * existingStats.totalGames) + args.gameResult.duration) / newTotalGames,
        averageMovesPerGame: ((existingStats.averageMovesPerGame * existingStats.totalGames) + args.gameResult.moveCount) / newTotalGames,
        difficultyStats,
        lastUpdated: Date.now(),
      };

      await ctx.runMutation(api.chess.updateStats, {
        userId: args.userId,
        stats,
      });
    } else {
      // Create new stats
      const isWin = args.gameResult.winner === 'white';
      const isDraw = args.gameResult.winner === 'draw';
      
      const difficultyStats = {
        easy: { games: 0, wins: 0, winRate: 0 },
        medium: { games: 0, wins: 0, winRate: 0 },
        hard: { games: 0, wins: 0, winRate: 0 },
      };
      
      const diffKey = args.difficulty as 'easy' | 'medium' | 'hard';
      difficultyStats[diffKey] = {
        games: 1,
        wins: isWin ? 1 : 0,
        winRate: isWin ? 100 : 0,
      };

      stats = {
        userId: args.userId,
        totalGames: 1,
        wins: isWin ? 1 : 0,
        losses: !isWin && !isDraw ? 1 : 0,
        draws: isDraw ? 1 : 0,
        winRate: isWin ? 100 : 0,
        averageGameDuration: args.gameResult.duration,
        averageMovesPerGame: args.gameResult.moveCount,
        difficultyStats,
        lastUpdated: Date.now(),
      };

      await ctx.runMutation(api.chess.createStats, {
        stats,
      });
    }
  },
});

// Get user chess statistics
export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chessStats")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

// Create user chess statistics
export const createStats = mutation({
  args: {
    stats: v.object({
      userId: v.id("users"),
      totalGames: v.number(),
      wins: v.number(),
      losses: v.number(),
      draws: v.number(),
      winRate: v.number(),
      averageGameDuration: v.number(),
      averageMovesPerGame: v.number(),
      difficultyStats: v.object({
        easy: v.object({
          games: v.number(),
          wins: v.number(),
          winRate: v.number(),
        }),
        medium: v.object({
          games: v.number(),
          wins: v.number(),
          winRate: v.number(),
        }),
        hard: v.object({
          games: v.number(),
          wins: v.number(),
          winRate: v.number(),
        }),
      }),
      lastUpdated: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chessStats", args.stats);
  },
});

// Update user chess statistics
export const updateStats = mutation({
  args: {
    userId: v.id("users"),
    stats: v.object({
      totalGames: v.number(),
      wins: v.number(),
      losses: v.number(),
      draws: v.number(),
      winRate: v.number(),
      averageGameDuration: v.number(),
      averageMovesPerGame: v.number(),
      difficultyStats: v.object({
        easy: v.object({
          games: v.number(),
          wins: v.number(),
          winRate: v.number(),
        }),
        medium: v.object({
          games: v.number(),
          wins: v.number(),
          winRate: v.number(),
        }),
        hard: v.object({
          games: v.number(),
          wins: v.number(),
          winRate: v.number(),
        }),
      }),
      lastUpdated: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const existingStats = await ctx.db
      .query("chessStats")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (existingStats) {
      await ctx.db.patch(existingStats._id, args.stats);
    }
  },
});

// Get user's chess game history
export const getGameHistory = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const games = await ctx.db
      .query("chessGames")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 20);

    return games;
  },
});

// Delete a chess game
export const deleteGame = mutation({
  args: { gameId: v.id("chessGames") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Verify the game belongs to the current user
    if (game.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.gameId);
    return { success: true };
  },
});

// Validate API key without consuming quota
export const validateGeminiAPIKey = action({
  args: {},
  handler: async (ctx, args) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return {
          success: false,
          error: "GEMINI_API_KEY environment variable is not set"
        };
      }

      // Basic validation - check if API key has correct format
      if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
        return {
          success: false,
          error: "API key format appears invalid"
        };
      }

      return {
        success: true,
        message: "API key is properly configured",
        keyPrefix: apiKey.substring(0, 8) + "..."
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

// Test Gemini API connection (for debugging and validation)
export const testGeminiConnection = action({
  args: {},
  handler: async (ctx, args) => {
    try {
      const client = getGeminiClient();
      
      // Try different model names to find one that works
      const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-1.5-pro", 
        "gemini-pro"
      ];
      
      for (const modelName of modelsToTry) {
        try {
          // Test with a simple chess position
          const testFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
          const prompt = `${GEMINI_CHESS_PROMPTS.systemInstruction}

${GEMINI_CHESS_PROMPTS.difficultyPrompts.medium}

Current position (FEN): ${testFen}
Recent moves: Game start

Your move:`;

          const result = await client.models.generateContent({
            model: modelName,
            contents: [{
              role: "user", 
              parts: [{ text: prompt }]
            }]
          });

          const moveText = result.text?.trim() || "";

          // Validate the test move
          const validation = validateAIMove(testFen, moveText);

          return {
            success: true,
            apiConnected: true,
            modelUsed: modelName,
            testMove: moveText,
            moveValid: validation.isValid,
            error: validation.error || null
          };
        } catch (modelError) {
          console.log(`Model ${modelName} failed:`, modelError);
          continue; // Try next model
        }
      }
      
      return {
        success: false,
        apiConnected: false,
        error: "No working model found among the tested models"
      };
    } catch (error) {
      return {
        success: false,
        apiConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

// Get AI service status and health check
export const getAIServiceStatus = action({
  args: {},
  handler: async (ctx, args) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return {
          status: 'unavailable',
          message: 'AI service is not configured',
          canRetry: false,
          fallbackAvailable: true
        };
      }

      // Try a simple test with Gemini API
      const client = getGeminiClient();
      const testFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      
      try {
        const result = await client.models.generateContent({
          model: "gemini-1.5-flash",
          contents: [{
            role: "user",
            parts: [{ text: "Test connection. Respond with 'OK'" }]
          }]
        });

        if (result.text?.trim()) {
          return {
            status: 'available',
            message: 'AI service is working normally',
            canRetry: true,
            fallbackAvailable: true
          };
        } else {
          return {
            status: 'degraded',
            message: 'AI service is responding but may have issues',
            canRetry: true,
            fallbackAvailable: true
          };
        }
      } catch (testError: any) {
        const parsedError = parseAPIError(testError);
        
        return {
          status: 'unavailable',
          message: parsedError.message,
          canRetry: parsedError.retryable,
          fallbackAvailable: true,
          retryAfter: parsedError.retryAfter
        };
      }
    } catch (error) {
      return {
        status: 'unavailable',
        message: 'Unable to check AI service status',
        canRetry: false,
        fallbackAvailable: true
      };
    }
  },
});

// Recover from AI errors by attempting to continue the game
export const recoverFromAIError = action({
  args: {
    gameId: v.id("chessGames"),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    forceReset: v.optional(v.boolean())
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    action: string;
    message: string;
    serviceStatus?: any;
    moveResult?: any;
    error?: string;
  }> => {
    try {
      // Check AI service status first
      const serviceStatus: any = await ctx.runAction(api.chess.getAIServiceStatus, {});
      
      if (args.forceReset) {
        // Reset the game to a clean state
        await ctx.runMutation(api.chess.resetGame, { gameId: args.gameId });
        
        return {
          success: true,
          action: 'game_reset',
          message: 'Game has been reset. You can start a new game.',
          serviceStatus
        };
      }
      
      // Try to continue with current game state
      if (serviceStatus.fallbackAvailable) {
        try {
          // Attempt to make an AI move using fallback
          const result: any = await ctx.runAction(api.chess.requestAIMove, {
            gameId: args.gameId,
            difficulty: args.difficulty
          });
          
          return {
            success: true,
            action: 'move_generated',
            message: 'AI move generated using fallback system',
            serviceStatus,
            moveResult: result
          };
        } catch (moveError) {
          return {
            success: false,
            action: 'recovery_failed',
            message: 'Unable to generate AI move. Consider restarting the game.',
            serviceStatus,
            error: moveError instanceof Error ? moveError.message : 'Unknown error'
          };
        }
      }
      
      return {
        success: false,
        action: 'service_unavailable',
        message: 'AI service is currently unavailable. Please try again later.',
        serviceStatus
      };
    } catch (error) {
      return {
        success: false,
        action: 'recovery_error',
        message: 'Error occurred during recovery attempt',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

// Update game with AI move (internal mutation)
export const updateGameWithAIMove = mutation({
  args: {
    gameId: v.id("chessGames"),
    move: v.object({
      from: v.string(),
      to: v.string(),
      san: v.string(),
      promotion: v.optional(v.string()),
      timestamp: v.number(),
    }),
    resultingFen: v.string(),
    gameStatus: v.string(),
    gameResult: v.optional(v.object({
      winner: v.string(),
      reason: v.string(),
      moveCount: v.number(),
      duration: v.number(),
    })),
    isCompleted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Update the game
    await ctx.db.patch(args.gameId, {
      fen: args.resultingFen,
      moveHistory: [...game.moveHistory, args.move],
      currentPlayer: args.resultingFen.split(' ')[1] === 'w' ? 'white' : 'black',
      gameStatus: args.gameStatus,
      gameResult: args.gameResult || undefined,
      isCompleted: args.isCompleted,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Request AI move from Gemini with enhanced error handling and retry logic
export const requestAIMove = action({
  args: {
    gameId: v.id("chessGames"),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    move: string;
    san: string;
    gameStatus: string;
    gameResult: any;
    attempts: number;
    usedFallback: boolean;
    errorMessage?: string;
    fallbackReason?: string;
  }> => {
    // Get the current game state
    const game = await ctx.runQuery(api.chess.getGame, { gameId: args.gameId });
    
    if (!game) {
      throw new Error("Game not found");
    }
    
    if (game.isCompleted) {
      throw new Error("Cannot request AI move: Game is already completed");
    }

    // Check if it's the AI's turn (assuming AI plays black when player is white)
    const chess = new Chess(game.fen);
    const currentTurn = chess.turn(); // 'w' for white, 'b' for black
    
    if (game.playerColor === 'white' && currentTurn === 'w') {
      throw new Error("It's the player's turn, not the AI's turn");
    }
    if (game.playerColor === 'black' && currentTurn === 'b') {
      throw new Error("It's the player's turn, not the AI's turn");
    }

    // Extract move history in SAN notation for context
    const moveHistory = game.moveHistory.map((move: any) => move.san);

    let totalAttempts = 0;
    const maxValidationAttempts = 3;
    let lastError: AIError | null = null;
    let usedFallback = false;
    let fallbackReason: string | undefined;
    
    // Add timeout to prevent infinite hanging
    const startTime = Date.now();
    const maxProcessingTime = 10000; // 10 seconds max
    
    while (totalAttempts < maxValidationAttempts) {
      // Check for timeout to prevent freezing
      if (Date.now() - startTime > maxProcessingTime) {
        console.error("AI move generation timed out after 10 seconds");
        throw new Error("AI move generation timed out. Please try again.");
      }
      
      try {
        totalAttempts++;
        
        // Generate AI move using enhanced Gemini integration
        const aiResult = await generateAIMove(game.fen, args.difficulty, moveHistory);
        const aiMove = aiResult.move;
        usedFallback = aiResult.usedFallback;
        
        if (aiResult.error) {
          lastError = aiResult.error;
          fallbackReason = aiResult.error.message;
        }
        
        // Validate the AI move
        const validation = validateAIMove(game.fen, aiMove);
        
        if (!validation.isValid) {
          console.warn(`AI move validation failed (attempt ${totalAttempts}):`, validation.error);
          
          // For check positions, be more lenient and try emergency fallback immediately
          const chess = new Chess(game.fen);
          const isInCheck = chess.inCheck();
          
          if (isInCheck || totalAttempts >= 2) {
            console.log("Using emergency fallback due to check position or multiple failures");
            try {
              const emergencyMove = generateFallbackAIMove(game.fen, args.difficulty);
              const emergencyValidation = validateAIMove(game.fen, emergencyMove);
              
              if (emergencyValidation.isValid) {
                console.warn("Using emergency fallback move:", emergencyMove);
                // Use the emergency move and break out of the loop
                const moveWithTimestamp = {
                  from: "",
                  to: "",
                  san: emergencyValidation.san!,
                  promotion: undefined as string | undefined,
                  timestamp: Date.now(),
                };

                // Parse the move to get from/to squares
                try {
                  const tempChess = new Chess(game.fen);
                  const moveObj = tempChess.move(emergencyMove);
                  if (moveObj) {
                    moveWithTimestamp.from = moveObj.from;
                    moveWithTimestamp.to = moveObj.to;
                    moveWithTimestamp.promotion = moveObj.promotion || undefined;
                  }
                } catch (parseError) {
                  console.warn("Failed to parse emergency AI move for from/to squares:", parseError);
                }

                // Determine if game is completed
                const gameResult = getGameResult(emergencyValidation.gameStatus!, game.currentPlayer);
                const isCompleted = gameResult !== null;

                // Calculate game duration if completed
                let finalGameResult = null;
                if (gameResult) {
                  const duration = Math.floor((Date.now() - game.createdAt) / 1000);
                  finalGameResult = {
                    ...gameResult,
                    moveCount: game.moveHistory.length + 1,
                    duration
                  };
                }

                // Update the game with AI move
                await ctx.runMutation(api.chess.updateGameWithAIMove, {
                  gameId: args.gameId,
                  move: moveWithTimestamp,
                  resultingFen: emergencyValidation.resultingFen!,
                  gameStatus: emergencyValidation.gameStatus!,
                  gameResult: finalGameResult || undefined,
                  isCompleted
                });

                // Update user statistics if game is completed
                if (finalGameResult) {
                  await ctx.scheduler.runAfter(0, api.chess.updateUserStats, {
                    userId: game.userId,
                    gameResult: finalGameResult,
                    difficulty: game.difficulty,
                  });
                }

                return {
                  success: true,
                  move: emergencyMove,
                  san: emergencyValidation.san!,
                  gameStatus: emergencyValidation.gameStatus!,
                  gameResult: finalGameResult,
                  attempts: totalAttempts,
                  usedFallback: true,
                  fallbackReason: "Emergency fallback used for check position or after multiple failures"
                };
              }
            } catch (emergencyError) {
              console.error("Emergency fallback also failed:", emergencyError);
            }
          }
          
          if (totalAttempts === maxValidationAttempts) {
            throw new Error(`AI generated invalid move after ${maxValidationAttempts} attempts: ${validation.error}`);
          }
          
          // Add a small delay before retrying to prevent tight loops
          await new Promise(resolve => setTimeout(resolve, 100));
          continue; // Try again
        }

        // Create move record with timestamp and SAN notation
        const moveWithTimestamp = {
          from: "", // Will be filled by chess.js parsing
          to: "", // Will be filled by chess.js parsing
          san: validation.san!,
          promotion: undefined as string | undefined, // Will be detected from SAN if present
          timestamp: Date.now(),
        };

        // Parse the move to get from/to squares
        try {
          const tempChess = new Chess(game.fen);
          const moveObj = tempChess.move(aiMove);
          if (moveObj) {
            moveWithTimestamp.from = moveObj.from;
            moveWithTimestamp.to = moveObj.to;
            moveWithTimestamp.promotion = moveObj.promotion || undefined;
          }
        } catch (parseError) {
          console.warn("Failed to parse AI move for from/to squares:", parseError);
        }

        // Determine if game is completed
        const gameResult = getGameResult(validation.gameStatus!, game.currentPlayer);
        const isCompleted = gameResult !== null;

        // Calculate game duration if completed
        let finalGameResult = null;
        if (gameResult) {
          const duration = Math.floor((Date.now() - game.createdAt) / 1000);
          finalGameResult = {
            ...gameResult,
            moveCount: game.moveHistory.length + 1,
            duration
          };
        }

        // Update the game with AI move
        await ctx.runMutation(api.chess.updateGameWithAIMove, {
          gameId: args.gameId,
          move: moveWithTimestamp,
          resultingFen: validation.resultingFen!,
          gameStatus: validation.gameStatus!,
          gameResult: finalGameResult || undefined,
          isCompleted
        });

        // Update user statistics if game is completed
        if (finalGameResult) {
          await ctx.scheduler.runAfter(0, api.chess.updateUserStats, {
            userId: game.userId,
            gameResult: finalGameResult,
            difficulty: game.difficulty,
          });
        }

        return {
          success: true,
          move: aiMove,
          san: validation.san!,
          gameStatus: validation.gameStatus!,
          gameResult: finalGameResult,
          attempts: totalAttempts,
          usedFallback,
          errorMessage: lastError?.message,
          fallbackReason
        };

      } catch (error) {
        console.error(`AI move generation attempt ${totalAttempts} failed:`, error);
        
        if (totalAttempts === maxValidationAttempts) {
          // If all attempts failed, provide detailed error information
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const userFriendlyMessage = lastError ? 
            lastError.message : 
            'AI opponent is temporarily unavailable. Please try again or restart the game.';
          
          throw new Error(`${userFriendlyMessage} (Technical details: ${errorMessage})`);
        }
        
        // Wait before retrying with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, totalAttempts - 1), 5000); // Max 5 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // This should never be reached, but just in case
    throw new Error("Unexpected error in AI move generation after all retry attempts");
  },
});
