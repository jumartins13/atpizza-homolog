import { Component, OnInit, OnDestroy, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Subscription } from "rxjs";
import { provideIcons } from "@ng-icons/core";
import { heroUsers } from "@ng-icons/heroicons/outline";
import { RoundService } from "@app/services/round.service";
import { Round } from "@app/models/round/round.model";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [CommonModule],
  providers: [provideIcons({ heroUsers })],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
})
export class HomeComponent implements OnInit, OnDestroy {
  constructor(private roundService: RoundService) {}

  subscription: Subscription | null = null;

  message: string = "Carregando rodada...";
  warningMessage: string | null = null;

  ngOnInit() {
    this.subscription = this.roundService.getRoundData().subscribe({
      next: (round) => {
        this.handleRound(round);
      },
      error: () => {
        this.message = "Erro ao buscar dados da rodada.";
      },
    });
  }

  handleRound(round: Round | null) {
    if (!round || !round.isActive) {
      this.message = "Rodada encerrada.";
      return;
    }
   

    const start = this.roundService.parseDate(round.startDate);
    const end = this.roundService.parseDate(round.endDate);

    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
      this.message = "Erro ao processar as datas da rodada.";
      return;
    }

    const startFormatted = start.toLocaleDateString("pt-BR", { timeZone: 'UTC' });
    const endFormatted = end.toLocaleDateString("pt-BR", { timeZone: 'UTC' });

    this.message = `Rodada ativa de\n${startFormatted} até ${endFormatted}`;

    this.roundService.warningMessage$.subscribe((msg) => {
      this.warningMessage = msg;
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
