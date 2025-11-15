# Design Document

## Overview

This design document outlines the architecture and implementation approach for the Rook card game web application. The application will be built using React and TypeScript, following a component-based architecture with clear separation of concerns between game logic, state management, and UI presentation.

The design prioritizes:
- Clean separation between game logic and UI
- Type-safe implementation using TypeScript
- Responsive and intuitive user interface
- Maintainable and testable code structure

## Architecture

### High-Level Architecture

The application follows a layered architecture:

```
┌─────────────────────────────────────┐
│         UI Components Layer         │
│   (React Components, Styling)       │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│      State Management Layer         │
│   (React Context/Hooks, Game State) │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│       Game Logic Layer              │
│   (Rules Engine, Validators)        │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│         Data Models Layer           │
│   (Types, Interfaces, Constants)    │
└─────────────────────────────────────┘
```

### Technology Stack

- **Frontend Framework**: React 18+
- **Language**: TypeScript 5+
- **Build Tool**: Vite
- **Styling**: CSS Modules
- **State Management**: React Context API with useReducer
- **Package Manager**: npm

## Components and Interfaces

### Core Data Models

#### Card Model
```typescript
type CardColor = 'red' | 'yellow' | 'green' | 'black';
type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

interface Card {
  id: string;
  color: CardColor | 'rook';
  value: CardValue | 'rook';
  points: number;
}
```

#### Player Model
```typescript
type PlayerId = string;
type TeamId = 'team1' | 'team2';

interface Player {
  id: PlayerId;
  name: string;
  teamId: TeamId;
  position: 0 | 1 | 2 | 3; // Position at table (0=bottom, 1=left, 2=top, 3=right)
  hand: Card[];
  capturedTricks: Card[][];
}
```

#### Game State Model
```typescript
type GamePhase = 'setup' | 'dealing' | 'bidding' | 'playing' | 'roundEnd' | 'gameEnd';

interface Bid {
  playerId: PlayerId;
  amount: number;
}

interface Trick {
  leadPlayerId: PlayerId;
  cards: Map<PlayerId, Card>;
  winnerId?: PlayerId;
}

interface GameState {
  phase: GamePhase;
  players: Player[];
  deck: Card[];
  nest: Card[];
  dealerId: PlayerId;
  currentPlayerId: PlayerId;
  
  // Bidding phase
  currentBid: Bid | null;
  passedPlayers: Set<PlayerId>;
  highBidder: PlayerId | null;
  
  // Playing phase
  trumpColor: CardColor | null;
  currentTrick: Trick | null;
  completedTricks: Trick[];
  
  // Scoring
  scores: Map<TeamId, number>;
  roundScores: Map<TeamId, number>;
}
```

### Component Hierarchy

```
App
├── GameSetup (phase: setup)
│   └── PlayerNameInput
├── GameBoard (phase: dealing | bidding | playing | roundEnd)
│   ├── PlayerHand
│   │   └── CardComponent
│   ├── TrickArea
│   │   └── PlayedCard
│   ├── BiddingPanel (phase: bidding)
│   │   └── BidControls
│   ├── TrumpSelector (high bidder after winning bid)
│   ├── NestDisplay (high bidder after winning bid)
│   ├── ScoreBoard
│   └── GameInfo
└── GameEnd (phase: gameEnd)
    └── FinalScores
```

### Key Components

#### GameBoard Component
The main game container that orchestrates all game phases and renders appropriate child components.

**Props**: None (uses context)
**Responsibilities**:
- Render current game phase
- Display player positions
- Show trick area
- Display scores and game info

#### PlayerHand Component
Displays the current player's cards and handles card selection.

**Props**:
```typescript
interface PlayerHandProps {
  cards: Card[];
  playableCards: Set<string>; // Card IDs that can be played
  onCardClick: (card: Card) => void;
}
```

**Responsibilities**:
- Display cards in hand
- Highlight playable cards
- Handle card selection
- Sort cards by color and value

#### BiddingPanel Component
Manages the bidding interface during the bidding phase.

**Props**:
```typescript
interface BiddingPanelProps {
  currentBid: number | null;
  minBid: number;
  maxBid: number;
  canBid: boolean;
  onBid: (amount: number) => void;
  onPass: () => void;
}
```

**Responsibilities**:
- Display current bid
- Provide bid increment/decrement controls
- Handle bid submission
- Handle pass action

#### TrickArea Component
Displays cards played in the current trick.

**Props**:
```typescript
interface TrickAreaProps {
  trick: Trick | null;
  players: Player[];
}
```

**Responsibilities**:
- Display played cards in correct positions
- Highlight winning card
- Animate card plays
- Clear trick when won

### Game Logic Layer

#### GameEngine
Central game logic controller that enforces rules and manages state transitions.

**Key Methods**:
```typescript
class GameEngine {
  // Initialization
  initializeGame(playerNames: string[]): GameState;
  startNewRound(state: GameState): GameState;
  
  // Dealing
  shuffleDeck(): Card[];
  dealCards(state: GameState): GameState;
  
  // Bidding
  placeBid(state: GameState, playerId: PlayerId, amount: number): GameState;
  passBid(state: GameState, playerId: PlayerId): GameState;
  
  // High bidder actions
  selectNestCards(state: GameState, cardsToDiscard: Card[]): GameState;
  selectTrump(state: GameState, color: CardColor): GameState;
  
  // Playing
  playCard(state: GameState, playerId: PlayerId, card: Card): GameState;
  getPlayableCards(state: GameState, playerId: PlayerId): Set<string>;
  determineTrickWinner(trick: Trick, trumpColor: CardColor): PlayerId;
  
  // Scoring
  calculateRoundScore(tricks: Trick[], nest: Card[]): Map<TeamId, number>;
  updateScores(state: GameState): GameState;
  checkGameEnd(state: GameState): boolean;
}
```

