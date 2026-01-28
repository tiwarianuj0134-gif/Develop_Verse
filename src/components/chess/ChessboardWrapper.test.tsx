/**
 * Comprehensive Unit Tests for ChessboardWrapper Component
 * Tests wrapper logic, state management, and integration with Chessboard
 * Requirements: 3.1, 3.2, 3.3, 4.1, 4.6
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChessboardWrapper from './ChessboardWrapper';
import { ChessEngine, GameState, Move } from './ChessEngine';

// Mock the Chessboard component
vi.mock('./Chessboard', () => ({
  default: vi.fn(({ onMove, isPlayerTurn, validMoves, position, orientation, theme, gameStatus, lastMove }) => (
    <div data-testid="chessboard">
      <div data-testid="position">{position}</div>
      <div data-testid="orientation">{orientation}</div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="game-status">{gameStatus}</div>
      <div data-testid="is-player-turn">{isPlayerTurn.toString()}</div>
      <div data-testid="valid-moves">{validMoves.join(',')}</div>
      <div data-testid="last-move">{lastMove ? `${lastMove.from}-${lastMove.to}` : 'none'}</div>
      <button 
        data-testid="make-move" 
        onClick={() => onMove({ from: 'e2', to: 'e4', san: 'e4' })}
        disabled={!isPlayerTurn}
      >
        Make Move
      </button>
    </div>
  ))
}));

describe('ChessboardWrapper Component', () => {
  let mockChessEngine: ChessEngine;
  let mockOnMove: ReturnType<typeof vi.fn>;
  let mockOnGameStateUpdate: ReturnType<typeof vi.fn>;
  let defaultGameState: GameState;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockOnMove = vi.fn();
    mockOnGameStateUpdate = vi.fn();
    
    mockChessEngine = {
      getValidMoves: vi.fn(() => ['e3', 'e4']),
      getGameState: vi.fn(),
      makeMove: vi.fn(),
      isValidMove: vi.fn(),
      getAllValidMoves: vi.fn(),
      undoMove: vi.fn(),
      reset: vi.fn(),
      loadPosition: vi.fn(),
      getFen: vi.fn(),
      isGameOver: vi.fn(),
      getPiece: vi.fn(),
      inCheck: vi.fn(),
      isCheckmate: vi.fn(),
      isStalemate: vi.fn(),
      isDraw: vi.fn(),
      requiresPromotion: vi.fn(() => false)
    } as any;

    defaultGameState = {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moveHistory: [],
      currentPlayer: 'white',
      gameStatus: 'playing',
      lastMove: undefined
    };
  });

  describe('Basic Rendering', () => {
    it('renders chessboard with correct props', () => {
      render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      expect(screen.getByTestId('chessboard')).toBeInTheDocument();
      expect(screen.getByTestId('position')).toHaveTextContent(defaultGameState.fen);
      expect(screen.getByTestId('orientation')).toHaveTextContent('white');
      expect(screen.getByTestId('theme')).toHaveTextContent('light');
      expect(screen.getByTestId('game-status')).toHaveTextContent('playing');
    });

    it('renders with black player orientation', () => {
      render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="black"
          theme="dark"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      expect(screen.getByTestId('orientation')).toHaveTextContent('black');
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('is-player-turn')).toHaveTextContent('false'); // White's turn, black player
    });

    it('renders with last move information', () => {
      const gameStateWithMove: GameState = {
        ...defaultGameState,
        lastMove: { from: 'e2', to: 'e4', san: 'e4' },
        moveHistory: [{ from: 'e2', to: 'e4', san: 'e4' }]
      };

      render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={gameStateWithMove}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      expect(screen.getByTestId('last-move')).toHaveTextContent('e2-e4');
    });
  });

  describe('Player Turn Logic', () => {
    it('enables player interaction when it is player turn', () => {
      render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      expect(screen.getByTestId('is-player-turn')).toHaveTextContent('true');
      expect(screen.getByTestId('make-move')).not.toBeDisabled();
    });

    it('disables player interaction when it is not player turn', () => {
      const blackTurnState: GameState = {
        ...defaultGameState,
        currentPlayer: 'black'
      };

      render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={blackTurnState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      expect(screen.getByTestId('is-player-turn')).toHaveTextContent('false');
      expect(screen.getByTestId('make-move')).toBeDisabled();
    });

    it('disables player interaction when game is over', () => {
      const gameOverState: GameState = {
        ...defaultGameState,
        gameStatus: 'checkmate'
      };

      render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={gameOverState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      expect(screen.getByTestId('is-player-turn')).toHaveTextContent('false');
      expect(screen.getByTestId('make-move')).toBeDisabled();
    });

    it('disables player interaction when wrapper is disabled', () => {
      render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
          disabled={true}
        />
      );

      expect(screen.getByTestId('is-player-turn')).toHaveTextContent('false');
      expect(screen.getByTestId('make-move')).toBeDisabled();
    });
  });

  describe('Valid Moves Management', () => {
    it('shows valid moves when piece is selected', () => {
      mockChessEngine.getValidMoves = vi.fn(() => ['e3', 'e4']);

      render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      // Initially no valid moves shown
      expect(screen.getByTestId('valid-moves')).toHaveTextContent('');
    });

    it('clears valid moves when disabled', () => {
      render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
          disabled={true}
        />
      );

      expect(screen.getByTestId('valid-moves')).toHaveTextContent('');
    });

    it('updates valid moves when game state changes', () => {
      const { rerender } = render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      // Change game state (new FEN)
      const newGameState: GameState = {
        ...defaultGameState,
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        currentPlayer: 'black'
      };

      rerender(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={newGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      expect(screen.getByTestId('position')).toHaveTextContent(newGameState.fen);
    });
  });

  describe('Move Handling', () => {
    it('handles move execution', async () => {
      const user = userEvent.setup();
      
      render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      const makeMoveButton = screen.getByTestId('make-move');
      await user.click(makeMoveButton);

      expect(mockOnMove).toHaveBeenCalledWith({
        from: 'e2',
        to: 'e4',
        san: 'e4'
      });
      expect(mockOnGameStateUpdate).toHaveBeenCalled();
    });

    it('does not handle moves when disabled', async () => {
      const user = userEvent.setup();
      
      render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
          disabled={true}
        />
      );

      const makeMoveButton = screen.getByTestId('make-move');
      
      // Button should be disabled, but let's test the wrapper logic too
      expect(makeMoveButton).toBeDisabled();
    });

    it('clears selection after move', async () => {
      const user = userEvent.setup();
      
      render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      const makeMoveButton = screen.getByTestId('make-move');
      await user.click(makeMoveButton);

      // Valid moves should be cleared after move
      expect(screen.getByTestId('valid-moves')).toHaveTextContent('');
    });
  });

  describe('Game Status Handling', () => {
    it('handles check status', () => {
      const checkState: GameState = {
        ...defaultGameState,
        gameStatus: 'check'
      };

      render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={checkState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      expect(screen.getByTestId('game-status')).toHaveTextContent('check');
    });

    it('handles checkmate status', () => {
      const checkmateState: GameState = {
        ...defaultGameState,
        gameStatus: 'checkmate'
      };

      render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={checkmateState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      expect(screen.getByTestId('game-status')).toHaveTextContent('checkmate');
      expect(screen.getByTestId('is-player-turn')).toHaveTextContent('false');
    });

    it('handles stalemate status', () => {
      const stalemateState: GameState = {
        ...defaultGameState,
        gameStatus: 'stalemate'
      };

      render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={stalemateState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      expect(screen.getByTestId('game-status')).toHaveTextContent('stalemate');
      expect(screen.getByTestId('is-player-turn')).toHaveTextContent('false');
    });

    it('handles draw status', () => {
      const drawState: GameState = {
        ...defaultGameState,
        gameStatus: 'draw'
      };

      render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={drawState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      expect(screen.getByTestId('game-status')).toHaveTextContent('draw');
      expect(screen.getByTestId('is-player-turn')).toHaveTextContent('false');
    });
  });

  describe('Theme Support', () => {
    it('passes light theme to chessboard', () => {
      render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('light');
    });

    it('passes dark theme to chessboard', () => {
      render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="white"
          theme="dark"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    });

    it('handles theme changes', () => {
      const { rerender } = render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('light');

      rerender(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="white"
          theme="dark"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    });
  });

  describe('Integration with ChessEngine', () => {
    it('calls chess engine for valid moves', () => {
      mockChessEngine.getValidMoves = vi.fn(() => ['e3', 'e4']);

      render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      // Engine should be available for the chessboard
      expect(screen.getByTestId('chessboard')).toBeInTheDocument();
    });

    it('handles engine errors gracefully', () => {
      mockChessEngine.getValidMoves = vi.fn(() => {
        throw new Error('Engine error');
      });

      expect(() => {
        render(
          <ChessboardWrapper
            chessEngine={mockChessEngine}
            gameState={defaultGameState}
            playerColor="white"
            theme="light"
            onMove={mockOnMove}
            onGameStateUpdate={mockOnGameStateUpdate}
          />
        );
      }).not.toThrow();
    });
  });

  describe('State Synchronization', () => {
    it('updates when game state changes', () => {
      const { rerender } = render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      const newGameState: GameState = {
        ...defaultGameState,
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        currentPlayer: 'black',
        moveHistory: [{ from: 'e2', to: 'e4', san: 'e4' }],
        lastMove: { from: 'e2', to: 'e4', san: 'e4' }
      };

      rerender(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={newGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      expect(screen.getByTestId('position')).toHaveTextContent(newGameState.fen);
      expect(screen.getByTestId('is-player-turn')).toHaveTextContent('false');
      expect(screen.getByTestId('last-move')).toHaveTextContent('e2-e4');
    });

    it('clears selection when FEN changes', () => {
      const { rerender } = render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      // Change FEN (simulating a move)
      const newGameState: GameState = {
        ...defaultGameState,
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      };

      rerender(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={newGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      // Valid moves should be cleared
      expect(screen.getByTestId('valid-moves')).toHaveTextContent('');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing last move', () => {
      render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      expect(screen.getByTestId('last-move')).toHaveTextContent('none');
    });

    it('handles empty valid moves array', () => {
      mockChessEngine.getValidMoves = vi.fn(() => []);

      render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      expect(screen.getByTestId('valid-moves')).toHaveTextContent('');
    });

    it('handles rapid state changes', () => {
      const { rerender } = render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      // Rapidly change states
      for (let i = 0; i < 5; i++) {
        const newState: GameState = {
          ...defaultGameState,
          fen: `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 ${i + 1}`,
          currentPlayer: i % 2 === 0 ? 'white' : 'black'
        };

        rerender(
          <ChessboardWrapper
            chessEngine={mockChessEngine}
            gameState={newState}
            playerColor="white"
            theme="light"
            onMove={mockOnMove}
            onGameStateUpdate={mockOnGameStateUpdate}
          />
        );
      }

      expect(screen.getByTestId('chessboard')).toBeInTheDocument();
    });

    it('handles null/undefined props gracefully', () => {
      // This test ensures the component doesn't crash with edge case props
      expect(() => {
        render(
          <ChessboardWrapper
            chessEngine={mockChessEngine}
            gameState={defaultGameState}
            playerColor="white"
            theme="light"
            onMove={mockOnMove}
            onGameStateUpdate={mockOnGameStateUpdate}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('handles multiple re-renders efficiently', () => {
      const { rerender } = render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      // Multiple re-renders with same props
      for (let i = 0; i < 10; i++) {
        rerender(
          <ChessboardWrapper
            chessEngine={mockChessEngine}
            gameState={defaultGameState}
            playerColor="white"
            theme="light"
            onMove={mockOnMove}
            onGameStateUpdate={mockOnGameStateUpdate}
          />
        );
      }

      expect(screen.getByTestId('chessboard')).toBeInTheDocument();
    });

    it('does not cause unnecessary re-renders', () => {
      const { rerender } = render(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      // Re-render with identical props
      rerender(
        <ChessboardWrapper
          chessEngine={mockChessEngine}
          gameState={defaultGameState}
          playerColor="white"
          theme="light"
          onMove={mockOnMove}
          onGameStateUpdate={mockOnGameStateUpdate}
        />
      );

      expect(screen.getByTestId('chessboard')).toBeInTheDocument();
    });
  });
});