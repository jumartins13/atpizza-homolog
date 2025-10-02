import { inject, Injectable } from "@angular/core";
import {
  Firestore,
  collection,
  doc,
  docData,
  query,
  where,
  limit,
  collectionData,
  orderBy,
  getDocs,
  getDoc,
  onSnapshot,
} from "@angular/fire/firestore";
import {
  IRanking,
  IRankingData,
  IRoundsHistoryPlayer,
} from "@app/models/rankings/rankings.model";
import { Round } from "@app/models/round/round.model";
import {
  BehaviorSubject,
  Observable,
  catchError,
  from,
  map,
  of,
  switchMap,
} from "rxjs";

@Injectable({ providedIn: "root" })
export class RoundService {
  isBlocked$ = new BehaviorSubject<boolean>(false);
  message$ = new BehaviorSubject<string>("");

  warningMessage$: Observable<string | null> = this.getRoundData().pipe(
    map((round) => {
      if (!round?.endDate) return null;

      const end = this.parseDate(round.endDate);
      if (!end) return null;

      const now = new Date();
      const diffInMs = end.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

      if (daysLeft <= 10 && daysLeft > 0) {
        return `⚠️ Restam ${daysLeft} dia${daysLeft === 1 ? '' : 's'} para o fim da rodada.`;
      }

      if( daysLeft <= 0) {
        return '🚨 A rodada será encerrada hoje!';
      }

      return null;
    }),
    catchError((err) => {
      // console.error('Erro ao calcular warning message:', err);
      return of(null);
    })
  );


  constructor(private firestore: Firestore) {
    const statusDoc = doc(this.firestore, "system", "status");

    onSnapshot(statusDoc, (docSnap) => {
      const data = docSnap.data();
      const isBlocked = !!data?.["isBlocked"];
      const message = data?.["message"] || "";

      this.isBlocked$.next(isBlocked);
      this.message$.next(message);
    }, (error) => {
      // console.error('Erro ao escutar mudanças no status:', error);
    });
  }

  getLatestRoundId$(groupId: string) {
    const groupRef = doc(this.firestore, `groups/${groupId}`);
    return from(getDoc(groupRef)).pipe(
      map((snap) => snap.data()?.["roundId"] ?? null),
      catchError((err) => {
        // console.error("Erro ao buscar roundId:", err);
        return of(null);
      })
    );
  }

  getRoundData(): Observable<Round | null> {
    const roundsRef = collection(this.firestore, "rounds");
    const activeRound = query(
      roundsRef,
      where("isActive", "==", true),
      limit(1)
    );

    return (
      collectionData(activeRound, { idField: "id" }) as Observable<Round[]>
    ).pipe(
      map((rounds) => {
        if (rounds.length > 0) {
          //console.log("Rodada ativa encontrada:", rounds[0]);
          return rounds[0];
        } else {
          //console.log("Nenhuma rodada encontrada.");
          return null;
        }
      })
    );
  }

  parseDate(input: string | { toDate: () => Date }): Date | null {
    if (typeof input === "string") {
      return new Date(input);
    }
    if (input?.toDate) {
      return input.toDate();
    }
    return null;
  }

  getRoundsHistoryIds(): Observable<{ id: string; createdAt: any }[]> {
    const roundsCollection = collection(this.firestore, "roundsHistory");
    const q = query(roundsCollection, orderBy("createdAt", "desc"));

    return from(getDocs(q)).pipe(
      map((snapshot) => {
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          createdAt: doc.data()["createdAt"],
        }));
      })
    );
  }

  getRoundsHistoryData(
    roundId: string
  ): Observable<{ data: IRoundsHistoryPlayer[] }> {
    const collectionRef = collection(
      this.firestore,
      `roundsHistory/${roundId}/players`
    );
    return from(getDocs(collectionRef)).pipe(
      map((snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            ...d,
            playerId: doc.id,
            roundId: roundId,
            points: d["points"],
            position: d["position"],
            groupPosition: d["groupPosition"],
            groupId: d["groupId"],
            createdAt: d["createdAt"],
          } as IRoundsHistoryPlayer;
        });
        return { data };
      })
    );
  }

  getAvailableYears(): Observable<number[]> {
    const roundsHistoryRef = collection(this.firestore, 'roundsHistory');
  
    return from(getDocs(roundsHistoryRef)).pipe(
      map((snapshot) => {
        const yearsSet = new Set<number>();
  
        snapshot.forEach((doc) => {
          const data = doc.data();
          const year = data?.['year'];
          if (typeof year === 'number') {
            yearsSet.add(year);
          }
        });
  
        return Array.from(yearsSet).sort((a, b) => b - a); // anos decrescentes
      }),
      catchError((err) => {
        // console.error('❌ Erro ao buscar anos disponíveis:', err);
        return of([]);
      })
    );
  }
}
