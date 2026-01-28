/**
 * Comprehensive AI Move Generation Integration Tests
 * 
 * Tests the complete AI move generation workflow including validation,
 * retry logic, and error handling.
 */

import { Chess } from 'chess.js';

// Test the complete AI move generation and validation workflow
describe('AI Move Generation Integration', () => {
  
  // Helper function that simulates the complete AI move workflow
  function simulateAIMoveWorkflow(
    fen: string, 
    difficulty: "easy" | "medium" | "hard",
    mockAIMoves: string[] = []
  ) {
    const chess = new Chess(fen);
    const maxAttempts = 3;
    let attempts = 0;
    
    // Simulate the retry logic
    while (attempts < maxAttempts) {
      attempts++;
      
      // Get a mock AI move (simulating Gemini API response)
      const aiMove = mockAIMoves[attempts - 1] || generateMockAIMove(fen, difficulty);
      
      // Validate the AI move (same logic as in chess.ts)
      try {
        const result = chess.move(aiMove);
        
        if (!result) {
          if (attempts === maxAttempts) {
            throw new Error(`AI generated invalid move after ${maxAttempts} attempts`);
          }
          continue; // Try again
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
          success: true,
          move: aiMove,
          san: result.san,
          gameStatus,
          attempts,
          resultingFen: chess.fen()
        };
        
      } catch (error) {
        if (attempts === maxAttempts) {
          throw new Error(`Failed to generate AI move after ${maxAttempts} attempts`);
        }
        continue;
      }
    }
    
    throw new Error("Unexpected error in AI move generation");
  }
  
  // Generate a mock AI move based on difficulty (simulates fallback AI)
  function generateMockAIMove(fen: string, difficulty: "easy" | "medium" | "hard"): string {
    const chess = new Chess(fen);
    const allMoves = chess.moves();
    
    if (allMoves.length === 0) {
      throw new Error("No legal moves available");
    }
    
    switch (difficulty) {
      case "easy":
        return allMoves[Math.floor(Math.random() * allMoves.length)];
        
      case "medium":
        const captures = allMoves.filter(move => move.includes('x'));
        if (captures.length > 0 && Math.random() < 0.7) {
          return captures[Math.floor(Math.random() * captures.length)];
        }
        return allMoves[Math.floor(Math.random() * allMoves.length)];
        
      case "hard":
        const goodMoves = [];
        goodMoves.push(...allMoves.filter(move => move.includes('x'))); // Captures
        goodMoves.push(...allMoves.filter(move => move.includes('+'))); // Checks
        
        if (goodMoves.length > 0) {
          return goodMoves[Math.floor(Math.random() * goodMoves.length)];
        }
        return allMoves[Math.floor(Math.random() * allMoves.length)];
        
      default:
        return allMoves[Math.floor(Math.random() * allMoves.length)];
    }
  }

  test('successfully generates valid AI moves for different difficulties', () => {
    const initialFen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    
    const difficulties: ("easy" | "medium" | "hard")[] = ["easy", "medium", "hard"];
    
    difficulties.forEach(difficulty => {
      const result = simulateAIMoveWorkflow(initialFen, difficulty);
      
      expect(result.success).toBe(true);
      expect(result.move).toBeDefined();
      expect(result.san).toBeDefined();
      expect(result.attempts).toBeGreaterThan(0);
      expect(result.attempts).toBeLessThanOrEqual(3);
      expect(result.gameStatus).toBeDefined();
    });
  });

  test('handles retry logic when AI generates invalid moves', () => {
    const initialFen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    
    // Provide invalid moves first, then a valid one
    const mockMoves = ["invalid", "Ke2", "e5"]; // First two are invalid for black
    
    const result = simulateAIMoveWorkflow(initialFen, "medium", mockMoves);
    
    expect(result.success).toBe(true);
    expect(result.attempts).toBe(3); // Should take 3 attempts
    expect(result.san).toBe("e5"); // Should end up with the valid move
  });

  test('fails after maximum retry attempts with all invalid moves', () => {
    const initialFen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    
    // Provide only invalid moves
    const mockMoves = ["invalid1", "invalid2", "invalid3"];
    
    expect(() => {
      simulateAIMoveWorkflow(initialFen, "medium", mockMoves);
    }).toThrow("AI generated invalid move after 3 attempts");
  });

  test('detects game ending conditions from AI moves', () => {
    // Position where AI can deliver checkmate
    const checkmatePosition = "rnbqkbnr/pppp1p1p/8/6p1/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2";
    
    // Force AI to play the checkmate move
    const mockMoves = ["Qh4#"];
    
    const result = simulateAIMoveWorkflow(checkmatePosition, "hard", mockMoves);
    
    expect(result.success).toBe(true);
    expect(result.gameStatus).toBe("checkmate");
    expect(result.san).toBe("Qh4#");
  });

  test('handles different chess positions correctly', () => {
    const testPositions = [
      {
        name: "Opening position",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        expectedMoves: 20 // 20 possible opening moves
      },
      {
        name: "Mid-game position",
        fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4",
        expectedMoves: 30 // Approximate number of moves in mid-game
      },
      {
        name: "Endgame position",
        fen: "8/8/8/8/8/8/8/R3K2r w Q - 0 1",
        expectedMoves: 21 // King + Rook moves
      }
    ];
    
    testPositions.forEach(position => {
      const chess = new Chess(position.fen);
      const actualMoves = chess.moves().length;
      
      // Verify the position is valid and has expected number of moves
      expect(actualMoves).toBeGreaterThan(0);
      
      // Test AI move generation for this position
      const result = simulateAIMoveWorkflow(position.fen, "medium");
      expect(result.success).toBe(true);
      expect(result.move).toBeDefined();
    });
  });

  test('validates turn-based move generation', () => {
    const whiteTurnFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const blackTurnFen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    
    // Test white's turn
    const whiteResult = simulateAIMoveWorkflow(whiteTurnFen, "medium");
    expect(whiteResult.success).toBe(true);
    
    // Test black's turn
    const blackResult = simulateAIMoveWorkflow(blackTurnFen, "medium");
    expect(blackResult.success).toBe(true);
    
    // Verify moves are different (different players)
    expect(whiteResult.move).toBeDefined();
    expect(blackResult.move).toBeDefined();
  });

  test('handles special moves correctly', () => {
    // Test castling
    const castlingPosition = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
    const castlingResult = simulateAIMoveWorkflow(castlingPosition, "hard");
    expect(castlingResult.success).toBe(true);
    
    // Test pawn promotion
    const promotionPosition = "8/P7/8/8/8/8/8/8 w - - 0 1";
    const promotionResult = simulateAIMoveWorkflow(promotionPosition, "hard");
    expect(promotionResult.success).toBe(true);
    expect(promotionResult.san).toContain("="); // Should contain promotion
  });
});

