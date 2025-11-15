# Accessibility Features

This document outlines the accessibility features implemented in the Rook Game application to ensure it's usable by all players, including those using assistive technologies.

## Overview

The Rook Game has been designed with accessibility in mind, following WCAG 2.1 guidelines to provide an inclusive gaming experience.

## Implemented Features

### 1. ARIA Labels and Roles

All interactive elements have appropriate ARIA labels and roles:

#### Card Component
- **Role**: `button` for interactive cards
- **ARIA Labels**: Descriptive labels including card color, value, and point value
  - Example: "red 5, worth 5 points" or "Rook Bird card, worth 20 points"
- **ARIA States**: 
  - `aria-disabled` for unplayable cards
  - `aria-pressed` for selected cards

#### Game Regions
- **BiddingPanel**: `role="region"` with `aria-label="Bidding controls"`
- **TrickArea**: `role="region"` with `aria-label="Current trick"` and `aria-live="polite"`
- **ScoreBoard**: `role="region"` with `aria-label="Score board"`
- **GameInfo**: `role="region"` with `aria-label="Game status information"`
- **PlayerHand**: `role="region"` with `aria-label="Your hand"`

#### Live Regions
Dynamic content updates are announced to screen readers using `aria-live`:
- **Polite announcements**: Game phase changes, turn updates, bid changes
- **Assertive announcements**: Error messages in forms
- **Status updates**: Current bid, trump suit, scores

#### Form Controls
- All form inputs have associated labels
- Required fields marked with `aria-required="true"`
- Error messages use `role="alert"` with `aria-live="assertive"`

### 2. Keyboard Navigation

Full keyboard support has been implemented:

#### Card Selection
- **Tab**: Navigate between cards
- **Enter/Space**: Select or play a card
- Cards are focusable with `tabIndex={0}` when playable
- Disabled cards have `tabIndex={-1}` to skip in tab order

#### Buttons and Controls
- All buttons respond to both click and keyboard events
- **Enter/Space**: Activate buttons
- Proper focus management throughout the application

#### Trump Selection
- Radio button group behavior for color selection
- Arrow keys can be used to navigate between options
- `role="radio"` with `aria-checked` states

### 3. Focus Indicators

Clear, visible focus indicators for all interactive elements:

#### Visual Focus Styles
- **Cards**: 3px solid blue outline with glow effect
  ```css
  outline: 3px solid #4a90e2;
  outline-offset: 3px;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.3);
  ```

- **Buttons**: 3px outline matching button color with shadow
- **Form Inputs**: Blue outline with shadow on focus
- **Trump Selector**: Gold outline for selected options

#### Focus-Visible Support
- Uses `:focus-visible` pseudo-class for keyboard-only focus indicators
- Mouse clicks don't show focus rings, but keyboard navigation does

### 4. Color Contrast

All text and interactive elements meet WCAG AA standards:

#### Text Contrast Ratios
- **Body text**: Dark text on light backgrounds (>7:1 ratio)
- **Button text**: White text on colored backgrounds (>4.5:1 ratio)
- **Card colors**: High contrast borders and text
  - Red: #e74c3c
  - Yellow: #f39c12
  - Green: #27ae60
  - Black: #2c3e50

#### Visual Indicators
- Selected cards have multiple visual cues (border, shadow, position)
- Winning cards highlighted with distinct styling
- Disabled cards use both opacity and grayscale filter

### 5. Screen Reader Support

Comprehensive screen reader announcements:

#### Game State Announcements
- Current phase (bidding, playing, etc.)
- Whose turn it is
- Trump suit selection
- Score updates
- Round completion

#### Card Descriptions
- Full card information read aloud
- Point values announced
- Playability status indicated

#### Action Feedback
- Bid placement confirmations
- Card play announcements
- Error messages for invalid actions

### 6. Semantic HTML

Proper HTML structure throughout:

- **Headings**: Logical hierarchy (h1, h2, h3)
- **Regions**: Main content areas properly marked
- **Articles**: Individual score cards and trick cards
- **Forms**: Proper form structure with labels
- **Buttons**: Semantic button elements (not divs)

### 7. Touch and Mobile Accessibility

Optimized for touch devices:

#### Touch Targets
- Minimum 44x44px touch targets on mobile
- Increased padding on buttons for touch devices
- Cards sized appropriately for finger taps

#### Responsive Design
- Layout adapts to screen size
- Text remains readable at all sizes
- Controls remain accessible on small screens

## Testing Recommendations

### Manual Testing
1. **Keyboard Navigation**: Tab through all interactive elements
2. **Screen Reader**: Test with VoiceOver (Mac), NVDA (Windows), or JAWS
3. **Color Blindness**: Use browser extensions to simulate color blindness
4. **Zoom**: Test at 200% zoom level
5. **Mobile**: Test on actual touch devices

### Automated Testing Tools
- **axe DevTools**: Browser extension for accessibility auditing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Chrome DevTools accessibility audit

## Known Limitations

1. **Animations**: Some animations may be distracting for users with motion sensitivity
   - Future: Add `prefers-reduced-motion` support
2. **Complex Game State**: Card game rules are inherently complex
   - Comprehensive ARIA labels help but may be verbose
3. **Visual-Only Cues**: Some game elements rely on visual position
   - Screen reader descriptions compensate for this

## Future Improvements

1. **Reduced Motion**: Respect `prefers-reduced-motion` preference
2. **High Contrast Mode**: Support for Windows High Contrast mode
3. **Customizable Colors**: Allow users to customize card colors
4. **Sound Effects**: Add audio cues for game events (with mute option)
5. **Tutorial Mode**: Interactive tutorial with accessibility features
6. **Keyboard Shortcuts**: Add keyboard shortcuts for common actions

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)

## Compliance

This application aims to meet WCAG 2.1 Level AA standards for accessibility. Regular audits and user testing help maintain and improve accessibility over time.
