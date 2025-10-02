// Este arquivo de rotas não é mais necessário pois as rotas foram movidas para app.routes.ts
// e ScoresComponent agora é standalone

/* 
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PendingComponent } from './pending/pending.component';
import { ScoresComponent } from './scores.component';
import { CompletedComponent } from './completed/completed.component';


export const routes: Routes = [
  {
    path: '',
    component: ScoresComponent,
    children: [
      {
        path: 'pending',
        loadComponent: () =>
          import('./pending/pending.component').then(m => m.PendingComponent),
      },
      {
        path: 'completed',
        loadComponent: () =>
          import('./completed/completed.component').then(m => m.CompletedComponent),
      },
      {
        path: '',
        redirectTo: 'pending',
        pathMatch: 'full'
      }
    ]
  }]
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ScoresRoutingModule { }
*/ 