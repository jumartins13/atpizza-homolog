import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import {
  IRanking,
  IRankingData,
  IRoundsHistoryPlayer,
} from "@models/rankings/rankings.model";
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import { matStarSharp } from "@ng-icons/material-icons/sharp";
import { Subscription, forkJoin, map, of, switchMap, catchError } from "rxjs";
import { RoundService } from "@app/services/round.service";
import { PlayersResponse } from "@app/models/player/player.dto";
import { PlayerService } from "@app/services/player.service";
import { MatchService } from "@app/services/match.service";
import { FormsModule } from "@angular/forms";
import { SelectComponent } from "@app/components/select/select.component";
import { LoggerService } from "@app/services/logger.service";
import { SelectSkeletonComponent } from "@app/components/select-skeleton/select-skeleton.component";
import { ISelectItem } from "@app/models/select/select.model";
import { PositionArrowComponent } from "@app/components/position-arrow/position-arrow.component";
import { RankingsService } from "@app/services/rankings.service";
import { MatSlideToggleChange, MatSlideToggleModule } from "@angular/material/slide-toggle";

@Component({
  selector: "app-rankings",
  standalone: true,
  imports: [
    NgIconComponent,
    FormsModule,
    SelectComponent,
    SelectSkeletonComponent,
    PositionArrowComponent,
    MatSlideToggleModule,
  ],
  templateUrl: "./rankings.component.html",
  styleUrl: "./rankings.component.scss",
  providers: [provideIcons({ matStarSharp })],
})
export class RankingsComponent implements OnInit, OnDestroy {
  data: IRanking[] | null = null;
  playersData: (IRankingData | IRoundsHistoryPlayer)[] = [];
  players: PlayersResponse = [];
  error: string | null = null;
  subscription = new Subscription();
  loading: boolean = false;
  isRoundGeneralMode = true;

  // Dados dos rounds organizados corretamente
  allRounds: { id: string; roundId: string; createdAt: any; year: number; roundNumber: number }[] = [];
  roundsByYear: Map<number, { id: string; roundId: string; createdAt: any; roundNumber: number }[]> = new Map();

  // Seleção de ano
  years: number[] = [];
  selectedYear: number | null = null;
  yearSelectItems: ISelectItem[] = [];
  yearsLoading = true;

  // Seleção de rodada (baseada no ano selecionado)
  filteredRounds: { id: string; roundId: string; createdAt: any; roundNumber: number }[] = [];
  filteredRoundSelectItems: ISelectItem[] = [];
  selectedRoundItem?: ISelectItem;
  roundsLoading = true;

  constructor(
    private rankingsService: RankingsService,
    private playerService: PlayerService,
    private roundsService: RoundService,
    private cdr: ChangeDetectorRef,
    private logger: LoggerService
  ) {}

  ngOnInit() {
    this.loading = true;

    // Carrega jogadores
    this.playerService.getPlayers().subscribe((players) => {
      this.players = players;
    });

    this.loadAvailableYearsAndRounds();
  }

  loadAvailableYearsAndRounds() {
    this.subscription.add(
      forkJoin({
        years: this.roundsService.getAvailableYears(),
        rounds: this.roundsService.getRoundsHistoryIds(),
      }).subscribe({
        next: ({ years, rounds }) => {
          // Processa os rounds e organiza por ano
          this.processRoundsData(rounds);

          // Configura os anos disponíveis
          this.years = years.sort((a, b) => b - a); // Decrescente
          this.yearSelectItems = [
            ...this.years.map((year) => ({
              name: year.toString(),
              value: year.toString(),
            })),
          ];
          this.yearsLoading = false;

          if (this.years.length > 0) {
            this.selectedYear = this.years[0];
            this.updateRoundSelectItems();
            this.loadRankingData();
          } else {
            this.playersData = [];
            this.loading = false;
          }
        },
        error: (err) => {
          this.logger.error("Erro ao buscar anos e rodadas:", err);
          this.playersData = [];
          this.loading = false;
        },
      })
    );
  }

