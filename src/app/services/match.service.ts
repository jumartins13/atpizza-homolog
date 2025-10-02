import { Injectable } from "@angular/core";
import {
  BehaviorSubject,
  Observable,
  forkJoin,
  from,
  map,
  switchMap,
  take,
  tap,
} from "rxjs";
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  doc,
  updateDoc,
  setDoc,
  getDocs,
} from "@angular/fire/firestore";
import { IMatch } from "@app/models/match/matches.model";

@Injectable({
  providedIn: "root",
})
export class MatchService {
  currentMatches: IMatch[] = [];

  groupMatches = new BehaviorSubject<IMatch[]>([]);
  matchesForGroup$ = this.groupMatches.asObservable();

  groupLoadingMatches = new BehaviorSubject<boolean>(false);
  matchesLoading$ = this.groupLoadingMatches.asObservable();

  groupMessageMatches = new BehaviorSubject<string>("");
  matchesMessage$ = this.groupMessageMatches.asObservable();

  currentGroupId = new BehaviorSubject<string | null>(null);
  currentGroupId$ = this.currentGroupId.asObservable();

  constructor(public firestore: Firestore) {}

  getPendingMatches(): IMatch[] {
    return this.currentMatches.filter(
      (m) => m.player1.score === "-" || m.player2.score === "-"
    );
  }

  getCompletedMatches(): IMatch[] {
    return this.currentMatches.filter(
      (m) => m.player1.score !== "-" && m.player2.score !== "-"
    );
  }

  setMatchesForGroup(matches: IMatch[]): void {
    this.currentMatches = matches;
    this.groupMatches.next(matches);
  }
  setMatchesLoading(loading: boolean): void {
    this.groupLoadingMatches.next(loading);
  }

  setMatchesMessage(message: string): void {
    this.groupMessageMatches.next(message);
  }

  getCurrentMatches(): IMatch[] {
    return this.currentMatches;
  }

  getMatchesByGroup(groupId: string): Observable<IMatch[]> {
    // console.log("MatchService: Definindo currentGroupId para:", groupId);
    this.currentGroupId.next(groupId);

    const matchesRef = collection(this.firestore, `groups/${groupId}/matches`);
    // console.log("MatchService: Buscando partidas em:", matchesRef.path);

    this.setMatchesLoading(true);
    this.setMatchesMessage("");

    return (
      collectionData(matchesRef, { idField: "id" }) as Observable<IMatch[]>
    ).pipe(
      tap({
        next: (matches: IMatch[]) => {
          this.setMatchesForGroup(matches);
          this.setMatchesLoading(false);
          if (matches.length === 0) {
            this.setMatchesMessage("Parabéns! Jogos concluídos! ✅");
          }
        },
        error: (err) => {
          this.setMatchesForGroup([]);
          this.setMatchesLoading(false);
          this.setMatchesMessage("Erro ao carregar partidas.");
        },
      })
    );
  }

  setWOForMatch(groupId: string, match: IMatch, woPlayerId: string): Observable<void> {
    const isPlayer1 = match.player1.id === woPlayerId;
    const isPlayer2 = match.player2.id === woPlayerId;

    if (!isPlayer1 && !isPlayer2) {
      throw new Error("Jogador não faz parte da partida.");
    }

    const opponent = isPlayer1 ? match.player2 : match.player1;
    const opponentAlreadyWO = opponent.score === "W.O";

    const updatedMatch: IMatch = { ...match };

    if (isPlayer1) {
      updatedMatch.player1.score = "W.O";
      updatedMatch.player2.score = opponentAlreadyWO ? "W.O" : 6;
      updatedMatch.winnerId = opponentAlreadyWO ? "" : updatedMatch.player2.id;
    } else if (isPlayer2) {
      updatedMatch.player2.score = "W.O";
      updatedMatch.player1.score = opponentAlreadyWO ? "W.O" : 6;
      updatedMatch.winnerId = opponentAlreadyWO ? "" : updatedMatch.player1.id;
    }

    return this.updateMatchInGroup(groupId, updatedMatch);
  }
  updateMatchInGroup(groupId: string, match: IMatch): Observable<void> {
    const matchDocRef = doc(this.firestore, `groups/${groupId}/matches/${match.id}`);
    return from(setDoc(matchDocRef, match)).pipe(map(() => void 0));
  }

