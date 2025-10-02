import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ISelectItem } from '@models/select/select.model';

@Component({
  selector: 'app-whatsapp-groups-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './whatsapp-groups-popup.component.html',
  styleUrl: './whatsapp-groups-popup.component.scss'
})
export class WhatsappGroupsPopupComponent {
  @Input() isVisible = false;
  @Input() groups: ISelectItem[] = [];
  @Output() close = new EventEmitter<void>();
  
  closePopup() {
    this.close.emit();
  }
  
  getGroupsWithLinks(): ISelectItem[] {
    return this.groups.filter(group => group.link && group.link.length > 0);
  }
}