import { ChessEngine, Move, GameState, MoveValidation } from './ChessEngine';

export interface GameResult {
  winner: 'white' | 'black' | 'draw';
  reason: 'checkmate' | 'stalemate' | 'draw' | 'resignation' | 'timeout';
  moveCount: number;
  duration: number;
}

export interface GameSettings {
  difficulty: 'easy' | 'medium' | 'hard';
  playerColor: 'white' | 'black';
  timeControl?: {
    initialTime: number; // in seconds
    increment: number; // in seconds
  };
}

export class GameManager {
  private chessEngine: ChessEngine;
  private gameSettings: GameSettings;
  private gameStartTime: number;
  private moveTimestamps: number[] = [];
  private gameId: string;

  constructor(settings: GameSettings, initialFen?: string) {
    this.chessEngine = new ChessEngine(initialFen);
    this.gameSettings = settings;
    this.gameStartTime = Date.now();
    this.gameId = this.generateGameId();
  }

  private generateGameId(): string {
    return `chess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get the current game state
   */
  getGameState(): GameState {
    return this.chessEngine.getGameState();
  }

  /**
   * Get detailed game status information
   */
  getGameStatusDetails() {
    return this.chessEngine.getGameStatusDetails();
  }

  /**
   * Make a move and validate it
   */
  makeMove(move: Move): MoveValidation {
    const validation = this.chessEngine.makeMove({
      from: move.from,
      to: move.to,
      promotion: move.promotion
    });

    if (validation.isValid) {
      this.moveTimestamps.push(Date.now());
    }

    return validation;
  }

  /**
   * Get valid moves for a specific square
   */
  getValidMoves(square?: string): string[] {
    return this.chessEngine.getValidMoves(square);
  }

  /**
   * Get all possible moves in the current position
   */
  getAllValidMoves(): Move[] {
    return this.chessEngine.getAllValidMoves();
  }

  /**
   * Check if a move is valid
   */
  isValidMove(move: { from: string; to: string; promotion?: string }): boolean {
    return this.chessEngine.isValidMove(move);
  }

  /**
   * Undo the last move (only player moves, not AI moves)
   */
  undoLastPlayerMove(): boolean {
    const gameState = this.getGameState();
    
    // Can't undo if no moves have been made
    if (gameState.moveHistory.length === 0) {
      return false;
    }
    
    // Can't undo if it's currently the player's turn and they just made a move
    // This means we need to undo both the AI move and the player move
    const isPlayerTurn = this.isPlayerTurn();
    
    if (!isPlayerTurn && gameState.moveHistory.length >= 2) {
      // It's AI's turn, so undo AI's move first, then player's move
      this.chessEngine.undoMove(); // Undo AI move
      const playerUndoResult = this.chessEngine.undoMove(); // Undo player move
      
      if (playerUndoResult && this.moveTimestamps.length >= 2) {
        this.moveTimestamps.pop(); // Remove AI move timestamp
        this.moveTimestamps.pop(); // Remove player move timestamp
      }
      
      return playerUndoResult;
    } else if (isPlayerTurn && gameState.moveHistory.length >= 1) {
      // It's player's turn, so just undo the player's last move
      const playerUndoResult = this.chessEngine.undoMove();
      
      if (playerUndoResult && this.moveTimestamps.length >= 1) {
        this.moveTimestamps.pop(); // Remove player move timestamp
      }
      
      return playerUndoResult;
    }
    
    return false;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    const gameState = this.getGameState();
    
    // Can't undo if game is over
    if (this.isGameOver()) {
      return false;
    }
    
    // Can't undo if no moves have been made
    if (gameState.moveHistory.length === 0) {
      return false;
    }
    
    // Can undo if there's at least one player move
    return true;
  }

  /**
   * Reset the game to the starting position
   */
  resetGame(): void {
    this.chessEngine.reset();
    this.gameStartTime = Date.now();
    this.moveTimestamps = [];
    this.gameId = this.generateGameId();
  }

  /**
   * Load a position from FEN notation
   */
  loadPosition(fen: string): boolean {
    const success = this.chessEngine.loadPosition(fen);
    if (success) {
      this.gameStartTime = Date.now();
      this.moveTimestamps = [];
    }
    return success;
  }

  /**
   * Get the current FEN string
   */
  getFen(): string {
    return this.chessEngine.getFen();
  }

  /**
   * Check if the game is over
   */
  isGameOver(): boolean {
    return this.chessEngine.isGameOver();
  }

  /**
   * Get game result if the game is over
   */
  getGameResult(): GameResult | null {
    const statusDetails = this.chessEngine.getGameStatusDetails();
    
    if (!statusDetails.isGameOver) {
      return null;
    }

    const duration = Math.floor((Date.now() - this.gameStartTime) / 1000);
    const moveCount = this.moveTimestamps.length;

    return {
      winner: statusDetails.winner || 'draw',
      reason: statusDetails.status as GameResult['reason'],
      moveCount,
      duration
    };
  }

  /**
   * Get game statistics
   */
  getGameStats() {
    const gameState = this.getGameState();
    const duration = Math.floor((Date.now() - this.gameStartTime) / 1000);
    
    return {
      gameId: this.gameId,
      duration,
      moveCount: gameState.moveHistory.length,
      currentPlayer: gameState.currentPlayer,
      gameStatus: gameState.gameStatus,
      playerColor: this.gameSettings.playerColor,
      difficulty: this.gameSettings.difficulty,
      fen: this.getFen()
    };
  }

  /**
   * Get move history in PGN format
   */
  getPgn(): string {
    return this.chessEngine.getPgn();
  }

  /**
   * Load a game from PGN
   */
  loadPgn(pgn: string): boolean {
    const success = this.chessEngine.loadPgn(pgn);
    if (success) {
      this.gameStartTime = Date.now();
      this.moveTimestamps = [];
    }
    return success;
  }

  /**
   * Get the current turn
   */
  getCurrentTurn(): 'white' | 'black' {
    return this.chessEngine.getTurn() === 'w' ? 'white' : 'black';
  }

  /**
   * Check if it's the player's turn
   */
  isPlayerTurn(): boolean {
    return this.getCurrentTurn() === this.gameSettings.playerColor;
  }

  /**
   * Check if it's the AI's turn
   */
  isAITurn(): boolean {
    return !this.isPlayerTurn() && !this.isGameOver();
  }

  /**
   * Get the chess engine instance
   */
  getChessEngine(): ChessEngine {
    return this.chessEngine;
  }

  /**
   * Get game settings
   */
  getGameSettings(): GameSettings {
    return { ...this.gameSettings };
  }

  /**
   * Update game settings
   */
  updateGameSettings(settings: Partial<GameSettings>): void {
    this.gameSettings = { ...this.gameSettings, ...settings };
  }

  /**
   * Export game state for persistence
   */
  exportGameState() {
    return {
      fen: this.getFen(),
      gameSettings: this.gameSettings,
      gameStartTime: this.gameStartTime,
      moveTimestamps: this.moveTimestamps,
      gameId: this.gameId
    };
  }

  /**
   * Import game state from persistence
   */
  importGameState(state: {
    fen: string;
    gameSettings: GameSettings;
    gameStartTime: number;
    moveTimestamps: number[];
    gameId: string;
  }): boolean {
    const success = this.loadPosition(state.fen);
    if (success) {
      this.gameSettings = state.gameSettings;
      this.gameStartTime = state.gameStartTime;
      this.moveTimestamps = state.moveTimestamps;
      this.gameId = state.gameId;
    }
    return success;
  }
}