export interface IMatch {
  id: string;
  groupId: string;
  roundId: string;
  player1: {
    id: string;
    name: string;
    score: number | 'W.O' | '-';
  };
  player2: {
    id: string;
    name: string;
    score: number | 'W.O' | '-';
  };
  winnerId?: string;
}
