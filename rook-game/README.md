# Rook Game 🃏

A modern, fully-featured digital implementation of the classic Rook card game built with React and TypeScript.

## ✨ Features

### Core Gameplay
- **4-Player Team-Based Gameplay** - Partners sit opposite each other
- **Complete Bidding System** - Bid for the right to name trump (40-120 points)
- **Trump Selection & Nest Management** - High bidder takes nest and discards 5 cards
- **Interactive Card Play** - Click to play cards with visual feedback
- **Rook Bird Special Rules** - Lowest trump card with unique gameplay mechanics
- **Automatic Rule Enforcement** - Game prevents invalid plays and ensures proper suit-following
- **Score Tracking** - Real-time scoring across multiple rounds
- **Win Condition** - First team to 500 points wins

### User Experience
- **🎮 Intuitive Interface** - Clean, modern design with smooth animations
- **📱 Fully Responsive** - Works seamlessly on desktop, tablet, and mobile
- **♿ Accessibility First** - WCAG compliant with keyboard navigation and screen reader support
- **❓ Built-in Help System** - Comprehensive game instructions and rules
- **🔔 Toast Notifications** - Real-time feedback for game events
- **⚡ Loading States** - Visual feedback during game transitions
- **🛡️ Error Handling** - Graceful error recovery with error boundaries

### Visual Polish
- **🎨 Refined Color Scheme** - Consistent design system with CSS variables
- **✨ Smooth Animations** - Card dealing, trick collection, and phase transitions
- **🏆 Victory Celebrations** - Animated winner announcements
- **📊 Game Statistics** - Detailed end-game stats and round information

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to play the game.

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
npm test
```

## 🎯 How to Play

### Game Setup
1. Enter names for all four players
2. Players are automatically assigned to teams (Team 1: Players 1 & 3, Team 2: Players 2 & 4)
3. Partners sit opposite each other

### Game Flow
1. **Dealing** - Each player receives 13 cards, 5 cards go to the nest
2. **Bidding** - Players bid in increments of 5 (minimum 40, maximum 120)
3. **Trump Selection** - High bidder takes nest, discards 5 cards, and names trump
4. **Playing Phase** - Players play 13 tricks following suit rules
5. **Scoring** - Teams count points, check if bidding team made their bid
6. **Next Round** - Continue until a team reaches 500 points

### Card Values
- **5s**: 5 points each
- **10s and 14s**: 10 points each
- **Rook Bird**: 20 points (lowest trump)
- **All other cards**: 0 points
- **Total available**: 180 points per round

### Special Rules
- **Following Suit**: Must play the same color as led card if you have it
- **Trump Power**: Trump cards beat all non-trump cards
- **Rook Bird**: Can be played anytime, acts as lowest trump
- **Last Trick Bonus**: Winner of last trick also wins the 5-card nest
- **Redeal**: If you have no point cards, you can call for a redeal during bidding

### Winning
- First team to reach **500 points** wins
- If both teams reach 500 in the same round, highest score wins

## 🎨 Design System

The game uses a consistent design system with CSS variables for easy theming:

- **Primary Colors**: Blue gradient for interactive elements
- **Card Colors**: Red, Yellow, Green, Black (matching Rook deck)
- **Feedback Colors**: Success (green), Error (red), Warning (yellow), Info (blue)
- **Shadows & Borders**: Consistent elevation system
- **Border Radius**: Standardized corner rounding

## ♿ Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: ARIA labels and live regions
- **Focus Indicators**: Clear visual focus states
- **Color Contrast**: WCAG AA compliant contrast ratios
- **Touch-Friendly**: Minimum 44px touch targets on mobile
- **Reduced Motion**: Respects prefers-reduced-motion settings

## 📱 Responsive Design

The game adapts to different screen sizes:
- **Desktop** (1024px+): Full layout with large cards
- **Tablet** (768px-1023px): Optimized layout with medium cards
- **Mobile** (< 768px): Compact layout with smaller cards
- **Touch Devices**: Enhanced touch targets and tap feedback

## 🛠️ Technology Stack

- **Framework**: React 18+
- **Language**: TypeScript 5+
- **Build Tool**: Vite
- **Styling**: CSS Modules
- **State Management**: React Context + useReducer
- **Testing**: Vitest
- **Package Manager**: npm

## 📁 Project Structure

```
src/
├── components/       # React components
│   ├── Card.tsx
│   ├── GameBoard.tsx
│   ├── BiddingPanel.tsx
│   ├── HelpModal.tsx
│   ├── Toast.tsx
│   └── ...
├── contexts/         # React Context & state management
│   ├── GameContext.tsx
│   └── gameReducer.ts
├── hooks/            # Custom React hooks
│   └── useToast.ts
├── types/            # TypeScript type definitions
│   ├── card.ts
│   ├── game.ts
│   └── ...
├── utils/            # Game logic & utilities
│   ├── gameEngine.ts
│   ├── ruleValidator.ts
│   └── scoreCalculator.ts
└── styles/           # Global styles
```

## 🧪 Testing

The project includes comprehensive test coverage:
- **Unit Tests**: Game logic, rules validation, scoring
- **Component Tests**: React component behavior
- **Integration Tests**: Complete game flows

Run tests with:
```bash
npm test
```

## 📝 Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build optimized production bundle
- `npm run preview` - Preview production build locally
- `npm test` - Run test suite
- `npm run lint` - Lint code with ESLint

## 🤝 Contributing

Contributions are welcome! Please ensure:
- All tests pass
- Code follows TypeScript strict mode
- Components are accessible
- Responsive design is maintained

## 📄 License

MIT License - feel free to use this project for learning or personal use.

## 🎮 Play Now!

Click the **?** button in the bottom-right corner while playing to access the in-game help system with complete rules and instructions.

Enjoy playing Rook! 🎉
