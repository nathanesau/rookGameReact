import { PlayerHand } from './PlayerHand';
import { TrickArea } from './TrickArea';
import { ScoreBoard } from './ScoreBoard';
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

    return (
        <div className={styles.gameTable}>
            {/* Top Player (Across) - Position 2 */}
            {topPlayer && (
                <div className={styles.topPlayer}>
                    <div className={styles.playerInfo}>
                        <div className={styles.playerName}>{topPlayer.name}</div>
                        <div className={styles.playerTeam}>Team {topPlayer.teamId === 'team1' ? '1' : '2'}</div>
                    </div>
                    <div className={styles.opponentHand}>
                        {topPlayer.hand.map((_, index) => (
                            <div key={index} className={styles.opponentCard}>
                                <CardBack count={topPlayer.hand.length} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Left Player - Position 1 */}
            {leftPlayer && (
                <div className={styles.leftPlayer}>
                    <div className={styles.playerInfo}>
                        <div className={styles.playerName}>{leftPlayer.name}</div>
                        <div className={styles.playerTeam}>Team {leftPlayer.teamId === 'team1' ? '1' : '2'}</div>
                    </div>
                    <div className={styles.opponentHandVertical}>
                        {leftPlayer.hand.map((_, index) => (
                            <div key={index} className={styles.opponentCardVertical}>
                                <CardBack count={leftPlayer.hand.length} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Right Player - Position 3 */}
            {rightPlayer && (
                <div className={styles.rightPlayer}>
                    <div className={styles.playerInfo}>
                        <div className={styles.playerName}>{rightPlayer.name}</div>
                        <div className={styles.playerTeam}>Team {rightPlayer.teamId === 'team1' ? '1' : '2'}</div>
                    </div>
                    <div className={styles.opponentHandVertical}>
                        {rightPlayer.hand.map((_, index) => (
                            <div key={index} className={styles.opponentCardVertical}>
                                <CardBack count={rightPlayer.hand.length} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Center Area (Trick Area or Nest) */}
            <div className={styles.centerArea}>
                {currentTrick && currentTrick.cards.size > 0 ? (
                    <TrickArea 
                        trick={currentTrick} 
                        players={players}
                        trumpColor={trumpColor}
                    />
                ) : (
                    <div className={styles.nest}>
                        <div className={styles.nestLabel}>Nest</div>
                        <div className={styles.nestCards}>
                            {nest.map((_, index) => (
                                <div key={index} className={styles.nestCard}>
                                    <CardBack count={nest.length} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ScoreBoard */}
            <div className={styles.scoreBoard}>
                <ScoreBoard />
            </div>

            {/* Bottom Player (Human) */}
            {humanPlayer && (
                <div className={styles.bottomPlayer}>
                    <div className={styles.playerInfo}>
                        <div className={styles.playerName}>
                            {humanPlayer.name} <span className={styles.youBadge}>YOU</span>
                        </div>
                        <div className={styles.playerTeam}>Team {humanPlayer.teamId === 'team1' ? '1' : '2'}</div>
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
