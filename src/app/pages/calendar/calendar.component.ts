import { Component, OnInit, OnDestroy } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { FloatingCircleComponent } from "../../components/floating-circle/floating-circle.component";
import {
  Availability,
  AvailabilitySummary,
  PendingSelection,
  SelectedRange,
  SelectionState,
  TimeSlot,
  User,
} from "@app/models/calendar/calendar.model";
import { PlayerService } from "@app/services/player.service";
import { AuthService } from "@app/services/auth.service";
import { AutocompleteComponent } from "../player/autocomplete/autocomplete.component";
import { LoggerService } from "@app/services/logger.service";
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import {
  matAccessTimeSharp,
  matCheckSharp,
  matEditCalendarSharp,
  matLogoutSharp,
  matQuestionMarkSharp,
  matRemoveSharp,
  matSaveAltSharp,
} from "@ng-icons/material-icons/sharp";
import { SelectionBarComponent } from "./selection-bar/selection-bar.component";
import { ToastService } from "@app/services/toast.service";
import { CalendarSummaryPopupComponent } from "@app/components/calendar-summary-popup/calendar-summary-popup.component";


@Component({
  selector: "app-calendar",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AutocompleteComponent,
    NgIconComponent,
    SelectionBarComponent,
    CalendarSummaryPopupComponent,
  ],
  providers: [
    AngularFireAuth,
    provideIcons({
      matSaveAltSharp,
      matQuestionMarkSharp,
      matCheckSharp,
      matRemoveSharp,
      matLogoutSharp,
      matEditCalendarSharp,
      matAccessTimeSharp
    }),
  ],
  templateUrl: "./calendar.component.html",
  styleUrls: ["./calendar.component.scss"],
})
export class CalendarComponent implements OnInit, OnDestroy {
  currentWeek: Date[] = [];
  selectedWeekStart = new Date();
  showAvailabilityModal = false;
  showSummaryView = false;
  showSummaryPopup = false;
  loading = false;
  canEditCalendar = false;

  // Seleções múltiplas
  pendingSelections: PendingSelection[] = [];
  showSelectionBar = false;
  pendingStatus: "available" | "maybe" | "unavailable" = "available";

  // Mobile / pointer / long-press
  multiSelectMode = true;
  multiSelectDragging = false;
  private longPressTimer: any = null;
  longPressDelay = 450; // ms
  pointerDownTs = 0;
  private pointerType: "mouse" | "touch" | "pen" | "" = "";
  private longPressTriggered = false;

  // Movimento real (px)
  private startX = 0;
  private startY = 0;
  private movedEnough = false;
  private moveThresholdPx = 8; // px
  private activePointerId: number | null = null;

  currentUser: User = { id: "1", name: "Juliana", level: "", avatar: "" };

  authPlayerId: string | null = null;
  viewingPlayerId: string | null = null;
  viewingPlayerName: string | null = null;

  availabilities: Availability[] = [];
  availabilitySummary: AvailabilitySummary[] = [];

  selectionState: SelectionState = {
    isSelecting: false,
    startDay: null,
    startTime: null,
  };

  selectedRange: SelectedRange | null = null;
  hoveredCell: { day: number; time: string } | null = null;

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

  availabilityForm = {
    status: "available" as "available" | "maybe" | "unavailable",
    notes: "",
  };

  constructor(
    private playerService: PlayerService,
    private authService: AuthService,
    private toast: ToastService,
    private logger: LoggerService
  ) {}

  ngOnInit() {
    this.logger.log("🚀 Inicializando CalendarComponent...");

    const email = this.authService.userEmail;
    this.logger.log("📧 Email do usuário autenticado:", email);

    if (email && typeof email === "string") {
      this.loginAuthenticatedUser(email)
        .then(() => this.setupPlayerServiceSubscription())
        .catch(() => this.setupPlayerServiceSubscription());
    } else {
      this.logger.log("⚠️ Nenhum email encontrado, gerando semana vazia");
      this.generateWeek();
      this.availabilities = [];

      setTimeout(() => {
        const delayedEmail = this.authService.userEmail;
        if (
          delayedEmail &&
          typeof delayedEmail === "string" &&
          !this.authPlayerId
        ) {
          this.logger.log(
            "🔄 Tentativa atrasada de login do usuário:",
            delayedEmail
          );
          this.loginAuthenticatedUser(delayedEmail)
            .then(() => this.setupPlayerServiceSubscription())
            .catch(() => this.setupPlayerServiceSubscription());
        } else {
          this.setupPlayerServiceSubscription();
        }
      }, 1000);
    }
  }

