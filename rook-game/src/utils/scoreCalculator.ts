import type { Card, Trick, PlayerId } from '../types';

/**
 * ScoreCalculator handles all scoring logic for the Rook game
 * 
 * Requirements:
 * - 8.1: Count point cards (counters) captured by each team
 * - 8.2: Award 5 points for each 5 card, 10 points for each 10 and 14 card, 20 points for Rook Bird
 * - 8.3: Check if bidding team met or exceeded their bid
 * - 8.4: Add captured points to bidding team's total if they made their bid
 * - 8.5: Subtract bid amount from bidding team if they failed, award zero points for the round
 * - 8.6: Always add non-bidding team's captured points to their total
 */
export class ScoreCalculator {
  /**
   * Gets the point value for a card
   * 
   * Requirement 8.2:
   * - 5 cards = 5 points
   * - 10 and 14 cards = 10 points
   * - Rook Bird = 20 points
   * - All other cards = 0 points
   * 
   * @param card - The card to get points for
   * @returns Point value of the card
   */
  static getCardPoints(card: Card): number {
    if (card.value === 'rook') return 20;
    if (card.value === 5) return 5;
    if (card.value === 10 || card.value === 14) return 10;
    return 0;
  }

  /**
   * Calculates the total points in a collection of cards
   * 
   * Requirement 8.1: Count point cards (counters) captured
   * 
   * @param cards - Array of cards to calculate points for
   * @returns Total point value
   */
  static calculateTrickPoints(cards: Card[]): number {
    return cards.reduce((total, card) => total + ScoreCalculator.getCardPoints(card), 0);
  }

  /**
   * Calculates the total score for a team based on their captured tricks
   * 
   * Requirement 8.1: Count point cards captured by each team
   * 
   * @param tricks - All completed tricks from the round
   * @param playerIds - Array of player IDs belonging to this team
   * @param nest - The nest cards (awarded to last trick winner)
   * @param lastTrickWinnerId - ID of the player who won the last trick
   * @returns Total points captured by the team
   */
  static calculateTeamScore(
    tricks: Trick[],
    playerIds: PlayerId[],
    nest: Card[],
    lastTrickWinnerId: PlayerId | null
  ): number {
    let totalPoints = 0;

    // Sum points from all tricks won by team members
    for (const trick of tricks) {
      if (trick.winnerId && playerIds.includes(trick.winnerId)) {
        const trickCards = Array.from(trick.cards.values());
        totalPoints += ScoreCalculator.calculateTrickPoints(trickCards);
      }
    }

    // Add nest points if a team member won the last trick (Requirement 5.9)
    if (lastTrickWinnerId && playerIds.includes(lastTrickWinnerId)) {
      totalPoints += ScoreCalculator.calculateTrickPoints(nest);
    }

    return totalPoints;
  }

  /**
   * Applies the bid result to determine the final score for the bidding team
   * 
   * Requirements:
   * - 8.3: Check if bidding team met or exceeded their bid
   * - 8.4: Add captured points if they made their bid
   * - 8.5: Subtract bid amount if they failed, award zero points for the round
   * 
   * @param capturedPoints - Points captured by the bidding team
   * @param bidAmount - The amount that was bid
   * @returns Final score adjustment for the bidding team
   */
  static applyBidResult(capturedPoints: number, bidAmount: number): number {
    const madeBid = capturedPoints >= bidAmount;

    if (madeBid) {
      // Requirement 8.4: Add captured points if bid was made
      return capturedPoints;
    } else {
      // Requirement 8.5: Subtract bid amount if bid was failed
      return -bidAmount;
    }
  }
}
