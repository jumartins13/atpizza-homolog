import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { matAccessTimeSharp, matCloseSharp } from '@ng-icons/material-icons/sharp';
import { Availability, TimeSlot } from '@app/models/calendar/calendar.model';

@Component({
  selector: 'app-calendar-summary-popup',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [provideIcons({ matCloseSharp, matAccessTimeSharp })],
  templateUrl: './calendar-summary-popup.component.html',
  styleUrl: './calendar-summary-popup.component.scss'
})
export class CalendarSummaryPopupComponent {
  @Input() show = false;
  @Input() currentWeek: Date[] = [];
  @Input() availabilities: Availability[] = [];
  @Input() viewingPlayerId: string | null = null;
  @Output() close = new EventEmitter<void>();

  timeSlots: TimeSlot[] = [
    { time: "06:00", displayTime: "06:00" },
    { time: "07:00", displayTime: "07:00" },
    { time: "08:00", displayTime: "08:00" },
    { time: "09:00", displayTime: "09:00" },
    { time: "10:00", displayTime: "10:00" },
    { time: "11:00", displayTime: "11:00" },
    { time: "12:00", displayTime: "12:00" },
    { time: "13:00", displayTime: "13:00" },
    { time: "14:00", displayTime: "14:00" },
    { time: "15:00", displayTime: "15:00" },
    { time: "16:00", displayTime: "16:00" },
    { time: "17:00", displayTime: "17:00" },
    { time: "18:00", displayTime: "18:00" },
    { time: "19:00", displayTime: "19:00" },
    { time: "20:00", displayTime: "20:00" },
    { time: "21:00", displayTime: "21:00" },
  ];

  onClose() {
    this.close.emit();
  }

  getDateString(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  isTimeInRange(time: string, startTime: string, endTime: string): boolean {
    const timeMin = this.timeToMinutes(time);
    const startMin = this.timeToMinutes(startTime);
    const endMin = this.timeToMinutes(endTime);
    return timeMin >= startMin && timeMin < endMin;
  }

  getSlotStatus(day: number, time: string): "available" | "maybe" | "busy" | null {
    if (!this.currentWeek[day]) return null;
    
    const date = this.currentWeek[day];
    const dateStr = this.getDateString(date);

    const availability = this.availabilities.find(
      (av) =>
        av.userId === this.viewingPlayerId &&
        av.date === dateStr &&
        this.isTimeInRange(time, av.startTime, av.endTime)
    );

    return availability?.status || null;
  }

  getStatusClasses(status: string | null): string {
    switch (status) {
      case "available":
        return "status-available";
      case "maybe":
        return "status-maybe";
      case "busy":
        return "status-busy";
      default:
        return "status-free";
    }
  }

  formatDateHeader(date: Date): string {
    const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" });
    const day = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capitalizedWeekday}\n${day}`;
  }

  formatWeekRange(): string {
    if (this.currentWeek.length === 0) return '';
    
    const start = this.currentWeek[0];
    const end = this.currentWeek[6];
    const startDate = `${start.getDate()}/${start.getMonth() + 1}/${start.getFullYear()}`;
    const endDate = `${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`;
    return `${startDate} - ${endDate}`;
  }
}