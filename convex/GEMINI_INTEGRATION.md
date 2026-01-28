# Gemini AI Integration for Chess Game

## Overview

This document describes the secure integration of Google's Gemini AI API for generating chess moves in the EduVerse chess game. The integration provides intelligent opponent moves at different difficulty levels while maintaining security and error handling best practices.

## Security Implementation

### API Key Management
- **Environment Variable**: The Gemini API key is stored securely in the `GEMINI_API_KEY` environment variable
- **Backend Only**: The API key is never exposed to the frontend or client-side code
- **Convex Environment**: Set using `npx convex env set GEMINI_API_KEY <your-key>`
- **Validation**: API key format is validated before use

### Current API Key Status
- ✅ API key is properly configured
- ✅ Key format validation passes
- ✅ Secure backend storage implemented

## API Integration Details

### SDK Used
- **Package**: `@google/genai` (latest Google Gen AI SDK)
- **Version**: Latest stable version
- **Migration**: Migrated from deprecated `@google/generative-ai` package

### Model Selection
The integration attempts to use models in order of preference:
1. `gemini-2.0-flash` (primary choice)
2. `gemini-1.5-flash` (fallback)
3. `gemini-1.5-pro` (fallback)

### Prompt Engineering

#### System Instructions
The AI receives comprehensive instructions to:
- Act as a professional chess engine
- Respond only with valid chess moves in Standard Algebraic Notation (SAN)
- Follow official chess rules
- Consider the specified difficulty level
- Never explain reasoning, only provide moves

#### Difficulty Levels

**Easy Level:**
- Make reasonable but not optimal moves
- Occasionally miss simple tactical opportunities
- Focus on basic piece development
- Don't calculate deeply
- Make some positional mistakes

**Medium Level:**
- Look for basic tactics (pins, forks, skewers)
- Consider positional principles
- Calculate 2-3 moves ahead
- Make good but not perfect moves
- Occasionally miss complex tactics

**Hard Level:**
- Calculate deeply (4-6 moves ahead)
- Find the best moves in most positions
- Exploit all tactical and positional opportunities
- Consider long-term strategic plans
- Play near-optimal moves

## Functions Implemented

### Core Functions

#### `generateAIMove(fen, difficulty, moveHistory)`
- **Purpose**: Generate AI chess moves using Gemini API
- **Input**: Board position (FEN), difficulty level, move history
- **Output**: Valid chess move in SAN notation
- **Error Handling**: Retry logic with multiple models, quota limit detection

#### `validateAIMove(fen, aiMove)`
- **Purpose**: Validate AI-generated moves using chess.js
- **Input**: Board position (FEN), AI move (SAN)
- **Output**: Validation result with game state information
- **Security**: Server-side validation prevents invalid moves

### API Functions

#### `requestAIMove`
- **Type**: Convex Action
- **Purpose**: Main function for requesting AI moves in games
- **Features**: 
  - Turn validation (ensures it's AI's turn)
  - Retry logic with exponential backoff
  - Game state updates
  - Statistics tracking

#### `testGeminiConnection`
- **Type**: Convex Action
- **Purpose**: Test API connectivity and model availability
- **Features**: Tests multiple models, validates responses

#### `validateGeminiAPIKey`
- **Type**: Convex Action
- **Purpose**: Validate API key configuration without consuming quota
- **Features**: Format validation, secure key prefix display

### Helper Functions

#### `updateGameWithAIMove`
- **Type**: Convex Mutation
- **Purpose**: Update game state with AI-generated moves
- **Features**: Move history tracking, game completion detection

## Error Handling

### Quota Management
- **Detection**: Identifies quota exceeded errors (HTTP 429)
- **Response**: Graceful error messages to users
- **Retry Logic**: Doesn't retry on quota errors to avoid waste

### Model Fallbacks
- **Strategy**: Try multiple models in order of preference
- **Handling**: Skip unavailable models, continue with alternatives
- **Logging**: Comprehensive error logging for debugging

### Network Resilience
- **Timeouts**: Reasonable timeout handling
- **Retries**: Exponential backoff for transient errors
- **Fallbacks**: Clear error messages when all attempts fail

## Move Validation

### Client-Side Validation
- Initial move validation using chess.js
- Prevents invalid moves from reaching the server
- Immediate user feedback

### Server-Side Validation
- Re-validation of all moves on the backend
- Security against client manipulation
- Ensures game integrity

### AI Move Validation
- All AI-generated moves are validated before application
- Invalid AI moves trigger retry with additional constraints
- Prevents game corruption from AI errors

## Performance Considerations

### Response Times
- **Target**: AI moves generated within 5 seconds
- **Optimization**: Efficient prompt engineering
- **Caching**: Move history context limited to last 10 moves

### Resource Usage
- **Tokens**: Optimized prompts to minimize token usage
- **Requests**: Efficient retry logic to avoid unnecessary calls
- **Memory**: Minimal server-side state storage

## Testing and Validation

### Test Functions
- `testGeminiConnection`: Full API connectivity test
- `validateGeminiAPIKey`: API key validation without quota usage
- Integration tests for move generation and validation

### Validation Checks
- ✅ API key properly configured
- ✅ Secure environment variable storage
- ✅ Move validation working correctly
- ✅ Error handling implemented
- ✅ Quota limit detection working

## Usage Examples

### Basic AI Move Request
```typescript
const result = await ctx.runAction(api.chess.requestAIMove, {
  gameId: "game-id",
  difficulty: "medium"
});
```

### API Key Validation
```typescript
const validation = await ctx.runAction(api.chess.validateGeminiAPIKey, {});
```

## Monitoring and Maintenance

### Logging
- All API errors are logged with context
- Move generation attempts tracked
- Performance metrics available

### Quota Monitoring
- Monitor usage through Google AI Studio
- Set up alerts for quota limits
- Plan for scaling if needed

### Model Updates
- Stay updated with new Gemini model releases
- Test new models before deployment
- Update model preferences as needed

## Security Best Practices

### Implemented
- ✅ API key stored in environment variables
- ✅ No client-side API key exposure
- ✅ Server-side move validation
- ✅ Input sanitization and validation
- ✅ Error message sanitization

### Recommendations
- Regular API key rotation
- Monitor for unusual usage patterns
- Implement rate limiting if needed
- Regular security audits

## Troubleshooting

### Common Issues

**Quota Exceeded**
- Error: "You exceeded your current quota"
- Solution: Wait for quota reset or upgrade plan
- Prevention: Monitor usage patterns

**Model Not Found**
- Error: "models/X is not found"
- Solution: Update to available model names
- Check: Google AI documentation for current models

**Invalid Moves**
- Error: AI generates invalid moves
- Solution: Retry logic with additional constraints
- Fallback: Error handling with user notification

### Debug Functions
- Use `validateGeminiAPIKey` to check configuration
- Use `testGeminiConnection` to test API connectivity
- Check Convex logs for detailed error information

## Future Enhancements

### Planned Features
- Advanced difficulty customization
- Opening book integration
- Endgame tablebase consultation
- Move explanation generation

### Scalability
- Batch move generation for multiple games
- Caching of common positions
- Load balancing across multiple API keys

## Compliance and Attribution

### Content Licensing
- All AI-generated moves are used within fair use guidelines
- No verbatim reproduction of copyrighted chess content
- Moves are factual game data, not creative content

### Attribution
- Google Gemini AI powers the chess opponent
- Proper attribution in user interface
- Compliance with Google AI usage policies