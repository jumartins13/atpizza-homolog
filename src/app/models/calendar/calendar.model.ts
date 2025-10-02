export interface User {
    id: string;
    name: string;
    level: string;
    avatar: string;
  }
  
  export interface Availability {
    id: number;
    userId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'available' | 'maybe' | 'busy';
    notes?: string;
  }
  
  export interface TimeSlot {
    time: string;
    displayTime: string;
  }
  
  export interface SelectionState {
    isSelecting: boolean;
    startDay: number | null;
    startTime: string | null;
  }
  
  export interface SelectedRange {
    day: number;
    time: string;
  }
  
  export interface SwipeState {
    startX: number;
    startY: number;
    isDragging: boolean;
    hasMoved: boolean;
    threshold: number;
  }
  
  export interface AvailabilitySummary {
    date: string;
    dayName: string;
    timeSlots: {
      startTime: string;
      endTime: string;
      status: 'available' | 'maybe' | 'busy';
      notes?: string;
    }[];
  }

  export interface PendingSelection {
    day: number;
    time: string;
    date: string;
    displayDate: string;
    displayTime: string;
  }