# Requirements Document

## Introduction

This document outlines the requirements for building a web-based implementation of the Rook card game. Rook is a trick-taking card game played by four players in two teams of two. The game uses a specialized deck with cards numbered 1-14 in four colors (red, yellow, green, black) plus a special Rook Bird card (57 cards total). Players bid for the right to name trump, then play tricks to capture point-scoring cards. The first team to reach 300 points wins.

The web application will provide a digital version of the game that allows four players to play together in real-time, handling all game rules, scoring, and turn management automatically.

## Requirements

### Requirement 1: Game Setup and Initialization

**User Story:** As a player, I want to start a new game with four players organized into two teams, so that we can begin playing Rook according to official rules.

#### Acceptance Criteria

1. WHEN a new game is created THEN the system SHALL initialize a deck with cards 1-14 in four colors plus the Rook Bird card (57 cards total)
2. WHEN the game starts THEN the system SHALL assign four players to two teams with partners sitting opposite each other
3. WHEN players join THEN the system SHALL display each player's position and team assignment
4. WHEN the game initializes THEN the system SHALL set the winning score to 300 points
5. WHEN the game begins THEN the system SHALL randomly select a dealer for the first round

### Requirement 2: Card Dealing

**User Story:** As a player, I want cards to be dealt automatically at the start of each round, so that the game can proceed without manual card distribution.

#### Acceptance Criteria

1. WHEN a round begins THEN the system SHALL shuffle the 57-card deck
2. WHEN dealing starts THEN the system SHALL deal one card at a time to each player in clockwise order
3. WHEN the first card is dealt to each player THEN the system SHALL place one card face-down in the nest
4. WHEN dealing continues THEN the system SHALL repeat the nest placement after each full rotation until the nest contains 5 cards
5. WHEN dealing is complete THEN each player SHALL have 13 cards and the nest SHALL have 5 cards
6. WHEN cards are dealt THEN each player SHALL only see their own hand

### Requirement 3: Bidding Phase

**User Story:** As a player, I want to participate in the bidding process to win the right to name trump and take the nest, so that I can influence the round's outcome.

#### Acceptance Criteria

1. WHEN the dealing is complete THEN the system SHALL start bidding with the player to the left of the dealer
2. WHEN it is a player's turn to bid THEN the system SHALL allow them to bid in increments of 5 points starting at minimum 70 points
3. WHEN a player bids THEN the system SHALL enforce that the bid is higher than the current high bid and not exceed 120 points
4. WHEN a player chooses not to bid THEN the system SHALL allow them to pass
5. WHEN a player passes THEN the system SHALL prevent them from bidding again in that round
6. WHEN bidding proceeds THEN the system SHALL move clockwise to the next player who hasn't passed
7. WHEN all players except one have passed THEN the system SHALL declare that player the high bidder
8. WHEN a player has no point cards in their hand THEN the system SHALL allow them to call for a redeal at any time during bidding
9. WHEN a redeal is called THEN the system SHALL restart the round with a new deal

### Requirement 4: High Bidder Actions

**User Story:** As the high bidder, I want to take the nest cards and discard five cards, then name the trump suit, so that I can optimize my hand for the round.

#### Acceptance Criteria

1. WHEN a player wins the bid THEN the system SHALL add the 5 nest cards to their hand
2. WHEN the nest is added THEN the system SHALL display all 18 cards to the high bidder
3. WHEN the high bidder has the nest THEN the system SHALL require them to select exactly 5 cards to discard
4. WHEN 5 cards are discarded THEN the system SHALL set those cards aside face-down
5. WHEN discarding is complete THEN the system SHALL prompt the high bidder to select a trump suit from the four colors
6. WHEN trump is named THEN the system SHALL display the trump suit to all players
7. WHEN trump is named THEN the system SHALL proceed to the play phase

### Requirement 5: Trick-Taking Gameplay

**User Story:** As a player, I want to play cards in tricks following standard Rook rules, so that my team can capture point-scoring cards.

#### Acceptance Criteria

1. WHEN the play phase begins THEN the system SHALL allow the player to the left of the dealer to lead the first trick
2. WHEN a player leads THEN the system SHALL allow them to play any card from their hand
3. WHEN a card is led THEN the system SHALL require subsequent players to follow suit if possible
4. WHEN a player cannot follow suit THEN the system SHALL allow them to play any card including trump or the Rook Bird card
5. WHEN all four players have played THEN the system SHALL determine the trick winner as the highest card of the led suit unless trump was played
6. WHEN trump is played THEN the system SHALL award the trick to the highest trump card
7. WHEN the trick is complete THEN the system SHALL add the cards to the winner's captured tricks pile
8. WHEN a trick is won THEN the system SHALL allow that player to lead the next trick
9. WHEN all 13 tricks are played THEN the system SHALL award the nest cards to the player who won the last trick

