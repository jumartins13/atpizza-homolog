import { Injectable, inject } from "@angular/core";
import {
  BehaviorSubject,
  Observable,
  from,
  map,
  tap,
  switchMap,
  throwError,
  catchError,
  of,
} from "rxjs";
import { LoggerService } from "./logger.service";
import {
  PlayerCreatedPayload,
  PlayerResponse,
  PlayersResponse,
  UpdatePlayerPayload,
} from "@models/player/player.dto";
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  doc,
  setDoc,
  updateDoc,
} from "@angular/fire/firestore";
import { Auth } from "@angular/fire/auth";
import { CollectionReference, getDoc, getDocs, query, where } from "firebase/firestore";
import { IMatch } from "@app/models/match/matches.model";
import { Availability } from "@app/models/calendar/calendar.model";

@Injectable({
  providedIn: "root",
})
export class PlayerService {
  private auth = inject(Auth);
  private logger = inject(LoggerService);

  playerId: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(
    null
  );
  player$ = new BehaviorSubject<PlayerResponse | null>(null);

  constructor(public firestore: Firestore) {}

  setPlayer(player: PlayerResponse) {
    this.player$.next(player);
  }

  getPlayers(): Observable<PlayersResponse> {
    const playersRef = collection(this.firestore, "players");
    return collectionData(playersRef, {
      idField: "id",
    }) as Observable<PlayersResponse>;
  }

  getPlayer(email: string): Observable<any> {
    const playersRef = collection(this.firestore, "players");
    const q = query(playersRef, where("email", "==", email));

    return from(getDocs(q)).pipe(
      map((user) => {
        if (user.empty) return null;

        const docData = user.docs[0].data() as Omit<PlayersResponse[0], "id">;
        return {
          id: user.docs[0].id,
          ...docData,
          details: docData.details || {
            country: "",
            height: "",
            startOfTheRanking: "",
            socialNetwork: "",
            mainHand: "",
            backHand: "",
          },
        };
      })
    );
  }

  getPlayerByUid(uid: string): Observable<any> {
    const playerDocRef = doc(this.firestore, "players", uid);

    return from(getDoc(playerDocRef)).pipe(
      map((docSnap) => {
        if (!docSnap.exists()) {
          return null;
        }

        const docData = docSnap.data() as Omit<PlayersResponse[0], "id">;
        return {
          id: docSnap.id,
          ...docData,
          details: docData.details || {
            country: "",
            height: "",
            startOfTheRanking: "",
            socialNetwork: "",
            mainHand: "",
            backHand: "",
          },
        };
      }),
      catchError((error) => {
        this.logger.error('❌ Erro ao buscar player por UID:', error);
        return of(null);
      })
    );
  }

  createPlayer(player: PlayerCreatedPayload): Observable<any> {
    const playersDocRef = doc(this.firestore, `players/${player.id}`);

    const updateData = { name: player.name };

    return from(updateDoc(playersDocRef, updateData));
  }

  updatePlayer(player: UpdatePlayerPayload): Observable<void> {
    this.logger.log('🔧 PlayerService.updatePlayer called with:', player);
    const playersDocRef = doc(this.firestore, `players/${player.id}`);

    const updateData = {
      name: player.name || "",
      details: player.details,
      avatarUrl: player.avatarUrl || "",
    };

    this.logger.log('🔧 Firebase updateDoc will be called with:', updateData);
    this.logger.log('🔧 Document path:', `players/${player.id}`);

    return from(updateDoc(playersDocRef, updateData)).pipe(
      tap(() => this.logger.log('🔧 Firebase updateDoc completed successfully')),
      catchError(error => {
        this.logger.error('🔧 Firebase updateDoc failed:', error);
        return throwError(() => error);
      })
    );
  }

  // Método no PlayerService para buscar calendário
getAvailabilityCalendar(playerId: string): Observable<any | null> {
  const calendarDocRef = doc(this.firestore, `availabilityCalendars/${playerId}`);
  return from(getDoc(calendarDocRef)).pipe(
    map(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        this.logger.log('📅 Calendário carregado do Firebase:', data);
        return data;
      }
      return null;
    }),
    catchError(error => {
      this.logger.error('❌ Erro ao carregar calendário:', error);
      return of(null);
    })
  );
}

// Método para salvar/atualizar calendário
saveAvailabilityCalendar(playerId: string, availabilities: Availability[]): Observable<void> {
  const calendarDocRef = doc(this.firestore, `availabilityCalendars/${playerId}`);

  // DEBUG: Verificar estado da autenticação
  this.logger.log('🔍 DEBUG Calendar Save:');
  this.logger.log('- playerId:', playerId);
  this.logger.log('- Auth current user:', this.auth.currentUser);
  this.logger.log('- User UID:', this.auth.currentUser?.uid);
  this.logger.log('- User email:', this.auth.currentUser?.email);
  this.logger.log('- Email verified:', this.auth.currentUser?.emailVerified);

  // Transforma as disponibilidades no formato para o Firestore
  const calendarData = {
    playerId,
    updatedAt: new Date().toISOString(),
    availabilities: availabilities.map(av => ({
      date: av.date,
      startTime: av.startTime,
      endTime: av.endTime,
      status: av.status,
      notes: av.notes || ''
    }))
  };

  this.logger.log('💾 Salvando calendário no Firebase:', calendarData);

  return from(setDoc(calendarDocRef, calendarData, { merge: true })).pipe(
    tap(() => this.logger.log('✅ Calendário salvo com sucesso!')),
    catchError(error => {
      this.logger.error('❌ Erro ao salvar calendário:', error);
      return throwError(() => error);
    })
  );
}


  // Mesma consulta, porém convertida para Signal, com error handling e valor inicial
  // getPlayersSignal(): Signal<PlayersResponse> {
  //   return toSignal(
  //     this.http.get<PlayersResponse>(this.baseUrl).pipe(
  //       catchError(err => {

  //         return of([]);
  //       })
  //     ),
  //     {
  //       initialValue: []
  //     }
  //   );
  // }
}
