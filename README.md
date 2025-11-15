# Rook Game

A digital implementation of the classic Rook card game built with React and TypeScript.

## Features

- 4-player team-based gameplay
- Complete bidding and trump selection mechanics
- Interactive card play with drag-and-drop
- Renege detection and penalty system
- Score tracking across multiple rounds
- Responsive design with accessibility support

## File Structure

The React application is located in the `rook-game/` subdirectory rather than the root directory. This structure provides several benefits:

- **Separation of concerns**: Keeps the React app isolated from repository-level configuration files
- **Multi-project support**: Allows for potential future additions (mobile app, server, documentation sites)
- **Clean root directory**: Repository metadata (.git, README, workspace files) remain at the top level
- **Deployment flexibility**: The React app can be deployed independently without repository artifacts

```
RookGame/
├── README.md                 # Project overview and documentation
├── rook-game/               # React application directory
│   ├── src/                 # Source code
│   ├── public/              # Static assets
│   ├── package.json         # App dependencies
│   └── ...                  # React app files
└── ...                      # Repository configuration
```

## Getting Started

```bash
cd rook-game
npm install
npm run dev
```

## Game Rules

Rook is played with 4 players in 2 teams. Players bid for the right to choose trump and play to reach the target score first.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Lint code
