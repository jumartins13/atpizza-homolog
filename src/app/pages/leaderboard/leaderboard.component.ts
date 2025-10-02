import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ISelectItem } from "@models/select/select.model";
import { ILeaderboard } from "@models/leaderboard/leaderboard.model";
import { WhatsappGroupsPopupComponent } from "@components/whatsapp-groups-popup/whatsapp-groups-popup.component";
import { PlayerResponse } from "@app/models/player/player.dto";
import { PlayerService } from "@app/services/player.service";
import { MatchService } from "@app/services/match.service";
import { GroupService } from "@app/services/group.service";
import {
  Firestore,
  doc,
  getDoc,
  collection,
  docData,
} from "@angular/fire/firestore";
import {
  Subscription,
  BehaviorSubject,
  combineLatest,
  from,
  map,
  switchMap,
  of,
  catchError,
} from "rxjs";
import { RoundService } from "@app/services/round.service";
import { LoggerService } from "@app/services/logger.service";

@Component({
  selector: "app-leaderboard",
  standalone: true,
  imports: [WhatsappGroupsPopupComponent, CommonModule],
  templateUrl: "./leaderboard.component.html",
  styleUrl: "./leaderboard.component.scss",
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  // Dados para todos os grupos
  groupsData: { [key: string]: ILeaderboard[] } = {};
  groupsPendingMatches: { [key: string]: number } = {};
  isLoading = false;
  subscription = new Subscription();
  allPlayers: PlayerResponse[] = [];

  groups: ISelectItem[] = [];
  groupsLoading = true;
  
  // WhatsApp popup
  showWhatsappPopup = false;

  constructor(
    private playerService: PlayerService,
    private firestore: Firestore,
    private matchService: MatchService,
    private roundService: RoundService,
    private groupService: GroupService,
    private logger: LoggerService
  ) {}

  ngOnInit() {
    this.logger.log('🏆 LeaderboardComponent - ngOnInit executado');
    // Reset do estado ao entrar na tela
    this.groupsData = {};
    this.groupsPendingMatches = {};
    this.isLoading = true; // Set to true initially to show loading state
    this.groupsLoading = true;

    // Carrega todos os players uma vez
    this.subscription.add(
      this.playerService.getPlayers().subscribe(players => {
        this.allPlayers = players;
      })
    );

    // Carrega todos os grupos disponíveis
    this.subscription.add(
      this.groupService.getAvailableGroupsWithLeaderboards().subscribe(groups => {
        this.logger.log('LeaderboardComponent received groups with leaderboards:', groups);
        this.groups = groups;
        this.groupsLoading = false;
        
        // Carrega dados para todos os grupos
        this.loadAllGroupsData(groups);
      })
    );
  }

  loadAllGroupsData(groups: ISelectItem[]) {
    this.isLoading = true;
    
    groups.forEach(group => {
      this.loadGroupData(group);
    });
  }

  loadGroupData(group: ISelectItem) {
    this.subscription.add(
      this.roundService.getLatestRoundId$(group.value).pipe(
        switchMap((roundId) => {
          if (!roundId) return of(null);

          const leaderboardDocId = `${group.value}_${roundId}`;
          const leaderboardDocRef = doc(
            this.firestore,
            `leaderboard/${leaderboardDocId}`
          );

          return from(getDoc(leaderboardDocRef)).pipe(
            map((docSnap) => {
              if (!docSnap.exists()) return null;

              const rawData = docSnap.data();
              let leaderboardData: ILeaderboard[] = [];

              if (Array.isArray(rawData["data"])) {
                leaderboardData = rawData["data"];
              } else if (Array.isArray(rawData)) {
                leaderboardData = rawData;
              } else if (Array.isArray(rawData["leaderboard"])) {
                leaderboardData = rawData["leaderboard"];
              } else if (Array.isArray(rawData["rankings"])) {
                leaderboardData = rawData["rankings"];
              } else {
                for (const value of Object.values(rawData)) {
                  if (Array.isArray(value)) {
                    leaderboardData = value;
                    break;
                  }
                }
              }

              return leaderboardData.map((entry) => ({
                ...entry,
                name: this.getPlayerName(entry.playerId),
              }));
            })
          );
        }),
        switchMap((leaderboard) => {
          if (!leaderboard) return of({ leaderboard: [], pendingMatches: 0 });

          return this.matchService
            .getMatchesByGroup(group.value)
            .pipe(
              map((matches) => {
                const pendingMatches = matches.filter(m => 
                  m.player1.score === "-" && m.player2.score === "-"
                ).length;
                return { leaderboard, pendingMatches };
              })
            );
        }),
        catchError((err) => {
          console.error(`Erro carregando dados do grupo ${group.value}:`, err);
          return of({ leaderboard: [], pendingMatches: 0 });
        })
      ).subscribe(({ leaderboard, pendingMatches }) => {
        this.groupsData[group.value] = leaderboard;
        this.groupsPendingMatches[group.value] = pendingMatches;
        
        this.logger.log(`📊 Dados carregados para grupo ${group.value}:`, {
          playersCount: leaderboard.length,
          pendingMatches,
          firstPlayer: leaderboard[0]?.name || 'N/A',
          positions: leaderboard.map(p => `${p.name}: ${p.position}º`)
        });
        
        // Verifica se todos os grupos foram carregados
        const loadedGroups = Object.keys(this.groupsData).length;
        if (loadedGroups === this.groups.length) {
          this.isLoading = false;
          this.logger.log('✅ Todos os grupos foram carregados!');
        }
      })
    );
  }

  openWhatsappPopup() {
    this.showWhatsappPopup = true;
  }

  closeWhatsappPopup() {
    this.showWhatsappPopup = false;
  }

  getPlayerName(id: string | undefined): string {
    if (!id) return "Desconhecido";
    return this.allPlayers.find((p) => p.id === id)?.name ?? "Desconhecido";
  }

  getPlayerClass(index: number, groupValue?: string): string {
    const groupData = this.getGroupData(groupValue || '');
    const player = groupData[index];
    const position = player ? player.position : index + 1;
    
    let cssClass = "";
    
    if (groupValue === "A") {
      if (position === 1) cssClass = "first"; // Gold for 1st place
      else if (position === 4 || position === 5) cssClass = "last"; // Red for 4th and 5th places
    } else {
      if (position === 1 || position === 2) cssClass = "top-two"; // Green for 1st and 2nd places
      else if (position === 4 || position === 5) cssClass = "last"; // Red for 4th and 5th places
    }
    if (position === 3) cssClass = "third"; // Bronze for 3rd place (all groups)
    
    this.logger.log(`🎯 getPlayerClass - Group: ${groupValue}, Index: ${index}, Position: ${position}, Player: ${player?.name || 'N/A'}, Class: ${cssClass}`);
    return cssClass;
  }

  getGroupData(groupValue: string): ILeaderboard[] {
    return this.groupsData[groupValue] || [];
  }

  getGroupPendingMatches(groupValue: string): number {
    return this.groupsPendingMatches[groupValue] || 0;
  }

  hasGroupData(groupValue: string): boolean {
    return this.groupsData[groupValue] && this.groupsData[groupValue].length > 0;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