  private loginAuthenticatedUser(email: string): Promise<void> {
    this.logger.log("🔑 Fazendo login do usuário autenticado:", email);
    return this.getPlayer(email);
  }

  get isViewerOnly(): boolean {
    // Modo leitura quando há alguém para ver e você NÃO pode editar
    return !!this.viewingPlayerId && !this.canEditCalendar;
  }

  viewPlayer(email: string): Promise<void> {
    this.logger.log("👁️ Carregando jogador para visualização:", email);
    return this.getPlayer(email);
  }

  private setupPlayerServiceSubscription() {
    this.playerService.playerId.subscribe((id) => {
      this.logger.log("📡 PlayerService playerId mudou:", id);
      this.logger.log("👤 AuthPlayerId atual (não deve mudar):", this.authPlayerId);

      if (!this.authPlayerId) {
        this.logger.log(
          "⚠️ Sem authPlayerId definido, não podemos processar mudanças externas"
        );
        return;
      }

      const newViewingPlayerId = id || this.authPlayerId;

      if (newViewingPlayerId !== this.viewingPlayerId) {
        this.logger.log(
          "🔄 Mudando visualização de:",
          this.viewingPlayerId,
          "para:",
          newViewingPlayerId
        );
        this.viewingPlayerId = newViewingPlayerId;
        this.checkPermission();

        if (this.viewingPlayerId && typeof this.viewingPlayerId === "string") {
          this.generateWeek();
          this.loadAvailabilityCalendar(this.viewingPlayerId);
        }
      }
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.longPressTimer);
  }

  // ----------------- Data / Semana -----------------
  getPlayer(email: string): Promise<void> {
    this.logger.log("🔍 Buscando player com email:", email);
    this.loading = true;

    return new Promise((resolve, reject) => {
      this.playerService.getPlayer(email).subscribe({
        next: (player) => {
          this.logger.log("📦 Player recebido:", player);

          if (player && player.id) {
            if (!this.authPlayerId) {
              this.currentUser.id = player.id;
              this.currentUser.name = player.name || player.displayName || (player.email?.split('@')[0]) || 'Jogador';
              this.authPlayerId = player.id;
              this.viewingPlayerId = this.authPlayerId;
              this.viewingPlayerName = this.currentUser.name;
              this.logger.log(
                "✅ ViewingPlayerId definido como:",
                this.viewingPlayerId
              );
            } else {
              this.logger.log(
                "👁️ Carregando dados de outro jogador para visualização:",
                player.id
              );
              this.logger.log("👤 AuthPlayerId mantém-se como:", this.authPlayerId);
              this.viewingPlayerId = player.id;
              this.viewingPlayerName = player.name || player.displayName || (player.email?.split('@')[0]) || 'Jogador'; 
              this.logger.log(
                "✅ ViewingPlayerId atualizado para:",
                this.viewingPlayerId
              );
            }

            this.checkPermission();
            this.logger.log("🔐 Pode editar calendário:", this.canEditCalendar);

            this.generateWeek();

            if (this.viewingPlayerId) {
              this.loadAvailabilityCalendar(this.viewingPlayerId);
            }

            resolve();
          } else {
            this.logger.error("❌ Jogador não encontrado ou sem ID válido");
            this.handlePlayerNotFound();
            reject(new Error("Jogador não encontrado"));
          }
        },
        error: (err) => {
          this.logger.error("❌ Erro ao buscar jogador:", err);
          this.handlePlayerError(err);
          reject(err);
        },
      });
    });
  }

  handlePlayerNotFound() {
    this.generateWeek();
    this.availabilities = [];
    this.loading = false;
    this.authPlayerId = null;
    this.viewingPlayerId = null;
    this.canEditCalendar = false;
  }

  handlePlayerError(error: any) {
    this.logger.error("❌ Erro detalhado:", error);
    this.generateWeek();
    this.availabilities = [];
    this.loading = false;
  }

  loadAvailabilityCalendar(playerId: string) {
    this.playerService.getAvailabilityCalendar(playerId).subscribe({
      next: (calendar) => {
        if (calendar?.availabilities) {
          this.logger.log("📅 Calendário carregado:", calendar);
          this.mapFirebaseToAvailabilities(calendar.availabilities);
        } else {
          this.logger.log("📅 Nenhum calendário encontrado (iniciando vazio).");
          this.availabilities = [];
        }
        this.loading = false;
      },
      error: (err) => {
        this.logger.error("❌ Erro ao carregar calendário:", err);
        this.availabilities = [];
        this.loading = false;
      },
    });
  }

  mapFirebaseToAvailabilities(firebaseAvailabilities: any[]) {
    this.availabilities = firebaseAvailabilities.map((fbAv, index) => ({
      id: Date.now() + index,
      userId: this.viewingPlayerId!,
      date: fbAv.date,
      startTime: fbAv.startTime,
      endTime: fbAv.endTime,
      status: fbAv.status,
      notes: fbAv.notes || "",
    }));
    this.logger.log("🔄 Disponibilidades mapeadas:", this.availabilities);
  }

  checkPermission() {
    this.logger.log("🔐 Verificando permissões...");
    this.logger.log("👤 AuthPlayerId:", this.authPlayerId);
    this.logger.log("👁️ ViewingPlayerId:", this.viewingPlayerId);

    if (!this.authPlayerId) {
      this.logger.log("⚠️ Nenhum jogador autenticado");
      this.canEditCalendar = false;
      return;
    }

    if (!this.viewingPlayerId) {
      this.logger.log(
        "⚠️ Nenhum jogador visualizado, definindo como jogador autenticado"
      );
      this.viewingPlayerId = this.authPlayerId;
    }

    const hasAuthId = !!this.authPlayerId;
    const hasViewingId = !!this.viewingPlayerId;
    const idsMatch = this.authPlayerId === this.viewingPlayerId;

    this.logger.log("✓ Tem AuthId:", hasAuthId);
    this.logger.log("✓ Tem ViewingId:", hasViewingId);
    this.logger.log("✓ IDs coincidem:", idsMatch);

    this.canEditCalendar = hasAuthId && hasViewingId && idsMatch;

    this.logger.log("🏁 Resultado - Pode editar:", this.canEditCalendar);
    if (!this.canEditCalendar) {
      if (!hasAuthId) this.logger.log("  - AuthPlayerId está null/undefined");
      if (!hasViewingId) this.logger.log("  - ViewingPlayerId está null/undefined");
      if (hasAuthId && hasViewingId && !idsMatch) {
        this.logger.log(
          "  - IDs não coincidem:",
          this.authPlayerId,
          "≠",
          this.viewingPlayerId
        );
      }
    }
  }

  generateWeek() {
    this.currentWeek = [];
    const startOfWeek = this.getStartOfWeek(this.selectedWeekStart);
    this.currentWeek.push(startOfWeek);
    for (let i = 1; i < 7; i++) {
      const nextDay = new Date(startOfWeek);
      nextDay.setDate(startOfWeek.getDate() + i);
      this.currentWeek.push(nextDay);
    }

    this.logger.log("currentWeek:", this.currentWeek);
  }

  getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - (day === 0 ? 6 : day - 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  isDayDisabled(day: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDay = new Date(day);
    compareDay.setHours(0, 0, 0, 0);
    return compareDay < today;
  }

  navigateWeek(direction: number) {
    const newDate = new Date(this.selectedWeekStart);
    newDate.setDate(newDate.getDate() + direction * 7);
    this.selectedWeekStart = newDate;
    this.generateWeek();
    this.clearPendingSelections();
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

  getSlotStatus(
    day: number,
    time: string
  ): "available" | "maybe" | "busy" | null {
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

  isCellPendingSelection(day: number, time: string): boolean {
    return this.pendingSelections.some((s) => s.day === day && s.time === time);
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

  getCellClasses(day: number, time: string): string {
    const status = this.getSlotStatus(day, time);
    const isPending = this.isCellPendingSelection(day, time);
    const isPast = this.isPastTimeSlot(day, time);
    const isPastDay = this.isPastDay(day);
    let classes = "time-cell ";
    classes += this.getStatusClasses(status) + " ";

    if (isPending) classes += "pending-selection ";
    if (isPast) classes += "past-time disabled ";
    if (isPastDay) classes += "past-day-column ";
    if (this.multiSelectMode && !status && !isPending && !isPast) {
      classes += "multi-select-mode ";
    }

    return classes;
  }

  /**
   * Verifica se um dia inteiro já passou (permite hoje e futuro, bloqueia passado)
   */
  isPastDay(day: number): boolean {
    if (!this.currentWeek || !this.currentWeek[day]) {
      return false;
    }

    const today = new Date();
    const todayStr = today.toDateString(); // Formato: "Mon Sep 30 2025"

    const checkDate = new Date(this.currentWeek[day]);
    const checkDateStr = checkDate.toDateString();

    const isPast = checkDate < today && checkDateStr !== todayStr;

    // Retorna true apenas se a data é anterior ao dia de hoje (não hoje)
    return isPast;
  }

  /**
   * Verifica se um horário específico já passou
   */
  private isPastTimeSlot(day: number, time: string): boolean {
    if (!this.currentWeek || !this.currentWeek[day]) {
      return false;
    }

    const now = new Date();
    const currentDate = new Date(this.currentWeek[day]);

    // Se é um dia anterior ao hoje, sempre é passado
    if (this.isPastDay(day)) {
      return true;
    }

    // Se é hoje, verificar se o horário já passou
    if (currentDate.toDateString() === now.toDateString()) {
      const [hours, minutes] = time.split(':').map(Number);
      const slotTime = new Date(now);
      slotTime.setHours(hours, minutes, 0, 0);

      return slotTime <= now;
    }

    // Se é dia futuro, não é passado
    return false;
  }

  /**
   * Retorna classes CSS para o cabeçalho do dia
   */
  getDayHeaderClasses(dayIndex: number): string {
    let classes = 'day-header';

    if (this.isPastDay(dayIndex)) {
      classes += ' past-day';
    }

    return classes;
  }

  onPointerDown(e: PointerEvent, day: number, time: string) {
    if (!this.canEditCalendar) return;

    // Verificar se é horário passado
    if (this.isPastTimeSlot(day, time)) {
      this.toast.show('Não é possível marcar horários anteriores ao momento atual', 'error');
      return;
    }

    this.pointerType = (e.pointerType as any) || "";
    this.pointerDownTs = performance.now();
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.movedEnough = false;
    this.longPressTriggered = false;
    this.activePointerId = e.pointerId;

    // Capturar ponteiro para continuar recebendo eventos
    try {
      (e.currentTarget as Element)?.setPointerCapture?.(e.pointerId);
    } catch {}

    // Evita scroll/ghost click no touch
    if (this.pointerType === "touch") e.preventDefault();

    if (this.pointerType === "touch") {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = setTimeout(() => {
        if (this.movedEnough) return; // cancelado por movimento
        this.longPressTriggered = true;
        this.activateMultiSelectMode();
        this.multiSelectDragging = true;
        this.toggleCellSelection(day, time);
        if ((navigator as any).vibrate) (navigator as any).vibrate(30);
      }, this.longPressDelay);
    } else {
      // mouse/caneta: ctrl/cmd ou já em multi
      if (
        this.multiSelectMode ||
        e.ctrlKey ||
        e.metaKey ||
        this.pendingSelections.length > 0
      ) {
        this.multiSelectDragging = true;
        this.toggleCellSelection(day, time);
      }
    }
  }

  onPointerMove(e: PointerEvent) {
    if (!this.canEditCalendar) return;
    if (this.activePointerId !== null && e.pointerId !== this.activePointerId)
      return;

    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;
    const dist = Math.hypot(dx, dy);

    if (!this.movedEnough && dist > this.moveThresholdPx) {
      this.movedEnough = true;
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (!this.multiSelectDragging) return;

    // Célula sob o dedo
    const el = document.elementFromPoint(
      e.clientX,
      e.clientY
    ) as HTMLElement | null;
    const cell = el?.closest?.(".cell-surface") as HTMLElement | null;
    if (!cell) return;

    const dayAttr = cell.getAttribute("data-day");
    const timeAttr = cell.getAttribute("data-time");
    if (dayAttr == null || timeAttr == null) return;

    const day = Number(dayAttr);
    const time = String(timeAttr);

    if (!this.isCellPendingSelection(day, time)) {
      this.toggleCellSelection(day, time);
    }
  }

  onPointerUp(e: PointerEvent) {
    if (!this.canEditCalendar) return;
    if (this.activePointerId !== null && e.pointerId === this.activePointerId) {
      try {
        (e.currentTarget as Element)?.releasePointerCapture?.(e.pointerId);
      } catch {}
    }
    clearTimeout(this.longPressTimer);
    this.longPressTimer = null;

    if (this.multiSelectDragging) {
      this.multiSelectDragging = false;
      this.longPressTriggered = false;
      this.pointerType = "";
      this.activePointerId = null;
      return;
    }

    const el = document.elementFromPoint(
      e.clientX,
      e.clientY
    ) as HTMLElement | null;
    const cell = el?.closest?.(".cell-surface") as HTMLElement | null;
    if (!cell) {
      this.longPressTriggered = false;
      this.pointerType = "";
      this.activePointerId = null;
      return;
    }
    const dayAttr = cell.getAttribute("data-day");
    const timeAttr = cell.getAttribute("data-time");
    if (dayAttr == null || timeAttr == null) {
      this.longPressTriggered = false;
      this.pointerType = "";
      this.activePointerId = null;
      return;
    }
    const day = Number(dayAttr);
    const time = String(timeAttr);

    const isShortTap = !this.longPressTriggered && !this.movedEnough;

    if (this.pointerType === "touch") {
      if (isShortTap) {
        if (this.multiSelectMode || this.pendingSelections.length > 0) {
          this.toggleCellSelection(day, time);
        }
      }
    }

    this.longPressTriggered = false;
    this.pointerType = "";
    this.activePointerId = null;
  }

  onPointerCancel(_e: PointerEvent) {
    clearTimeout(this.longPressTimer);
    this.longPressTimer = null;
    this.multiSelectDragging = false;
    this.longPressTriggered = false;
    this.activePointerId = null;
  }

  // ----------------- Seleção / Aplicação -----------------
  activateMultiSelectMode() {
    this.multiSelectMode = true;
    this.showSelectionBar = this.pendingSelections.length > 0;
    this.logger.log("🎯 Modo de seleção múltipla ativado");
  }

  toggleMultiSelectMode() {
    this.multiSelectMode = !this.multiSelectMode;
    if (!this.multiSelectMode) this.clearPendingSelections();
  }

  toggleCellSelection(day: number, time: string) {
    if (!this.canEditCalendar) return;
    const date = this.currentWeek[day];
    const dateStr = this.getDateString(date);

    const idx = this.pendingSelections.findIndex(
      (s) => s.day === day && s.time === time
    );

    if (idx >= 0) {
      this.pendingSelections.splice(idx, 1);
    } else {
      const startTimeIndex = this.timeSlots.findIndex(
        (slot) => slot.time === time
      );
      const endTimeIndex = Math.min(
        startTimeIndex + 1,
        this.timeSlots.length - 1
      );
      const endTime =
        startTimeIndex === this.timeSlots.length - 1
          ? "23:00"
          : this.timeSlots[endTimeIndex].time;

      this.pendingSelections.push({
        day,
        time,
        date: dateStr,
        displayDate: date.toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        }),
        displayTime: `${time} - ${endTime}`,
      });
    }

    this.showSelectionBar = this.pendingSelections.length > 0;
  }

  clearPendingSelections() {
    this.pendingSelections = [];
    this.showSelectionBar = false;
    this.pendingStatus = "available";
  }

  applyPendingSelections() {
    if (this.pendingSelections.length === 0) return;

    const selectionsCount = this.pendingSelections.length;
    const statusLabel = this.getStatusLabel(this.pendingStatus);

    this.pendingSelections.forEach((s) => {
      if (this.pendingStatus === "unavailable") {
        this.removeAvailabilityForCell(s.day, s.time);
      } else {
        this.addAvailabilityForCell(s.day, s.time, this.pendingStatus);
      }
    });

    this.savePendingSelections(selectionsCount, statusLabel);
  }

  removeAvailabilityForCell(day: number, time: string) {
    const date = this.currentWeek[day];
    const dateStr = this.getDateString(date);

    this.availabilities = this.availabilities.filter((av) => {
      if (av.userId !== this.viewingPlayerId || av.date !== dateStr)
        return true;
      return !this.isTimeInRange(time, av.startTime, av.endTime);
    });
  }

  addAvailabilityForCell(
    day: number,
    time: string,
    status: "available" | "maybe"
  ) {
    this.removeAvailabilityForCell(day, time);
    const date = this.currentWeek[day];
    const dateStr = this.getDateString(date);

    const startTimeIndex = this.timeSlots.findIndex(
      (slot) => slot.time === time
    );
    const endTimeIndex = Math.min(
      startTimeIndex + 1,
      this.timeSlots.length - 1
    );
    const endTime =
      startTimeIndex === this.timeSlots.length - 1
        ? "23:00"
        : this.timeSlots[endTimeIndex].time;

    const newAvailability: Availability = {
      id: Date.now() + Math.random(),
      userId: this.viewingPlayerId!,
      date: dateStr,
      startTime: time,
      endTime,
      status,
      notes: "",
    };

    this.availabilities.push(newAvailability);
  }

  savePendingSelections(selectionsCount?: number, statusLabel?: string) {
    if (!this.viewingPlayerId) {
      this.logger.error("❌ ID do jogador não encontrado para salvar.");
      alert("Erro: ID do jogador não encontrado.");
      return;
    }

    const userAvailabilities = this.availabilities.filter(
      (av) => av.userId === this.viewingPlayerId
    );
    this.logger.log("💾 Salvando seleções pendentes:", userAvailabilities);

    this.loading = true;
    this.playerService
      .saveAvailabilityCalendar(this.viewingPlayerId!, userAvailabilities)
      .subscribe({
        next: () => {
          this.logger.log("✅ Seleções salvas no Firebase!");
          this.loading = false;

          if (selectionsCount && statusLabel) {
            this.toast.show(
              `✅ ${selectionsCount} horário(s) marcado(s) como "${statusLabel.toLowerCase()}" com sucesso!`,
              'success'
            );
          }

          this.clearPendingSelections();
        },
        error: (err) => {
          this.logger.error("❌ Erro ao salvar seleções:", err);
          this.loading = false;
          alert("Erro ao salvar seleções. Tente novamente.");
        },
      });
  }

  removePendingSelection(day: number, time: string): void {
    const index = this.pendingSelections.findIndex(
      (s) => s.day === day && s.time === time
    );
    if (index >= 0) {
      this.pendingSelections.splice(index, 1);
      this.showSelectionBar = this.pendingSelections.length > 0;
    }
  }

  formatDateHeader(date: Date): string {
    const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" });
    const day = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capitalizedWeekday}\n${day}`;
  }

  formatWeekRange(): string {
    const start = this.currentWeek[0];
    const end = this.currentWeek[6];
    const startDate = `${start.getDate()}/${
      start.getMonth() + 1
    }/${start.getFullYear()}`;
    const endDate = `${end.getDate()}/${
      end.getMonth() + 1
    }/${end.getFullYear()}`;
    return `${startDate} - ${endDate}`;
  }

  duplicateToNextWeek() {
    const currentWeekDates = this.currentWeek.map((date) =>
      this.getDateString(date)
    );
    const currentWeekAvailabilities = this.availabilities.filter(
      (av) =>
        av.userId === this.viewingPlayerId && currentWeekDates.includes(av.date)
    );

    const nextWeekStart = new Date(this.selectedWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);

    const nextWeek: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(nextWeekStart);
      day.setDate(nextWeekStart.getDate() + i);
      nextWeek.push(day);
    }

    const nextWeekDates = nextWeek.map((date) => this.getDateString(date));
    this.availabilities = this.availabilities.filter(
      (av) =>
        !(av.userId === this.viewingPlayerId && nextWeekDates.includes(av.date))
    );

    currentWeekAvailabilities.forEach((av) => {
      const currentDate = new Date(av.date);
      const dayOfWeek = currentDate.getDay();
      const nextWeekDate = nextWeek[dayOfWeek];

      const duplicated: Availability = {
        id: Date.now() + Math.random(),
        userId: av.userId,
        date: this.getDateString(nextWeekDate),
        startTime: av.startTime,
        endTime: av.endTime,
        status: av.status,
        notes: av.notes,
      };

      this.availabilities.push(duplicated);
    });

    this.navigateWeek(1);
    alert("Disponibilidades duplicadas para a próxima semana com sucesso!");
  }

  getStatusLabel(
    status: "available" | "maybe" | "unavailable"
  ): string {
    switch (status) {
      case "available":
        return "Disponível";
      case "maybe":
        return "Talvez";
      case "unavailable":
        return "Remover";
      default:
        return "";
    }
  }

  hasAvailabilityData(): boolean {
    return this.availabilities.some(av => av.userId === this.viewingPlayerId);
  }

  openSummaryPopup() {
    this.showSummaryPopup = true;
  }

  closeSummaryPopup() {
    this.showSummaryPopup = false;
  }
}
