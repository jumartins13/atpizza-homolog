import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent } from '@ng-icons/core';
import {
  matCheckSharp,
  matQuestionMarkSharp,
  matRemoveSharp,
  matEditCalendarSharp,
} from '@ng-icons/material-icons/sharp';
import { PendingSelection } from '@app/models/calendar/calendar.model';

@Component({
  selector: 'app-selection-bar',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [],
  templateUrl: './selection-bar.component.html',
  styleUrls: ['./selection-bar.component.scss'],
})
export class SelectionBarComponent {
  @Input() show = false;
  @Input() loading = false;

  @Input() pendingSelections: PendingSelection[] = [];
  @Input() pendingStatus: 'available' | 'maybe' | 'unavailable' = 'available';

  @Output() statusChange = new EventEmitter<'available' | 'maybe' | 'unavailable'>();
  @Output() apply = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();

  setStatus(status: 'available' | 'maybe' | 'unavailable') {
    if (this.pendingStatus !== status) {
      this.pendingStatus = status;
      this.statusChange.emit(status);
    }
  }

  getStatusLabel(
    status: 'available' | 'maybe' | 'unavailable'
  ): string {
    switch (status) {
      case 'available':
        return 'Disponível';
      case 'maybe':
        return 'Talvez';
      case 'unavailable':
        return 'Remover';
    }
  }

  getDescription(): string {
    const count = this.pendingSelections.length;
    const statusLabel = this.getStatusLabel(this.pendingStatus).toLowerCase();
    if (count === 1) return `Marcar como ${statusLabel}`;
    return `Marcar todos como ${statusLabel}`;
  }

  onApply() {
    this.apply.emit();
  }

  onClear() {
    this.clear.emit();
  }
}
