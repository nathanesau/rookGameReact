import { useState, useMemo, useEffect } from 'react';
import { useGame } from '../contexts';
import { GameTable } from './GameTable';
import { BiddingPanel } from './BiddingPanel';
import { NestDisplay } from './NestDisplay';
import { TrumpSelector } from './TrumpSelector';
import { GameInfo } from './GameInfo';
import { Announcement } from './Announcement';
import { getPlayableCards } from '../utils/gameEngine';
import { aiMakeBid, aiSelectNestCards, aiSelectTrump, aiSelectPartner, aiPlayCard } from '../utils/aiPlayer';
import type { Card, CardColor } from '../types';
import styles from './GameBoard.module.css';

export const GameBoard = () => {
  const { state, dispatch } = useGame();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [announcementQueue, setAnnouncementQueue] = useState<string[]>([]);
  const [shownAnnouncements, setShownAnnouncements] = useState<Set<string>>(new Set());

  // Assume player-0 is the human player
  const humanPlayerId = 'player-0';
  const humanPlayer = state.players.find(p => p.id === humanPlayerId);

  // Calculate playable cards for the human player
  const playableCards = useMemo(() => {
    if (state.phase !== 'playing' || !humanPlayer) {
      return new Set<string>();
    }
    return getPlayableCards(state, humanPlayerId);
  }, [state, humanPlayer, humanPlayerId]);

  // AI player logic - runs when it's a computer player's turn
  useEffect(() => {
    const currentPlayer = state.currentPlayerId;
    
    // Only run AI for non-human players
    if (currentPlayer === humanPlayerId) return;

    // Don't run AI while announcement is showing
    if (announcement) return;

    // Phase-specific delays to make game flow easier to follow
    let delay = 800; // Default for playing phase
    if (state.phase === 'bidding') {
      delay = 1300;
    } else if (state.phase === 'nestSelection' || state.phase === 'trumpSelection' || state.phase === 'partnerSelection') {
      delay = 200; // Fast for selection phases since no intermediate messages shown
    }

    const timer = setTimeout(() => {
      // Bidding phase AI
      if (state.phase === 'bidding' && !state.passedPlayers.has(currentPlayer)) {
        const decision = aiMakeBid(state, currentPlayer);
        if (decision.action === 'bid' && decision.amount) {
          dispatch({
            type: 'PLACE_BID',
            payload: { playerId: currentPlayer, amount: decision.amount },
          });
        } else {
          dispatch({
            type: 'PASS_BID',
            payload: { playerId: currentPlayer },
          });
        }
      }
      
      // Nest selection AI
      else if (state.phase === 'nestSelection' && state.highBidder === currentPlayer) {
        const player = state.players.find(p => p.id === currentPlayer);
        if (player) {
          const { cardsToAdd, cardsToDiscard } = aiSelectNestCards(player.hand, state.nest);
          dispatch({
            type: 'SELECT_NEST_CARDS',
            payload: { cardsToAdd, cardsToDiscard },
          });
        }
      }
      
      // Trump selection AI
      else if (state.phase === 'trumpSelection' && state.highBidder === currentPlayer) {
        const player = state.players.find(p => p.id === currentPlayer);
        if (player) {
          const trumpColor = aiSelectTrump(player.hand);
          dispatch({
            type: 'SELECT_TRUMP',
            payload: { color: trumpColor },
          });
        }
      }
      
      // Partner selection AI
      else if (state.phase === 'partnerSelection' && state.highBidder === currentPlayer) {
        const player = state.players.find(p => p.id === currentPlayer);
        if (player) {
          const partnerCard = aiSelectPartner(player.hand, state.trumpColor);
          dispatch({
            type: 'SELECT_PARTNER',
            payload: { card: partnerCard },
          });
        }
      }
      
      // Playing phase AI
      else if (state.phase === 'playing') {
        const cardToPlay = aiPlayCard(state, currentPlayer);
        if (cardToPlay) {
          dispatch({
            type: 'PLAY_CARD',
            payload: { playerId: currentPlayer, card: cardToPlay },
          });
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [state, humanPlayerId, dispatch, announcement]);

  // Process announcement queue
  useEffect(() => {
    if (!announcement && announcementQueue.length > 0) {
      // Show next announcement in queue after a brief delay
      const timer = setTimeout(() => {
        setAnnouncement(announcementQueue[0]);
        setAnnouncementQueue(prev => prev.slice(1));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [announcement, announcementQueue]);

  // Reset when dealing starts
  useEffect(() => {
    if (state.phase === 'dealing') {
      setShownAnnouncements(new Set());
      setAnnouncementQueue([]);
    }
  }, [state.phase]);

  // Show both announcements during roundStart phase (after cards are dealt and visible)
  useEffect(() => {
    const key = `round-${state.currentRound}`;
    if (state.phase === 'roundStart' && !shownAnnouncements.has(key)) {
      const firstBidder = state.players.find(p => p.id === state.currentPlayerId);
      if (firstBidder) {
        setAnnouncementQueue([
          `Round ${state.currentRound} Starting`,
          `${firstBidder.name} starts the bidding`
        ]);
        setShownAnnouncements(prev => new Set(prev).add(key));
      }
    }
  }, [state.phase, state.currentRound, state.currentPlayerId, state.players, shownAnnouncements]);

  // Transition to bidding after announcements are dismissed
  useEffect(() => {
    if (state.phase === 'roundStart' && !announcement && announcementQueue.length === 0 && shownAnnouncements.has(`round-${state.currentRound}`)) {
      const timer = setTimeout(() => {
        dispatch({ type: 'START_BIDDING' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.phase, announcement, announcementQueue, shownAnnouncements, state.currentRound, dispatch]);

  // Show announcement when bidding ends
  useEffect(() => {
    const key = `bid-${state.currentBid?.amount}`;
    if (state.phase === 'biddingComplete' && state.highBidder && state.currentBid && !shownAnnouncements.has(key)) {
      const bidder = state.players.find(p => p.id === state.highBidder);
      if (bidder && state.currentBid) {
        setAnnouncementQueue(prev => [...prev, `${bidder.name} won the bid for ${state.currentBid!.amount} points!`]);
        setShownAnnouncements(prev => new Set(prev).add(key));
      }
    }
  }, [state.phase, state.highBidder, state.currentBid, state.players, shownAnnouncements]);

  // Continue to nest selection after bidding complete announcement is dismissed
  useEffect(() => {
    if (state.phase === 'biddingComplete' && !announcement && announcementQueue.length === 0) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CONTINUE_TO_NEST_SELECTION' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.phase, announcement, announcementQueue, dispatch]);

  // Show single announcement when computer player starts making selections
  useEffect(() => {
    const key = `computer-selecting-${state.currentRound}`;
    if (state.phase === 'nestSelection' && state.highBidder !== humanPlayerId && !shownAnnouncements.has(key)) {
      const bidder = state.players.find(p => p.id === state.highBidder);
      if (bidder) {
        setAnnouncementQueue([`${bidder.name} is making selections...`]);
        setShownAnnouncements(prev => new Set(prev).add(key));
      }
    }
  }, [state.phase, state.highBidder, state.players, humanPlayerId, state.currentRound, shownAnnouncements]);

  // Show announcements when playing phase starts (after all selections are complete)
  useEffect(() => {
    const key = `selections-${state.trumpColor}-${state.calledCard?.id}`;
    if (state.phase === 'playing' && state.trumpColor && state.calledCard && !state.partnerRevealed && !shownAnnouncements.has(key)) {
      const bidder = state.players.find(p => p.id === state.highBidder);
      if (bidder) {
        const messages: string[] = [];
        
        // Trump selection message
        const trumpName = state.trumpColor.charAt(0).toUpperCase() + state.trumpColor.slice(1);
        messages.push(`${bidder.name} selected ${trumpName} as Trump`);
        
        // Partner selection message
        const cardName = state.calledCard.color === 'rook' 
          ? 'Rook Bird' 
          : `${state.calledCard.value} of ${state.calledCard.color.charAt(0).toUpperCase() + state.calledCard.color.slice(1)}`;
        messages.push(`${bidder.name} called the ${cardName} as Partner`);
        
        // Nest points message
        const nestPoints = state.nest.reduce((sum, card) => sum + card.points, 0);
        if (nestPoints > 0) {
          messages.push(`There are ${nestPoints} points in the Nest`);
        } else {
          messages.push(`There are no points in the Nest`);
        }
        
        setAnnouncementQueue(prev => [...prev, ...messages]);
        setShownAnnouncements(prev => new Set(prev).add(key));
      }
    }
  }, [state.phase, state.trumpColor, state.calledCard, state.partnerRevealed, state.highBidder, state.players, state.nest, shownAnnouncements, humanPlayerId]);

  // Show announcement when partner is revealed
  useEffect(() => {
    const key = `partner-revealed-${state.partnerId}`;
    if (state.phase === 'playing' && state.partnerRevealed && state.partnerId && !shownAnnouncements.has(key)) {
      const bidder = state.players.find(p => p.id === state.highBidder);
      const partner = state.players.find(p => p.id === state.partnerId);
      
      if (bidder && partner) {
        // Get team members
        const team1Players = state.players.filter(p => p.teamId === 'team1');
        const team2Players = state.players.filter(p => p.teamId === 'team2');
        
        const team1Names = team1Players.map(p => p.name).join(' & ');
        const team2Names = team2Players.map(p => p.name).join(' & ');
        
        const cardName = state.calledCard?.color === 'rook' 
          ? 'Rook Bird' 
          : `${state.calledCard?.value} of ${state.calledCard?.color?.charAt(0).toUpperCase()}${state.calledCard?.color?.slice(1)}`;
        
        setAnnouncementQueue(prev => [...prev, 
          `${partner.name} played the ${cardName}!`,
          `Teams: ${team1Names} vs ${team2Names}`
        ]);
        setShownAnnouncements(prev => new Set(prev).add(key));
      }
    }
  }, [state.phase, state.partnerRevealed, state.partnerId, state.highBidder, state.players, state.calledCard, shownAnnouncements]);

  // Handle card click during playing phase
  const handleCardClick = (card: Card) => {
    if (state.phase === 'playing' && state.currentPlayerId === humanPlayerId) {
      if (playableCards.has(card.id)) {
        dispatch({
          type: 'PLAY_CARD',
          payload: { playerId: humanPlayerId, card },
        });
        setSelectedCard(null);
      }
    } else {
      // Just for visual feedback when not player's turn
      setSelectedCard(selectedCard?.id === card.id ? null : card);
    }
  };

  // Handle bidding actions
  const handlePlaceBid = (amount: number) => {
    dispatch({
      type: 'PLACE_BID',
      payload: { playerId: humanPlayerId, amount },
    });
  };

  const handlePass = () => {
    dispatch({
      type: 'PASS_BID',
      payload: { playerId: humanPlayerId },
    });
  };

  const handleCallRedeal = () => {
    dispatch({
      type: 'CALL_REDEAL',
      payload: { playerId: humanPlayerId },
    });
  };

  // Handle nest selection
  const handleDiscard = (cardsToAdd: Card[], cardsToDiscard: Card[]) => {
    dispatch({
      type: 'SELECT_NEST_CARDS',
      payload: { cardsToAdd, cardsToDiscard },
    });
  };

  // Handle trump selection
  const handleSelectTrump = (color: CardColor) => {
    dispatch({
      type: 'SELECT_TRUMP',
      payload: { color },
    });
  };

  // Render phase-specific content
  const renderPhaseContent = () => {
    // Common GameTable props
    const gameTableProps = {
      players: state.players,
      humanPlayerId,
      nest: state.nest,
      currentTrick: state.currentTrick,
      trumpColor: state.trumpColor,
      onCardClick: handleCardClick,
      selectedCard,
      playableCards,
      phase: state.phase,
      highBidder: state.highBidder,
    };

    switch (state.phase) {
      case 'setup':
        return (
          <div className={styles.setupMessage}>
            <h2>Initializing game...</h2>
          </div>
        );

      case 'dealing':
        return (
          <div className={styles.dealingMessage}>
            <h2>Dealing cards...</h2>
          </div>
        );

      case 'roundStart':
        // Show cards but no bidding panel during announcements
        return <GameTable {...gameTableProps} />;

      case 'biddingComplete':
        // Show game table with all cards visible during bid winner announcement
        return <GameTable {...gameTableProps} />;

      case 'bidding':
        return (
          <>
            <GameTable {...gameTableProps} />
            <div className={styles.biddingOverlay}>
              <BiddingPanel
                currentBid={state.currentBid}
                currentPlayerId={state.currentPlayerId}
                humanPlayerId={humanPlayerId}
                passedPlayers={state.passedPlayers}
                playerHand={humanPlayer?.hand || []}
                players={state.players}
                onPlaceBid={handlePlaceBid}
                onPass={handlePass}
                onCallRedeal={handleCallRedeal}
              />
            </div>
          </>
        );

      case 'nestSelection':
        // Only show nest selection UI if human player is the high bidder
        if (state.highBidder === humanPlayerId) {
          return (
            <div className={styles.nestSelectionContainer}>
              <NestDisplay
                hand={humanPlayer?.hand || []}
                nest={state.nest}
                onComplete={handleDiscard}
              />
            </div>
          );
        }
        // Otherwise show game table (computer player is selecting)
        return <GameTable {...gameTableProps} />;

      case 'trumpSelection':
        // Only show trump selector if human player is the high bidder
        if (state.highBidder === humanPlayerId) {
          return (
            <div className={styles.trumpSelectionContainer}>
              <TrumpSelector onSelectTrump={handleSelectTrump} />
            </div>
          );
        }
        // Otherwise show game table (computer player is selecting)
        return <GameTable {...gameTableProps} />;

      case 'partnerSelection':
        // Always show game table during partner selection (AI handles it)
        return <GameTable {...gameTableProps} />;

      case 'playing':
        return <GameTable {...gameTableProps} />;

      case 'roundEnd':
        return (
          <div className={styles.roundEndContainer}>
            <GameTable {...gameTableProps} />
            <div className={styles.roundEndOverlay}>
              <div className={styles.roundEndPanel}>
                <h2>Round Complete!</h2>
                <div className={styles.roundScores}>
                  <div className={styles.scoreItem}>
                    <span className={styles.teamLabel}>Team 1:</span>
                    <span className={styles.scoreValue}>
                      +{state.roundScores.get('team1') || 0} points
                    </span>
                  </div>
                  <div className={styles.scoreItem}>
                    <span className={styles.teamLabel}>Team 2:</span>
                    <span className={styles.scoreValue}>
                      +{state.roundScores.get('team2') || 0} points
                    </span>
                  </div>
                </div>
                <div className={styles.totalScores}>
                  <h3>Total Scores</h3>
                  <div className={styles.scoreItem}>
                    <span className={styles.teamLabel}>Team 1:</span>
                    <span className={styles.scoreValue}>
                      {state.scores.get('team1') || 0}
                    </span>
                  </div>
                  <div className={styles.scoreItem}>
                    <span className={styles.teamLabel}>Team 2:</span>
                    <span className={styles.scoreValue}>
                      {state.scores.get('team2') || 0}
                    </span>
                  </div>
                </div>
                <button
                  className={styles.nextRoundButton}
                  onClick={() => dispatch({ type: 'START_ROUND' })}
                >
                  Start Next Round
                </button>
              </div>
            </div>
          </div>
        );

      case 'gameEnd':
        const team1Score = state.scores.get('team1') || 0;
        const team2Score = state.scores.get('team2') || 0;
        const winningTeam = team1Score > team2Score ? 'Team 1' : 'Team 2';

        return (
          <div className={styles.gameEndContainer}>
            <div className={styles.gameEndPanel}>
              <h1 className={styles.victoryTitle}>🎉 Game Over! 🎉</h1>
              <h2 className={styles.winnerAnnouncement}>
                {winningTeam} Wins!
              </h2>
              <div className={styles.finalScores}>
                <div className={`${styles.scoreItem} ${team1Score >= team2Score ? styles.winner : ''}`}>
                  <span className={styles.teamLabel}>Team 1:</span>
                  <span className={styles.scoreValue}>{team1Score}</span>
                </div>
                <div className={`${styles.scoreItem} ${team2Score >= team1Score ? styles.winner : ''}`}>
                  <span className={styles.teamLabel}>Team 2:</span>
                  <span className={styles.scoreValue}>{team2Score}</span>
                </div>
              </div>
              <div className={styles.gameEndActions}>
                <button
                  className={styles.newGameButton}
                  onClick={() => window.location.reload()}
                >
                  New Game
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.gameBoard}>
      {/* Top info bar */}
      <div className={styles.topBar}>
        <div className={styles.gameTitle}>
          {state.currentRound > 0 ? `Round ${state.currentRound}` : 'Rook Card Game'}
        </div>
        <GameInfo />
      </div>

      {/* Main game content */}
      <div className={styles.gameContent}>
        {renderPhaseContent()}
      </div>

      {/* Announcement overlay */}
      {announcement && (
        <Announcement
          message={announcement}
          onComplete={() => setAnnouncement(null)}
        />
      )}
    </div>
  );
};
