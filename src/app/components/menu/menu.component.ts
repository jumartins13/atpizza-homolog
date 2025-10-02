import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SideMenuModule } from '@components/side-menu/side-menu.module';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroChartBar, heroTrophy, heroStar, heroUsers } from '@ng-icons/heroicons/outline';
import { matBarChartSharp, matCalendarMonthSharp, matLeaderboardSharp, matSportsTennisSharp } from '@ng-icons/material-icons/sharp';
@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterLink, SideMenuModule, NgIconComponent],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
  providers: [ provideIcons ( { heroChartBar, heroTrophy, heroUsers, heroStar, matBarChartSharp, matSportsTennisSharp, matLeaderboardSharp, matCalendarMonthSharp } ) ]
})
export class MenuComponent implements OnInit {

  constructor(private router: Router) {}

  ngOnInit() {
  }

  goToMyProfile() {
    // Força navegação para o perfil sempre carregando o usuário logado
    // Usa timestamp para forçar navegação mesmo estando na mesma rota
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/app/profile']);
    });
  }

  goToMyCalendar() {
    // Força navegação para o calendário sempre carregando o usuário logado
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/app/calendar']);
    });
  }

  goToMyScores() {
    // Força navegação para confrontos sempre carregando o grupo do usuário logado
    // Usa mesma estratégia do "Meu perfil"
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/app/scores']);
    });
  }

}
