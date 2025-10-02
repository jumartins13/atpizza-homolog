import { Injectable } from "@angular/core";
import { from, tap } from "rxjs";
import {
  Firestore,
  doc,
  setDoc,
  serverTimestamp,
} from "@angular/fire/firestore";
import { ILeaderboard } from "@app/models/leaderboard/leaderboard.model";

@Injectable({
  providedIn: "root",
})
export class LeaderboardService {
  constructor(public firestore: Firestore) {}

}
