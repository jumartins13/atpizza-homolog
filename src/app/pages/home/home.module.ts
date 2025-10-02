import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { NgIconsModule } from '@ng-icons/core';
import { heroBars3 } from '@ng-icons/heroicons/outline';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes), NgIconsModule.withIcons({ heroBars3 })],
  exports: [RouterModule]
})
export class HomeModule { }