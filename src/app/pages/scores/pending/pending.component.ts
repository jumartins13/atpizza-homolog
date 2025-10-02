import { Component } from "@angular/core";
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import { matEditSharp } from "@ng-icons/material-icons/sharp";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatInputModule } from "@angular/material/input";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { IMatch } from "@app/models/match/matches.model";
import {
  Observable,
  Subscription,
  firstValueFrom,
  map,
  of,
  switchMap,
  take,
} from "rxjs";
import { ConfirmationModalComponent } from "@app/components/confirmation-modal/confirmation-modal.component";
import { MatchService } from "@app/services/match.service";
import { Router } from "@angular/router";
import { PlayerService } from "@app/services/player.service";
import { PlayersResponse } from "@app/models/player/player.dto";

@Component({
  selector: "app-pending",
  standalone: true,
  imports: [
    NgIconComponent,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    ConfirmationModalComponent,
    CommonModule,
    FormsModule,
  ],
  templateUrl: "./pending.component.html",
  styleUrl: "./pending.component.scss",
  providers: [provideIcons({ matEditSharp })],
})
export class PendingComponent {
  isOpenModal: boolean = false;
  loggedPlayerId: string | null = null;

  players: PlayersResponse = [];
  matches: IMatch[] = [];
  loading: boolean = false;
  selectedMatch: IMatch | null = null;

  subscription = new Subscription();

  message: string = "";

  constructor(
    private matchService: MatchService,
    private playerService: PlayerService
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.playerService.playerId.subscribe((id) => {
        this.loggedPlayerId = id;
      })
    );

    this.playerService.getPlayers().subscribe((players) => {
      this.players = players;
    });

    this.subscription.add(
      this.matchService.matchesForGroup$.subscribe(() => {
        this.matches = this.matchService.getPendingMatches();
      })
    );

    this.subscription.add(
      this.matchService.matchesLoading$.subscribe((isLoading) => {
        this.loading = isLoading;
      })
    );

    this.subscription.add(
      this.matchService.matchesMessage$.subscribe((msg) => {
        this.message = msg;
      })
    );
  }

  getPlayerName(id: string | undefined): string {
    if (!id) return "Desconhecido";
    return this.players.find((p) => p.id === id)?.name ?? "Desconhecido";
  }

  openModal(match: IMatch) {
    this.selectedMatch = match;
    this.isOpenModal = true;
  }

  handleCloseModal() {
    this.isOpenModal = false;
    this.selectedMatch = null;
  }

  async handleSaveMatch(updatedMatchData: IMatch) {
    const groupId = await firstValueFrom(this.matchService.currentGroupId$);

    if (groupId) {
      let operation$: Observable<void>;

      if (updatedMatchData.player1.score === "W.O") {
        operation$ = this.matchService.setWOForMatch(
          groupId,
          updatedMatchData,
          updatedMatchData.player1.id
        );
      } else if (updatedMatchData.player2.score === "W.O") {
        operation$ = this.matchService.setWOForMatch(
          groupId,
          updatedMatchData,
          updatedMatchData.player2.id
        );
      } else {
        operation$ = this.matchService.updateMatchInGroup(
          groupId,
          updatedMatchData
        );
      }

      operation$.pipe(take(1)).subscribe({
        next: () => {
          this.matches = this.matches.map((m) =>
            m.id === updatedMatchData.id ? { ...updatedMatchData } : m
          );
          this.handleCloseModal();
        },
        error: (err) => {
          console.error("Erro ao atualizar partida", err);
        },
      });
    }
  }

  canEditMatch(match: IMatch): boolean {
    return (
      this.loggedPlayerId === match.player1?.id ||
      this.loggedPlayerId === match.player2?.id
    );
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
