# Chess Game - Quick Testing Guide

## How to Test the Fixes

### Basic Move Test (Click-to-Move)
1. Open the chess game
2. Click on the white pawn at **e2** (5th square from left, 2nd row from bottom)
3. You should see green dots on **e3** and **e4** (valid moves)
4. Click on **e4**
5. The pawn should move to e4
6. The board should update and show it's now Black's turn (AI's turn)
7. AI should make a move automatically

### Drag-and-Drop Test
1. Click on a white piece (e.g., knight at g1)
2. Drag it to a valid destination (e.g., f3)
3. Release the mouse
4. The piece should move to the destination

### Invalid Move Test
1. Click on a white piece
2. Try to click on an invalid square (not highlighted)
3. The piece should NOT move
4. The selection should clear

### Piece Selection Test
1. Click on a white piece
2. Valid moves should be highlighted with green dots
3. Click on the same piece again
4. The selection should clear and highlights should disappear
5. Click on a different piece
6. New valid moves should be highlighted

### Pawn Promotion Test
1. Play until a white pawn reaches the 8th rank (top row)
2. A dialog should appear asking which piece to promote to
3. Select a piece (Queen, Rook, Bishop, or Knight)
4. The pawn should be replaced with the selected piece

### Castling Test
1. Move pieces to set up castling (e.g., move f-pawn and g-pawn)
2. Move the king 2 squares toward the rook (e.g., e1 to g1)
3. The rook should automatically move to f1
4. Castling should be complete

### Game Status Test
1. Play a game until checkmate or stalemate
2. The game should display the result
3. A "New Game" button should appear
4. Clicking it should start a fresh game

---

## Expected Behavior

### When You Click a Piece
- ✅ Valid moves should be highlighted immediately
- ✅ Green dots should appear on empty squares
- ✅ Red rings should appear on capturable pieces
- ✅ The selected square should have a blue ring

### When You Move a Piece
- ✅ The piece should move to the destination
- ✅ The board should update
- ✅ It should become the opponent's turn
- ✅ AI should make a move (if it's AI's turn)

### When You Drag a Piece
- ✅ The piece should follow your cursor
- ✅ Dropping on a valid square should move the piece
- ✅ Dropping on an invalid square should cancel the move

### When the Game Ends
- ✅ The game status should show the result
- ✅ No more moves should be allowed
- ✅ A "New Game" button should be available

---

## Troubleshooting

### Pieces Not Moving
1. Check browser console for errors (F12 → Console)
2. Verify you're clicking on YOUR pieces (white)
3. Verify it's your turn (not AI's turn)
4. Try refreshing the page

### Valid Moves Not Showing
1. Make sure you clicked on a piece (not empty square)
2. Make sure it's your turn
3. Try clicking on a different piece
4. Check if the piece has any legal moves

### AI Not Moving
1. Wait a few seconds (AI might be thinking)
2. Check browser console for errors
3. Verify you made a valid move
4. Try making another move

### Game Frozen
1. Refresh the page
2. Check browser console for errors
3. Try a different browser
4. Clear browser cache and try again

---

## Performance Expectations

- **Move validation**: < 50ms (should be instant)
- **UI response**: < 100ms (should feel responsive)
- **AI move generation**: < 5 seconds (might take a few seconds)
- **Board rendering**: Smooth and fluid

---

## Browser Compatibility

Tested and working on:
- ✅ Chrome/Chromium (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

---

## Known Limitations

- AI difficulty levels may not be perfectly balanced
- No multiplayer support (AI only)
- No game history or analysis
- No time controls

---

## Reporting Issues

If you find any issues:
1. Note the exact steps to reproduce
2. Check browser console for errors
3. Take a screenshot if possible
4. Report with as much detail as possible

