import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-select-skeleton',
  standalone: true,
  imports: [],
  templateUrl: './select-skeleton.component.html',
  styleUrl: './select-skeleton.component.scss'
})
export class SelectSkeletonComponent {
  @Input() variant: 'default' | 'rankings' = 'default';
}