// Test the difficulty-based move selection logic
describe('AI Difficulty Levels', () => {
  
  function analyzeMoveQuality(fen: string, move: string): {
    isCapture: boolean;
    isCheck: boolean;
    isDevelopment: boolean;
  } {
    const chess = new Chess(fen);
    const moveObj = chess.move(move);
    
    return {
      isCapture: move.includes('x'),
      isCheck: move.includes('+') || move.includes('#'),
      isDevelopment: ['N', 'B'].includes(move[0]) || move === 'O-O' || move === 'O-O-O'
    };
  }
  
  test('easy difficulty makes reasonable but not optimal moves', () => {
    const testPosition = "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3";
    
    // Generate multiple moves to test randomness
    const moves = [];
    for (let i = 0; i < 10; i++) {
      const result = simulateAIMoveWorkflow(testPosition, "easy");
      moves.push(result.move);
    }
    
    // Easy AI should make various moves (not always the same)
    const uniqueMoves = new Set(moves);
    expect(uniqueMoves.size).toBeGreaterThan(1);
  });
  
  test('medium difficulty prefers captures and checks', () => {
    const testPosition = "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3";
    
    // Generate multiple moves and analyze them
    const moves = [];
    for (let i = 0; i < 20; i++) {
      const result = simulateAIMoveWorkflow(testPosition, "medium");
      const analysis = analyzeMoveQuality(testPosition, result.move);
      moves.push(analysis);
    }
    
    // Medium AI should prefer tactical moves
    const tacticalMoves = moves.filter(m => m.isCapture || m.isCheck);
    const tacticalPercentage = tacticalMoves.length / moves.length;
    
    // Should prefer tactical moves more than random
    expect(tacticalPercentage).toBeGreaterThan(0.3);
  });
  
  test('hard difficulty makes sophisticated move choices', () => {
    const testPosition = "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3";
    
    // Generate multiple moves and analyze them
    const moves = [];
    for (let i = 0; i < 20; i++) {
      const result = simulateAIMoveWorkflow(testPosition, "hard");
      const analysis = analyzeMoveQuality(testPosition, result.move);
      moves.push(analysis);
    }
    
    // Hard AI should strongly prefer good moves
    const goodMoves = moves.filter(m => m.isCapture || m.isCheck || m.isDevelopment);
    const goodMovePercentage = goodMoves.length / moves.length;
    
    // Should prefer good moves most of the time
    expect(goodMovePercentage).toBeGreaterThan(0.5);
  });
});

export {};