  processRoundsData(rounds: { id: string; createdAt: any }[]) {
    this.roundsByYear.clear();
    this.allRounds = [];

    for (const round of rounds) {
      // O id vem no formato "YYYY_RodadaN" (ex: "2025_Rodada1")
      const [yearStr, roundStr] = round.id.split("_");
      const year = parseInt(yearStr);
      const roundNumber = parseInt(roundStr.replace("Rodada", ""));

      let createdAt = round.createdAt;
      
      // Normaliza o createdAt
      if (createdAt?.toDate) {
        createdAt = createdAt.toDate();
      } else if (!(createdAt instanceof Date)) {
        createdAt = new Date();
      }

      const roundData = {
        id: round.id,
        roundId: round.id, // Para compatibilidade
        createdAt: createdAt,
        year: year,
        roundNumber: roundNumber,
      };

      // Adiciona ao array de todos os rounds
      this.allRounds.push(roundData);

      // Adiciona ao mapa de rounds por ano
      if (!this.roundsByYear.has(year)) {
        this.roundsByYear.set(year, []);
      }
      this.roundsByYear.get(year)!.push(roundData);
    }

    // Ordena os rounds de cada ano por número da rodada (rodada 3, 2, 1...)
    this.roundsByYear.forEach((rounds, year) => {
      rounds.sort((a, b) => {
        // Primeiro por número da rodada (decrescente - mais nova primeiro)
        if (a.roundNumber !== b.roundNumber) {
          return b.roundNumber - a.roundNumber;
        }
        // Se for o mesmo número, por data (mais recente primeiro)
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    });
  }

  updateRoundSelectItems() {
    if (!this.selectedYear) {
      this.filteredRounds = [];
      this.filteredRoundSelectItems = [];
      this.cdr.detectChanges();
      return;
    }

    this.filteredRounds = this.roundsByYear.get(this.selectedYear) || [];

    // Cria itens do select ordenados por número da rodada
    this.filteredRoundSelectItems = this.filteredRounds.map((round) => ({
      name: this.getRoundLabel(round.id),
      value: round.id,
    }));
    this.roundsLoading = false;

    // Define seleção padrão como undefined
    this.selectedRoundItem = undefined;
    
    // Força detecção de mudanças
    this.cdr.detectChanges();
  }

  onYearSelected(item: ISelectItem) {
    if (!item?.value) return;
  
    this.selectedYear = Number(item.value);
  
    // Limpa primeiro para forçar re-render
    this.filteredRoundSelectItems = [];
    this.selectedRoundItem = undefined;
    this.roundsLoading = true;
    this.cdr.detectChanges();
    
    // Depois carrega os novos dados
    setTimeout(() => {
      this.updateRoundSelectItems();
      
      const rounds = this.roundsByYear.get(this.selectedYear!) || [];
    
      if (rounds.length > 0) {
        // Seleciona a primeira rodada (maior número - mais recente)
        const firstRound = rounds[0];
        
        this.selectedRoundItem = {
          name: this.getRoundLabel(firstRound.id),
          value: firstRound.id,
        };
    
        // Força a detecção de mudanças antes de carregar os dados
        this.cdr.detectChanges();
        
        // Carrega os dados
        if (this.isRoundGeneralMode) {
          this.loadAccumulatedUntilRound(firstRound.id);
        } else {
          this.loadRoundSpecificData(firstRound.id);
        }
      } else {
        this.selectedRoundItem = undefined;
        this.cdr.detectChanges();
        this.loadRankingData();
      }
    }, 1);
  }

  onRoundSelected(item: ISelectItem) {
    if (!item?.value) return;
  
    this.selectedRoundItem = item;
    const roundId = String(item.value);
  
    if (this.isRoundGeneralMode) {
      this.loadAccumulatedUntilRound(roundId);
    } else {
      this.loadRoundSpecificData(roundId);
    }
  }

  onToggleRoundGeneral(event: MatSlideToggleChange) {
    const isChecked = event.checked;
    this.isRoundGeneralMode = isChecked;

    let roundId = this.selectedRoundItem?.value;

    // Se ainda não tiver rodada selecionada, pegar a primeira do ano
    if (!roundId && this.selectedYear) {
      const rounds = this.roundsByYear.get(this.selectedYear);
      if (rounds && rounds.length > 0) {
        roundId = rounds[0].id;
        this.selectedRoundItem = {
          name: this.getRoundLabel(rounds[0].id),
          value: rounds[0].id,
        };
      }
    }

    if (roundId) {
      if (isChecked) {
        this.loadAccumulatedUntilRound(roundId);
      } else {
        this.loadRoundSpecificData(roundId);
      }
    } else {
      this.loadRankingData();
    }
  }

  loadAccumulatedUntilRound(roundId: string) {
    this.logger.log("📊 Carregando acumulado até a rodada:", roundId);
    this.loading = true;
  
    // Extrai ano e número da rodada
    const [yearStr, roundStr] = roundId.split("_");
    const currentYear = parseInt(yearStr);
    const currentRoundNumber = parseInt(roundStr.replace("Rodada", ""));
  
    // Verifica se é a primeira rodada do primeiro ano
    const firstYear = Math.min(...this.years);
    const isFirstYear = currentYear === firstYear;
    const isFirstRound = currentRoundNumber === 1;
  
    const current$ = this.rankingsService.getAccumulatedRankingUntilRound(roundId);
    
    let previous$;
    
    if (isFirstYear && isFirstRound) {
      previous$ = of([]); // Primeira rodada do sistema, não tem anterior
    } else if (currentRoundNumber === 1) {
      // Rodada 1 de qualquer ano (exceto o primeiro)
      const previousYear = currentYear - 1;
      const previousRoundId = `${previousYear}_Rodada3`;

      previous$ = this.rankingsService.getAccumulatedRankingUntilRound(previousRoundId).pipe(
        catchError(err => {
          console.warn(`⚠️ Erro ao buscar rodada anterior ${previousRoundId}:`, err);
          return of([]);
        })
      );
    } else {
      // Rodada 2 ou 3 do mesmo ano
      const previousRoundNumber = currentRoundNumber - 1;
      const previousRoundId = `${currentYear}_Rodada${previousRoundNumber}`;

      previous$ = this.rankingsService.getAccumulatedRankingUntilRound(previousRoundId).pipe(
        catchError(err => {
          console.warn(`⚠️ Erro ao buscar rodada anterior ${previousRoundId}:`, err);
          return of([]);
        })
      );
    }
  
    this.subscription.add(
      forkJoin({ current: current$, previous: previous$ }).subscribe({
        next: ({ current, previous }) => {
          if (!Array.isArray(current)) {
            this.playersData = [];
            this.loading = false;
            return;
          }
  
          // Ordena anterior por scorePoints
          const previousSorted = (previous || [])
            .filter((p) => p.playerId && p.scorePoints !== undefined)
            .sort((a, b) => b.scorePoints - a.scorePoints);
  
          // Cria mapa de posições anteriores
          const previousPositions = new Map<string, number>();
          previousSorted.forEach((player, index) => {
            previousPositions.set(player.playerId, index + 1);
          });
  
          // Debug: verificar se finalRoundIndex existe nos dados acumulados
          if (current.length > 0) {
            this.logger.log("🔍 Dados acumulados - estrutura:", current[0]);
            this.logger.log("🔍 Dados acumulados - campos:", Object.keys(current[0]));
          }

          // Ordena atual por scorePoints (maior para menor)
          const currentSorted = current
            .filter((p) => p.playerId && p.scorePoints !== undefined)
            .sort((a, b) => b.scorePoints - a.scorePoints);
  
          // Atribui posição e calcula diferença
          currentSorted.forEach((player, index) => {
            player.position = index + 1;
            const oldPosition = previousPositions.get(player.playerId);
            
            player.positionChange = oldPosition ? oldPosition - player.position : 0;
          });
  
          this.playersData = currentSorted;
          this.loading = false;
          this.logger.log("✅ Ranking acumulado carregado:", currentSorted);
        },
        error: (err) => {
          this.logger.error("❌ Erro ao carregar ranking acumulado:", err);
          this.playersData = [];
          this.loading = false;
        }
      })
    );
  }

  loadRankingData() {
    this.logger.log("📊 Carregando ranking geral...");
    this.loading = true;

    // Carrega o ranking geral/acumulado
    this.loadRankingWithComparison();
  }

  loadRoundSpecificData(roundId: string) {
    this.logger.log("🎯 Carregando dados da rodada:", roundId);
    this.loading = true;

    // Extrai ano e número da rodada
    const [yearStr, roundStr] = roundId.split("_");
    const currentYear = parseInt(yearStr);
    const currentRoundNumber = parseInt(roundStr.replace("Rodada", ""));

    // Para encontrar a rodada anterior
    let previousRoundId: string | null = null;
    
    if (currentRoundNumber === 1) {
      // Rodada 1: pegar rodada 3 do ano anterior (se existir)
      const previousYear = currentYear - 1;
      const potentialPreviousId = `${previousYear}_Rodada3`;
      
      // Verifica se existe
      const previousYearRounds = this.roundsByYear.get(previousYear) || [];
      if (previousYearRounds.some(r => r.id === potentialPreviousId)) {
        previousRoundId = potentialPreviousId;
      }
    } else {
      // Rodada 2 ou 3: pegar rodada anterior do mesmo ano
      const previousRoundNumber = currentRoundNumber - 1;
      const potentialPreviousId = `${currentYear}_Rodada${previousRoundNumber}`;
      
      const currentYearRounds = this.roundsByYear.get(currentYear) || [];
      if (currentYearRounds.some(r => r.id === potentialPreviousId)) {
        previousRoundId = potentialPreviousId;
      }
    }

    this.logger.log("🔍 Rodada anterior encontrada:", previousRoundId);

    const currentRound$ = this.roundsService.getRoundsHistoryData(roundId);
    const previousRound$ = previousRoundId
      ? this.roundsService.getRoundsHistoryData(previousRoundId)
      : of({ data: [] });

    this.subscription.add(
      forkJoin({
        current: currentRound$,
        previous: previousRound$,
      }).subscribe({
        next: ({ current, previous }) => {
          // Mapa das posições anteriores
          const previousMap = new Map<string, number>();
          if (previous?.data && Array.isArray(previous.data)) {
            previous.data.forEach((p: IRoundsHistoryPlayer) => {
              if (p?.playerId && typeof p?.position === "number") {
                previousMap.set(p.playerId, p.position);
              }
            });
          }

          // Debug: verificar estrutura dos dados da rodada específica
          if (current?.data && current.data.length > 0) {
            this.logger.log("🔍 Dados da rodada - estrutura:", current.data[0]);
            this.logger.log("🔍 Dados da rodada - campos:", Object.keys(current.data[0]));
          }

          // Ordena por finalRoundIndex se disponível, senão por pontos
          const sorted = [...(current?.data || [])].sort((a, b) => {
            if (a.finalRoundIndex !== undefined && b.finalRoundIndex !== undefined) {
              return a.finalRoundIndex - b.finalRoundIndex;
            }
            return (b.points ?? 0) - (a.points ?? 0);
          });

          // Calcula posições e mudanças
          sorted.forEach((player, index) => {
            player.position = index + 1;
            const oldPos = previousMap.get(player.playerId);
            player.positionChange =
              oldPos != null ? oldPos - player.position : 0;
          });

          this.playersData = sorted;
          this.loading = false;
          this.logger.log("✅ Dados da rodada carregados:", sorted);
        },
        error: (err) => {
          this.logger.error("❌ Erro ao buscar rodada:", err);
          this.error = "Erro ao buscar dados da rodada";
          this.loading = false;
        },
      })
    );
  }

  loadRankingWithComparison() {
    this.logger.log("📊 Carregando ranking com comparação...");

    const current$ = this.rankingsService.getLatestRankings();
    const previous$ = this.rankingsService.getPreviousAccumulatedRanking().pipe(
      catchError((err) => {
        console.warn(
          "⚠️ Erro ao buscar ranking anterior, usando array vazio:",
          err
        );
        return of([]);
      })
    );

    this.subscription.add(
      forkJoin({ current: current$, previous: previous$ }).subscribe({
        next: ({ current, previous }) => {
          if (!current || !Array.isArray(current)) {
            console.warn("⚠️ Dados atuais inválidos:", current);
            this.playersData = [];
            this.loading = false;
            return;
          }

          // Remove duplicatas
          const seenIds = new Set<string>();
          const dedupedCurrent = current.filter((player: any) => {
            if (seenIds.has(player.playerId)) return false;
            seenIds.add(player.playerId);
            return true;
          });

          // Ordena por pontos (maior para menor)
          const sortedCurrent = dedupedCurrent.sort(
            (a, b) =>
              (b.scorePoints ?? b.points ?? 0) -
              (a.scorePoints ?? a.points ?? 0)
          );

          // Mapeia posição anterior a partir do backend
          const previousPositionMap = new Map<string, number>(
            (previous ?? []).map((p: any) => [p.playerId, p.position])
          );

          // Usa posição atual do backend e calcula mudança de posição
          const finalRanking = dedupedCurrent.map((player: any) => {
            const currentPosition = player.position;
            const previousPosition = previousPositionMap.get(player.playerId);

            const positionChange =
              typeof previousPosition === "number"
                ? previousPosition - currentPosition
                : 0;

            return {
              ...player,
              position: currentPosition,
              positionChange,
              name: this.getPlayerName(player.playerId),
            };
          });

          // Debug: verificar se finalRoundIndex existe nos dados
          this.logger.log("🔍 Verificando estrutura dos dados:", finalRanking[0]);
          if (finalRanking.length > 0) {
            const sample = finalRanking[0];
            this.logger.log("🔍 Campos disponíveis:", Object.keys(sample));
            this.logger.log("🔍 finalRoundIndex:", sample.finalRoundIndex);
          }

          // Ordena por scorePoints (maior para menor) 
          const sorted = finalRanking.sort((a, b) => {
            const aPoints = a.scorePoints ?? a.points ?? 0;
            const bPoints = b.scorePoints ?? b.points ?? 0;
            return bPoints - aPoints;
          });

          // Reatribui posições após ordenação por pontos
          sorted.forEach((player, index) => {
            player.position = index + 1;
          });

          this.playersData = sorted;
          
          this.loading = false;
          this.logger.log("✅ Ranking geral carregado e ordenado:", this.playersData);
        },
        error: (err) => {
          this.logger.error("❌ Erro ao buscar ranking acumulado:", err);
          this.playersData = [];
          this.loading = false;
        },
      })
    );
  }

  getPlayerName(id: string | undefined): string {
    if (!id) return "Desconhecido";
    return this.players.find((p) => p.id === id)?.name ?? "Desconhecido";
  }

  getPlayerPoints(player: any): number {
    if (player.scorePoints !== undefined) {
      return player.scorePoints;
    }
    if (player.points !== undefined) {
      return player.points;
    }
    return 0;
  }

  getRoundLabel(roundId: string): string {
    // Extrai o número da rodada do ID (formato: YYYY_RodadaN)
    const parts = roundId.split("_");
    if (parts.length === 2 && parts[1].startsWith("Rodada")) {
      const roundNumber = parts[1].replace("Rodada", "");
      return `Rodada ${roundNumber}`;
    }

    // Fallback caso não consiga extrair o número
    return roundId;
  }

  extractRoundNumber(roundId: string): number {
    const parts = roundId.split("_");
    if (parts.length === 2 && parts[1].startsWith("Rodada")) {
      return parseInt(parts[1].replace("Rodada", "")) || 0;
    }
    return 0;
  }

  shouldShowArrow(player: IRankingData | IRoundsHistoryPlayer): boolean {
    const hasPoints =
      ("points" in player && player.points > 0) ||
      ("scorePoints" in player && player.scorePoints > 0);
  
    const hasMovement =
      typeof player.positionChange === "number" && player.positionChange !== 0;
  
    // Se não há pontos ou movimento, não mostra seta
    if (!hasPoints || !hasMovement) {
      return false;
    }
  
    // Para o modo NÃO acumulado (rodada específica): NUNCA mostra setas
    if (!this.isRoundGeneralMode) {
      return false;
    }
  
    // Para o modo acumulado: mostra setas EXCETO na Rodada 1 do primeiro ano
    const currentRoundId = this.selectedRoundItem?.value as string;
    
    if (!currentRoundId) {
      return true; // Se não tem rodada selecionada, mostra a seta
    }
  
    // Extrai o número da rodada do ID
    const [yearStr, roundStr] = currentRoundId.split("_");
    const currentYear = parseInt(yearStr);
    const currentRoundNumber = parseInt(roundStr.replace("Rodada", ""));
    
    // Verifica se é o primeiro ano do sistema
    const firstYear = Math.min(...this.years);
    const isFirstYear = currentYear === firstYear;
    
    // Oculta seta APENAS no acumulado da Rodada 1 do primeiro ano do sistema
    const isFirstRoundOfFirstYear = isFirstYear && currentRoundNumber === 1;
  
    return !isFirstRoundOfFirstYear;
  }

  shouldShowEmptyMessage(): boolean {
    return !this.loading && this.playersData.length === 0;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}