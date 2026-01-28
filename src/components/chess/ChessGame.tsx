/// <reference types="react" />
/// <reference types="react-dom" />

import React, { useState, useEffect } from 'react';
import { Move, GameState } from './ChessEngine';
import { GameManager, GameResult, GameSettings } from './GameManager';
import { OfflineGameManager } from './OfflineGameManager';
import { GamePersistence } from './GamePersistence';
import ChessboardWrapper from './ChessboardWrapperNew';
import ChessErrorBoundary from './ChessErrorBoundary';
import AIErrorBoundary from './AIErrorBoundary';
import BoardErrorBoundary from './BoardErrorBoundary';
import NetworkStatusIndicator, { NetworkStatusBadge } from './NetworkStatusIndicator';
import { networkService, NetworkStatus, NetworkError } from './NetworkService';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

interface ChessGameProps {
  difficulty?: 'easy' | 'medium' | 'hard';
  theme?: 'light' | 'dark';
  onGameEnd?: (result: GameResult) => void;
  showDifficultySelector?: boolean;
  showGameStats?: boolean;
}

export default function ChessGame({ 
  difficulty: initialDifficulty = 'medium', 
  theme: initialTheme = 'light', 
  onGameEnd,
  showDifficultySelector = true,
  showGameStats = true
}: ChessGameProps) {
  const [persistence] = useState(() => new GamePersistence());
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(initialDifficulty);
  const [gameManager, setGameManager] = useState<OfflineGameManager>(() => {
    // Try to restore from saved state first
    const savedState = persistence.loadGameState();
    if (savedState) {
      const restoredManager = persistence.restoreGameManager(savedState);
      if (restoredManager) {
        // Convert to OfflineGameManager
        const settings: GameSettings = {
          difficulty: restoredManager.getGameSettings().difficulty,
          playerColor: restoredManager.getGameSettings().playerColor
        };
        const offlineManager = new OfflineGameManager(settings, restoredManager.getFen());
        // Import the game state
        offlineManager.importGameState(restoredManager.exportGameState());
        return offlineManager;
      }
    }
    
    // Create new game if no saved state or restoration failed
    const settings: GameSettings = {
      difficulty,
      playerColor: 'white' // Player always plays white for now
    };
    return new OfflineGameManager(settings);
  });
  const [gameState, setGameState] = useState<GameState>(() => gameManager.getGameState());
  const [gameKey, setGameKey] = useState<string>(() => `game-${Date.now()}`); // Force re-render key
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [dialogDismissed, setDialogDismissed] = useState(false); // Track if user dismissed dialog
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [convexGameId, setConvexGameId] = useState<Id<"chessGames"> | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiServiceStatus, setAiServiceStatus] = useState<{
    status: string;
    message: string;
    canRetry: boolean;
    fallbackAvailable: boolean;
    retryAfter?: number;
  } | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(networkService.getNetworkStatus());
  const [networkError, setNetworkError] = useState<NetworkError | null>(null);
  const [showNetworkDetails, setShowNetworkDetails] = useState(false);

  // Convex mutations and actions
  const createGame = useMutation(api.chess.createGame);
  const makeMove = useMutation(api.chess.makeMove);
  const requestAIMove = useAction(api.chess.requestAIMove);
  const resetGame = useMutation(api.chess.resetGame);
  const getAIServiceStatus = useAction(api.chess.getAIServiceStatus);
  const recoverFromAIError = useAction(api.chess.recoverFromAIError);

  // Get active game from Convex
  const activeGame = useQuery(api.chess.getActiveGame);

  // Set up network monitoring
  useEffect(() => {
    const unsubscribe = networkService.subscribe((status) => {
      setNetworkStatus(status);
      
      // Clear network error when connection is restored
      if (status.isOnline && status.isBackendAvailable && networkError) {
        setNetworkError(null);
      }
    });

    return unsubscribe;
  }, [networkError]);

  // Initialize Convex game
  useEffect(() => {
    const initializeGame = async () => {
      try {
        if (activeGame) {
          // Restore from existing Convex game
          setConvexGameId(activeGame._id);
          gameManager.loadPosition(activeGame.fen);
          setGameState(gameManager.getGameState());
        } else if (networkService.canPerformOnlineOperations()) {
          // Create new Convex game only if online
          const newGameId = await createGame({
            difficulty,
            playerColor: 'white'
          });
          setConvexGameId(newGameId);
        } else {
          // Start in offline mode
          console.log('Start  offl mode - backend unavailable');
          setNetworkError(networkService.parseNetworkError(new Error('Backend unavailable')));
        }
      } catch (error) {
        console.error('Failed to initialize game:', error);
        const parsedError = networkService.parseNetworkError(error);
        setNetworkError(parsedError);
        setAiError('Failed to itialize game. Play  offl mode.');
      }
    };

    if (activeGame !== undefined) { // Wait for query to complete
      initializeGame();
    }
  }, [activeGame, createGame, difficulty, gameManager]);

  // Set up auto-save and check for existing saved state
  useEffect(() => {
    // Start auto-save
    persistence.startAutoSave(gameManager);
    
    // Check if there's a recent saved state to restore (only if user hasn't dismissed dialog)
    // Also check if we just created a new game manager to avoid re-triggering dialog
    if (!dialogDismissed && gameManager.getGameState().moveHistory.length === 0) {
      const savedStateAge = persistence.getSavedStateAge();
      if (savedStateAge !== null && savedStateAge < 24 * 60 * 60 * 1000) { // Less than 24 hours old
        setShowRestoreDialog(true);
      }
    }
    
    // Cleanup on unmount
    return () => {
      persistence.stopAutoSave();
      // Save final state
      persistence.saveGameState(gameManager);
      // Cleanup offline game manager
      gameManager.cleanup();
    };
  }, [gameManager, persistence, dialogDismissed]);

  // Update game state when engine state changes
  const updateGameState = () => {
    try {
      const newState = gameManager.getGameState();
      console.log('🔄 updateGameState called, new state:', newState);
      
      // Prevent unnecessary re-renders if state hasn't actually changed
      if (JSON.stringify(newState) !== JSON.stringify(gameState)) {
        setGameState(newState);
        
        // Auto-save after each move (with error handling)
        try {
          persistence.saveGameState(gameManager);
        } catch (saveError) {
          console.warn('Failed to save game state:', saveError);
        }
        
        // Check for game end
        const gameResult = gameManager.getGameResult();
        if (gameResult) {
          onGameEnd?.(gameResult);
        }
      }
    } catch (error) {
      console.error('Error  updateGameState:', error);
      // Don't let updateGameState errors crash the game
      // Just log the error and continue
    }
  };

  const handleMove = async (move: Move) => {
    // Clear any previous errors
    setNetworkError(null);
    setAiError(null);

    // Check if we can perform online operations
    if (!convexGameId || !networkService.canPerformOnlineOperations()) {
      // Fallback to offline mode
      console.log('Mak move  offl mode');
      const result = gameManager.makeOfflineMove(move);
      
      if (result.success) {
        updateGameState();
        
        // Check if game ended
        const gameResult = gameManager.getGameResult();
        if (gameResult) {
          onGameEnd?.(gameResult);
          return;
        }
        
        // Request AI move in offline mode
        if (gameManager.isAITurn()) {
          handleOfflineAIMove();
        }
      } else {
        setAiError(result.error || 'Invalid move');
      }
      return;
    }

    try {
      // Make move in Convex backend
      const result = await makeMove({
        gameId: convexGameId,
        move: {
          from: move.from,
          to: move.to,
          promotion: move.promotion
        }
      });

      if (result.success) {
        // Update local game manager to match backend
        const validation = gameManager.makeMove(move);
        if (validation.isValid) {
          updateGameState();
          
          // Check if game ended
          if (result.gameResult) {
            onGameEnd?.(result.gameResult);
            return;
          }
          
          // Request AI move if it's AI's turn
          if (gameManager.isAITurn()) {
            handleAIMove();
          }
        }
      }
    } catch (error) {
      console.error('Failed to make move:', error);
      const parsedError = networkService.parseNetworkError(error);
      setNetworkError(parsedError);
      
      // Fallback to offline mode for this move
      if (parsedError.retryable) {
        console.log('Network error, falling back to offline mode for this move');
        const result = gameManager.makeOfflineMove(move);
        
        if (result.success) {
          updateGameState();
          setAiError('Move made offline. Will sync when connection is restored.');
          
          // Add to pending operations
          networkService.addPendingOperation({
            type: 'move',
            data: move,
            maxRetries: 3
          });
          
          // Handle AI move offline if needed
          if (gameManager.isAITurn()) {
            handleOfflineAIMove();
          }
        } else {
          setAiError(result.error || 'Failed to make move');
        }
      } else {
        setAiError('Failed to make move. Please try again.');
      }
    }
  };

  const handleAIMove = async () => {
    if (!convexGameId || !gameManager.isAITurn() || gameManager.isGameOver()) {
      return;
    }

    // Check if we can perform online operations
    if (!networkService.canPerformOnlineOperations()) {
      handleOfflineAIMove();
      return;
    }

    setIsAIThinking(true);
    setAiError(null);
    setAiServiceStatus(null);
    setNetworkError(null);

    try {
      // Add timeout to prevent frontend freezing
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI move request timed out')), 15000); // 15 second timeout
      });

      const aiMovePromise = requestAIMove({
        gameId: convexGameId,
        difficulty
      });

      const result = await Promise.race([aiMovePromise, timeoutPromise]) as any;

      if (result.success) {
        // Show fallback notification if AI used fallback
        if (result.usedFallback && result.fallbackReason) {
          setAiServiceStatus({
            status: 'fallback',
            message: result.fallbackReason,
            canRetry: true,
            fallbackAvailable: true
          });
        }

        // The AI move is already applied in the backend, we need to sync the frontend
        // Parse the SAN move to get from/to squares for local game manager
        try {
          const tempChess = new (await import('chess.js')).Chess(gameState.fen);
          const moveObj = tempChess.move(result.san);
          
          if (moveObj) {
            const aiMove: Move = {
              from: moveObj.from,
              to: moveObj.to,
              san: moveObj.san,
              promotion: moveObj.promotion as 'q' | 'r' | 'b' | 'n' | undefined
            };

            // Apply AI move to local game manager
            const validation = gameManager.makeMove(aiMove);
            if (validation.isValid) {
              updateGameState();
              
              // Check if game ended
              if (result.gameResult) {
                onGameEnd?.(result.gameResult);
              }
            } else {
              // If local validation fails, reload from backend
              console.warn('Local validation failed for AI move, reloading from backend');
              if (activeGame) {
                gameManager.loadPosition(activeGame.fen);
                setGameState(gameManager.getGameState());
              }
            }
          }
        } catch (parseError) {
          console.error('Failed to parse AI move:', parseError);
          // Fallback: reload game state from backend
          if (activeGame) {
            gameManager.loadPosition(activeGame.fen);
            setGameState(gameManager.getGameState());
          }
        }
      }
    } catch (error) {
      console.error('AI move failed:', error);
      const parsedError = networkService.parseNetworkError(error);
      setNetworkError(parsedError);
      
      // Fallback to offline AI if the error is retryable
      if (parsedError.retryable) {
        console.log('Network error during AI move, falling back to offline AI');
        setAiError('Using offline AI due to connection issues');
        handleOfflineAIMove();
      } else {
        setAiError(parsedError.message);
        
        // Check AI service status for better error handling
        try {
          const status = await getAIServiceStatus();
          setAiServiceStatus(status);
        } catch (statusError) {
          console.error('Failed to get AI service status:', statusError);
        }
      }
    } finally {
      setIsAIThinking(false);
    }
  };

  const handleOfflineAIMove = async () => {
    if (!gameManager.isAITurn() || gameManager.isGameOver()) {
      return;
    }

    setIsAIThinking(true);
    setAiError(null);

    try {
      console.log('Generat AI move  offl mode');
      const result = await gameManager.generateOfflineAIMove();
      
      if (result.success && result.move) {
        updateGameState();
        
        // Check if game ended
        const gameResult = gameManager.getGameResult();
        if (gameResult) {
          onGameEnd?.(gameResult);
        }
        
        // Show offline AI notification
        setAiServiceStatus({
          status: 'offline',
          message: 'Using offline AI - moves will sync when connection is restored',
          canRetry: networkService.canPerformOnlineOperations(),
          fallbackAvailable: true
        });
        
        // Add AI move to pending operations if we have a game ID
        if (convexGameId) {
          networkService.addPendingOperation({
            type: 'ai_move',
            data: { move: result.move, gameId: convexGameId },
            maxRetries: 3
          });
        }
      } else {
        setAiError(result.error || 'Failed to generate AI move offline');
      }
    } catch (error) {
      console.error('Offline AI move failed:', error);
      setAiError('Failed to generate AI move. Please make your next move.');
    } finally {
      setIsAIThinking(false);
    }
  };

  const handleRetryAIMove = async () => {
    if (!convexGameId) return;
    
    setIsRecovering(true);
    setAiError(null);
    
    try {
      const recoveryResult = await recoverFromAIError({
        gameId: convexGameId,
        difficulty,
        forceReset: false
      });
      
      if (recoveryResult.success) {
        if (recoveryResult.action === 'move_generated' && recoveryResult.moveResult) {
          // Handle successful move generation
          const result = recoveryResult.moveResult;
          
          try {
            const tempChess = new (await import('chess.js')).Chess(gameState.fen);
            const moveObj = tempChess.move(result.san);
            
            if (moveObj) {
              const aiMove: Move = {
                from: moveObj.from,
                to: moveObj.to,
                san: moveObj.san,
                promotion: moveObj.promotion as 'q' | 'r' | 'b' | 'n' | undefined
              };

              const validation = gameManager.makeMove(aiMove);
              if (validation.isValid) {
                updateGameState();
                
                if (result.gameResult) {
                  onGameEnd?.(result.gameResult);
                }
              }
            }
          } catch (parseError) {
            console.error('Failed to parse recovered AI move:', parseError);
          }
        }
        
        setAiServiceStatus(recoveryResult.serviceStatus);
      } else {
        setAiError(recoveryResult.message);
        if (recoveryResult.serviceStatus) {
          setAiServiceStatus(recoveryResult.serviceStatus);
        }
      }
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
      setAiError('Recovery attempt failed. Please try restarting the game.');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleForceGameReset = async () => {
    if (!convexGameId) return;
    
    setIsRecovering(true);
    
    try {
      const recoveryResult = await recoverFromAIError({
        gameId: convexGameId,
        difficulty,
        forceReset: true
      });
      
      if (recoveryResult.success) {
        // Reset local game manager
        gameManager.resetGame();
        persistence.clearSavedState();
        updateGameState();
        setAiError(null);
        setAiServiceStatus(null);
      } else {
        setAiError('Failed to reset game. Please refresh the page.');
      }
    } catch (error) {
      console.error('Force reset failed:', error);
      setAiError('Failed to reset game. Please refresh the page.');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleNewGame = (event?: any) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Show confirmation dialog if game is in progress
    if (gameState.moveHistory.length > 0 && !gameManager.isGameOver()) {
      setShowRestartDialog(true);
    } else {
      confirmNewGame();
    }
  };

  const confirmNewGame = async () => {
    try {
      if (convexGameId) {
        // Reset Convex game with current difficulty
        await resetGame({ gameId: convexGameId });
      } else {
        // Create new Convex game with current difficulty
        const newGameId = await createGame({
          difficulty,
          playerColor: 'white'
        });
        setConvexGameId(newGameId);
      }
      
      // Reset local game manager with current difficulty
      const settings: GameSettings = {
        difficulty,
        playerColor: 'white'
      };
      const newManager = new OfflineGameManager(settings);
      
      // Use functional updates for consistency
      setGameManager(prevManager => {
        if (prevManager && typeof prevManager.cleanup === 'function') {
          prevManager.cleanup();
        }
        return newManager;
      });
      
      setGameState(newManager.getGameState());
      setGameKey(`game-${Date.now()}`); // Force re-render
      persistence.clearSavedState();
      setShowRestartDialog(false);
      setAiError(null);
    } catch (error) {
      console.error('Failed to start new game:', error);
      setAiError('Failed to start new game. Please try again.');
      setShowRestartDialog(false);
    }
  };

  const cancelNewGame = () => {
    setShowRestartDialog(false);
  };

  const handleUndoMove = () => {
    const success = gameManager.undoLastPlayerMove();
    if (success) {
      updateGameState();
    }
  };

  const handleToggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleRestoreGame = () => {
    console.log('Attempting to restore game - simplified version...');
    
    try {
      // First, close the dialog immediately
      setShowRestoreDialog(false);
      
      // Clear any errors
      setAiError(null);
      setAiServiceStatus(null);
      
      console.log('Loading saved state...');
      const savedState = persistence.loadGameState();
      
      if (savedState) {
        console.log('Found saved state, attempting restore...');
        const restoredManager = persistence.restoreGameManager(savedState);
        
        if (restoredManager) {
          console.log('Successfully restored manager, converting to offline...');
          const settings: GameSettings = {
            difficulty: restoredManager.getGameSettings().difficulty,
            playerColor: restoredManager.getGameSettings().playerColor
          };
          
          const offlineManager = new OfflineGameManager(settings, restoredManager.getFen());
          offlineManager.importGameState(restoredManager.exportGameState());
          
          setGameManager(offlineManager);
          setGameState(offlineManager.getGameState());
          
          console.log('Game restored successfully!');
          return;
        }
      }
      
      console.log('No saved state or restoration failed, starting new game...');
      handleStartNewGame();
    } catch (error) {
      console.error('Error restoring game:', error);
      console.error('Error details:', error);
      
      // Even if there's an error, make sure dialog closes
      setShowRestoreDialog(false);
      setAiError('Failed to restore game. Starting new game instead.');
      
      // Try to start new game as fallback
      setTimeout(() => {
        handleStartNewGame();
      }, 100);
    }
  };

  const handleStartNewGameSimple = () => {
    console.log('Simple new game handler called');
    
    try {
      // Close dialog immediately
      setShowRestoreDialog(false);
      setAiError(null);
      setAiServiceStatus(null);
      
      // Clear saved state
      persistence.clearSavedState();
      
      // Create a completely new game manager
      const settings: GameSettings = {
        difficulty,
        playerColor: 'white'
      };
      
      const newManager = new OfflineGameManager(settings);
      
      // Use functional updates for consistency
      setGameManager(prevManager => {
        if (prevManager && typeof prevManager.cleanup === 'function') {
          prevManager.cleanup();
        }
        return newManager;
      });
      
      setGameState(newManager.getGameState());
      setGameKey(`game-${Date.now()}`); // Force re-render
      
      console.log('New game created successfully');
    } catch (error) {
      console.error('Error  simple new game handler:', error);
      setShowRestoreDialog(false); // Ensure dialog closes even on error
    }
  };

  const handleRestoreGameSimple = () => {
    console.log('Simple restore game handler called');
    
    try {
      // Close dialog immediately
      setShowRestoreDialog(false);
      setAiError(null);
      setAiServiceStatus(null);
      
      // Try to restore the saved game
      const savedState = persistence.loadGameState();
      if (savedState) {
        const restoredManager = persistence.restoreGameManager(savedState);
        if (restoredManager) {
          const settings: GameSettings = {
            difficulty: restoredManager.getGameSettings().difficulty,
            playerColor: restoredManager.getGameSettings().playerColor
          };
          
          const offlineManager = new OfflineGameManager(settings, restoredManager.getFen());
          offlineManager.importGameState(restoredManager.exportGameState());
          
          // Use functional updates for consistency
          setGameManager(prevManager => {
            if (prevManager && typeof prevManager.cleanup === 'function') {
              prevManager.cleanup();
            }
            return offlineManager;
          });
          
          setGameState(offlineManager.getGameState());
          setGameKey(`game-${Date.now()}`); // Force re-render
          
          console.log('Game restored successfully');
          return;
        }
      }
      
      // If restore fails, start new game
      console.log('Restore failed, starting new game');
      handleStartNewGameSimple();
    } catch (error) {
      console.error('Error  simple restore handler:', error);
      setShowRestoreDialog(false); // Ensure dialog closes even on error
      // Fallback to new game
      handleStartNewGameSimple();
    }
  };

  const handleStartNewGame = () => {
    console.log('Starting new game - simplified version...');
    
    try {
      // First, close the dialog immediately
      setShowRestoreDialog(false);
      
      // Clear any errors
      setAiError(null);
      setAiServiceStatus(null);
      
      // Clear saved state
      console.log('Clearing saved state...');
      persistence.clearSavedState();
      
      // Create new game manager
      console.log('Creating new game manager...');
      const settings: GameSettings = {
        difficulty,
        playerColor: 'white'
      };
      
      const newManager = new OfflineGameManager(settings);
      
      // Update state
      console.log('Updating game state...');
      setGameManager(newManager);
      setGameState(newManager.getGameState());
      
      console.log('New game started successfully!');
    } catch (error) {
      console.error('Error starting new game:', error);
      console.error('Error details:', error);
      
      // Even if there's an error, make sure dialog closes
      setShowRestoreDialog(false);
      setAiError('Failed to start new game. Please refresh the page.');
    }
  };

  const getStatusMessage = () => {
    if (isRecovering) {
      return 'Attempting to recover from error...';
    }
    
    if (networkError && !networkError.retryable) {
      return `Network Error: ${networkError.message}`;
    }
    
    if (aiError) {
      return `Error: ${aiError}`;
    }
    
    if (aiServiceStatus) {
      switch (aiServiceStatus.status) {
        case 'fallback':
          return `Using fallback AI: ${aiServiceStatus.message}`;
        case 'offline':
          return `Offline Mode: ${aiServiceStatus.message}`;
        default:
          return aiServiceStatus.message;
      }
    }
    
    if (isAIThinking) {
      if (gameManager.isOfflineMode()) {
        return 'Offline AI is thinking...';
      }
      return 'AI is thinking...';
    }
    
    const statusDetails = gameManager.getGameStatusDetails();
    
    switch (statusDetails.status) {
      case 'check':
        return `${gameState.currentPlayer} is in check!`;
      case 'checkmate':
        return `Checkmate! ${statusDetails.winner === 'white' ? 'White' : 'Black'} wins!`;
      case 'stalemate':
        return 'Stalemate! The game is a draw.';
      case 'draw':
        return `Draw! ${statusDetails.reason || 'The game is a draw.'}`;
      default:
        if (gameManager.isAITurn()) {
          return gameManager.isOfflineMode() ? "Offline AI's turn" : "AI's turn";
        }
        return `${gameState.currentPlayer}'s turn`;
    }
  };

  const RestartGameDialog = () => {
    if (!showRestartDialog) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white rounded-lg p-6 shadow-xl max-w-md" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-semibold mb-4 text-center">Start New Game?</h3>
          <p className="text-gray-600 mb-6 text-center">
            Are you sure you want to start a new game? Your current progress will be lost.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Confirm New Game clicked');
                confirmNewGame();
              }}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              Start New Game
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Cancel clicked');
                cancelNewGame();
              }}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const RestoreGameDialog = () => {
    console.log('RestoreGameDialog render - showRestoreDialog:', showRestoreDialog, 'dialogDismissed:', dialogDismissed);
    
    if (!showRestoreDialog || dialogDismissed) return null;
    
    const handleNewGameClick = (event: any) => {
      event.preventDefault();
      event.stopPropagation();
      
      console.log('🎮 New Game button clicked!');
      console.log('Current showRestoreDialog state:', showRestoreDialog);
      
      // Force close dialog immediately with multiple approaches
      setShowRestoreDialog(false);
      setDialogDismissed(true);
      
      // Use setTimeout to ensure state updates are processed
      setTimeout(() => {
        try {
          console.log('🔄 Closing dialog and starting new game...');
          
          // Clear any errors
          setAiError(null);
          setAiServiceStatus(null);
          setNetworkError(null);
          
          // Clear saved state FIRST
          console.log('🗑️ Clearing saved state...');
          persistence.clearSavedState();
          
          // Create completely new game manager
          console.log('⚙️ Creating new game manager...');
          const settings: GameSettings = {
            difficulty,
            playerColor: 'white'
          };
          
          const newManager = new OfflineGameManager(settings);
          
          // Use functional updates to ensure proper state setting
          setGameManager(prevManager => {
            // Cleanup previous manager
            if (prevManager && typeof prevManager.cleanup === 'function') {
              prevManager.cleanup();
            }
            console.log('🔄 Setting new game manager');
            return newManager;
          });
          
          setGameState(prevState => {
            const newState = newManager.getGameState();
            console.log('🔄 Setting new game state:', newState);
            return newState;
          });
          
          // Force re-render by updating game key
          setGameKey(`game-${Date.now()}`);
          
          // Clear any Convex game ID to ensure fresh start
          setConvexGameId(null);
          
          console.log('✅ New game started successfully!');
          console.log('New game state:', newManager.getGameState());
          console.log('New game FEN:', newManager.getFen());
          console.log('Move history length:', newManager.getGameState().moveHistory.length);
        } catch (error) {
          console.error('❌ Error starting new game:', error);
          console.error('Error details:', error);
          alert('Error starting new game. Please refresh the page.');
        }
      }, 0);
    };

    const handleRestoreClick = (event: any) => {
      event.preventDefault();
      event.stopPropagation();
      
      console.log('Restore Game button clicked!');
      
      // Force close dialog immediately with multiple approaches
      setShowRestoreDialog(false);
      setDialogDismissed(true);
      
      // Use setTimeout to ensure state updates are processed
      setTimeout(() => {
        try {
          // Clear any errors
          setAiError(null);
          setAiServiceStatus(null);
          
          // Try to restore the saved game
          const savedState = persistence.loadGameState();
          if (savedState) {
            const restoredManager = persistence.restoreGameManager(savedState);
            if (restoredManager) {
              const settings: GameSettings = {
                difficulty: restoredManager.getGameSettings().difficulty,
                playerColor: restoredManager.getGameSettings().playerColor
              };
              
              const offlineManager = new OfflineGameManager(settings, restoredManager.getFen());
              offlineManager.importGameState(restoredManager.exportGameState());
              
              setGameManager(offlineManager);
              setGameState(offlineManager.getGameState());
              
              console.log('Game restored successfully!');
              return;
            }
          }
          
          // If restore fails, start new game
          console.log('Restore failed, starting new game instead');
          handleStartNewGameSimple();
        } catch (error) {
          console.error('Error restoring game:', error);
          // Fallback to new game
          handleStartNewGameSimple();
        }
      }, 0);
    };
    
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="bg-white rounded-lg p-6 shadow-xl max-w-md" 
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold mb-4 text-center">Restore Previous Game?</h3>
          <p className="text-gray-600 mb-6 text-center">
            We found a saved game from your previous session. Would you like to continue where you left off?
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleRestoreClick}
              onMouseDown={() => console.log('🖱️ Restore Game button mouse down')}
              onMouseUp={() => console.log('🖱️ Restore Game button mouse up')}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-semibold cursor-pointer select-none"
              style={{ userSelect: 'none' }}
            >
              Restore Game
            </button>
            <button
              type="button"
              onClick={handleNewGameClick}
              onMouseDown={() => console.log('🖱️ New Game button mouse down')}
              onMouseUp={() => console.log('🖱️ New Game button mouse up')}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 active:bg-gray-800 transition-colors font-semibold cursor-pointer select-none"
              style={{ userSelect: 'none' }}
            >
              New Game
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ChessErrorBoundary
      section="game"
      onReset={() => {
        // Reset game state
        gameManager.loadPosition(gameState.fen);
        updateGameState();
      }}
      onRestart={confirmNewGame}
    >
      <div className="flex flex-col items-center p-4">
        <RestoreGameDialog />
        <RestartGameDialog />
        <div className="w-full max-w-6xl">
          {/* Header - Enhanced mobile layout */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-2">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
                Chess Game
              </h2>
              <NetworkStatusBadge />
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs sm:text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <span>🤖</span> AI Difficulty: <strong className="capitalize">{difficulty}</strong>
              </span>
              <span className="flex items-center gap-1">
                <span>♔</span> You play as <strong>White</strong>
              </span>
              <span className="flex items-center gap-1">
                <span>🎯</span> Mode: <strong>{gameManager.isOfflineMode() ? 'Offline' : 'Online'}</strong>
              </span>
            </div>
            {gameManager.isOfflineMode() && (
              <p className="text-xs sm:text-sm text-yellow-600 mt-2 bg-yellow-50 rounded-lg px-3 py-1 inline-block">
                🔄 Offline Mode - {gameManager.getPendingMovesCount()} moves pending sync
              </p>
            )}
          </div>

          {/* Game Container - Enhanced responsive layout */}
          <div className="bg-gradient-to-br from-orange-50 via-white to-green-50 rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 lg:p-6 border border-orange-200 sm:border-2">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
              {/* Chess Board Area - Responsive sizing */}
              <div className="xl:col-span-2 flex justify-center">
                <div className="w-full max-w-lg sm:max-w-xl lg:max-w-2xl">
                  <BoardErrorBoundary
                    onResetBoard={() => {
                      // Reset board display by forcing a re-render
                      gameManager.loadPosition(gameState.fen);
                      updateGameState();
                    }}
                    onRestartGame={confirmNewGame}
                    currentPosition={gameState.fen}
                    theme={theme}
                  >
                    <ChessboardWrapper
                      key={gameKey}
                      chessEngine={gameManager.getChessEngine()}
                      gameState={gameState}
                      playerColor={gameManager.getGameSettings().playerColor}
                      theme={theme}
                      onMove={handleMove}
                      onGameStateUpdate={updateGameState}
                      disabled={isAIThinking || !gameManager.isPlayerTurn()}
                    />
                  </BoardErrorBoundary>
                </div>
              </div>

              {/* Game Controls and Info - Enhanced mobile layout */}
              <div className="space-y-3 sm:space-y-4">
                <ChessErrorBoundary
                  section="controls"
                  onReset={() => {
                    // Reset game state
                    gameManager.loadPosition(gameState.fen);
                    updateGameState();
                  }}
                  onRestart={confirmNewGame}
                >
                  {/* Game Status - Improved mobile design */}
                  <div className="bg-orange-50 rounded-lg p-3 sm:p-4 border border-orange-200">
                    <h3 className="font-semibold text-orange-800 mb-2 text-sm sm:text-base flex items-center gap-2">
                      <span>🎮</span> Game Status
                    </h3>
                    <div className="flex items-start gap-2 mb-2">
                      {(isAIThinking || isRecovering) && (
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-orange-600 mt-0.5 flex-shrink-0"></div>
                      )}
                      <p className={`text-xs sm:text-sm leading-relaxed ${
                        aiError || networkError ? 'text-red-600' : 
                        aiServiceStatus?.status === 'fallback' || aiServiceStatus?.status === 'offline' ? 'text-yellow-600' : 
                        'text-gray-600'
                      }`}>
                        {getStatusMessage()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                      <span className="bg-white px-2 py-1 rounded">
                        Moves: {gameState.moveHistory.length}
                      </span>
                      <span className="bg-white px-2 py-1 rounded">
                        Turn: {gameState.moveHistory.length % 2 === 0 ? 'White' : 'Black'}
                      </span>
                    </div>
                    
                    {/* Network Status Information */}
                    {!networkStatus.isOnline && (
                      <p className="text-xs text-red-600 mt-1">
                        🔴 No internet connection
                      </p>
                    )}
                    {networkStatus.isOnline && !networkStatus.isBackendAvailable && (
                      <p className="text-xs text-yellow-600 mt-1">
                        🟡 Server unavailable - using offline mode
                      </p>
                    )}
                    {!convexGameId && networkStatus.isOnline && (
                      <p className="text-xs text-yellow-600 mt-1">
                        ⚠️ Playing in offline mode
                      </p>
                    )}
                    {gameManager.isOfflineMode() && gameManager.getPendingMovesCount() > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        🔄 {gameManager.getPendingMovesCount()} moves pending sync
                      </p>
                    )}
                    {aiServiceStatus && aiServiceStatus.status === 'fallback' && (
                      <p className="text-xs text-yellow-600 mt-1">
                        ⚠️ Using fallback AI system
                      </p>
                    )}
                    {aiServiceStatus && aiServiceStatus.status === 'offline' && (
                      <p className="text-xs text-blue-600 mt-1">
                        🤖 Using offline AI
                      </p>
                    )}
                    {/* Network and Sync Controls */}
                    {(aiError || networkError || gameManager.isOfflineMode()) && (
                      <AIErrorBoundary
                        onRetryAI={handleRetryAIMove}
                        onContinueWithoutAI={() => {
                          setAiError(null);
                          setNetworkError(null);
                          setAiServiceStatus(null);
                        }}
                        onRestartGame={handleForceGameReset}
                        isAIThinking={isAIThinking}
                        aiServiceStatus={aiServiceStatus}
                      >
                        <div className="mt-2 space-y-1">
                          {networkError && networkError.retryable && (
                            <button 
                              onClick={async () => {
                                setNetworkError(null);
                                await networkService.forceNetworkCheck();
                              }}
                              disabled={isRecovering}
                              className="w-full bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              Retry Connection
                            </button>
                          )}
                          {gameManager.isOfflineMode() && networkService.canPerformOnlineOperations() && (
                            <button 
                              onClick={async () => {
                                const syncResult = await gameManager.attemptSync();
                                if (syncResult.success) {
                                  setAiError(null);
                                  setNetworkError(null);
                                  console.log(`Synced ${syncResult.syncedMoves} moves`);
                                } else {
                                  setAiError(`Sync failed: ${syncResult.errors.join(', ')}`);
                                }
                              }}
                              disabled={isRecovering}
                              className="w-full bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              Sync Offline Changes
                            </button>
                          )}
                          {aiError && (
                            <button 
                              onClick={handleRetryAIMove}
                              disabled={isRecovering}
                              className="w-full bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              {isRecovering ? 'Recovering...' : 'Retry AI Move'}
                            </button>
                          )}
                          <button 
                            onClick={handleForceGameReset}
                            disabled={isRecovering}
                            className="w-full bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            Reset Game
                          </button>
                        </div>
                      </AIErrorBoundary>
                    )}
                    {aiServiceStatus && aiServiceStatus.canRetry && !aiError && (
                      <button 
                        onClick={() => {
                          setAiServiceStatus(null);
                          if (gameManager.isAITurn()) {
                            handleAIMove();
                          }
                        }}
                        className="mt-2 w-full bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Try Gemini AI Again
                      </button>
                    )}
                    {gameManager.isGameOver() && (
                      <button 
                        onClick={confirmNewGame}
                        className="mt-2 w-full bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Play Again
                      </button>
                    )}
                  </div>

                  {/* Network Status */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-2">Network Status</h3>
                    <NetworkStatusIndicator 
                      showDetails={showNetworkDetails}
                      onRetryConnection={async () => {
                        await networkService.forceNetworkCheck();
                        // Try to reconnect to backend if possible
                        if (networkService.canPerformOnlineOperations() && !convexGameId) {
                          try {
                            const newGameId = await createGame({
                              difficulty,
                              playerColor: 'white'
                            });
                            setConvexGameId(newGameId);
                            setNetworkError(null);
                            setAiError(null);
                          } catch (error) {
                            console.error('Failed to reconnect:', error);
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => setShowNetworkDetails(!showNetworkDetails)}
                      className="mt-2 w-full bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      {showNetworkDetails ? 'Hide' : 'Show'} Network Details
                    </button>
                  </div>

                  {/* Game Controls */}
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h3 className="font-semibold text-green-800 mb-3">Game Controls</h3>
                    <div className="space-y-3">
                      {/* Difficulty Selector */}
                      {showDifficultySelector && (
                        <div>
                          <label className="block text-sm font-medium text-green-700 mb-1">
                            AI Difficulty
                          </label>
                          <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                            disabled={!gameManager.isGameOver() && gameState.moveHistory.length > 0}
                            className="w-full px-3 py-1 border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                          {!gameManager.isGameOver() && gameState.moveHistory.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Start a new game to change difficulty
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Control Buttons */}
                      <div className="space-y-2">
                        <button 
                          onClick={handleNewGame}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          New Game
                        </button>
                        <button 
                          onClick={handleUndoMove}
                          disabled={!gameManager.canUndo()}
                          className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                        >
                          Undo Move
                        </button>
                        <button 
                          onClick={handleToggleTheme}
                          className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                        >
                          {theme === 'light' ? '🌙 Dark Theme' : '☀️ Light Theme'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Move History */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-2">Move History</h3>
                    <div className="max-h-48 overflow-y-auto">
                      {gameState.moveHistory.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No moves yet</p>
                      ) : (
                        <div className="space-y-1">
                          {gameState.moveHistory.map((move, index) => {
                            const moveNumber = Math.floor(index / 2) + 1;
                            const isWhiteMove = index % 2 === 0;
                            const isLastMove = index === gameState.moveHistory.length - 1;
                            
                            return (
                              <div 
                                key={index} 
                                className={`text-sm flex items-center py-1 px-2 rounded ${
                                  isLastMove ? 'bg-blue-100 border border-blue-300' : 'hover:bg-blue-50'
                                }`}
                              >
                                <span className="w-8 text-right mr-3 text-gray-500 font-mono">
                                  {isWhiteMove ? `${moveNumber}.` : ''}
                                </span>
                                <span className={`font-mono ${isWhiteMove ? 'text-gray-800' : 'text-gray-600'}`}>
                                  {move.san}
                                </span>
                                {isLastMove && (
                                  <span className="ml-auto text-xs text-blue-600">
                                    ← Last
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {gameState.moveHistory.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <p className="text-xs text-gray-600">
                          Total moves: {gameState.moveHistory.length} • 
                          Turn: {gameState.moveHistory.length % 2 === 0 ? 'White' : 'Black'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Game Statistics */}
                  {showGameStats && (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h3 className="font-semibold text-purple-800 mb-2">Game Statistics</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Player:</span>
                          <span className="font-medium">White ♔</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">AI Difficulty:</span>
                          <span className="font-medium capitalize">{difficulty}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Game Mode:</span>
                          <span className="font-medium">
                            {gameManager.isOfflineMode() ? 'Offline' : 'Online'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Moves Played:</span>
                          <span className="font-medium">{gameState.moveHistory.length}</span>
                        </div>
                        {gameManager.isOfflineMode() && gameManager.getPendingMovesCount() > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Pending Sync:</span>
                            <span className="font-medium text-yellow-600">
                              {gameManager.getPendingMovesCount()} moves
                            </span>
                          </div>
                        )}
                        {gameManager.isGameOver() && (
                          <div className="pt-2 border-t border-purple-200">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Result:</span>
                              <span className="font-medium">
                                {(() => {
                                  const result = gameManager.getGameResult();
                                  if (!result) return ' Progress';
                                  if (result.winner === 'draw') return 'Draw';
                                  return result.winner === 'white' ? 'You Win!' : 'AI Wins';
                                })()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </ChessErrorBoundary>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ChessErrorBoundary>
  );
}