  async uploadAllScores(): Promise<void> {
    const scoresData = {
      'A': [
        { p1: 'Hugo Boccaletti', p2: 'Thiago Soller', s1: 2, s2: 6 },
        { p1: 'Hugo Boccaletti', p2: 'Raphael Portella', s1: 4, s2: 6 },
        { p1: 'Hugo Boccaletti', p2: 'Marcelo Taylor', s1: 5, s2: 7 },
        { p1: 'Hugo Boccaletti', p2: 'André Telles', s1: 6, s2: 4 },
        { p1: 'Thiago Soller', p2: 'Raphael Portella', s1: 6, s2: 2 },
        { p1: 'Thiago Soller', p2: 'Marcelo Taylor', s1: 6, s2: 0 },
        { p1: 'Thiago Soller', p2: 'André Telles', s1: 6, s2: 0 },
        { p1: 'Raphael Portella', p2: 'Marcelo Taylor', s1: 7, s2: 6 },
        { p1: 'Raphael Portella', p2: 'André Telles', s1: 6, s2: 3 },
        { p1: 'Marcelo Taylor', p2: 'André Telles', s1: 6, s2: 2 }
      ],
      'B': [
        { p1: 'Patrick Wandelli', p2: 'Xiomara', s1: 6, s2: 3 },
        { p1: 'Patrick Wandelli', p2: 'Vinícus Côrtes', s1: 6, s2: 1 },
        { p1: 'Patrick Wandelli', p2: 'Philipe Peixoto', s1: 6, s2: 3 },
        { p1: 'Patrick Wandelli', p2: 'Newtinho', s1: 6, s2: 2 },
        { p1: 'Xiomara', p2: 'Vinícus Côrtes', s1: 5, s2: 7 },
        { p1: 'Xiomara', p2: 'Philipe Peixoto', s1: 4, s2: 6 },
        { p1: 'Xiomara', p2: 'Newtinho', s1: 3, s2: 6 },
        { p1: 'Vinícus Côrtes', p2: 'Philipe Peixoto', s1: 2, s2: 6 },
        { p1: 'Vinícus Côrtes', p2: 'Newtinho', s1: 6, s2: 1 },
        { p1: 'Philipe Peixoto', p2: 'Newtinho', s1: 6, s2: 0 }
      ],
      'C': [
        { p1: 'Arthur Rodrigues', p2: 'Renan Porto', s1: 6, s2: 0 },
        { p1: 'Arthur Rodrigues', p2: 'Lúcio Pires', s1: 6, s2: 3 },
        { p1: 'Arthur Rodrigues', p2: 'Pedro Villares', s1: 0, s2: 6 },
        { p1: 'Arthur Rodrigues', p2: 'Marrafa', s1: 4, s2: 6 },
        { p1: 'Renan Porto', p2: 'Lúcio Pires', s1: 0, s2: 6 },
        { p1: 'Renan Porto', p2: 'Pedro Villares', s1: 0, s2: 6 },
        { p1: 'Renan Porto', p2: 'Marrafa', s1: 0, s2: 6 },
        { p1: 'Lúcio Pires', p2: 'Pedro Villares', s1: 4, s2: 6 },
        { p1: 'Lúcio Pires', p2: 'Marrafa', s1: 0, s2: 6 },
        { p1: 'Pedro Villares', p2: 'Marrafa', s1: 7, s2: 5 }
      ],
      'D': [
        { p1: 'Felipe Cesário', p2: 'Daniel Carrilho', s1: 6, s2: 1 },
        { p1: 'Felipe Cesário', p2: 'André Ramos', s1: 6, s2: 2 },
        { p1: 'Felipe Cesário', p2: 'Luis Guilhermo', s1: 6, s2: 3 },
        { p1: 'Felipe Cesário', p2: 'Davi Antunes', s1: 6, s2: 2 },
        { p1: 'Daniel Carrilho', p2: 'André Ramos', s1: 6, s2: 4 },
        { p1: 'Daniel Carrilho', p2: 'Luis Guilhermo', s1: 6, s2: 4 },
        { p1: 'Daniel Carrilho', p2: 'Davi Antunes', s1: 6, s2: 1 },
        { p1: 'André Ramos', p2: 'Luis Guilhermo', s1: 6, s2: 3 },
        { p1: 'André Ramos', p2: 'Davi Antunes', s1: 6, s2: 4 },
        { p1: 'Luis Guilhermo', p2: 'Davi Antunes', s1: 5, s2: 7 }
      ],
      'E': [
        { p1: 'Diego Peres', p2: 'Paulo Ricardo', s1: 6, s2: 0 },
        { p1: 'Diego Peres', p2: 'Gilson Souza', s1: 6, s2: 1 },
        { p1: 'Diego Peres', p2: 'Eduardo Henriques', s1: 1, s2: 6 },
        { p1: 'Diego Peres', p2: 'Victor Mendonça', s1: 1, s2: 6 },
        { p1: 'Paulo Ricardo', p2: 'Gilson Souza', s1: 0, s2: 6 },
        { p1: 'Paulo Ricardo', p2: 'Eduardo Henriques', s1: 0, s2: 6 },
        { p1: 'Paulo Ricardo', p2: 'Victor Mendonça', s1: 0, s2: 6 },
        { p1: 'Gilson Souza', p2: 'Eduardo Henriques', s1: 1, s2: 6 },
        { p1: 'Gilson Souza', p2: 'Victor Mendonça', s1: 2, s2: 6 },
        { p1: 'Eduardo Henriques', p2: 'Victor Mendonça', s1: null, s2: null } // Aguardando
      ],
      'F': [
        { p1: 'Victor Marconi', p2: 'Herika Cristina', s1: 6, s2: 0 },
        { p1: 'Victor Marconi', p2: 'Ewerton Reis', s1: 6, s2: 1 },
        { p1: 'Victor Marconi', p2: 'Matheus Leitão', s1: 6, s2: 0 },
        { p1: 'Victor Marconi', p2: 'Sofia', s1: 6, s2: 0 },
        { p1: 'Herika Cristina', p2: 'Ewerton Reis', s1: 0, s2: 6 },
        { p1: 'Herika Cristina', p2: 'Matheus Leitão', s1: 0, s2: 6 },
        { p1: 'Herika Cristina', p2: 'Sofia', s1: 6, s2: 1 },
        { p1: 'Ewerton Reis', p2: 'Matheus Leitão', s1: 4, s2: 6 },
        { p1: 'Ewerton Reis', p2: 'Sofia', s1: 2, s2: 6 },
        { p1: 'Matheus Leitão', p2: 'Sofia', s1: 6, s2: 2 }
      ],
      'G': [
        { p1: 'Marcello Moraes', p2: 'Andreza Cristina', s1: null, s2: null },
        { p1: 'Marcello Moraes', p2: 'Juliana Martins', s1: 3, s2: 6 },
        { p1: 'Marcello Moraes', p2: 'Jorge Pereira', s1: 3, s2: 6 },
        { p1: 'Marcello Moraes', p2: 'Silvia Lindgren', s1: 6, s2: 'W.O' },
        { p1: 'Andreza Cristina', p2: 'Juliana Martins', s1: 4, s2: 6 },
        { p1: 'Andreza Cristina', p2: 'Jorge Pereira', s1: 0, s2: 6 },
        { p1: 'Andreza Cristina', p2: 'Silvia Lindgren', s1: 6, s2: 'W.O' },
        { p1: 'Juliana Martins', p2: 'Jorge Pereira', s1: 3, s2: 6 },
        { p1: 'Juliana Martins', p2: 'Silvia Lindgren', s1: 6, s2: 'W.O' },
        { p1: 'Jorge Pereira', p2: 'Silvia Lindgren', s1: 6, s2: 3 }
      ],
      'H': [
        { p1: 'Luís Jorge', p2: 'André Máximo', s1: 6, s2: 3 },
        { p1: 'Luís Jorge', p2: 'Renato Lopes', s1: 6, s2: 2 },
        { p1: 'Luís Jorge', p2: 'Guilherme Mendes', s1: 6, s2: 0 },
        { p1: 'Luís Jorge', p2: 'Ciro', s1: 4, s2: 6 },
        { p1: 'André Máximo', p2: 'Renato Lopes', s1: 6, s2: 4 },
        { p1: 'André Máximo', p2: 'Guilherme Mendes', s1: 6, s2: 3 },
        { p1: 'André Máximo', p2: 'Ciro', s1: 5, s2: 7 },
        { p1: 'Renato Lopes', p2: 'Guilherme Mendes', s1: null, s2: null },
        { p1: 'Renato Lopes', p2: 'Ciro', s1: 3, s2: 6 },
        { p1: 'Guilherme Mendes', p2: 'Ciro', s1: 6, s2: 7 }
      ],
    };
    
    try {
      // console.log('🚀 Iniciando upload de placares...');
      
      const playersSnapshot = await getDocs(collection(this.firestore, 'players'));
      const playerMap = new Map();
      
      playersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data['name']) {
          playerMap.set(data['name'].toLowerCase(), doc.id);
        }
      });

      // console.log(`📊 ${playerMap.size} jogadores carregados`);
      let totalUpdated = 0;
      let totalErrors = 0;

      for (const [groupId, matches] of Object.entries(scoresData)) {
        // console.log(`📋 Processando Grupo ${groupId}...`);
        
        const groupMatchesSnapshot = await getDocs(collection(this.firestore, `groups/${groupId}/matches`));
        
        if (!groupMatchesSnapshot.docs.length) {
          // console.log(`⚠️ Grupo ${groupId}: nenhuma partida encontrada`);
          continue;
        }
        
        for (const matchData of matches) {
          try {
            const { p1, p2, s1, s2 } = matchData;
            const p1Id = playerMap.get(p1.toLowerCase());
            const p2Id = playerMap.get(p2.toLowerCase());
            
            if (!p1Id || !p2Id) {
              console.warn(`❌ ${p1} / ${p2}: jogador não encontrado`);
              totalErrors++;
              continue;
            }

            const matchDoc = groupMatchesSnapshot.docs.find(doc => {
              const data = doc.data();
              return (data['player1']['id'] === p1Id && data['player2']['id'] === p2Id) ||
                     (data['player1']['id'] === p2Id && data['player2']['id'] === p1Id);
            });

            if (!matchDoc) {
              console.warn(`❌ ${p1} vs ${p2}: partida não encontrada no Firebase`);
              totalErrors++;
              continue;
            }

            const matchId = matchDoc.id;
            const matchDocData = matchDoc.data();
            
            const score1 = matchDocData['player1']['id'] === p1Id ? s1 : s2;
            const score2 = matchDocData['player1']['id'] === p1Id ? s2 : s1;
            
            let winnerId = '';
            if (typeof score1 === 'number' && typeof score2 === 'number') {
              if (score1 > score2) winnerId = matchDocData['player1']['id'];
              else if (score2 > score1) winnerId = matchDocData['player2']['id'];
            }

            const updateData = {
              'player1.score': score1,
              'player2.score': score2,
              winnerId: winnerId,
              updatedAt: new Date()
            };

            // Atualiza apenas na subcoleção do grupo (onde os matches realmente existem)
            await updateDoc(doc(this.firestore, `groups/${groupId}/matches`, matchId), updateData);
            
            // console.log(`✅ ${p1} ${s1} x ${s2} ${p2}`);
            totalUpdated++;
            
          } catch (error) {
            console.error(`❌ Erro ao processar ${matchData.p1} vs ${matchData.p2}:`, error);
            totalErrors++;
          }
        }
      }

      // console.log(`\n🎯 UPLOAD COMPLETO CONCLUÍDO!`);
      // console.log(`✅ ${totalUpdated} placares inseridos com sucesso`);
      // console.log(`❌ ${totalErrors} erros encontrados`);
      
      alert(`🎉 Sucesso! ${totalUpdated} placares inseridos de todos os grupos (A-I)!`);
      
    } catch (error) {
      console.error('❌ Erro geral:', error);
      alert('❌ Erro: ' + (error as Error).message);
    }
  }
  
}
