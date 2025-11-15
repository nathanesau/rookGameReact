import { useState, useMemo, useEffect } from 'react';
import { useGame } from '../contexts';
import { GameTable } from './GameTable';
import { BiddingPanel } from './BiddingPanel';
import { NestDisplay } from './NestDisplay';
import { TrumpSelector } from './TrumpSelector';
import { GameInfo } from './GameInfo';
import { getPlayableCards } from '../utils/gameEngine';
import { aiMakeBid, aiSelectNestCards, aiSelectTrump, aiPlayCard } from '../utils/aiPlayer';
import type { Card, CardColor } from '../types';
import styles from './GameBoard.module.css';

export const GameBoard = () => {
  const { state, dispatch } = useGame();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

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

    const delay = 800; // Delay for more natural feel

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
          const cardsToDiscard = aiSelectNestCards(player.hand);
          dispatch({
            type: 'SELECT_NEST_CARDS',
            payload: { cards: cardsToDiscard },
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
  }, [state, humanPlayerId, dispatch]);

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
  const handleDiscard = (cards: Card[]) => {
    dispatch({
      type: 'SELECT_NEST_CARDS',
      payload: { cards },
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

      case 'bidding':
        return (
          <>
            <GameTable
              players={state.players}
              humanPlayerId={humanPlayerId}
              nest={state.nest}
              currentTrick={state.currentTrick}
              trumpColor={state.trumpColor}
              onCardClick={handleCardClick}
              selectedCard={selectedCard}
              playableCards={playableCards}
            />
            <div className={styles.biddingOverlay}>
              <BiddingPanel
                currentBid={state.currentBid}
                currentPlayerId={state.currentPlayerId}
                humanPlayerId={humanPlayerId}
                passedPlayers={state.passedPlayers}
                playerHand={humanPlayer?.hand || []}
                onPlaceBid={handlePlaceBid}
                onPass={handlePass}
                onCallRedeal={handleCallRedeal}
              />
            </div>
          </>
        );

      case 'nestSelection':
        return (
          <div className={styles.nestSelectionContainer}>
            <NestDisplay
              hand={humanPlayer?.hand || []}
              onDiscard={handleDiscard}
            />
          </div>
        );

      case 'trumpSelection':
        return (
          <div className={styles.trumpSelectionContainer}>
            <TrumpSelector onSelectTrump={handleSelectTrump} />
          </div>
        );

      case 'playing':
        return (
          <GameTable
            players={state.players}
            humanPlayerId={humanPlayerId}
            nest={state.nest}
            currentTrick={state.currentTrick}
            trumpColor={state.trumpColor}
            onCardClick={handleCardClick}
            selectedCard={selectedCard}
            playableCards={playableCards}
          />
        );

      case 'roundEnd':
        return (
          <div className={styles.roundEndContainer}>
            <GameTable
              players={state.players}
              humanPlayerId={humanPlayerId}
              nest={state.nest}
              currentTrick={state.currentTrick}
              trumpColor={state.trumpColor}
              onCardClick={handleCardClick}
              selectedCard={selectedCard}
              playableCards={playableCards}
            />
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
        <div className={styles.gameTitle}>Rook Card Game</div>
        <GameInfo />
      </div>

      {/* Main game content */}
      <div className={styles.gameContent}>
        {renderPhaseContent()}
      </div>
    </div>
  );
};
