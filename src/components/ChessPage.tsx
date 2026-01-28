import ChessGame from './chess/ChessGame';
import ChessErrorBoundary from './chess/ChessErrorBoundary';
import { GameResult } from './chess/GameManager';

export default function ChessPage() {
  const handleGameEnd = (result: GameResult) => {
    console.log('Game ended:', result);
    // TODO: Show game result modal or notification
    // TODO: Update user statistics in Convex
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Page Header with Develop Verse styling pattern - Enhanced for mobile */}
      <div className="mb-6 sm:mb-8 bg-gradient-to-r from-orange-50 via-white to-green-50 rounded-2xl p-4 sm:p-6 lg:p-8 border-2 sm:border-4 border-orange-300 shadow-lg">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <span className="text-3xl sm:text-4xl">♟️</span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent text-center">
            Chess with AI
          </h1>
          <span className="text-xl sm:text-2xl">🤖</span>
        </div>
        <p className="text-gray-700 text-sm sm:text-base lg:text-lg font-semibold text-center leading-relaxed">
          Challenge yourself against our telligent AI opponent powered by Google Gem. 
          Choose your difficulty level and improve your chess skills!
        </p>
        <div className="flex items-center justify-center space-x-2 mt-3 sm:mt-4">
          <p className="text-xs sm:text-sm text-gray-600 italic font-medium">
            Develop your strategic thkg • Develop Verse Chess Academy
          </p>
          <span className="text-xl">🏆</span>
        </div>
      </div>

      {/* Chess Game Container - Enhanced responsive design */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-orange-200 sm:border-2 p-3 sm:p-4 lg:p-6 mb-6 sm:mb-8">
        <ChessErrorBoundary
          section="game"
          onRestart={() => {
            // Force page refresh to restart the entire chess game
            window.location.reload();
          }}
        >
          <ChessGame
            difficulty="medium"
            theme="light"
            onGameEnd={handleGameEnd}
            showDifficultySelector={true}
            showGameStats={true}
          />
        </ChessErrorBoundary>
      </div>

      {/* Instructions Section - Enhanced mobile layout */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-orange-200 sm:border-2 p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <span className="text-2xl sm:text-3xl">📖</span>
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
            How to Play
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
              <span className="text-lg sm:text-xl">🎯</span> Game Controls
            </h3>
            <ul className="text-xs sm:text-sm text-blue-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Click on a piece to select it</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Click on a highlighted square to move</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Drag and drop pieces to move them</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Use the "Undo Move" button to take back your last move</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Click "New Game" to start over</span>
              </li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
              <span className="text-lg sm:text-xl">♟️</span> Chess Rules
            </h3>
            <ul className="text-xs sm:text-sm text-green-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                <span>All standard chess rules apply</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                <span>Castling, en passant, and pawn promotion supported</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                <span>Game ends with checkmate, stalemate, or draw</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                <span>You play as White, AI plays as Black</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                <span>Choose difficulty: Easy, Medium, or Hard</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Features Section - Enhanced mobile grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-200 sm:border-2 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 duration-300">
          <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 text-center">🤖</div>
          <h3 className="font-bold text-blue-800 mb-2 text-center text-base sm:text-lg">AI Opponent</h3>
          <p className="text-xs sm:text-sm text-blue-700 text-center leading-relaxed">
            Play against Google Gemini AI with adjustable difficulty levels from beginner to expert
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-green-200 sm:border-2 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 duration-300">
          <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 text-center">💾</div>
          <h3 className="font-bold text-green-800 mb-2 text-center text-base sm:text-lg">Auto Save</h3>
          <p className="text-xs sm:text-sm text-green-700 text-center leading-relaxed">
            Your games are automatically saved and can be resumed anytime, even offline
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-purple-200 sm:border-2 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 duration-300 sm:col-span-2 lg:col-span-1">
          <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 text-center">📊</div>
          <h3 className="font-bold text-purple-800 mb-2 text-center text-base sm:text-lg">Statistics</h3>
          <p className="text-xs sm:text-sm text-purple-700 text-center leading-relaxed">
            Track your progress and improve your chess skills with detailed game analytics
          </p>
        </div>
      </div>

      {/* Educational Benefits Section - New addition for Develop Verse integration */}
      <div className="mt-8 sm:mt-12 bg-gradient-to-r from-orange-500 via-white to-green-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-orange-300 shadow-lg">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
          <span className="text-2xl sm:text-3xl">🧠</span>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">
            Educational Benefits
          </h2>
          <span className="text-2xl sm:text-3xl">🎓</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white bg-opacity-80 rounded-lg p-3 sm:p-4 text-center">
            <div className="text-2xl sm:text-3xl mb-2">🎯</div>
            <h4 className="font-semibold text-gray-800 text-sm sm:text-base mb-1">Strategic Thinking</h4>
            <p className="text-xs text-gray-600">Plan ahead and think critically</p>
          </div>
          <div className="bg-white bg-opacity-80 rounded-lg p-3 sm:p-4 text-center">
            <div className="text-2xl sm:text-3xl mb-2">⚡</div>
            <h4 className="font-semibold text-gray-800 text-sm sm:text-base mb-1">Quick Decision</h4>
            <p className="text-xs text-gray-600">Improve decision-making speed</p>
          </div>
          <div className="bg-white bg-opacity-80 rounded-lg p-3 sm:p-4 text-center">
            <div className="text-2xl sm:text-3xl mb-2">🧮</div>
            <h4 className="font-semibold text-gray-800 text-sm sm:text-base mb-1">Pattern Recognition</h4>
            <p className="text-xs text-gray-600">Enhance analytical skills</p>
          </div>
          <div className="bg-white bg-opacity-80 rounded-lg p-3 sm:p-4 text-center">
            <div className="text-2xl sm:text-3xl mb-2">🏆</div>
            <h4 className="font-semibold text-gray-800 text-sm sm:text-base mb-1">Concentration</h4>
            <p className="text-xs text-gray-600">Build focus and patience</p>
          </div>
        </div>
        <div className="text-center mt-4 sm:mt-6">
          <p className="text-sm sm:text-base font-semibold text-gray-800">
            "Chess is the gymnasium of the mind" - Blaise Pascal
          </p>
          <div className="flex items-center justify-center space-x-2 mt-2">
            <span className="text-orange-600 font-bold">Develop</span>
            <span className="text-gray-800 font-bold">Verse</span>
            <span className="text-green-600 font-bold">Chess</span>
            <span className="text-xl">🇮🇳</span>
          </div>
        </div>
      </div>
    </div>
  );
}