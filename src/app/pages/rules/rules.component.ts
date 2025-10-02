import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { CommonModule } from '@angular/common';
import { FloatingCircleComponent } from "../../components/floating-circle/floating-circle.component";

@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [CommonModule, FloatingCircleComponent],
  providers: [AngularFireAuth],
  templateUrl: './rules.component.html',
  styleUrl: './rules.component.scss',
})
export class RulesComponent {
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