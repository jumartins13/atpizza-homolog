import { Injectable } from "@angular/core";
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
} from "@angular/fire/firestore";
import { catchError, from, map, of } from "rxjs";
import { PlayerService } from "./player.service";
import { RoundService } from "./round.service";

@Injectable({
  providedIn: "root",
})
export class RankingsService {
  constructor(
    public firestore: Firestore,
    private playerService: PlayerService,
    private roundService: RoundService
  ) {}

  getLatestRankings() {
    const rankingsRef = collection(this.firestore, 'rankings');
    const q = query(rankingsRef, orderBy('createdAt', 'desc'), limit(1));

    return from(getDocs(q)).pipe(
      map((snapshot) => {
        if (snapshot.empty) {
          return null;
        }
        
        const doc = snapshot.docs[0];
        const docData = doc.data() as any;
        
        return docData?.data || null;
      }),
      catchError(() => {
        return of(null);
      })
    );
  }

  getPreviousAccumulatedRanking() {
    const rankingsRef = collection(this.firestore, 'rankings');
    const q = query(rankingsRef, orderBy('createdAt', 'desc'), limit(2));
  
    return from(getDocs(q)).pipe(
      map((snapshot) => {
        const docs = snapshot.docs;
  
        if (docs.length < 2) {
          return [];
        }
  
        const previousDoc = docs[1]; // segundo mais recente (rodada anterior)
        const previousData = previousDoc.data() as any;
  
        return previousData?.data || [];
      }),
      catchError(() => {
        return of([]);
      })
    );
  }

  getAccumulatedRankingUntilRound(roundId: string) {
    const ref = doc(this.firestore, `rankings/${roundId}`);
    return from(getDoc(ref)).pipe(
      map((docSnap) => {
        if (!docSnap.exists()) {
          console.warn(`⚠️ Documento rankings/${roundId} não encontrado.`);
          return [];
        }
  
        const data = docSnap.data()?.['data'];
        if (!Array.isArray(data)) {
          console.warn(`⚠️ Dados inválidos em rankings/${roundId}`);
          return [];
        }
  
        return data;
      }),
      catchError((err) => {
        // console.error(`❌ Erro ao buscar rankings/${roundId}:`, err);
        return of([]);
      })
    );
  }
}