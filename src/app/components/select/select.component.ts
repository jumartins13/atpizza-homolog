import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges, OnDestroy, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ISelectItem } from '@models/select/select.model';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [],
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss'
})
export class SelectComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('selectContainer') selectContainer!: ElementRef<HTMLDivElement>;

  @Input() items: ISelectItem[] = []
  @Input() selectedItem?: ISelectItem;
  @Input() label?: string;
  @Input() placeholder?: string = 'Selecione uma opção';
  @Output() itemSelected: EventEmitter<ISelectItem> = new EventEmitter<ISelectItem>();

  isSelectOpen: boolean = false;
  filteredItems: ISelectItem[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    this.updateFilteredItems();
    
    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('click', this.handleClickOutside, true);
      document.addEventListener('touchstart', this.handleClickOutside, true);
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('click', this.handleClickOutside, true);
      document.removeEventListener('touchstart', this.handleClickOutside, true);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['items']) {
      this.updateFilteredItems();
    }
  }

  handleClickOutside = (event: Event) => {
    if (!isPlatformBrowser(this.platformId)) return;

    const target = event.target as Node | null;
    if (!target) return;

    const clickedInside = this.selectContainer?.nativeElement.contains(target);

    if (!clickedInside && this.isSelectOpen) {
      this.isSelectOpen = false;
    }
  };

  private updateFilteredItems() {
    this.filteredItems = this.items;
    if (!this.selectedItem && this.items.length > 0) {
      this.selectedItem = this.items[0];
    }
  }

  toggleSelect() {
    this.isSelectOpen = !this.isSelectOpen;
  }

  selectItem(item: ISelectItem) {
    this.isSelectOpen = false;
    this.itemSelected.emit(item);
  }

  onBlur() {
    // Comentado porque agora usamos handleClickOutside
    // setTimeout(() => {
    //   this.isSelectOpen = false;
    // }, 150);
  }
}