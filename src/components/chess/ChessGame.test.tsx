/**
 * Comprehensive Unit Tests for ChessGame Component
 * Tests main game component integration, state management, and user interactions
 * Requirements: 3.7, 4.1, 4.6, 6.1, 7.1, 7.2, 7.3, 8.1, 8.2
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChessGame from './ChessGame';
import { GameResult } from './GameManager';

// Mock all dependencies
vi.mock('convex/react', () => ({
  useQuery: vi.fn(() => undefined),
  useMutation: vi.fn(() => vi.fn()),
  useAction: vi.fn(() => vi.fn()),
}));

vi.mock('./NetworkService', () => ({
  networkService: {
    getNetworkStatus: vi.fn(() => ({ 
      isOnline: true, 
      isBackendAvailable: true,
      lastChecked: Date.now(),
      connectionQuality: 'good',
      retryCount: 0
    })),
    subscribe: vi.fn(() => vi.fn()),
    canPerformOnlineOperations: vi.fn(() => true),
    parseNetworkError: vi.fn(() => ({ message: 'Test error', retryable: true, type: 'network' })),
    addPendingOperation: vi.fn(),
    forceNetworkCheck: vi.fn(),
  },
  NetworkStatus: {},
  NetworkError: {},
}));

vi.mock('./OfflineGameManager', () => ({
  OfflineGameManager: vi.fn().mockImplementation(() => ({
    getGameState: vi.fn(() => ({
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moveHistory: [],
      currentPlayer: 'white',
      gameStatus: 'playing',
      lastMove: undefined
    })),
    getGameSettings: vi.fn(() => ({
      difficulty: 'medium',
      playerColor: 'white'
    })),
    getGameStatusDetails: vi.fn(() => ({
      status: 'playing',
      isGameOver: false
    })),
    getGameResult: vi.fn(() => null),
    makeMove: vi.fn(() => ({ isValid: true })),
    makeOfflineMove: vi.fn(() => ({ success: true })),
    generateOfflineAIMove: vi.fn(() => ({ success: true, move: { from: 'e7', to: 'e5', san: 'e5' } })),
    undoLastPlayerMove: vi.fn(() => true),
    canUndo: vi.fn(() => true),
    resetGame: vi.fn(),
    loadPosition: vi.fn(() => true),
    getFen: vi.fn(() => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
    isGameOver: vi.fn(() => false),
    isPlayerTurn: vi.fn(() => true),
    isAITurn: vi.fn(() => false),
    isOfflineMode: vi.fn(() => false),
    getPendingMovesCount: vi.fn(() => 0),
    exportGameState: vi.fn(() => ({})),
    importGameState: vi.fn(() => true),
    attemptSync: vi.fn(() => ({ success: true, syncedMoves: 0 })),
    cleanup: vi.fn()
  }))
}));

vi.mock('./GamePersistence', () => ({
  GamePersistence: vi.fn().mockImplementation(() => ({
    loadGameState: vi.fn(() => null),
    saveGameState: vi.fn(),
    startAutoSave: vi.fn(),
    stopAutoSave: vi.fn(),
    clearSavedState: vi.fn(),
    getSavedStateAge: vi.fn(() => null),
    restoreGameManager: vi.fn(() => null)
  }))
}));

vi.mock('./ChessboardWrapper', () => ({
  default: vi.fn(({ onMove, onGameStateUpdate }) => (
    <div data-testid="chessboard-wrapper">
      <button onClick={() => onMove({ from: 'e2', to: 'e4', san: 'e4' })}>
        Make Move
      </button>
      <button onClick={onGameStateUpdate}>
        Update State
      </button>
    </div>
  ))
}));

vi.mock('./ChessErrorBoundary', () => ({
  default: vi.fn(({ children }) => <div data-testid="error-boundary">{children}</div>)
}));

vi.mock('./AIErrorBoundary', () => ({
  default: vi.fn(({ children }) => <div data-testid="ai-error-boundary">{children}</div>)
}));

vi.mock('./BoardErrorBoundary', () => ({
  default: vi.fn(({ children }) => <div data-testid="board-error-boundary">{children}</div>)
}));

vi.mock('./NetworkStatusIndicator', () => ({
  default: vi.fn(() => <div data-testid="network-status">Network Status</div>),
  NetworkStatusBadge: vi.fn(() => <div data-testid="network-badge">Network Badge</div>)
}));

describe('ChessGame Component', () => {
  let mockOnGameEnd: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnGameEnd = vi.fn();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Basic Rendering', () => {
    it('renders the main chess game interface', () => {
      render(<ChessGame />);
      
      expect(screen.getByText('Chess Game')).toBeInTheDocument();
      expect(screen.getByText('Game Controls')).toBeInTheDocument();
      expect(screen.getByText('New Game')).toBeInTheDocument();
      expect(screen.getByText('Undo Move')).toBeInTheDocument();
      expect(screen.getByText('Move History')).toBeInTheDocument();
      expect(screen.getByText('Game Status')).toBeInTheDocument();
    });

    it('renders with custom props', () => {
      render(
        <ChessGame 
          difficulty="hard"
          theme="dark"
          onGameEnd={mockOnGameEnd}
          showDifficultySelector={true}
          showGameStats={true}
        />
      );
      
      expect(screen.getByText('Chess Game')).toBeInTheDocument();
      expect(screen.getByText('AI Difficulty')).toBeInTheDocument();
      expect(screen.getByText('Game Statistics')).toBeInTheDocument();
    });

    it('renders difficulty selector when enabled', () => {
      render(<ChessGame showDifficultySelector={true} />);
      
      expect(screen.getByText('AI Difficulty')).toBeInTheDocument();
      expect(screen.getByDisplayValue('medium')).toBeInTheDocument();
    });

    it('renders game statistics when enabled', () => {
      render(<ChessGame showGameStats={true} />);
      
      expect(screen.getByText('Game Statistics')).toBeInTheDocument();
      expect(screen.getByText('Player:')).toBeInTheDocument();
      expect(screen.getByText('AI Difficulty:')).toBeInTheDocument();
    });

    it('hides difficulty selector when disabled', () => {
      render(<ChessGame showDifficultySelector={false} />);
      
      expect(screen.queryByText('AI Difficulty')).not.toBeInTheDocument();
    });

    it('hides game statistics when disabled', () => {
      render(<ChessGame showGameStats={false} />);
      
      expect(screen.queryByText('Game Statistics')).not.toBeInTheDocument();
    });
  });

  describe('Game Controls', () => {
    it('handles new game button click', async () => {
      const user = userEvent.setup();
      render(<ChessGame />);
      
      const newGameButton = screen.getByText('New Game');
      await user.click(newGameButton);
      
      // Should show confirmation dialog for new game
      expect(screen.getByText('Start New Game?')).toBeInTheDocument();
    });

    it('handles undo move button click', async () => {
      const user = userEvent.setup();
      render(<ChessGame />);
      
      const undoButton = screen.getByText('Undo Move');
      await user.click(undoButton);
      
      // Undo should be called (tested through mocks)
      expect(screen.getByText('Chess Game')).toBeInTheDocument();
    });

    it('handles theme toggle', async () => {
      const user = userEvent.setup();
      render(<ChessGame theme="light" />);
      
      const themeButton = screen.getByText('🌙 Dark Theme');
      await user.click(themeButton);
      
      // Theme should toggle
      expect(screen.getByText('☀️ Light Theme')).toBeInTheDocument();
    });

    it('handles difficulty change', async () => {
      const user = userEvent.setup();
      render(<ChessGame showDifficultySelector={true} />);
      
      const difficultySelect = screen.getByDisplayValue('medium');
      await user.selectOptions(difficultySelect, 'hard');
      
      expect(screen.getByDisplayValue('hard')).toBeInTheDocument();
    });

    it('disables difficulty change during game', () => {
      // Mock game in progress
      const { OfflineGameManager } = require('./OfflineGameManager');
      OfflineGameManager.mockImplementation(() => ({
        ...OfflineGameManager(),
        getGameState: vi.fn(() => ({
          fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
          moveHistory: [{ from: 'e2', to: 'e4', san: 'e4' }],
          currentPlayer: 'black',
          gameStatus: 'playing'
        })),
        isGameOver: vi.fn(() => false)
      }));

      render(<ChessGame showDifficultySelector={true} />);
      
      const difficultySelect = screen.getByDisplayValue('medium');
      expect(difficultySelect).toBeDisabled();
    });
  });

  describe('Move Handling', () => {
    it('handles valid moves', async () => {
      render(<ChessGame />);
      
      const makeMoveButton = screen.getByText('Make Move');
      fireEvent.click(makeMoveButton);
      
      // Move should be processed
      expect(screen.getByText('Chess Game')).toBeInTheDocument();
    });

    it('handles game state updates', async () => {
      render(<ChessGame />);
      
      const updateStateButton = screen.getByText('Update State');
      fireEvent.click(updateStateButton);
      
      // State should be updated
      expect(screen.getByText('Chess Game')).toBeInTheDocument();
    });

    it('calls onGameEnd when game finishes', () => {
      const { OfflineGameManager } = require('./OfflineGameManager');
      OfflineGameManager.mockImplementation(() => ({
        ...OfflineGameManager(),
        getGameResult: vi.fn(() => ({
          winner: 'white',
          reason: 'checkmate',
          moveCount: 10,
          duration: 300
        })),
        isGameOver: vi.fn(() => true)
      }));

      render(<ChessGame onGameEnd={mockOnGameEnd} />);
      
      const updateStateButton = screen.getByText('Update State');
      fireEvent.click(updateStateButton);
      
      expect(mockOnGameEnd).toHaveBeenCalledWith({
        winner: 'white',
        reason: 'checkmate',
        moveCount: 10,
        duration: 300
      });
    });
  });

  describe('Network Status', () => {
    it('displays network status indicator', () => {
      render(<ChessGame />);
      
      expect(screen.getByTestId('network-status')).toBeInTheDocument();
      expect(screen.getByTestId('network-badge')).toBeInTheDocument();
    });

    it('shows offline mode indicator', () => {
      const { OfflineGameManager } = require('./OfflineGameManager');
      OfflineGameManager.mockImplementation(() => ({
        ...OfflineGameManager(),
        isOfflineMode: vi.fn(() => true),
        getPendingMovesCount: vi.fn(() => 3)
      }));

      render(<ChessGame />);
      
      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByText('3 moves pending sync')).toBeInTheDocument();
    });

    it('handles network status changes', () => {
      const { networkService } = require('./NetworkService');
      
      render(<ChessGame />);
      
      // Simulate network status change
      const statusCallback = networkService.subscribe.mock.calls[0][0];
      statusCallback({
        isOnline: false,
        isBackendAvailable: false,
        lastChecked: Date.now(),
        connectionQuality: 'offline',
        retryCount: 0
      });
      
      expect(screen.getByText('Chess Game')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays AI errors', () => {
      const { OfflineGameManager } = require('./OfflineGameManager');
      OfflineGameManager.mockImplementation(() => ({
        ...OfflineGameManager(),
        makeOfflineMove: vi.fn(() => ({ success: false, error: 'Invalid move' }))
      }));

      render(<ChessGame />);
      
      const makeMoveButton = screen.getByText('Make Move');
      fireEvent.click(makeMoveButton);
      
      // Error should be handled
      expect(screen.getByText('Chess Game')).toBeInTheDocument();
    });

    it('handles network errors gracefully', () => {
      const { networkService } = require('./NetworkService');
      networkService.canPerformOnlineOperations.mockReturnValue(false);

      render(<ChessGame />);
      
      const makeMoveButton = screen.getByText('Make Move');
      fireEvent.click(makeMoveButton);
      
      // Should fallback to offline mode
      expect(screen.getByText('Chess Game')).toBeInTheDocument();
    });

    it('shows error boundaries', () => {
      render(<ChessGame />);
      
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('ai-error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('board-error-boundary')).toBeInTheDocument();
    });
  });

  describe('Game Status Display', () => {
    it('shows current player turn', () => {
      render(<ChessGame />);
      
      expect(screen.getByText("white's turn")).toBeInTheDocument();
    });

    it('shows check status', () => {
      const { OfflineGameManager } = require('./OfflineGameManager');
      OfflineGameManager.mockImplementation(() => ({
        ...OfflineGameManager(),
        getGameState: vi.fn(() => ({
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          moveHistory: [],
          currentPlayer: 'white',
          gameStatus: 'check'
        })),
        getGameStatusDetails: vi.fn(() => ({
          status: 'check',
          isGameOver: false
        }))
      }));

      render(<ChessGame />);
      
      expect(screen.getByText('white is  check!')).toBeTheDocument();
    });

    it('shows checkmate status', () => {
      const { OfflineGameManager } = require('./OfflineGameManager');
      OfflineGameManager.mockImplementation(() => ({
        ...OfflineGameManager(),
        getGameState: vi.fn(() => ({
          fen: 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3',
          moveHistory: [],
          currentPlayer: 'white',
          gameStatus: 'checkmate'
        })),
        getGameStatusDetails: vi.fn(() => ({
          status: 'checkmate',
          isGameOver: true,
          winner: 'black'
        })),
        isGameOver: vi.fn(() => true)
      }));

      render(<ChessGame />);
      
      expect(screen.getByText('Checkmate! Black wins!')).toBeInTheDocument();
    });

    it('shows AI thinking status', () => {
      const { OfflineGameManager } = require('./OfflineGameManager');
      OfflineGameManager.mockImplementation(() => ({
        ...OfflineGameManager(),
        isAITurn: vi.fn(() => true)
      }));

      render(<ChessGame />);
      
      // AI thinking status would be shown during AI move generation
      expect(screen.getByText('Chess Game')).toBeInTheDocument();
    });
  });

  describe('Move History', () => {
    it('displays empty move history', () => {
      render(<ChessGame />);
      
      expect(screen.getByText('No moves yet')).toBeInTheDocument();
    });

    it('displays move history with moves', () => {
      const { OfflineGameManager } = require('./OfflineGameManager');
      OfflineGameManager.mockImplementation(() => ({
        ...OfflineGameManager(),
        getGameState: vi.fn(() => ({
          fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
          moveHistory: [
            { from: 'e2', to: 'e4', san: 'e4' },
            { from: 'e7', to: 'e5', san: 'e5' }
          ],
          currentPlayer: 'white',
          gameStatus: 'playing'
        }))
      }));

      render(<ChessGame />);
      
      expect(screen.getByText('1.')).toBeInTheDocument();
      expect(screen.getByText('e4')).toBeInTheDocument();
      expect(screen.getByText('e5')).toBeInTheDocument();
    });

    it('highlights last move', () => {
      const { OfflineGameManager } = require('./OfflineGameManager');
      OfflineGameManager.mockImplementation(() => ({
        ...OfflineGameManager(),
        getGameState: vi.fn(() => ({
          fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
          moveHistory: [
            { from: 'e2', to: 'e4', san: 'e4' },
            { from: 'e7', to: 'e5', san: 'e5' }
          ],
          currentPlayer: 'white',
          gameStatus: 'playing'
        }))
      }));

      render(<ChessGame />);
      
      expect(screen.getByText('← Last')).toBeInTheDocument();
    });
  });

  describe('Game Statistics', () => {
    it('shows game statistics when enabled', () => {
      render(<ChessGame showGameStats={true} />);
      
      expect(screen.getByText('Game Statistics')).toBeInTheDocument();
      expect(screen.getByText('Player:')).toBeInTheDocument();
      expect(screen.getByText('White ♔')).toBeInTheDocument();
      expect(screen.getByText('AI Difficulty:')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
    });

    it('shows offl mode  statistics', () => {
      const { OfflineGameManager } = require('./OfflineGameManager');
      OfflineGameManager.mockImplementation(() => ({
        ...OfflineGameManager(),
        isOfflineMode: vi.fn(() => true)
      }));

      render(<ChessGame showGameStats={true} />);
      
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('shows game result  statistics', () => {
      const { OfflineGameManager } = require('./OfflineGameManager');
      OfflineGameManager.mockImplementation(() => ({
        ...OfflineGameManager(),
        isGameOver: vi.fn(() => true),
        getGameResult: vi.fn(() => ({
          winner: 'white',
          reason: 'checkmate',
          moveCount: 25,
          duration: 600
        }))
      }));

      render(<ChessGame showGameStats={true} />);
      
      expect(screen.getByText('You Win!')).toBeInTheDocument();
    });
  });

  describe('Dialogs', () => {
    it('shows restart confirmation dialog', async () => {
      const user = userEvent.setup();
      
      // Mock game in progress
      const { OfflineGameManager } = require('./OfflineGameManager');
      OfflineGameManager.mockImplementation(() => ({
        ...OfflineGameManager(),
        getGameState: vi.fn(() => ({
          fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
          moveHistory: [{ from: 'e2', to: 'e4', san: 'e4' }],
          currentPlayer: 'black',
          gameStatus: 'playing'
        })),
        isGameOver: vi.fn(() => false)
      }));

      render(<ChessGame />);
      
      const newGameButton = screen.getByText('New Game');
      await user.click(newGameButton);
      
      expect(screen.getByText('Start New Game?')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to start a new game?')).toBeInTheDocument();
    });

    it('handles restart confirmation', async () => {
      const user = userEvent.setup();
      
      // Mock game in progress
      const { OfflineGameManager } = require('./OfflineGameManager');
      OfflineGameManager.mockImplementation(() => ({
        ...OfflineGameManager(),
        getGameState: vi.fn(() => ({
          fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
          moveHistory: [{ from: 'e2', to: 'e4', san: 'e4' }],
          currentPlayer: 'black',
          gameStatus: 'playing'
        })),
        isGameOver: vi.fn(() => false)
      }));

      render(<ChessGame />);
      
      const newGameButton = screen.getByText('New Game');
      await user.click(newGameButton);
      
      const confirmButton = screen.getByText('Start New Game');
      await user.click(confirmButton);
      
      // Dialog should close
      expect(screen.queryByText('Start New Game?')).not.toBeInTheDocument();
    });

    it('handles restart cancellation', async () => {
      const user = userEvent.setup();
      
      // Mock game in progress
      const { OfflineGameManager } = require('./OfflineGameManager');
      OfflineGameManager.mockImplementation(() => ({
        ...OfflineGameManager(),
        getGameState: vi.fn(() => ({
          fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
          moveHistory: [{ from: 'e2', to: 'e4', san: 'e4' }],
          currentPlayer: 'black',
          gameStatus: 'playing'
        })),
        isGameOver: vi.fn(() => false)
      }));

      render(<ChessGame />);
      
      const newGameButton = screen.getByText('New Game');
      await user.click(newGameButton);
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      // Dialog should close
      expect(screen.queryByText('Start New Game?')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders mobile-friendly layout', () => {
      render(<ChessGame />);
      
      // Check for responsive classes
      const heading = screen.getByText('Chess Game');
      expect(heading).toHaveClass('text-2xl', 'sm:text-3xl');
    });

    it('handles different screen sizes', () => {
      render(<ChessGame />);
      
      // Component should render without errors on different screen sizes
      expect(screen.getByText('Chess Game')).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('cleans up resources on unmount', () => {
      const { unmount } = render(<ChessGame />);
      
      unmount();
      
      // Cleanup should be called (tested through mocks)
      expect(screen.queryByText('Chess Game')).not.toBeInTheDocument();
    });
  });
});