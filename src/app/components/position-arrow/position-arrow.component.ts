import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { matKeyboardDoubleArrowDownSharp, matKeyboardDoubleArrowUpSharp } from '@ng-icons/material-icons/sharp';

@Component({
  selector: 'app-position-arrow',
  standalone: true,
  imports: [NgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './position-arrow.component.html',
  styleUrl: './position-arrow.component.scss',
  providers: [ 
    provideIcons({
    matKeyboardDoubleArrowUpSharp,
    matKeyboardDoubleArrowDownSharp
  }) ]
})
export class PositionArrowComponent {

  @Input() positionChange: number = 0;
}
