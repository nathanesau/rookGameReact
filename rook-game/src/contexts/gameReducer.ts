import type { GameState, GameAction, Player, Trick, Card, TeamId } from '../types';
import { generateDeck, shuffleDeck } from '../utils/deckUtils';
import { dealCards, determineTrickWinner } from '../utils/gameEngine';
import { RuleValidator } from '../utils/ruleValidator';
import { ScoreCalculator } from '../utils/scoreCalculator';

export const createInitialState = (): GameState => {
  return {
    phase: 'setup',
    players: [],
    deck: [],
    nest: [],
    dealerId: '',
    currentPlayerId: '',
    currentBid: null,
    passedPlayers: new Set(),
    highBidder: null,
    trumpColor: null,
    currentTrick: null,
    completedTricks: [],
    renegeInfo: null,
    scores: new Map([
      ['team1', 0],
      ['team2', 0],
    ]),
    roundScores: new Map([
      ['team1', 0],
      ['team2', 0],
    ]),
  };
};

const initializeGame = (state: GameState, playerNames: string[]): GameState => {
  // Create players with alternating teams (partners sit opposite)
  const players: Player[] = playerNames.map((name, index) => ({
    id: `player-${index}`,
    name,
    teamId: index % 2 === 0 ? 'team1' : 'team2',
    position: index as 0 | 1 | 2 | 3,
    hand: [],
    capturedTricks: [],
  }));

  // Randomly select dealer
  const dealerIndex = Math.floor(Math.random() * 4);
  const dealerId = players[dealerIndex].id;

  // Generate and shuffle deck
  const deck = shuffleDeck(generateDeck());

  return {
    ...state,
    phase: 'dealing',
    players,
    deck,
    dealerId,
    currentPlayerId: players[(dealerIndex + 1) % 4].id, // Player to left of dealer
    nest: [],
    currentBid: null,
    passedPlayers: new Set(),
    highBidder: null,
    trumpColor: null,
    currentTrick: null,
    completedTricks: [],
    renegeInfo: null,
    scores: new Map([
      ['team1', 0],
      ['team2', 0],
    ]),
    roundScores: new Map([
      ['team1', 0],
      ['team2', 0],
    ]),
  };
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'INITIALIZE_GAME':
      return initializeGame(state, action.payload.playerNames);

    case 'START_ROUND': {
      // Requirements 10.3, 10.4, 10.5
      
      // Rotate dealer position clockwise (Requirement 10.4)
      const currentDealerIndex = state.players.findIndex(p => p.id === state.dealerId);
      const newDealerIndex = (currentDealerIndex + 1) % 4;
      const newDealerId = state.players[newDealerIndex].id;
      
      // Player to left of dealer starts bidding
      const firstBidderIndex = (newDealerIndex + 1) % 4;
      const firstBidderId = state.players[firstBidderIndex].id;
      
      // Generate and shuffle new deck
      const deck = shuffleDeck(generateDeck());
      
      // Reset round-specific state (Requirement 10.5)
      const resetPlayers = state.players.map(player => ({
        ...player,
        hand: [],
        capturedTricks: [],
      }));
      
      return {
        ...state,
        phase: 'dealing',
        players: resetPlayers,
        deck,
        nest: [],
        dealerId: newDealerId,
        currentPlayerId: firstBidderId,
        currentBid: null,
        passedPlayers: new Set(),
        highBidder: null,
        trumpColor: null,
        currentTrick: null,
        completedTricks: [],
        renegeInfo: null,
        roundScores: new Map([
          ['team1', 0],
          ['team2', 0],
        ]),
        // Maintain cumulative scores across rounds (Requirement 10.3)
        // scores: state.scores (unchanged)
      };
    }

    case 'DEAL_CARDS':
      return dealCards(state);

    case 'PLACE_BID': {
      const { playerId, amount } = action.payload;

      // Validate it's the current player's turn
      if (playerId !== state.currentPlayerId) {
        console.error('Not this player\'s turn to bid');
        return state;
      }

      // Validate player hasn't already passed
      if (state.passedPlayers.has(playerId)) {
        console.error('Player has already passed and cannot bid');
        return state;
      }

      // Validate the bid amount
      const currentBidAmount = state.currentBid?.amount ?? null;
      if (!RuleValidator.isValidBid(amount, currentBidAmount)) {
        console.error('Invalid bid amount');
        return state;
      }

      // Update current bid
      const newBid = { playerId, amount };

      // Move to next player who hasn't passed
      const currentPlayerIndex = state.players.findIndex(p => p.id === playerId);
      let nextPlayerIndex = (currentPlayerIndex + 1) % 4;
      let nextPlayerId = state.players[nextPlayerIndex].id;

      // Find next player who hasn't passed
      let attempts = 0;
      while (state.passedPlayers.has(nextPlayerId) && attempts < 4) {
        nextPlayerIndex = (nextPlayerIndex + 1) % 4;
        nextPlayerId = state.players[nextPlayerIndex].id;
        attempts++;
      }

      // Check if all other players have passed (this player wins the bid)
      const activePlayers = state.players.filter(p => !state.passedPlayers.has(p.id));
      if (activePlayers.length === 1 && activePlayers[0].id === playerId) {
        // This player is the high bidder - add nest cards to their hand
        const highBidderPlayer = state.players.find(p => p.id === playerId);
        if (!highBidderPlayer) {
          console.error('High bidder not found');
          return state;
        }

        const updatedPlayers = state.players.map(player =>
          player.id === playerId
            ? { ...player, hand: [...player.hand, ...state.nest] }
            : player
        );

        return {
          ...state,
          currentBid: newBid,
          highBidder: playerId,
          currentPlayerId: playerId,
          phase: 'nestSelection',
          players: updatedPlayers,
        };
      }

      return {
        ...state,
        currentBid: newBid,
        currentPlayerId: nextPlayerId,
      };
    }

    case 'PASS_BID': {
      const { playerId } = action.payload;

      // Validate it's the current player's turn
      if (playerId !== state.currentPlayerId) {
        console.error('Not this player\'s turn to pass');
        return state;
      }

      // Validate player hasn't already passed
      if (state.passedPlayers.has(playerId)) {
        console.error('Player has already passed');
        return state;
      }

      // Add player to passed set
      const newPassedPlayers = new Set(state.passedPlayers);
      newPassedPlayers.add(playerId);

      // Find next player who hasn't passed
      const currentPlayerIndex = state.players.findIndex(p => p.id === playerId);
      let nextPlayerIndex = (currentPlayerIndex + 1) % 4;
      let nextPlayerId = state.players[nextPlayerIndex].id;

      let attempts = 0;
      while (newPassedPlayers.has(nextPlayerId) && attempts < 4) {
        nextPlayerIndex = (nextPlayerIndex + 1) % 4;
        nextPlayerId = state.players[nextPlayerIndex].id;
        attempts++;
      }

      // Check if only one player remains (they win the bid)
      const activePlayers = state.players.filter(p => !newPassedPlayers.has(p.id));
      if (activePlayers.length === 1) {
        const highBidder = activePlayers[0].id;

        // If no one has bid yet, the last player must bid at least 70
        if (!state.currentBid) {
          return {
            ...state,
            passedPlayers: newPassedPlayers,
            currentPlayerId: highBidder,
            // Stay in bidding phase - last player must make a bid
          };
        }

        // Someone has bid, so the last remaining player wins - add nest cards to their hand
        const highBidderPlayer = state.players.find(p => p.id === highBidder);
        if (!highBidderPlayer) {
          console.error('High bidder not found');
          return state;
        }

        const updatedPlayers = state.players.map(player =>
          player.id === highBidder
            ? { ...player, hand: [...player.hand, ...state.nest] }
            : player
        );

        return {
          ...state,
          passedPlayers: newPassedPlayers,
          highBidder,
          currentPlayerId: highBidder,
          phase: 'nestSelection',
          players: updatedPlayers,
        };
      }

      return {
        ...state,
        passedPlayers: newPassedPlayers,
        currentPlayerId: nextPlayerId,
      };
    }

    case 'CALL_REDEAL': {
      // Requirements 3.8, 3.9: Allow redeal if player has no point cards
      const { playerId } = action.payload;

      // Validate we're in the bidding phase
      if (state.phase !== 'bidding') {
        console.error('Can only call redeal during bidding phase');
        return state;
      }

      // Find the player
      const player = state.players.find(p => p.id === playerId);
      if (!player) {
        console.error('Player not found');
        return state;
      }

      // Check if player has no point cards (Requirement 3.8)
      const hasPoints = player.hand.some(card => card.points > 0);
      if (hasPoints) {
        console.error('Cannot call redeal - player has point cards');
        return state;
      }

      // Reset the round with a new deal (Requirement 3.9)
      // Generate and shuffle new deck
      const deck = shuffleDeck(generateDeck());
      
      // Reset players' hands and captured tricks
      const resetPlayers = state.players.map(p => ({
        ...p,
        hand: [],
        capturedTricks: [],
      }));
      
      // Keep the same dealer and starting bidder
      return {
        ...state,
        phase: 'dealing',
        players: resetPlayers,
        deck,
        nest: [],
        currentBid: null,
        passedPlayers: new Set(),
        highBidder: null,
        trumpColor: null,
        currentTrick: null,
        completedTricks: [],
        renegeInfo: null,
      };
    }

    case 'SELECT_NEST_CARDS': {
      const { cards } = action.payload;

      // Validate that exactly 5 cards are being discarded
      if (cards.length !== 5) {
        console.error('Must discard exactly 5 cards');
        return state;
      }

      // Validate that it's the high bidder's turn
      if (state.currentPlayerId !== state.highBidder) {
        console.error('Only the high bidder can discard nest cards');
        return state;
      }

      // Find the high bidder player
      const highBidderPlayer = state.players.find(p => p.id === state.highBidder);
      if (!highBidderPlayer) {
        console.error('High bidder not found');
        return state;
      }

      // Remove discarded cards from player's hand
      const cardIdsToDiscard = new Set(cards.map(c => c.id));
      const updatedHand = highBidderPlayer.hand.filter(card => !cardIdsToDiscard.has(card.id));

      // Update the player's hand
      const updatedPlayers = state.players.map(player =>
        player.id === state.highBidder
          ? { ...player, hand: updatedHand }
          : player
      );

      // Store discarded cards in nest and move to trump selection
      return {
        ...state,
        players: updatedPlayers,
        nest: cards,
        phase: 'trumpSelection',
      };
    }

    case 'SELECT_TRUMP': {
      const { color } = action.payload;

      // Validate that it's the high bidder's turn
      if (state.currentPlayerId !== state.highBidder) {
        console.error('Only the high bidder can select trump');
        return state;
      }

      // Validate that nest cards have been discarded (nest should have 5 cards)
      if (state.nest.length !== 5) {
        console.error('Must discard nest cards before selecting trump');
        return state;
      }

      // Find the dealer to determine who leads first trick
      const dealerIndex = state.players.findIndex(p => p.id === state.dealerId);
      const firstLeadIndex = (dealerIndex + 1) % 4;
      const firstLeadPlayerId = state.players[firstLeadIndex].id;

      return {
        ...state,
        trumpColor: color,
        currentPlayerId: firstLeadPlayerId,
        phase: 'playing',
      };
    }

    case 'PLAY_CARD': {
      const { playerId, card } = action.payload;

      // Validate it's the current player's turn
      if (playerId !== state.currentPlayerId) {
        console.error('Not this player\'s turn to play');
        return state;
      }

      // Validate the card can be played
      const player = state.players.find(p => p.id === playerId);
      if (!player) {
        console.error('Player not found');
        return state;
      }

      // Check if card is in player's hand
      if (!player.hand.some(c => c.id === card.id)) {
        console.error('Card not in player\'s hand');
        return state;
      }

      // Get lead card if trick is in progress
      let leadCard: Card | null = null;
      if (state.currentTrick && state.currentTrick.cards.size > 0) {
        leadCard = state.currentTrick.cards.get(state.currentTrick.leadPlayerId) || null;
      }

      // Validate card can be played according to rules
      if (!RuleValidator.canPlayCard(card, player.hand, leadCard, state.trumpColor)) {
        console.error('Card cannot be played according to game rules');
        return state;
      }

      // Detect renege if this is not the lead card (Requirement 7.1)
      if (leadCard !== null) {
        const isRenege = RuleValidator.detectRenege(card, player.hand, leadCard, state.trumpColor);
        
        if (isRenege) {
          // Store renege information for potential correction (Requirement 7.2)
          const renegeInfo = {
            playerId,
            trickIndex: state.completedTricks.length,
            cardPlayed: card,
            correctCards: player.hand.filter(c => 
              RuleValidator.canPlayCard(c, player.hand, leadCard, state.trumpColor) && c.id !== card.id
            ),
          };
          
          // For now, we'll allow the play but mark the renege
          // The UI can show a warning and allow correction before the next trick
          console.warn('Renege detected!', renegeInfo);
        }
      }

      // Remove card from player's hand
      const updatedHand = player.hand.filter(c => c.id !== card.id);
      const updatedPlayers = state.players.map(p =>
        p.id === playerId ? { ...p, hand: updatedHand } : p
      );

      // Add card to current trick or create new trick
      let updatedTrick: Trick;
      if (state.currentTrick === null) {
        // Start a new trick with this player leading
        updatedTrick = {
          leadPlayerId: playerId,
          cards: new Map([[playerId, card]]),
        };
      } else {
        // Add card to existing trick
        const newCards = new Map(state.currentTrick.cards);
        newCards.set(playerId, card);
        updatedTrick = {
          ...state.currentTrick,
          cards: newCards,
        };
      }

      // Check if trick is complete (all 4 players have played)
      if (updatedTrick.cards.size === 4) {
        // Check if there was a renege in a previous trick that wasn't corrected (Requirement 7.3)
        if (state.renegeInfo !== null && state.renegeInfo.trickIndex < state.completedTricks.length) {
          // Renege was discovered after the next trick was taken
          // Apply renege penalty (handled by APPLY_RENEGE_PENALTY action)
          console.error('Renege discovered after next trick - penalty will be applied');
        }

        // Determine trick winner
        const winnerId = determineTrickWinner(updatedTrick, state.trumpColor);
        updatedTrick.winnerId = winnerId;

        // Add trick to winner's captured tricks
        const trickCards = Array.from(updatedTrick.cards.values());
        const playersWithCapturedTrick = updatedPlayers.map(p =>
          p.id === winnerId
            ? { ...p, capturedTricks: [...p.capturedTricks, trickCards] }
            : p
        );

        // Check if this was the last trick (all players have 0 cards)
        const allHandsEmpty = playersWithCapturedTrick.every(p => p.hand.length === 0);

        if (allHandsEmpty) {
          // Award nest to last trick winner (Requirement 5.9)
          const playersWithNest = playersWithCapturedTrick.map(p =>
            p.id === winnerId
              ? { ...p, capturedTricks: [...p.capturedTricks, state.nest] }
              : p
          );

          return {
            ...state,
            players: playersWithNest,
            currentTrick: null,
            completedTricks: [...state.completedTricks, updatedTrick],
            phase: 'roundEnd',
          };
        }

        // Move to next trick with winner leading (Requirement 5.8)
        return {
          ...state,
          players: playersWithCapturedTrick,
          currentTrick: null,
          completedTricks: [...state.completedTricks, updatedTrick],
          currentPlayerId: winnerId,
        };
      }

      // Trick not complete yet - move to next player
      const currentPlayerIndex = state.players.findIndex(p => p.id === playerId);
      const nextPlayerIndex = (currentPlayerIndex + 1) % 4;
      const nextPlayerId = state.players[nextPlayerIndex].id;

      return {
        ...state,
        players: updatedPlayers,
        currentTrick: updatedTrick,
        currentPlayerId: nextPlayerId,
      };
    }

    case 'CORRECT_RENEGE': {
      // Requirement 7.2: Allow correction before next trick
      const { playerId, card } = action.payload;

      // Validate there is a renege to correct
      if (state.renegeInfo === null || state.renegeInfo.playerId !== playerId) {
        console.error('No renege to correct for this player');
        return state;
      }

      // Validate the correction is happening before the next trick
      if (state.renegeInfo.trickIndex < state.completedTricks.length) {
        console.error('Cannot correct renege after next trick has been taken');
        return state;
      }

      // Validate the new card is valid
      const player = state.players.find(p => p.id === playerId);
      if (!player) {
        console.error('Player not found');
        return state;
      }

      // Get the current trick and lead card
      if (!state.currentTrick) {
        console.error('No current trick to correct');
        return state;
      }

      const leadCard = state.currentTrick.cards.get(state.currentTrick.leadPlayerId);
      if (!leadCard) {
        console.error('Lead card not found');
        return state;
      }

      // Add the incorrectly played card back to the player's hand
      const handWithOldCard = [...player.hand, state.renegeInfo.cardPlayed];

      // Validate the new card can be played
      if (!RuleValidator.canPlayCard(card, handWithOldCard, leadCard, state.trumpColor)) {
        console.error('Corrected card cannot be played according to game rules');
        return state;
      }

      // Verify the new card is not a renege
      if (RuleValidator.detectRenege(card, handWithOldCard, leadCard, state.trumpColor)) {
        console.error('Corrected card is still a renege');
        return state;
      }

      // Update the player's hand: remove new card, keep old card removed
      const updatedHand = player.hand.filter(c => c.id !== card.id);
      const updatedPlayers = state.players.map(p =>
        p.id === playerId ? { ...p, hand: updatedHand } : p
      );

      // Update the current trick with the corrected card
      const updatedCards = new Map(state.currentTrick.cards);
      updatedCards.set(playerId, card);
      const updatedTrick = {
        ...state.currentTrick,
        cards: updatedCards,
      };

      return {
        ...state,
        players: updatedPlayers,
        currentTrick: updatedTrick,
        renegeInfo: null, // Clear the renege info
      };
    }

    case 'APPLY_RENEGE_PENALTY': {
      // Requirements 7.3, 7.4, 7.5: Apply penalty when renege discovered after next trick
      const { playerId } = action.payload;

      // Find the player and their team
      const player = state.players.find(p => p.id === playerId);
      if (!player) {
        console.error('Player not found');
        return state;
      }

      const offendingTeamId = player.teamId;
      const opposingTeamId: TeamId = offendingTeamId === 'team1' ? 'team2' : 'team1';

      // Get the bid amount
      const bidAmount = state.currentBid?.amount || 0;

      // Calculate points captured by opposing team before the renege
      const opposingTeamPlayerIds = state.players
        .filter(p => p.teamId === opposingTeamId)
        .map(p => p.id);

      // Count points from completed tricks up to the renege
      let opposingTeamPoints = 0;
      for (let i = 0; i < state.completedTricks.length; i++) {
        const trick = state.completedTricks[i];
        const trickCards = Array.from(trick.cards.values());
        
        // Check if any opposing team member won this trick
        if (trick.winnerId && opposingTeamPlayerIds.includes(trick.winnerId)) {
          opposingTeamPoints += ScoreCalculator.calculateTrickPoints(trickCards);
        }
      }

      // Deduct bid amount from offending team (Requirement 7.4)
      const offendingTeamCurrentScore = state.scores.get(offendingTeamId) || 0;
      const offendingTeamNewScore = offendingTeamCurrentScore - bidAmount;

      // Award opposing team their captured points (Requirement 7.5)
      const opposingTeamCurrentScore = state.scores.get(opposingTeamId) || 0;
      const opposingTeamNewScore = opposingTeamCurrentScore + opposingTeamPoints;

      const newScores = new Map<TeamId, number>([
        [offendingTeamId, offendingTeamNewScore],
        [opposingTeamId, opposingTeamNewScore],
      ]);

      const newRoundScores = new Map<TeamId, number>([
        [offendingTeamId, -bidAmount],
        [opposingTeamId, opposingTeamPoints],
      ]);

      // End the round immediately (Requirement 7.3)
      return {
        ...state,
        scores: newScores,
        roundScores: newRoundScores,
        renegeInfo: null,
        phase: 'roundEnd',
      };
    }

    case 'COMPLETE_TRICK':
      return state;

    case 'END_ROUND': {
      // Requirements 8.8, 8.9, 8.10, 10.1, 10.2
      
      // Calculate scores for each team
      const team1PlayerIds = state.players.filter(p => p.teamId === 'team1').map(p => p.id);
      const team2PlayerIds = state.players.filter(p => p.teamId === 'team2').map(p => p.id);
      
      // Find the last trick winner
      const lastTrick = state.completedTricks[state.completedTricks.length - 1];
      const lastTrickWinnerId = lastTrick?.winnerId || null;
      
      // Calculate raw points captured by each team (Requirement 8.1)
      // Use completedTricks which contain the actual cards played
      const team1CapturedPoints = ScoreCalculator.calculateTeamScore(
        state.completedTricks,
        team1PlayerIds,
        state.nest,
        lastTrickWinnerId
      );
      
      const team2CapturedPoints = ScoreCalculator.calculateTeamScore(
        state.completedTricks,
        team2PlayerIds,
        state.nest,
        lastTrickWinnerId
      );
      
      // Determine which team was the bidding team
      const highBidder = state.players.find(p => p.id === state.highBidder);
      const biddingTeamId = highBidder?.teamId;
      const bidAmount = state.currentBid?.amount || 0;
      
      // Calculate round scores based on bid result
      let team1RoundScore = 0;
      let team2RoundScore = 0;
      
      if (biddingTeamId === 'team1') {
        // Team 1 was bidding - apply bid result (Requirements 8.3, 8.4, 8.5)
        team1RoundScore = ScoreCalculator.applyBidResult(team1CapturedPoints, bidAmount);
        // Team 2 always gets their captured points (Requirement 8.6)
        team2RoundScore = team2CapturedPoints;
      } else {
        // Team 2 was bidding - apply bid result
        team2RoundScore = ScoreCalculator.applyBidResult(team2CapturedPoints, bidAmount);
        // Team 1 always gets their captured points (Requirement 8.6)
        team1RoundScore = team1CapturedPoints;
      }
      
      // Update cumulative scores (Requirement 10.2)
      const newTeam1Score = (state.scores.get('team1') || 0) + team1RoundScore;
      const newTeam2Score = (state.scores.get('team2') || 0) + team2RoundScore;
      
      const newScores = new Map<TeamId, number>([
        ['team1', newTeam1Score],
        ['team2', newTeam2Score],
      ]);
      
      const newRoundScores = new Map<TeamId, number>([
        ['team1', team1RoundScore],
        ['team2', team2RoundScore],
      ]);
      
      // Check for 300-point win condition (Requirements 8.8, 8.9, 8.10)
      const team1Wins = newTeam1Score >= 300;
      const team2Wins = newTeam2Score >= 300;
      
      if (team1Wins || team2Wins) {
        // At least one team has reached 300 points
        if (team1Wins && team2Wins) {
          // Both teams have 300+ - higher score wins (Requirement 8.10)
          return {
            ...state,
            scores: newScores,
            roundScores: newRoundScores,
            phase: 'gameEnd',
          };
        } else {
          // Only one team has 300+ - they win (Requirement 8.9)
          return {
            ...state,
            scores: newScores,
            roundScores: newRoundScores,
            phase: 'gameEnd',
          };
        }
      }
      
      // No winner yet - stay in roundEnd phase to display results (Requirement 10.1)
      return {
        ...state,
        scores: newScores,
        roundScores: newRoundScores,
        phase: 'roundEnd',
      };
    }

    case 'END_GAME': {
      // Requirement 10.6: Display victory message with final scores
      // This action is primarily for UI purposes - the game is already in gameEnd phase
      // Could be used to reset or return to menu in the future
      return {
        ...state,
        phase: 'gameEnd',
      };
    }

    default:
      return state;
  }
};
