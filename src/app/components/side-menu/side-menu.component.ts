import { animate, style, transition, trigger } from "@angular/animations";
import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AvatarService } from "@app/services/avatar.service";
import { PlayerService } from "@app/services/player.service";
import { AuthService } from "@services/auth.service";
import { Subscription } from "rxjs";
import { LoggerService } from "@app/services/logger.service";

const hidden = { transform: "translateX(-100%)" };
const visible = { transform: "translateX(0)" };
const timing = "1s ease-in";
@Component({
  selector: "app-side-menu",
  standalone: false,
  templateUrl: "./side-menu.component.html",
  styleUrl: "./side-menu.component.scss",
  animations: [
    trigger("openClose", [
      transition(":enter", [style(hidden), animate(timing, style(visible))]),
      transition(":leave", [style(visible), animate(timing, style(hidden))]),
    ]),
  ],
})
export class SideMenuComponent {
  isOpen: boolean = false;
  username: string = "";
  
  readonly DEFAULT_AVATAR = './images/profile.PNG';
  userAvatarUrl: string = this.DEFAULT_AVATAR;

  avatarSubscription: Subscription = new Subscription();
  playerSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private playerService: PlayerService,
    private avatarService: AvatarService,
    private logger: LoggerService,
    private router: Router
  ) {}

  ngOnInit() {
    const email = this.authService.userEmail;

    if (!email) return;

    // Buscar dados iniciais do usuário logado
    this.playerService.getPlayer(email).subscribe({
      next: (player) => {
        if (player && player.name) {
          this.username = player.name;
          this.userAvatarUrl = player.avatarUrl || this.DEFAULT_AVATAR;
        } else {
          this.username = 'Usuário';
          this.userAvatarUrl = this.DEFAULT_AVATAR;
        }
      },
      error: (err) => {
        this.logger.warn('Erro ao buscar dados do player:', err);
        this.username = 'Usuário';
        this.userAvatarUrl = this.DEFAULT_AVATAR;
      }
    });

    // Inscrever-se APENAS no player$ do usuário logado para atualizações do seu próprio avatar
    this.avatarSubscription = this.playerService.player$.subscribe(
      player => {
        // Só atualiza se for o mesmo usuário logado
        if (player && player.email === email && player.avatarUrl) {
          this.userAvatarUrl = player.avatarUrl;
        }
      }
    );
  }

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  goToMyProfile() {
    // Força navegação para o perfil sempre carregando o usuário logado
    // Usa timestamp para forçar navegação mesmo estando na mesma rota
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/app/profile']);
    });
  }

  logout() {
    this.authService.signOut();
  }

  ngOnDestroy() {
    this.avatarSubscription.unsubscribe();
  }
}
