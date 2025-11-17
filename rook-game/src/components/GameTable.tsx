import { PlayerHand } from './PlayerHand';
import { TrickArea } from './TrickArea';
import { ScoreButton } from './ScoreButton';
import { HelpButton } from './HelpButton';
import type { Card, Player, Trick } from '../types';
import styles from './GameTable.module.css';

interface GameTableProps {
    players: Player[];
    humanPlayerId: string;
    nest: Card[];
    currentTrick: Trick | null;
    trumpColor: string | null;
    onCardClick: (card: Card) => void;
    selectedCard: Card | null;
    playableCards: Set<string>;
    phase?: string;
    highBidder?: string | null;
    currentBid?: { playerId: string; amount: number } | null;
    calledCard?: Card | null;
    partnerRevealed?: boolean;
}

const CardBack = ({ count }: { count: number }) => (
    <div className={styles.cardBack}>
        <div className={styles.cardBackPattern}>
            <div className={styles.cardBackCount}>{count}</div>
        </div>
    </div>
);

export const GameTable = ({
    players,
    humanPlayerId,
    nest,
    currentTrick,
    trumpColor,
    onCardClick,
    selectedCard,
    playableCards,
    phase,
    highBidder,
    currentBid,
    calledCard,
    partnerRevealed,
}: GameTableProps) => {
    // Find players by their position
    // Position 0 = Human (bottom)
    // Position 1 = Left
    // Position 2 = Top (across)
    // Position 3 = Right
    const humanPlayer = players.find(p => p.id === humanPlayerId);
    const leftPlayer = players.find(p => p.position === 1);
    const topPlayer = players.find(p => p.position === 2);
    const rightPlayer = players.find(p => p.position === 3);

    // Helper to get display hand for opponent players
    // During nest selection, computer players temporarily have 18 cards (13 + 5 nest)
    // We should only show 13 cards to avoid confusion
    const getDisplayHand = (player: Player | undefined): Card[] => {
        if (!player) return [];
        
        // During nest selection, if this is the high bidder (not human), show only 13 cards
        if (phase === 'nestSelection' && player.id === highBidder && player.id !== humanPlayerId) {
            // Filter out nest cards to show only original 13
            const nestCardIds = new Set(nest.map(c => c.id));
            return player.hand.filter(c => !nestCardIds.has(c.id));
        }
        
        return player.hand;
    };

    // Determine what team information the human player knows
    const getKnownTeam = (player: Player | undefined): string | null => {
        if (!player || !humanPlayer || !calledCard || !highBidder) return null;
        
        // If partner is revealed, show actual teams
        if (partnerRevealed && player.teamId) {
            return player.teamId === 'team1' ? '1' : '2';
        }
        
        // If partner not revealed yet, determine what human knows
        if (phase === 'playing' && !partnerRevealed) {
            // Check if human player has the called card
            const humanHasCalledCard = humanPlayer.hand.some(c => c.id === calledCard.id);
            
            if (humanHasCalledCard) {
                // Human is the partner
                if (player.id === humanPlayerId || player.id === highBidder) {
                    return '1'; // Human and bidder are team 1
                } else {
                    return '2'; // Others are team 2
                }
            } else {
                // Human is not the partner
                if (player.id === humanPlayerId) {
                    return '2'; // Human is team 2
                } else if (player.id === highBidder) {
                    return '1'; // Bidder is team 1
                } else {
                    return null; // Don't know about other players yet
                }
            }
        }
        
        return null;
    };

    // Calculate points captured by each player
    const calculatePoints = (player: Player | undefined): number => {
        if (!player) return 0;
        return player.capturedTricks.flat().reduce((sum, card) => sum + card.points, 0);
    };

    // Check if bid is broken for a player's team
    const getPointsInfo = (player: Player | undefined): { text: string; isBroken: boolean } => {
        if (!player || !currentBid || !highBidder) return { text: '0 pts', isBroken: false };
        
        const points = calculatePoints(player);
        
        // Only check if teams are assigned
        if (!player.teamId) return { text: `${points} pts`, isBroken: false };
        
        // Find the bidding team
        const bidderPlayer = players.find(p => p.id === highBidder);
        if (!bidderPlayer || !bidderPlayer.teamId) return { text: `${points} pts`, isBroken: false };
        
        const biddingTeamId = bidderPlayer.teamId;
        const opposingTeamId = biddingTeamId === 'team1' ? 'team2' : 'team1';
        
        // Calculate both teams' points
        const biddingTeamPoints = players
            .filter(p => p.teamId === biddingTeamId)
            .reduce((sum, p) => sum + calculatePoints(p), 0);
        
        const opposingTeamPoints = players
            .filter(p => p.teamId === opposingTeamId)
            .reduce((sum, p) => sum + calculatePoints(p), 0);
        
        // Calculate remaining points in play
        const totalPointsInGame = 120;
        const pointsCaptured = biddingTeamPoints + opposingTeamPoints;
        const remainingPoints = totalPointsInGame - pointsCaptured;
        
        // Bid is broken if opposing team has enough points that bidding team can't reach their bid
        // even if they win all remaining points
        const isBidBroken = biddingTeamPoints + remainingPoints < currentBid.amount;
        
        // If player is on bidding team and bid is broken, show negative bid amount
        if (player.teamId === biddingTeamId && isBidBroken) {
            return { text: `-${currentBid.amount} pts`, isBroken: true };
        }
        
        return { text: `${points} pts`, isBroken: false };
    };

    return (
        <div className={styles.gameTable}>
            {/* Top Player (Across) - Position 2 */}
            {topPlayer && (
                <div className={styles.topPlayer}>
                    <div className={styles.playerInfo}>
                        <div className={styles.playerName}>
                            {topPlayer.name}
                            {highBidder === topPlayer.id && currentBid && (
                                <span className={styles.bidBadge}>Bid: {currentBid.amount}</span>
                            )}
                        </div>
                        <div className={styles.playerTeam}>
                            {getKnownTeam(topPlayer) ? `Team ${getKnownTeam(topPlayer)}` : 'Team ?'}
                        </div>
                        {phase === 'playing' && (() => {
                            const pointsInfo = getPointsInfo(topPlayer);
                            return (
                                <div className={`${styles.playerPoints} ${pointsInfo.isBroken ? styles.broken : (topPlayer.teamId ? styles[`team${topPlayer.teamId === 'team1' ? '1' : '2'}`] : styles.noTeam)}`}>
                                    {pointsInfo.text}
                                </div>
                            );
                        })()}
                    </div>
                    <div className={styles.opponentHand}>
                        {getDisplayHand(topPlayer).map((_, index) => (
                            <div key={index} className={styles.opponentCard}>
                                <CardBack count={getDisplayHand(topPlayer).length} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Left Player - Position 1 */}
            {leftPlayer && (
                <div className={styles.leftPlayer}>
                    <div className={styles.playerInfo}>
                        <div className={styles.playerName}>
                            {leftPlayer.name}
                            {highBidder === leftPlayer.id && currentBid && (
                                <span className={styles.bidBadge}>Bid: {currentBid.amount}</span>
                            )}
                        </div>
                        <div className={styles.playerTeam}>
                            {getKnownTeam(leftPlayer) ? `Team ${getKnownTeam(leftPlayer)}` : 'Team ?'}
                        </div>
                        {phase === 'playing' && (() => {
                            const pointsInfo = getPointsInfo(leftPlayer);
                            return (
                                <div className={`${styles.playerPoints} ${pointsInfo.isBroken ? styles.broken : (leftPlayer.teamId ? styles[`team${leftPlayer.teamId === 'team1' ? '1' : '2'}`] : styles.noTeam)}`}>
                                    {pointsInfo.text}
                                </div>
                            );
                        })()}
                    </div>
                    <div className={styles.opponentHandVertical}>
                        {getDisplayHand(leftPlayer).map((_, index) => (
                            <div key={index} className={styles.opponentCardVertical}>
                                <CardBack count={getDisplayHand(leftPlayer).length} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Right Player - Position 3 */}
            {rightPlayer && (
                <div className={styles.rightPlayer}>
                    <div className={styles.playerInfo}>
                        <div className={styles.playerName}>
                            {rightPlayer.name}
                            {highBidder === rightPlayer.id && currentBid && (
                                <span className={styles.bidBadge}>Bid: {currentBid.amount}</span>
                            )}
                        </div>
                        <div className={styles.playerTeam}>
                            {getKnownTeam(rightPlayer) ? `Team ${getKnownTeam(rightPlayer)}` : 'Team ?'}
                        </div>
                        {phase === 'playing' && (() => {
                            const pointsInfo = getPointsInfo(rightPlayer);
                            return (
                                <div className={`${styles.playerPoints} ${pointsInfo.isBroken ? styles.broken : (rightPlayer.teamId ? styles[`team${rightPlayer.teamId === 'team1' ? '1' : '2'}`] : styles.noTeam)}`}>
                                    {pointsInfo.text}
                                </div>
                            );
                        })()}
                    </div>
                    <div className={styles.opponentHandVertical}>
                        {getDisplayHand(rightPlayer).map((_, index) => (
                            <div key={index} className={styles.opponentCardVertical}>
                                <CardBack count={getDisplayHand(rightPlayer).length} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Nest - always visible in top left during playing phase */}
            {nest.length > 0 && (
                <div className={styles.nest}>
                    <div className={styles.nestHeader}>
                        <div className={styles.nestLabel}>Nest</div>
                        {phase === 'playing' && (
                            nest.some(card => card.points && card.points > 0) ? (
                                <div className={styles.nestPoints}>HAS POINTS</div>
                            ) : (
                                <div className={styles.nestNoPoints}>NO POINTS</div>
                            )
                        )}
                    </div>
                    <div className={styles.nestCards}>
                        {nest.map((_, index) => (
                            <div key={index} className={styles.nestCard}>
                                <CardBack count={nest.length} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Center Area (Trick Area) */}
            {currentTrick && currentTrick.cards.size > 0 && (
                <div className={styles.centerArea}>
                    <TrickArea 
                        trick={currentTrick} 
                        players={players}
                        trumpColor={trumpColor}
                    />
                </div>
            )}

            {/* Fixed Buttons */}
            <ScoreButton />
            <HelpButton />

            {/* Bottom Player (Human) */}
            {humanPlayer && (
                <div className={styles.bottomPlayer}>
                    <div className={styles.playerInfo}>
                        <div className={styles.playerName}>
                            {humanPlayer.name} <span className={styles.youBadge}>YOU</span>
                            {highBidder === humanPlayer.id && currentBid && (
                                <span className={styles.bidBadge}>Bid: {currentBid.amount}</span>
                            )}
                        </div>
                        <div className={styles.playerTeam}>
                            {getKnownTeam(humanPlayer) ? `Team ${getKnownTeam(humanPlayer)}` : 'Team ?'}
                        </div>
                        {phase === 'playing' && (() => {
                            const pointsInfo = getPointsInfo(humanPlayer);
                            return (
                                <div className={`${styles.playerPoints} ${pointsInfo.isBroken ? styles.broken : (humanPlayer.teamId ? styles[`team${humanPlayer.teamId === 'team1' ? '1' : '2'}`] : styles.noTeam)}`}>
                                    {pointsInfo.text}
                                </div>
                            );
                        })()}
                    </div>
                    <PlayerHand
                        cards={humanPlayer.hand}
                        playableCards={playableCards}
                        onCardClick={onCardClick}
                        selectedCard={selectedCard}
                    />
                </div>
            )}
        </div>
    );
};
