import { Chess } from 'chess.js';

export interface Move {
  from: string;
  to: string;
  promotion?: 'q' | 'r' | 'b' | 'n';
  san: string; // Standard Algebraic Notation
}

export interface GameState {
  fen: string;
  moveHistory: Move[];
  currentPlayer: 'white' | 'black';
  gameStatus: 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';
  lastMove?: Move;
}

export interface MoveValidation {
  isValid: boolean;
  error?: string;
  resultingFen?: string;
  gameStatus?: GameState['gameStatus'];
  capturedPiece?: string;
}

export class ChessEngine {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  /**
   * Get the current game state
   */
  getGameState(): GameState {
    const history = this.chess.history({ verbose: true });
    const moveHistory: Move[] = history.map(move => ({
      from: move.from,
      to: move.to,
      promotion: move.promotion as Move['promotion'],
      san: move.san
    }));

    let gameStatus: GameState['gameStatus'] = 'playing';
    
    if (this.chess.isCheckmate()) {
      gameStatus = 'checkmate';
    } else if (this.chess.isStalemate()) {
      gameStatus = 'stalemate';
    } else if (this.chess.isDraw()) {
      gameStatus = 'draw';
    } else if (this.chess.inCheck()) {
      gameStatus = 'check';
    }

    return {
      fen: this.chess.fen(),
      moveHistory,
      currentPlayer: this.chess.turn() === 'w' ? 'white' : 'black',
      gameStatus,
      lastMove: moveHistory[moveHistory.length - 1]
    };
  }

  /**
   * Get detailed game status information
   */
  getGameStatusDetails(): {
    status: GameState['gameStatus'];
    isGameOver: boolean;
    winner?: 'white' | 'black' | 'draw';
    reason?: string;
  } {
    const status = this.getGameState().gameStatus;
    const isGameOver = this.chess.isGameOver();
    
    let winner: 'white' | 'black' | 'draw' | undefined;
    let reason: string | undefined;
    
    if (status === 'checkmate') {
      winner = this.chess.turn() === 'w' ? 'black' : 'white';
      reason = 'Checkmate';
    } else if (status === 'stalemate') {
      winner = 'draw';
      reason = 'Stalemate';
    } else if (status === 'draw') {
      winner = 'draw';
      if (this.chess.isThreefoldRepetition()) {
        reason = 'Draw by threefold repetition';
      } else if (this.chess.isInsufficientMaterial()) {
        reason = 'Draw by insufficient material';
      } else {
        reason = 'Draw by 50-move rule';
      }
    }
    
    return {
      status,
      isGameOver,
      winner,
      reason
    };
  }

  /**
   * Validate and make a move
   */
  makeMove(move: { from: string; to: string; promotion?: string }): MoveValidation {
    try {
      const moveResult = this.chess.move(move);
      
      if (!moveResult) {
        return {
          isValid: false,
          error: 'Invalid move',
          resultingFen: this.chess.fen(), // Return current FEN for invalid moves
          gameStatus: this.getGameState().gameStatus
        };
      }

      const gameState = this.getGameState();
      
      return {
        isValid: true,
        resultingFen: gameState.fen,
        gameStatus: gameState.gameStatus,
        capturedPiece: moveResult.captured
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid move',
        resultingFen: this.chess.fen(), // Return current FEN for errors
        gameStatus: this.getGameState().gameStatus
      };
    }
  }

  /**
   * Check if a move requires pawn promotion
   */
  requiresPromotion(from: string, to: string): boolean {
    const piece = this.chess.get(from as any);
    if (!piece || piece.type !== 'p') return false;
    
    const toRank = parseInt(to[1]);
    return (piece.color === 'w' && toRank === 8) || (piece.color === 'b' && toRank === 1);
  }

  /**
   * Get available castling moves for the current player
   */
  getCastlingMoves(): Move[] {
    const moves = this.chess.moves({ verbose: true });
    return moves
      .filter(move => move.flags.includes('k') || move.flags.includes('q'))
      .map(move => ({
        from: move.from,
        to: move.to,
        san: move.san,
        promotion: move.promotion as Move['promotion']
      }));
  }

  /**
   * Check if en passant is available
   */
  getEnPassantMoves(): Move[] {
    const moves = this.chess.moves({ verbose: true });
    return moves
      .filter(move => move.flags.includes('e'))
      .map(move => ({
        from: move.from,
        to: move.to,
        san: move.san,
        promotion: move.promotion as Move['promotion']
      }));
  }

  /**
   * Get all valid moves for a specific square
   */
  getValidMoves(square?: string): string[] {
    const moves = this.chess.moves({ 
      square: square as any,
      verbose: true 
    });
    
    return moves.map(move => move.to);
  }

  /**
   * Get all possible moves in the current position
   */
  getAllValidMoves(): Move[] {
    const moves = this.chess.moves({ verbose: true });
    return moves.map(move => ({
      from: move.from,
      to: move.to,
      promotion: move.promotion as Move['promotion'],
      san: move.san
    }));
  }

  /**
   * Check if a move is valid
   */
  isValidMove(move: { from: string; to: string; promotion?: string }): boolean {
    try {
      // Create a copy to test the move without affecting the current state
      const testChess = new Chess(this.chess.fen());
      const result = testChess.move(move);
      return result !== null;
    } catch {
      return false;
    }
  }

  /**
   * Undo the last move
   */
  undoMove(): boolean {
    const undoResult = this.chess.undo();
    return undoResult !== null;
  }

  /**
   * Reset the game to the starting position
   */
  reset(): void {
    this.chess.reset();
  }

  /**
   * Load a position from FEN notation
   */
  loadPosition(fen: string): boolean {
    try {
      this.chess.load(fen);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the current FEN string
   */
  getFen(): string {
    return this.chess.fen();
  }

  /**
   * Check if the game is over
   */
  isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  /**
   * Get the piece at a specific square
   */
  getPiece(square: string): { type: string; color: string } | null {
    const piece = this.chess.get(square as any);
    return piece ? { type: piece.type, color: piece.color } : null;
  }

  /**
   * Check if the current player is in check
   */
  inCheck(): boolean {
    return this.chess.inCheck();
  }

  /**
   * Check if the current position is checkmate
   */
  isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  /**
   * Check if the current position is stalemate
   */
  isStalemate(): boolean {
    return this.chess.isStalemate();
  }

  /**
   * Check if the current position is a draw
   */
  isDraw(): boolean {
    return this.chess.isDraw();
  }

  /**
   * Check if the position is draw by threefold repetition
   */
  isThreefoldRepetition(): boolean {
    return this.chess.isThreefoldRepetition();
  }

  /**
   * Check if the position is draw by insufficient material
   */
  isInsufficientMaterial(): boolean {
    return this.chess.isInsufficientMaterial();
  }

  /**
   * Get the number of moves since the last pawn move or capture (for 50-move rule)
   */
  getHalfmoveClock(): number {
    const fenParts = this.chess.fen().split(' ');
    return parseInt(fenParts[4]) || 0;
  }

  /**
   * Get the current turn ('w' for white, 'b' for black)
   */
  getTurn(): 'w' | 'b' {
    return this.chess.turn();
  }

  /**
   * Get move history in PGN format
   */
  getPgn(): string {
    return this.chess.pgn();
  }

  /**
   * Load a game from PGN
   */
  loadPgn(pgn: string): boolean {
    try {
      this.chess.loadPgn(pgn);
      return true;
    } catch {
      return false;
    }
  }
}