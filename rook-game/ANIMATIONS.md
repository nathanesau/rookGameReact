# Rook Game Animations

This document describes all the animations and transitions implemented in the Rook card game.

## Card Dealing Animations

### PlayerHand Component
- **Card dealing animation**: Cards animate in from off-screen with a rotation effect
  - Each card has a staggered delay (0.05s per card)
  - Cards fly in from top with rotation and scale effects
  - Uses cubic-bezier easing for smooth, bouncy entrance

### Opponent Hands (GameTable)
- **Card back flip animation**: Opponent card backs flip in with a 3D rotation effect
  - Cards appear with rotateY transformation
  - Staggered timing creates a dealing sequence effect

## Card Play Animations

### TrickArea Component
- **Card play animation**: Cards animate into the trick area with dramatic entrance
  - Cards start small and rotated, then bounce into position
  - 3D rotation effect (180deg to 0deg)
  - Scale animation (0.3 to 1.1 to 1.0) for bounce effect
  - Duration: 0.5s with cubic-bezier easing

### Winning Card Highlight
- **Winning pulse animation**: The winning card glows and pulses
  - Gold drop-shadow effect
  - Scale animation (1.1 to 1.2)
  - Brightness increase on pulse
  - Continuous animation until trick is collected

## Trick Collection Animation

### TrickArea Component
- **Collection animation**: Cards animate away when trick is won
  - Triggered automatically 1 second after trick completion
  - Cards shrink, rotate, and fly upward
  - Opacity fades to 0
  - Duration: 0.6s with bounce easing
  - Uses state management to show animation before clearing trick

## Card Sorting Animation

### PlayerHand Component
- **Smooth card repositioning**: Cards smoothly transition when hand is sorted
  - All properties (position, rotation) animate with 0.4s duration
  - Uses cubic-bezier easing for natural movement
  - Cards maintain fan layout during transitions

## Card Interaction Animations

### Card Component
- **Hover animation**: Cards lift and scale on hover
  - translateY(-8px) and scale(1.02)
  - Enhanced shadow on hover
  - 0.3s transition with cubic-bezier easing

- **Selected state animation**: Selected cards pulse with glow effect
  - Continuous pulse animation (1.5s)
  - Blue glow that intensifies and fades
  - Scale and shadow changes
  - Border glow animation

## Phase Transition Animations

### GameBoard Component
- **Dealing phase**: Pulsing text animation
  - Text fades and scales continuously
  - Indicates active dealing process

- **Bidding overlay**: Slides up and fades in
  - Starts below final position with reduced opacity
  - 0.4s cubic-bezier animation

- **Nest selection**: Fade and scale entrance
  - Container fades in with scale effect
  - Cards appear with staggered rotation animation
  - Each card has individual delay (0.05s increments)

- **Trump selection**: Zoom in with rotation
  - Panel rotates slightly while scaling up
  - Color buttons appear with staggered delays
  - Selected button has continuous glow animation

### GameTable
- **Table appearance**: Smooth fade-in
  - 0.6s fade from transparent to opaque
  - Player info cards slide in with staggered delays

## UI Component Animations

### BiddingPanel
- **Panel entrance**: Slides up with scale
  - Starts below and smaller
  - Bouncy cubic-bezier easing
  - 0.4s duration

- **Bid amount change**: Pulse effect on bid display
  - Background color flash
  - Scale pulse when bid changes
  - 0.3s animation

### NestDisplay
- **Panel entrance**: Slides from top
  - Starts above with reduced scale
  - 0.5s bouncy animation

- **Card grid**: Staggered card appearances
  - Each card rotates and scales in
  - Up to 18 cards with individual delays
  - Creates cascading effect

### TrumpSelector
- **Panel entrance**: Zoom with rotation
  - Starts smaller and rotated
  - 0.5s bouncy animation

- **Color buttons**: Staggered appearances
  - Each button rotates and scales in
  - 0.1s delay between buttons
  - Selected button has continuous glow

### ScoreBoard
- **Score updates**: Number animation
  - Scale and color change on update
  - Yellow flash effect
  - 0.5s bouncy animation

- **Winner highlight**: Continuous pulse
  - Gold glow that intensifies
  - 2s infinite animation

### Round End / Game End
- **Panel entrance**: Scale and fade
  - Starts smaller with reduced opacity
  - 0.3-0.5s animation

- **Victory title**: Bounce animation
  - Continuous up/down movement
  - 1s infinite animation

## Animation Timing

All animations use carefully tuned timing:
- **Quick interactions**: 0.2-0.3s (hover, clicks)
- **Card movements**: 0.4-0.5s (dealing, playing)
- **Phase transitions**: 0.4-0.6s (screen changes)
- **Continuous effects**: 1.5-2s (pulses, glows)

## Easing Functions

- **cubic-bezier(0.4, 0, 0.2, 1)**: Smooth, natural movement
- **cubic-bezier(0.34, 1.56, 0.64, 1)**: Bouncy, playful effect
- **ease-in-out**: Symmetrical acceleration/deceleration
- **ease-out**: Quick start, slow finish

## Performance Considerations

- All animations use CSS transforms and opacity for GPU acceleration
- No layout-triggering properties (width, height, top, left) are animated
- Animations use `will-change` implicitly through transforms
- Staggered animations prevent too many simultaneous effects
- Animation durations are kept short (< 1s) for responsiveness
