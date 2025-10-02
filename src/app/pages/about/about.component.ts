import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { CommonModule } from '@angular/common';
import { FloatingCircleComponent } from '@app/components/floating-circle/floating-circle.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, FloatingCircleComponent],
  providers: [AngularFireAuth],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  activeSection: string | null = null;

  section = {
    ranking: '',
    wo: '',
    results: '',
    games: '',
    points: ''
  }

  toggleSection(section: string): void {
    this.activeSection = this.activeSection === section ? null : section;
  }

  isExpanded(section: string): boolean {
    return this.activeSection === section;
  }
}