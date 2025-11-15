import type { GameState, Card, PlayerId, Trick, CardColor } from '../types';
import { RuleValidator } from './ruleValidator';

/**
 * Gets the set of playable card IDs for a specific player
 * 
 * Requirements:
 * - Returns all cards that can legally be played according to Rook rules
 * - Considers lead card and trump color
 * - Enforces "must follow suit" rule
 * 
 * @param state - The current game state
 * @param playerId - The ID of the player whose playable cards to determine
 * @returns Set of card IDs that can be played
 */
export function getPlayableCards(state: GameState, playerId: PlayerId): Set<string> {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return new Set();
  }

  const { hand } = player;
  const { currentTrick, trumpColor } = state;

  // Determine the lead card (first card played in the trick)
  let leadCard: Card | null = null;
  if (currentTrick && currentTrick.cards.size > 0) {
    // Get the first card played (by the lead player)
    leadCard = currentTrick.cards.get(currentTrick.leadPlayerId) || null;
  }

  // Filter hand to only playable cards
  const playableCardIds = new Set<string>();
  
  for (const card of hand) {
    if (RuleValidator.canPlayCard(card, hand, leadCard, trumpColor)) {
      playableCardIds.add(card.id);
    }
  }

  return playableCardIds;
}

/**
 * Determines the winner of a completed trick
 * 
 * Requirements (5.5, 5.6):
 * - Highest card of led suit wins unless trump was played
 * - When trump is played, highest trump card wins
 * - Rook Bird is the highest trump card (Requirement 6.2)
 * 
 * @param trick - The completed trick with all 4 cards played
 * @param trumpColor - The current trump color
 * @returns The player ID of the trick winner
 */
export function determineTrickWinner(trick: Trick, trumpColor: CardColor | null): PlayerId {
  if (trick.cards.size !== 4) {
    throw new Error('Trick must have exactly 4 cards to determine winner');
  }

  const leadCard = trick.cards.get(trick.leadPlayerId);
  if (!leadCard) {
    throw new Error('Lead card not found in trick');
  }

  let winningPlayerId = trick.leadPlayerId;
  let winningCard = leadCard;

  // Iterate through all cards in the trick to find the winner
  for (const [playerId, card] of trick.cards.entries()) {
    if (playerId === trick.leadPlayerId) {
      continue; // Skip lead card, already set as initial winner
    }

    // Check if this card beats the current winning card
    if (cardBeatsCard(card, winningCard, leadCard, trumpColor)) {
      winningPlayerId = playerId;
      winningCard = card;
    }
  }

  return winningPlayerId;
}

/**
 * Helper function to determine if one card beats another
 * 
 * @param card - The card to check
 * @param currentWinner - The current winning card
 * @param leadCard - The card that was led
 * @param trumpColor - The current trump color
 * @returns true if card beats currentWinner
 */
function cardBeatsCard(
  card: Card,
  currentWinner: Card,
  leadCard: Card,
  trumpColor: CardColor | null
): boolean {
  // Rook Bird is the highest trump card (Requirement 6.2)
  if (card.color === 'rook') {
    // Rook Bird beats everything except another Rook Bird (impossible)
    return currentWinner.color !== 'rook';
  }

  // If current winner is Rook Bird, nothing else can beat it
  if (currentWinner.color === 'rook') {
    return false;
  }

  // Check if either card is trump
  const cardIsTrump = trumpColor !== null && card.color === trumpColor;
  const winnerIsTrump = trumpColor !== null && currentWinner.color === trumpColor;

  // Trump beats non-trump
  if (cardIsTrump && !winnerIsTrump) {
    return true;
  }

  // Non-trump cannot beat trump
  if (!cardIsTrump && winnerIsTrump) {
    return false;
  }

  // Both are trump - higher value wins
  if (cardIsTrump && winnerIsTrump) {
    return getCardNumericValue(card) > getCardNumericValue(currentWinner);
  }

  // Neither is trump - must be same suit as lead to compete
  const leadSuit = leadCard.color === 'rook' ? trumpColor : leadCard.color;
  const cardMatchesLead = card.color === leadSuit;
  const winnerMatchesLead = currentWinner.color === leadSuit;

  // Card of led suit beats card not of led suit
  if (cardMatchesLead && !winnerMatchesLead) {
    return true;
  }

  // Card not of led suit cannot beat card of led suit
  if (!cardMatchesLead && winnerMatchesLead) {
    return false;
  }

  // Both match lead suit - higher value wins
  if (cardMatchesLead && winnerMatchesLead) {
    return getCardNumericValue(card) > getCardNumericValue(currentWinner);
  }

  // Neither matches lead suit - current winner stays
  return false;
}

/**
 * Helper function to get numeric value of a card for comparison
 * 
 * @param card - The card to get value for
 * @returns Numeric value (1-14)
 */
function getCardNumericValue(card: Card): number {
  if (card.value === 'rook') {
    return 15; // Rook Bird is highest
  }
  return card.value;
}

/**
 * Deals cards according to Rook rules:
 * - One card at a time to each player in clockwise order
 * - After each full rotation, one card goes to the nest
 * - Continue until nest has 5 cards and each player has 13 cards
 * - Total: 4 players × 13 cards + 5 nest cards = 57 cards
 */
export function dealCards(state: GameState): GameState {
  const { deck, players, dealerId } = state;
  
  // Find dealer index to determine dealing order
  const dealerIndex = players.findIndex(p => p.id === dealerId);
  if (dealerIndex === -1) {
    throw new Error('Dealer not found');
  }

  // Create dealing order starting with player to left of dealer
  const dealingOrder: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const playerIndex = (dealerIndex + i) % 4;
    dealingOrder.push(players[playerIndex].id);
  }

  // Initialize hands and nest
  const hands: Map<string, Card[]> = new Map();
  players.forEach(player => hands.set(player.id, []));
  const nest: Card[] = [];

  let deckIndex = 0;

  // Deal cards: one to each player, then one to nest, repeat
  while (nest.length < 5) {
    // Deal one card to each player in order
    for (const playerId of dealingOrder) {
      if (deckIndex >= deck.length) break;
      hands.get(playerId)!.push(deck[deckIndex]);
      deckIndex++;
    }

    // Add one card to nest after each full rotation
    if (deckIndex < deck.length && nest.length < 5) {
      nest.push(deck[deckIndex]);
      deckIndex++;
    }
  }

  // Continue dealing remaining cards to players until each has 13
  while (deckIndex < deck.length) {
    for (const playerId of dealingOrder) {
      if (deckIndex >= deck.length) break;
      const hand = hands.get(playerId)!;
      if (hand.length < 13) {
        hand.push(deck[deckIndex]);
        deckIndex++;
      }
    }
  }

  // Update players with their dealt hands
  const updatedPlayers = players.map(player => ({
    ...player,
    hand: hands.get(player.id) || [],
  }));

  return {
    ...state,
    players: updatedPlayers,
    nest,
    phase: 'bidding',
    deck: [], // Deck is now empty after dealing
  };
}