#### RuleValidator
Validates game actions according to Rook rules.

**Key Methods**:
```typescript
class RuleValidator {
  // Card play validation
  canPlayCard(card: Card, hand: Card[], leadCard: Card | null, trumpColor: CardColor): boolean;
  mustFollowSuit(hand: Card[], leadCard: Card): boolean;
  
  // Bidding validation
  isValidBid(amount: number, currentBid: number | null): boolean;
  
  // Rook Bird special rules
  isRookBirdPlayable(hand: Card[], leadCard: Card | null): boolean;
  mustPlayRookBird(hand: Card[], leadCard: Card, trumpColor: CardColor): boolean;
  
  // Renege detection
  detectRenege(playedCard: Card, hand: Card[], leadCard: Card): boolean;
}
```

#### ScoreCalculator
Handles all scoring logic.

**Key Methods**:
```typescript
class ScoreCalculator {
  getCardPoints(card: Card): number;
  calculateTrickPoints(cards: Card[]): number;
  calculateTeamScore(tricks: Trick[], teamId: TeamId): number;
  applyBidResult(score: number, bid: number, madeBid: boolean): number;
}
```

## Data Models

### Card Generation

Cards are generated programmatically:

```typescript
function generateDeck(): Card[] {
  const colors: CardColor[] = ['red', 'yellow', 'green', 'black'];
  const values: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const cards: Card[] = [];
  
  // Generate colored cards
  for (const color of colors) {
    for (const value of values) {
      cards.push({
        id: `${color}-${value}`,
        color,
        value,
        points: getCardPoints(value)
      });
    }
  }
  
  // Add Rook Bird card
  cards.push({
    id: 'rook-bird',
    color: 'rook',
    value: 'rook',
    points: 20
  });
  
  return cards;
}

function getCardPoints(value: CardValue | 'rook'): number {
  if (value === 'rook') return 20;
  if (value === 5) return 5;
  if (value === 10 || value === 14) return 10;
  return 0;
}
```

### State Management

The application uses React Context with useReducer for state management:

```typescript
type GameAction =
  | { type: 'INITIALIZE_GAME'; payload: { playerNames: string[] } }
  | { type: 'START_ROUND' }
  | { type: 'DEAL_CARDS' }
  | { type: 'PLACE_BID'; payload: { playerId: PlayerId; amount: number } }
  | { type: 'PASS_BID'; payload: { playerId: PlayerId } }
  | { type: 'SELECT_NEST_CARDS'; payload: { cards: Card[] } }
  | { type: 'SELECT_TRUMP'; payload: { color: CardColor } }
  | { type: 'PLAY_CARD'; payload: { playerId: PlayerId; card: Card } }
  | { type: 'COMPLETE_TRICK' }
  | { type: 'END_ROUND' }
  | { type: 'END_GAME' };

function gameReducer(state: GameState, action: GameAction): GameState {
  // Handle state transitions based on action type
}
```

## Error Handling

### Validation Errors
- Invalid card plays are prevented at the UI level by disabling unplayable cards
- Bid validation occurs before state updates
- Clear error messages for any rule violations

### State Consistency
- All state transitions go through the reducer
- Immutable state updates prevent accidental mutations
- Type safety ensures correct data structures

### User Feedback
- Visual feedback for invalid actions (disabled buttons, grayed-out cards)
- Toast notifications for important game events
- Clear messaging during phase transitions

## Testing Strategy

### Unit Tests
- Test game logic functions in isolation
- Test rule validators with various scenarios
- Test score calculation with known inputs
- Test card generation and deck shuffling

### Component Tests
- Test component rendering with different props
- Test user interactions (clicks, selections)
- Test conditional rendering based on game phase
- Test card playability highlighting

### Integration Tests
- Test complete game flows (setup → bidding → playing → scoring)
- Test state transitions between phases
- Test multi-round games
- Test edge cases (reneges, redeal, tie scores)

### Test Data
Create fixtures for common game states:
- Initial game state
- Mid-bidding state
- Mid-trick state
- Round end state
- Game end state

## UI/UX Considerations

### Layout
- Responsive design that works on desktop and tablet
- Player positions arranged in a square (bottom = current player)
- Trick area in the center
- Score display always visible
- Clear indication of current player and phase

### Visual Design
- Card colors match Rook deck (red, yellow, green, black)
- Rook Bird card has distinctive appearance
- Trump suit indicator prominently displayed
- Smooth animations for card plays and trick collection

### Accessibility
- Keyboard navigation support
- Clear focus indicators
- Sufficient color contrast
- Screen reader friendly labels

### User Feedback
- Highlight playable cards during player's turn
- Animate card movement
- Show brief message when trick is won
- Display round results before starting next round
- Confirm actions for critical decisions (trump selection, discard)

## Performance Considerations

- Memoize expensive calculations (playable cards, trick winner)
- Use React.memo for components that don't need frequent re-renders
- Optimize card rendering with virtualization if needed
- Debounce rapid user interactions

## Future Enhancements

Potential features for future iterations:
- Multiplayer support (WebSocket/real-time)
- AI opponents for single-player mode
- Game replay and history
- Different Rook variants (Kentucky Discard, Call Partner, etc.)
- Customizable rules
- Statistics and player profiles
- Sound effects and enhanced animations
