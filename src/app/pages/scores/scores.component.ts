import { Component, OnDestroy, OnInit, HostListener, ElementRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IMatch } from "@app/models/match/matches.model";
import { MatchService } from "@app/services/match.service";
import { PlayerService } from "@app/services/player.service";
import { GroupService } from "@app/services/group.service";
import { AuthService } from "@app/services/auth.service";
import { ISelectItem } from "@models/select/select.model";
import { SelectComponent } from "@components/select/select.component";
import { SelectSkeletonComponent } from "@components/select-skeleton/select-skeleton.component";
import { Subscription } from "rxjs";
import { LoggerService } from "@app/services/logger.service";

@Component({
  selector: "app-scores",
  standalone: true,
  imports: [CommonModule, RouterModule, SelectComponent, SelectSkeletonComponent],
  templateUrl: "./scores.component.html",
  styleUrl: "./scores.component.scss",
})
export class ScoresComponent implements OnInit, OnDestroy {
  groups: ISelectItem[] = [];
  groupsLoading = true;
  selectedGroup: ISelectItem | null = null;
  matches: IMatch[] = [];
  loading = false;
  message = "";
  subscription: Subscription | null = null;

  // Variáveis para controle do header auto-hide
  private lastScrollTop = 0;
  private isLandscape = false;

  constructor(
    private matchService: MatchService,
    private groupService: GroupService,
    private authService: AuthService,
    private playerService: PlayerService,
    private elementRef: ElementRef,
    private logger: LoggerService
  ) {}

  ngOnInit() {
    // Limpa dados do MatchService ao inicializar
    this.matchService.setMatchesForGroup([]);
    this.matchService.setMatchesMessage("");
    this.matchService.setMatchesLoading(true);

    // Verifica se está em modo landscape
    this.checkOrientation();

    // Com navegação forçada do menu, sempre carrega grupo do usuário

    this.loadGroupsAndSetUserGroup();
  }

  private loadGroupsAndSetUserGroup() {
    this.groupService.getAvailableGroupsWithLeaderboards().subscribe(groups => {
      this.logger.log('ScoresComponent received groups with leaderboards:', groups);
      this.groups = groups;
      this.groupsLoading = false;
      
      if (groups.length > 0) {
        // Busca o grupo do usuário autenticado
        this.findUserGroup(groups);
      } else {
        // Se não há grupos, limpa o loading
        this.matchService.setMatchesLoading(false);
      }
    });
  }


  onGroupSelected(group: ISelectItem) {
    this.selectedGroup = group;
    this.loadMatchesForGroup(group);
  }

  loadMatchesForGroup(group: ISelectItem | null) {
    if (!group) return;
    
    // Cancela subscription anterior se existir
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    
    // Limpa dados anteriores IMEDIATAMENTE
    this.matchService.setMatchesForGroup([]);
    this.matchService.setMatchesMessage("");
    this.matchService.setMatchesLoading(true);

    this.subscription = this.matchService
      .getMatchesByGroup(group.value)
      .subscribe({
        next: (matchesData) => {
          if (!matchesData || matchesData.length === 0) {
            this.matchService.setMatchesForGroup([]);
          } else {
            const allCompleted = matchesData.every(
              (m) => m.player1.score !== "-" && m.player2.score !== "-"
            );

            if (allCompleted) {
              this.matchService.setMatchesMessage(
                "Parabéns! Jogos concluídos! ✅"
              );
            } else {
              this.matchService.setMatchesMessage("");
            }

            this.matchService.setMatchesForGroup(matchesData);
          }

            this.matchService.setMatchesLoading(false);
            this.logger.log("Partidas carregadas e publicadas para grupo:", group.name, matchesData);
        },
      });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    // Auto-hide desabilitado - tabs agora ficam sempre fixas no landscape
    return;
  }

  @HostListener('window:orientationchange', ['$event'])
  @HostListener('window:resize', ['$event'])
  onOrientationChange() {
    setTimeout(() => {
      this.checkOrientation();
    }, 100);
  }

  private checkOrientation() {
    this.isLandscape = window.orientation === 90 || window.orientation === -90 ||
                      (window.innerHeight < 500 && window.innerWidth > window.innerHeight);
  }

  private findUserGroup(groups: ISelectItem[]) {
    const userEmail = this.authService.userEmail;
    
    if (!userEmail) {
      this.logger.log('⚠️ Usuário não autenticado, usando primeiro grupo');
      this.selectedGroup = groups[0];
      this.loadMatchesForGroup(this.selectedGroup);
      return;
    }

    this.logger.log('🔍 Buscando grupo do usuário:', userEmail);
    
    // NÃO seleciona nada ainda - aguarda a busca do player
    
    // Busca o jogador atual para descobrir seu grupo
    this.playerService.getPlayer(userEmail).subscribe({
      next: (player) => {
        this.logger.log('👤 Player response:', player);
        
        const playerGroup = player.group || player.groupId;
        if (player && playerGroup) {
          this.logger.log('👤 Jogador encontrado no grupo:', playerGroup);
          
          // Procura o grupo correspondente na lista (busca por value E name)
          const userGroup = groups.find(group => {
            const matchByValue = group.value === playerGroup;
            const matchByName = group.name === playerGroup;
            
            this.logger.log(`🔍 Comparando grupo ${group.name} (${group.value}) com playerGroup ${playerGroup}`);
            this.logger.log(`  - matchByValue: ${matchByValue}`);
            this.logger.log(`  - matchByName: ${matchByName}`);
            
            return matchByValue || matchByName;
          });
          
          if (userGroup) {
            this.logger.log('✅ Grupo do usuário encontrado:', userGroup.name, userGroup.value);
            this.selectedGroup = userGroup;
          } else {
            this.logger.log('⚠️ Grupo do usuário não encontrado na lista');
            this.logger.log('📋 Grupos disponíveis:', groups.map(g => `${g.name} (${g.value})`));
            this.logger.log('🎯 Grupo do player:', playerGroup);
            this.selectedGroup = groups[0];
          }
        } else {
          this.logger.log('⚠️ Jogador sem grupo definido, usando primeiro grupo');
          this.selectedGroup = groups[0];
        }
        
        this.loadMatchesForGroup(this.selectedGroup);
      },
      error: (error) => {
        this.logger.error('❌ Erro ao buscar jogador:', error);
        this.selectedGroup = groups[0];
        this.loadMatchesForGroup(this.selectedGroup);
      }
    });
  }
}
