export interface Round {
  id: string;
  isActive: boolean;
  startDate: string | { toDate: () => Date };
  endDate: string | { toDate: () => Date };
}
