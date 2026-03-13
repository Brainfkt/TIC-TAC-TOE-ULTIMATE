export type Player = 'X' | 'O' | null;
export type GameStatus = 'waiting' | 'playing' | 'draw' | 'X_wins' | 'O_wins';

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  count: number;
}

export interface Cell {
  player: Player;
  isWinningCell?: boolean;
  blockedTurns?: number; // 0 or undefined = not blocked
}

export interface SmallGrid {
  cells: Cell[];
  winner: Player;
  isFull: boolean;
}

export interface GameState {
  board: SmallGrid[];
  currentPlayer: Player;
  nextSmallGridIndex: number | null;
  status: GameStatus;
  scores: { X: number; O: number };
  playerInfo: {
    X: { name: string; avatar: string }; // avatar can be dataURI or emoji
    O: { name: string; avatar: string };
  };
  powerUps: {
    X: PowerUp[];
    O: PowerUp[];
  };
  timeLeft: number; // Seconds left for current turn
  nextTurnTimeLimit?: number; // Custom limit for the next turn (Sabotage)
  isPaused: boolean;
}

export const INITIAL_POWER_UPS: PowerUp[] = [
  { id: 'sabotage', name: 'Sabotage', description: 'Réduit le prochain tour de l\'adversaire à 1 seconde.', count: 1 },
  { id: 'block', name: 'Bloqueur', description: 'Bloque une case pendant 1 tour.', count: 1 },
  { id: 'swap', name: 'Voleur', description: 'Remplace une pièce adverse par la vôtre.', count: 1 },
];

export const createInitialState = (): GameState => ({
  board: Array(9).fill(null).map(() => ({
    cells: Array(9).fill(null).map(() => ({ player: null, blockedTurns: 0 })),
    winner: null,
    isFull: false,
  })),
  currentPlayer: 'X',
  nextSmallGridIndex: null,
  status: 'waiting',
  scores: { X: 0, O: 0 },
  playerInfo: {
    X: { name: 'BLEU', avatar: '👤' },
    O: { name: 'ROUGE', avatar: '👤' },
  },
  powerUps: {
    X: [...INITIAL_POWER_UPS],
    O: [...INITIAL_POWER_UPS],
  },
  timeLeft: 5,
  isPaused: true,
});

export const checkWin = (cells: (Player | { player: Player })[]): Player => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  const getPlayer = (cell: any): Player => {
    if (!cell) return null;
    return typeof cell === 'object' ? cell.player : cell;
  };

  for (const [a, b, c] of lines) {
    const pA = getPlayer(cells[a]);
    const pB = getPlayer(cells[b]);
    const pC = getPlayer(cells[c]);

    if (pA && pA === pB && pA === pC) {
      return pA;
    }
  }
  return null;
};
