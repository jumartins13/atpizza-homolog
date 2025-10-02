import { NgModule } from '@angular/core';
import { LoginComponent } from './pages/login/login.component';
import { RouterModule, Routes } from '@angular/router';
import { PagesComponent } from './pages/pages.component';
import { AboutComponent } from './pages/about/about.component';
import { LeaderboardComponent } from './pages/leaderboard/leaderboard.component';
import { PlayerComponent } from './pages/player/player.component';
import { RankingsComponent } from './pages/rankings/rankings.component';
import { RulesComponent } from './pages/rules/rules.component';
import { PizzaComponent } from './pages/pizza/pizza.component';
import { CalendarComponent } from './pages/calendar/calendar.component';
// import { RouterModule, Routes } from '@angular/router';
// import { PlayerComponent } from './pages/player/player.component';
// import { RankingsComponent } from './pages/rankings/rankings.component';
// import { RulesComponent } from './pages/rules/rules.component';
// import { LeaderboardComponent } from './pages/leaderboard/leaderboard.component';
// import { LoginComponent } from './pages/login/login.component';
// import { PagesComponent } from './pages/pages.component';
// import { AutocompleteComponent } from './pages/player/autocomplete/autocomplete.component';
// import { AboutComponent } from './pages/about/about.component';
// import { StatsComponent } from './pages/stats/stats.component';
// import { TournamentComponent } from './pages/tournament/tournament.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'app',
    component: PagesComponent,
    children: [
      { path: 'home', loadChildren: () => import('./pages/home/home.module').then(m => m.HomeModule) },
      { path: 'pizza', component: PizzaComponent },
      { path: 'profile', component: PlayerComponent },
      { path: 'rankings', component: RankingsComponent },
      { path: 'calendar', component: CalendarComponent },
      { path: 'rules', component: RulesComponent },
      { path: 'about', component: AboutComponent },
      { path: 'leaderboard', component: LeaderboardComponent },
      { 
        path: 'scores', 
        loadComponent: () => import('./pages/scores/scores.component').then(c => c.ScoresComponent),
        children: [
          {
            path: 'pending',
            loadComponent: () => import('./pages/scores/pending/pending.component').then(m => m.PendingComponent),
          },
          {
            path: 'completed',
            loadComponent: () => import('./pages/scores/completed/completed.component').then(m => m.CompletedComponent),
          },
          {
            path: '',
            redirectTo: 'pending',
            pathMatch: 'full'
          }
        ]
      }
    ]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