### Requirement 6: Rook Bird Card Special Rules

**User Story:** As a player, I want the Rook Bird card to function according to its special rules, so that it can be used strategically as the highest trump card.

#### Acceptance Criteria

1. WHEN a player holds the Rook Bird card THEN the system SHALL allow them to play it at any time regardless of suit requirements
2. WHEN the Rook Bird card is played THEN the system SHALL treat it as the highest trump card
3. WHEN the Rook Bird card is led THEN the system SHALL require all other players to play trump if they have it
4. WHEN trump is led and a player has the Rook Bird card but no other trump THEN the system SHALL require them to play the Rook Bird card
5. WHEN the Rook Bird card is in play THEN the system SHALL ensure it wins the trick unless a renege occurs

### Requirement 7: Renege Detection and Handling

**User Story:** As a player, I want the system to detect when someone fails to follow suit incorrectly, so that the game rules are enforced fairly.

#### Acceptance Criteria

1. WHEN a player plays a card THEN the system SHALL verify they followed suit if they had cards of the led suit
2. WHEN a renege is detected before the next trick THEN the system SHALL allow the player to correct their play
3. WHEN a renege is discovered after the next trick is taken THEN the system SHALL end the round immediately
4. WHEN a round ends due to renege THEN the system SHALL deduct points equal to the bid from the offending team
5. WHEN a renege penalty is applied THEN the system SHALL award the opposing team points for all counters they captured before the error

### Requirement 8: Scoring System

**User Story:** As a player, I want the system to automatically calculate and track scores, so that we can focus on playing without manual score keeping.

#### Acceptance Criteria

1. WHEN a round ends THEN the system SHALL count point cards (counters) captured by each team
2. WHEN counting points THEN the system SHALL award 5 points for each 5 card, 10 points for each 10 and 14 card, and 20 points for the Rook Bird card
3. WHEN the bidding team's points are counted THEN the system SHALL check if they met or exceeded their bid
4. WHEN the bidding team makes their bid THEN the system SHALL add their captured points to their total score
5. WHEN the bidding team fails their bid THEN the system SHALL subtract the bid amount from their total score and award them zero points for the round
6. WHEN the non-bidding team's points are counted THEN the system SHALL always add their captured points to their total score
7. WHEN scores are updated THEN the system SHALL display both teams' current totals
8. WHEN a team reaches 300 or more points THEN the system SHALL check if the round is complete
9. WHEN both teams have 300+ points THEN the system SHALL declare the team with the higher score as the winner
10. WHEN only one team has 300+ points THEN the system SHALL declare that team the winner

### Requirement 9: User Interface and Card Display

**User Story:** As a player, I want a clear and intuitive interface that shows my cards, the current game state, and other players' actions, so that I can make informed decisions.

#### Acceptance Criteria

1. WHEN viewing the game THEN the system SHALL display the player's hand with all cards clearly visible
2. WHEN viewing the game THEN the system SHALL show the current trick in the center with cards played by each player
3. WHEN viewing the game THEN the system SHALL display the current trump suit prominently
4. WHEN viewing the game THEN the system SHALL show each team's current score
5. WHEN viewing the game THEN the system SHALL indicate whose turn it is to play
6. WHEN viewing the game THEN the system SHALL display the current high bid and bidder during the bidding phase
7. WHEN a player plays a card THEN the system SHALL animate the card moving to the center
8. WHEN a trick is won THEN the system SHALL briefly highlight the winning card before clearing the trick
9. WHEN it is the player's turn THEN the system SHALL highlight playable cards and disable unplayable cards

### Requirement 10: Game Flow and Round Management

**User Story:** As a player, I want the game to automatically progress through rounds until a winner is determined, so that we can play a complete game seamlessly.

#### Acceptance Criteria

1. WHEN a round ends THEN the system SHALL display the round results including points captured by each team
2. WHEN round results are shown THEN the system SHALL update the cumulative scores
3. WHEN no team has won THEN the system SHALL allow players to start a new round
4. WHEN a new round starts THEN the system SHALL rotate the dealer position clockwise
5. WHEN a new round starts THEN the system SHALL reset all round-specific state (hands, tricks, bid, trump)
6. WHEN a team wins THEN the system SHALL display a victory message with the final scores
7. WHEN the game ends THEN the system SHALL offer options to start a new game or return to the main menu
