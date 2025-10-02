import { CommonModule } from "@angular/common";
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
  OnDestroy,
  Inject,
  PLATFORM_ID,
} from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { isPlatformBrowser } from "@angular/common";
import { LoggerService } from "@app/services/logger.service";
import { PlayerResponse } from "@app/models/player/player.dto";
import { PlayerService } from "@app/services/player.service";

@Component({
  selector: "app-autocomplete",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./autocomplete.component.html",
  styleUrl: "./autocomplete.component.scss",
})
export class AutocompleteComponent implements OnInit, OnDestroy {
  @ViewChild("searchInput") searchInput!: ElementRef<HTMLInputElement>;
  @Output() playerSelected = new EventEmitter<string>();

  allPlayers: any[] = [];
  filteredPlayers: any[] = [];
  searchText: string = "";
  showList: boolean = false;
  selectedIndex: number = -1;

  private isTouch: boolean = false;
  private blurTimeout: any = null;

  constructor(
    private playerService: PlayerService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private logger: LoggerService
  ) {}

  ngOnInit() {
    this.loadPlayers();

    if (isPlatformBrowser(this.platformId)) {
      this.setupMobileOptimizations();

      document.addEventListener("click", this.handleClickOutside, true);
      document.addEventListener("touchstart", this.handleClickOutside, true);
    }
  }

  ngOnDestroy() {
    if (this.blurTimeout) {
      clearTimeout(this.blurTimeout);
    }

    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener("click", this.handleClickOutside, true);
      document.removeEventListener("touchstart", this.handleClickOutside, true);
    }
  }

  handleClickOutside = (event: Event) => {
    if (!isPlatformBrowser(this.platformId)) return;

    const target = event.target as Node | null;
    if (!target) return;

    const clickedInside =
      this.searchInput?.nativeElement.contains(target) ||
      !!(target as HTMLElement).closest('.players-container');

    if (!clickedInside) {
      setTimeout(() => {
        this.showList = false;
        this.selectedIndex = -1;
      }, 100);
    }
  };

  setupMobileOptimizations() {
    if (!isPlatformBrowser(this.platformId)) return;

    window.addEventListener("orientationchange", () => {
      setTimeout(() => {
        this.updateViewportForZoomPrevention();
      }, 500);
    });

    this.isTouch = "ontouchstart" in window;
  }

  private updateViewportForZoomPrevention() {
    if (!isPlatformBrowser(this.platformId)) return;

    const viewport = document.querySelector("meta[name=viewport]");
    if (viewport) {
      viewport.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      );
    }
  }

  loadPlayers() {
    this.playerService.getPlayers().subscribe({
      next: (players) => {
        this.allPlayers = players.sort((a, b) => a.name.localeCompare(b.name));
      },
      error: (error) => {
        this.logger.error("Erro ao carregar jogadores:", error);
      },
    });
  }

  onFocus() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.logger.log("🎯 Input focado");

    if (this.isIOSDevice()) {
      setTimeout(() => {
        this.updateViewportForZoomPrevention();
      }, 100);
    }

    this.showList = true;

    if (this.searchText === "") {
      this.filteredPlayers = this.allPlayers;
    }
  }

  onBlur(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.logger.log("👋 Input perdeu foco");

    this.blurTimeout = setTimeout(() => {
      this.showList = false;
      this.selectedIndex = -1;
      this.forceCompleteBlur();
    }, 200);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.showList || this.filteredPlayers.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.selectedIndex = Math.min(
          this.selectedIndex + 1,
          this.filteredPlayers.length - 1
        );
        break;

      case "ArrowUp":
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        break;

      case "Enter":
        event.preventDefault();
        if (this.selectedIndex >= 0) {
          this.selectPlayer(this.filteredPlayers[this.selectedIndex]);
        }
        break;

      case "Escape":
        this.showList = false;
        this.selectedIndex = -1;
        this.forceCompleteBlur();
        break;
    }
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchText = input.value;

    this.showList = true;
    this.filterPlayers();
  }

  filterPlayers() {
    this.logger.log("🔎 Filtrando com texto:", this.searchText);

    if (this.searchText === "") {
      this.filteredPlayers = this.allPlayers;
    } else {
      const searchLower = this.searchText.toLowerCase();
      this.filteredPlayers = this.allPlayers
        .filter(
          (player) =>
            player.name?.toLowerCase().includes(searchLower) ||
            player.email?.toLowerCase().includes(searchLower)
        );
    }

    this.selectedIndex = -1;
  }

  selectPlayer(player: PlayerResponse) {
    this.logger.log("✅ Jogador selecionado:", player.name);

    if (this.blurTimeout) {
      clearTimeout(this.blurTimeout);
      this.blurTimeout = null;
    }

    // Delay para permitir scroll antes de fechar a lista
    setTimeout(() => {
      this.searchText = player.name;
      this.showList = false;
      this.selectedIndex = -1;

      this.forceCompleteBlurAndPreventZoom();
      this.playerSelected.emit(player.email);

      setTimeout(() => {
        this.searchText = "";
      }, 150);
    }, 50);
  }

  private forceCompleteBlurAndPreventZoom(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.logger.log("🚫 Forçando blur completo para prevenir zoom");

    if (this.searchInput?.nativeElement) {
      this.searchInput.nativeElement.blur();
    }

    if (
      document.activeElement &&
      document.activeElement instanceof HTMLElement
    ) {
      document.activeElement.blur();
    }

    const currentScrollY = window.scrollY;

    setTimeout(() => {
      if (this.searchInput?.nativeElement === document.activeElement) {
        this.searchInput.nativeElement.blur();
      }

      if (Math.abs(window.scrollY - currentScrollY) > 10) {
        window.scrollTo(0, currentScrollY);
      }

      if (this.isIOSDevice()) {
        this.updateViewportForZoomPrevention();
      }
    }, 100);

    setTimeout(() => {
      if (
        document.activeElement &&
        document.activeElement.tagName === "INPUT"
      ) {
        (document.activeElement as HTMLElement).blur();
      }
    }, 300);
  }

  private forceCompleteBlur(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.searchInput?.nativeElement) {
      this.searchInput.nativeElement.blur();
    }

    setTimeout(() => {
      if (
        document.activeElement &&
        document.activeElement instanceof HTMLElement
      ) {
        document.activeElement.blur();
      }
    }, 50);
  }

  private isIOSDevice(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return /iPhone|iPad|iPod/.test(navigator.userAgent);
  }

  highlightText(text: string) {
    if (!isPlatformBrowser(this.platformId)) return text;

    if (!this.searchText) return text;

    const regex = new RegExp(this.searchText, "gi");
    return text.replace(
      regex,
      `<span class="highlight">${this.searchText}</span>`
    );
  }

  focusSearch() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.isIOSDevice()) {
      this.updateViewportForZoomPrevention();
    }

    setTimeout(() => {
      this.searchInput.nativeElement.focus();
    }, 100);
  }
}
