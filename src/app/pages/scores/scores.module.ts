// Este módulo não é mais necessário pois ScoresComponent agora é standalone
// e é carregado diretamente via loadComponent nas rotas

/* 
import { NgModule } from '@angular/core';
import { ScoresRoutingModule } from './scores.routes';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { ScoresComponent } from './scores.component';
import { PendingComponent } from './pending/pending.component';
import { CompletedComponent } from './completed/completed.component';
import { SelectComponent } from '@components/select/select.component';
import { SelectSkeletonComponent } from '@components/select-skeleton/select-skeleton.component';


@NgModule({
  declarations: [ScoresComponent],
  imports: [
    ScoresRoutingModule,
    MatSelectModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    RouterModule,
    SelectComponent,
    SelectSkeletonComponent
  ],
  exports: [
    ScoresRoutingModule,
    ScoresComponent
  ]
})
export class ScoresModule { }
*/