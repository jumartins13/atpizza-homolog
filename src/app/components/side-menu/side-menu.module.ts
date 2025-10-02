import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { NgIconsModule } from '@ng-icons/core';
import { heroBars3 } from '@ng-icons/heroicons/outline';
import { SideMenuComponent } from './side-menu.component';
import { ClickOutsideDirective } from './click-outside.directive';
import { CommonModule } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';
import { RouterLink } from '@angular/router';

@NgModule({
  declarations: [SideMenuComponent, ClickOutsideDirective],
  imports: [NgIconsModule.withIcons({ heroBars3 }), CommonModule, RouterLink],
  exports: [SideMenuComponent, ClickOutsideDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    provideAnimations()
  ]
})
export class SideMenuModule { }