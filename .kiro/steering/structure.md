# Project Structure

## Recommended Organization

```
/src
  /components     # Reusable React components
  /pages          # Page-level components
  /hooks          # Custom React hooks
  /utils          # Utility functions
  /types          # TypeScript type definitions
  /assets         # Images, fonts, static files
  /styles         # Global styles and CSS modules
  App.tsx         # Root component
  main.tsx        # Application entry point
/public           # Static assets served directly
```

## File Naming Conventions

- Components: PascalCase (e.g., `GameBoard.tsx`)
- Hooks: camelCase with 'use' prefix (e.g., `useGameState.ts`)
- Utils: camelCase (e.g., `formatScore.ts`)
- Types: PascalCase (e.g., `GameTypes.ts`)

## Component Structure

- One component per file
- Co-locate component-specific styles
- Export components as named exports when possible
- Keep component files under 200 lines
