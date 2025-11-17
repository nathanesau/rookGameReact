import type { GameState, GameAction, Player, Trick, Card, TeamId, PlayerId } from '../types';
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
    biddingHistory: [],
    calledCard: null,
    partnerId: null,
    partnerRevealed: false,
    trumpColor: null,
    currentTrick: null,
    completedTricks: [],
    trickCompleted: false,
    renegeInfo: null,
    scores: new Map(), // Individual player scores
    roundScores: new Map([
      ['team1', 0],
      ['team2', 0],
    ]),
    scoreHistory: [],
    currentRound: 0,
  };
};

const initializeGame = (state: GameState, playerNames: string[]): GameState => {
  // Create players without teams (teams determined by partner selection)
  const players: Player[] = playerNames.map((name, index) => ({
    id: `player-${index}`,
    name,
    teamId: null, // Teams assigned after partner selection
    position: index as 0 | 1 | 2 | 3,
    hand: [],
    capturedTricks: [],
  }));

  // For the first round, player 1 (player-0) starts bidding
  // This means dealer is player 4 (player-3), since bidder is to left of dealer
  const dealerIndex = 3; // Player 4
  const dealerId = players[dealerIndex].id;

  // Generate and shuffle deck
  const deck = shuffleDeck(generateDeck());

  // Initialize individual player scores
  const initialScores = new Map<PlayerId, number>();
  players.forEach(player => {
    initialScores.set(player.id, 0);
  });

  return {
    ...state,
    phase: 'dealing',
    players,
    deck,
    dealerId,
    currentPlayerId: players[0].id, // Player 1 (player-0) starts bidding
    nest: [],
    currentBid: null,
    passedPlayers: new Set(),
    highBidder: null,
    calledCard: null,
    partnerId: null,
    partnerRevealed: false,
    trumpColor: null,
    currentTrick: null,
    completedTricks: [],
    renegeInfo: null,
    scores: initialScores,
    roundScores: new Map([
      ['team1', 0],
      ['team2', 0],
    ]),
    scoreHistory: [],
    currentRound: 1,
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
        teamId: null, // Reset teams for new partner selection
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
        biddingHistory: [],
        calledCard: null,
        partnerId: null,
        partnerRevealed: false,
        trumpColor: null,
        currentTrick: null,
        completedTricks: [],
        renegeInfo: null,
        roundScores: new Map([
          ['team1', 0],
          ['team2', 0],
        ]),
        currentRound: state.currentRound + 1,
        // Maintain cumulative scores across rounds (Requirement 10.3)
        // scores: state.scores (unchanged)
        // scoreHistory: state.scoreHistory (unchanged)
      };
    }

    case 'DEAL_CARDS':
      return dealCards(state);

    case 'START_BIDDING': {
      // Transition from roundStart to bidding
      if (state.phase !== 'roundStart') {
        console.error('Can only start bidding from roundStart phase');
        return state;
      }

      return {
        ...state,
        phase: 'bidding',
      };
    }

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
        // This player is the high bidder
        return {
          ...state,
          currentBid: newBid,
          highBidder: playerId,
          currentPlayerId: playerId,
          phase: 'biddingComplete',
          biddingHistory: [...state.biddingHistory, { playerId, action: 'bid', amount }],
        };
      }

      return {
        ...state,
        currentBid: newBid,
        currentPlayerId: nextPlayerId,
        biddingHistory: [...state.biddingHistory, { playerId, action: 'bid', amount }],
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
            biddingHistory: [...state.biddingHistory, { playerId, action: 'pass' }],
            // Stay in bidding phase - last player must make a bid
          };
        }

        // Someone has bid, so the last remaining player wins
        return {
          ...state,
          passedPlayers: newPassedPlayers,
          highBidder,
          currentPlayerId: highBidder,
          phase: 'biddingComplete',
          biddingHistory: [...state.biddingHistory, { playerId, action: 'pass' }],
        };
      }

      return {
        ...state,
        passedPlayers: newPassedPlayers,
        currentPlayerId: nextPlayerId,
        biddingHistory: [...state.biddingHistory, { playerId, action: 'pass' }],
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

    case 'CONTINUE_TO_NEST_SELECTION': {
      // Transition from biddingComplete to nestSelection
      // This allows UI to show bidding winner message before nest selection
      if (state.phase !== 'biddingComplete') {
        console.error('Can only continue to nest selection from biddingComplete phase');
        return state;
      }

      // Add nest cards to high bidder's hand
      const highBidderPlayer = state.players.find(p => p.id === state.highBidder);
      if (!highBidderPlayer) {
        console.error('High bidder not found');
        return state;
      }

      const updatedPlayers = state.players.map(player =>
        player.id === state.highBidder
          ? { ...player, hand: [...player.hand, ...state.nest] }
          : player
      );

      return {
        ...state,
        phase: 'nestSelection',
        players: updatedPlayers,
      };
    }

    case 'SELECT_NEST_CARDS': {
      const { cardsToAdd, cardsToDiscard } = action.payload;

      // Validate that the same number of cards are being added and discarded
      if (cardsToAdd.length !== cardsToDiscard.length) {
        console.error('Must discard the same number of cards as taken from nest');
        return state;
      }

      // Validate that at most 3 cards are being taken
      if (cardsToAdd.length > 3) {
        console.error('Can only take up to 3 cards from nest');
        return state;
      }

      // Validate that it's the high bidder's turn
      if (state.currentPlayerId !== state.highBidder) {
        console.error('Only the high bidder can select nest cards');
        return state;
      }

      // Find the high bidder player
      const highBidderPlayer = state.players.find(p => p.id === state.highBidder);
      if (!highBidderPlayer) {
        console.error('High bidder not found');
        return state;
      }

      // Validate cards to add are from the nest
      const nestCardIds = new Set(state.nest.map(c => c.id));
      const invalidAddCards = cardsToAdd.filter(c => !nestCardIds.has(c.id));
      if (invalidAddCards.length > 0) {
        console.error('Cards to add must be from the nest');
        return state;
      }

      // Validate cards to discard are from the player's hand (excluding nest cards)
      const originalHandIds = new Set(
        highBidderPlayer.hand.filter(c => !nestCardIds.has(c.id)).map(c => c.id)
      );
      const invalidDiscardCards = cardsToDiscard.filter(c => !originalHandIds.has(c.id));
      if (invalidDiscardCards.length > 0) {
        console.error('Cards to discard must be from your original hand');
        return state;
      }

      // Remove nest cards and discarded cards from player's hand, keeping selected nest cards
      const cardsToAddIds = new Set(cardsToAdd.map(c => c.id));
      const cardsToDiscardIds = new Set(cardsToDiscard.map(c => c.id));
      
      const updatedHand = highBidderPlayer.hand.filter(card => 
        !nestCardIds.has(card.id) && !cardsToDiscardIds.has(card.id)
      );

      // Add selected nest cards to hand
      const finalHand = [...updatedHand, ...cardsToAdd];

      // Validate final hand has exactly 13 cards
      if (finalHand.length !== 13) {
        console.error(`Final hand must have exactly 13 cards, got ${finalHand.length}`);
        return state;
      }

      // Update the player's hand
      const updatedPlayers = state.players.map(player =>
        player.id === state.highBidder
          ? { ...player, hand: finalHand }
          : player
      );

      // Update nest: remove taken cards, add discarded cards
      const remainingNest = state.nest.filter(c => !cardsToAddIds.has(c.id));
      const newNest = [...remainingNest, ...cardsToDiscard];

      // Validate nest still has 5 cards
      if (newNest.length !== 5) {
        console.error(`Nest must have exactly 5 cards, got ${newNest.length}`);
        return state;
      }

      // Store updated nest and move to trump selection
      return {
        ...state,
        players: updatedPlayers,
        nest: newNest,
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

      return {
        ...state,
        trumpColor: color,
        phase: 'partnerSelection',
      };
    }

    case 'SELECT_PARTNER': {
      const { card } = action.payload;

      // Validate that it's the high bidder's turn
      if (state.currentPlayerId !== state.highBidder) {
        console.error('Only the high bidder can select partner');
        return state;
      }

      // Validate trump has been selected
      if (!state.trumpColor) {
        console.error('Must select trump before selecting partner');
        return state;
      }

      // Validate the high bidder doesn't have this card
      const highBidder = state.players.find(p => p.id === state.highBidder);
      if (!highBidder) {
        console.error('High bidder not found');
        return state;
      }

      if (highBidder.hand.some(c => c.id === card.id)) {
        console.error('Cannot call a card you already have');
        return state;
      }

      // Check if the card is in the nest (was discarded)
      if (state.nest.some(c => c.id === card.id)) {
        console.error('Cannot call a card that is in the nest');
        return state;
      }

      // Find who has the called card (partner is secret for now)
      console.log('Looking for partner with card:', card.id);
      console.log('Players hands:', state.players.map(p => ({
        id: p.id,
        isHighBidder: p.id === state.highBidder,
        hasCard: p.hand.some(c => c.id === card.id),
        handCardIds: p.hand.map(c => c.id)
      })));
      
      const partner = state.players.find(p =>
        p.id !== state.highBidder && p.hand.some(c => c.id === card.id)
      );

      // Store the called card and partner ID (secret)
      const partnerId = partner?.id || null;
      console.log('Partner found:', partnerId);

      // High bidder (bid winner) leads the first trick
      const firstLeadPlayerId = state.highBidder!;

      // If no partner found (card in nest or high bidder has it), high bidder plays alone
      let updatedPlayers = state.players;
      let partnerRevealed = false;
      
      if (partnerId === null) {
        console.log('No partner found - high bidder plays alone!');
        // High bidder is team1, everyone else is team2
        updatedPlayers = state.players.map(p => ({
          ...p,
          teamId: p.id === state.highBidder ? 'team1' : 'team2',
        }));
        partnerRevealed = true; // Teams are known immediately
      }

      return {
        ...state,
        players: updatedPlayers,
        calledCard: card,
        partnerId,
        partnerRevealed,
        currentPlayerId: firstLeadPlayerId,
        phase: 'playing',
      };
    }

    case 'PLAY_CARD': {
      const { playerId, card } = action.payload;

      // Don't allow playing if trick is completed and being animated
      if (state.trickCompleted) {
        return state;
      }

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

      // Check if this is the called card being played (reveal partner)
      let partnerRevealed = state.partnerRevealed;
      let updatedPlayersWithTeams = state.players;

      if (!state.partnerRevealed && state.calledCard) {
        console.log('Checking partner card:', {
          playedCardId: card.id,
          calledCardId: state.calledCard.id,
          match: card.id === state.calledCard.id,
          partnerId: state.partnerId,
          playerId: playerId
        });
        
        if (card.id === state.calledCard.id) {
          // Partner revealed! Assign teams
          partnerRevealed = true;
          console.log('Partner revealed! Assigning teams...');

          // High bidder and partner are team1, others are team2
          updatedPlayersWithTeams = state.players.map(p => ({
            ...p,
            teamId: (p.id === state.highBidder || p.id === state.partnerId) ? 'team1' : 'team2',
          }));
          
          console.log('Teams assigned:', updatedPlayersWithTeams.map(p => ({ id: p.id, teamId: p.teamId })));
        }
      }

      // Remove card from player's hand
      const updatedHand = player.hand.filter(c => c.id !== card.id);
      const updatedPlayers = updatedPlayersWithTeams.map(p =>
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

          // Calculate scores for the round
          const team1PlayerIds = playersWithNest.filter(p => p.teamId === 'team1').map(p => p.id);
          const team2PlayerIds = playersWithNest.filter(p => p.teamId === 'team2').map(p => p.id);

          // Calculate points captured by each team
          const team1Points = playersWithNest
            .filter(p => team1PlayerIds.includes(p.id))
            .reduce((sum, p) => sum + p.capturedTricks.flat().reduce((s, card) => s + card.points, 0), 0);
          
          const team2Points = playersWithNest
            .filter(p => team2PlayerIds.includes(p.id))
            .reduce((sum, p) => sum + p.capturedTricks.flat().reduce((s, card) => s + card.points, 0), 0);

          // Determine bidding team and apply bid logic
          const highBidder = playersWithNest.find(p => p.id === state.highBidder);
          const biddingTeamId = highBidder?.teamId;
          const bidAmount = state.currentBid?.amount || 0;

          let team1RoundScore = 0;
          let team2RoundScore = 0;

          if (biddingTeamId === 'team1') {
            // Team 1 made bid or failed
            team1RoundScore = team1Points >= bidAmount ? team1Points : -bidAmount;
            team2RoundScore = team2Points;
          } else {
            // Team 2 made bid or failed
            team2RoundScore = team2Points >= bidAmount ? team2Points : -bidAmount;
            team1RoundScore = team1Points;
          }

          const newRoundScores = new Map<TeamId, number>([
            ['team1', team1RoundScore],
            ['team2', team2RoundScore],
          ]);

          // Update individual player scores
          const newScores = new Map(state.scores);
          const roundDeltas = new Map<PlayerId, number>();
          
          team1PlayerIds.forEach(playerId => {
            const currentScore = newScores.get(playerId) || 0;
            newScores.set(playerId, currentScore + team1RoundScore);
            roundDeltas.set(playerId, team1RoundScore);
          });
          team2PlayerIds.forEach(playerId => {
            const currentScore = newScores.get(playerId) || 0;
            newScores.set(playerId, currentScore + team2RoundScore);
            roundDeltas.set(playerId, team2RoundScore);
          });

          // Create round history entry
          const roundHistory = {
            roundNumber: state.currentRound,
            playerScores: new Map(newScores),
            roundDeltas,
            bidAmount: bidAmount,
            bidderId: state.highBidder,
            bidMade: biddingTeamId === 'team1' ? team1Points >= bidAmount : team2Points >= bidAmount,
          };

          return {
            ...state,
            players: playersWithNest,
            currentTrick: null,
            completedTricks: [...state.completedTricks, updatedTrick],
            partnerRevealed: true,
            scores: newScores,
            roundScores: newRoundScores,
            scoreHistory: [...state.scoreHistory, roundHistory],
            phase: 'roundEnd',
          };
        }

        // Move to next trick with winner leading (Requirement 5.8)
        // Keep completed trick visible for animations by storing it separately
        return {
          ...state,
          players: playersWithCapturedTrick,
          currentTrick: updatedTrick, // Keep for TrickArea to display
          completedTricks: [...state.completedTricks, updatedTrick],
          currentPlayerId: winnerId,
          partnerRevealed,
          trickCompleted: true, // Flag to prevent new cards being played
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
        partnerRevealed,
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
      if (!player || !player.teamId) {
        console.error('Player not found or team not assigned');
        return state;
      }

      const offendingTeamId: TeamId = player.teamId;
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

      // Get player IDs for each team
      const offendingTeamPlayerIds = state.players
        .filter(p => p.teamId === offendingTeamId)
        .map(p => p.id);

      // Deduct bid amount from offending team players (Requirement 7.4)
      // Award opposing team their captured points (Requirement 7.5)
      const newScores = new Map(state.scores);
      offendingTeamPlayerIds.forEach(pId => {
        const currentScore = newScores.get(pId) || 0;
        newScores.set(pId, currentScore - bidAmount);
      });
      opposingTeamPlayerIds.forEach(pId => {
        const currentScore = newScores.get(pId) || 0;
        newScores.set(pId, currentScore + opposingTeamPoints);
      });

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

    case 'CLEAR_TRICK':
      // Clear the completed trick after animations
      return {
        ...state,
        currentTrick: null,
        trickCompleted: false,
      };

    case 'COMPLETE_TRICK':
      return state;

    case 'END_ROUND': {
      // Requirements 8.8, 8.9, 8.10, 10.1, 10.2

      // If partner was never revealed, reveal teams now
      let finalPlayers = state.players;
      if (!state.partnerRevealed && state.partnerId) {
        finalPlayers = state.players.map(p => ({
          ...p,
          teamId: (p.id === state.highBidder || p.id === state.partnerId) ? 'team1' : 'team2',
        }));
      }

      // Calculate scores for each team
      const team1PlayerIds = finalPlayers.filter(p => p.teamId === 'team1').map(p => p.id);
      const team2PlayerIds = finalPlayers.filter(p => p.teamId === 'team2').map(p => p.id);

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
      const highBidder = finalPlayers.find(p => p.id === state.highBidder);
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

      const newRoundScores = new Map<TeamId, number>([
        ['team1', team1RoundScore],
        ['team2', team2RoundScore],
      ]);

      // Distribute team scores to individual players
      const newScores = new Map(state.scores);
      team1PlayerIds.forEach(playerId => {
        const currentScore = newScores.get(playerId) || 0;
        newScores.set(playerId, currentScore + team1RoundScore);
      });
      team2PlayerIds.forEach(playerId => {
        const currentScore = newScores.get(playerId) || 0;
        newScores.set(playerId, currentScore + team2RoundScore);
      });

      // Check for 500-point win condition - any individual player
      const playerScores = Array.from(newScores.values());
      const hasWinner = playerScores.some(score => score >= 500);

      if (hasWinner) {
        // At least one player has reached 500 points - game over
        return {
          ...state,
          players: finalPlayers,
          partnerRevealed: true,
          scores: newScores,
          roundScores: newRoundScores,
          phase: 'gameEnd',
        };
      }

      // No winner yet - stay in roundEnd phase to display results (Requirement 10.1)
      return {
        ...state,
        players: finalPlayers,
        partnerRevealed: true,
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
