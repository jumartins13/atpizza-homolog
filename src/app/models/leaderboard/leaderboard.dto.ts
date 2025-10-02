
export interface ILeaderboardResponse {
    id: number;
    groupId: string;
    position: number;
    gamesDone: number; // jogos realizados
    victories: number;
    pointsInFavor: number; //  soma do placar dos games que ganhou mesmo perdendo o jogo
    pointsAgainst: number; // soma do placar dos games que o adversário fez 
    scoreBalance: number; // seria (pointsInFavor - pointsAgainst)
  }