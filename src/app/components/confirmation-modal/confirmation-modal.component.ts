import { CommonModule } from "@angular/common";
import {
  Component,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  OnInit,
  OnDestroy,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IMatch } from "@app/models/match/matches.model";
import { PlayerService } from "@app/services/player.service"; // Importar PlayerService
import { PlayerResponse } from "@app/models/player/player.dto"; // Importar PlayerResponse
import { Subscription } from "rxjs"; // Importar Subscription
import { tuple } from "zod";

@Component({
  selector: "app-confirmation-modal",
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
  ],
  templateUrl: "./confirmation-modal.component.html",
  styleUrl: "./confirmation-modal.component.scss",
})
export class ConfirmationModalComponent implements OnInit, OnDestroy {
  @Input() isVisible: boolean = false;
  @Input() match: IMatch | null = null;
  @Output() closeModalEvent = new EventEmitter<boolean>();
  @Output() saveMatchEvent = new EventEmitter<IMatch>();

  private players: PlayerResponse[] = [];
  private playerSubscription: Subscription | null = null;

  activeButton: boolean = false;

  scoreOptions: { label: string; value: number | "W.O" }[] = [
    { label: "0", value: 0 },
    { label: "1", value: 1 },
    { label: "2", value: 2 },
    { label: "3", value: 3 },
    { label: "4", value: 4 },
    { label: "5", value: 5 },
    { label: "6", value: 6 },
    { label: "7", value: 7 },
    { label: "W.O", value: "W.O" },
  ];

  score1updated: number | "W.O" = 0;
  score2updated: number | "W.O" = 0;

  constructor(private playerService: PlayerService) {}

  ngOnInit(): void {
    // Buscar a lista de jogadores quando o componente é inicializado
    this.playerSubscription = this.playerService.getPlayers().subscribe(players => {
      this.players = players;
    });
  }

  ngOnChanges(changes: SimpleChanges) {

    if (changes["match"] && this.match) {
      this.score1updated =
        typeof this.match.player1.score === "number" ||
        this.match.player1.score === "W.O"
          ? this.match.player1.score
          : 0;
      this.score2updated =
        typeof this.match.player2.score === "number" ||
        this.match.player2.score === "W.O"
          ? this.match.player2.score
          : 0;
    } else if (changes["match"] && !this.match) {
      this.score1updated = 0;
      this.score2updated = 0;
    }
    this.updateActiveButtonState(); // Atualizar o estado do botão ao receber uma nova partida
  }

  closeModal() {
    this.closeModalEvent.emit();
  }

  onScoreChange() {
    this.updateActiveButtonState();
  }

  updateActiveButtonState() {
    this.activeButton = this.match ? this.isValidScore(this.score1updated, this.score2updated) : false;
  }

  saveMatch() {
    if (!this.match) {
      console.log("ERRO");
      return;
    }

    const winnerId = this.winnerPlayer(
      this.score1updated,
      this.score2updated,
      this.match.player1.id,
      this.match.player2.id
    );

    const updatedMatch: IMatch = {
      ...this.match,
      groupId: this.match.groupId,
      roundId: this.match.roundId,
      player1: {
        ...this.match.player1,
        name: this.getPlayerName(this.match.player1.id),
        score: this.score1updated,
      },
      player2: {
        ...this.match.player2,
        name: this.getPlayerName(this.match.player2.id),
        score: this.score2updated,
      },
      winnerId: winnerId,
    };

    this.saveMatchEvent.emit(updatedMatch);
  }

  getPlayerName(id: string | undefined): string {
    if (!id) return "Desconhecido";
    return this.players.find((p) => p.id === id)?.name ?? "Desconhecido";
  }

  winnerPlayer(
    score1: number | "W.O",
    score2: number | "W.O",
    player1Id: string | undefined,
    player2Id: string | undefined
  ): string {
    if (player1Id && player2Id) {
      if (score1 > score2) return player1Id;
      if (score2 > score1) return player2Id;

      if (score1 === "W.O") {
        return player2Id;
      }
      if (score2 === "W.O") {
        return player1Id;
      }
    }

    return "";
  }

  isValidScore(score1: number | "W.O", score2: number | "W.O"): boolean {
    if (score1 === "W.O" || score2 === "W.O") {
      if (score1 === "W.O" && score2 === "W.O") return true;
      if (score1 === "W.O") return score2 === 6;
      if (score2 === "W.O") return score1 === 6;
    }

    if (typeof score1 === "number" && typeof score2 === "number") {
      const max = Math.max(score1, score2);
      const min = Math.min(score1, score2);

      if (max === 6 && min >= 0 && min <= 4) return true;
      if (max === 7 && (min === 5 || min === 6)) return true;
    }
    return false;
  }

  ngOnDestroy(): void {
    if (this.playerSubscription) {
      this.playerSubscription.unsubscribe();
    }
  }
}
