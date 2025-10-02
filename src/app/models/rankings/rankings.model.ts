import { Timestamp } from "@angular/fire/firestore";

export interface IRankingData {
  playerId: string;
  position: number;
  scorePoints: number;
  positionChange?: number;
  finalRoundIndex?: number;
}

export interface IRanking {
    roundId: string;
    createdAt: any;
    data: IRankingData[];
  }

  export interface IRoundsHistoryPlayer {
    playerId: string;
    roundId: string;
    points: number;
    position: number;
    groupPosition: number;
    groupId: string;
    createdAt: Timestamp;
    positionChange?: number;
    finalRoundIndex?: number;
  }

  