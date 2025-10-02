import { Component } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatInputModule } from "@angular/material/input";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { IMatch } from "@app/models/match/matches.model";
import { Subscription, firstValueFrom, of, switchMap, take } from "rxjs";
import { ConfirmationModalComponent } from "@app/components/confirmation-modal/confirmation-modal.component";
import { MatchService } from "@app/services/match.service";
import { PlayerResponse } from "@app/models/player/player.dto";
import { PlayerService } from "@app/services/player.service";

@Component({
  selector: "app-completed",
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    ConfirmationModalComponent,
    CommonModule,
    FormsModule,
  ],
  templateUrl: "./completed.component.html",
  styleUrl: "./completed.component.scss",
})
export class CompletedComponent {
  isOpenModal: boolean = false;

  players: PlayerResponse[] = [];
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
    this.playerService.getPlayers().subscribe((players) => {
      this.players = players;
    });

    this.subscription.add(
      this.matchService.matchesForGroup$.subscribe(() => {
        this.matches = this.matchService.getCompletedMatches();

        if (this.matches.length === 0) {
          this.message = "Nenhuma partida realizada! ❌ ";
        } else {
          this.message = "";
        }
      })
    );
    this.subscription.add(
      this.matchService.matchesLoading$.subscribe((isLoading) => {
        this.loading = isLoading;
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

    if (!groupId) return;

    const currentMatch = this.matches.find((m) => m.id === updatedMatchData.id);

    if (currentMatch) {
      const currentScore1 = currentMatch.player1.score;
      const currentScore2 = currentMatch.player2.score;
      const newScore1 = updatedMatchData.player1.score;
      const newScore2 = updatedMatchData.player2.score;

      const isWO1 = newScore1 === "W.O";
      const isWO2 = newScore2 === "W.O";

      if (isWO1 && isWO2) {
        const wasWO1 = currentScore1 === "W.O";
        const wasWO2 = currentScore2 === "W.O";

        if (wasWO1 && !wasWO2) {
          // jogador2 agora cedeu também
        } else if (wasWO2 && !wasWO1) {
          // jogador1 agora cedeu também
        } else {
          console.warn("W.O x W.O não permitido se não houver um W.O anterior");
          return;
        }
      }
    }

    let operation$;

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

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
