import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { matKeyboardDoubleArrowDownSharp, matKeyboardDoubleArrowUpSharp } from '@ng-icons/material-icons/sharp';

@Component({
  selector: 'app-country-flag',
  standalone: true,
  template: `<span class="country-flag" [style.fontSize.px]="size" style="display: flex; align-items: center;">{{ flag }}</span>`,
})
export class CountryFlagComponent {
  @Input() countryName: string | null | undefined = '';
  @Input() size: number = 24;

  flag: string = '';

  ngOnChanges(): void {
    this.flag = this.getCountryFlag((this.countryName || '').toLowerCase());
  }

  getCountryFlag(countryName: string): string {
    const countryFlags: { [key: string]: string } = {
      'brasil': '🇧🇷',
      'brazil': '🇧🇷',
      'argentina': '🇦🇷',
      'chile': '🇨🇱',
      'uruguai': '🇺🇾',
      'uruguay': '🇺🇾',
      'paraguai': '🇵🇾',
      'paraguay': '🇵🇾',
      'colombia': '🇨🇴',
      'colômbia': '🇨🇴',
      'venezuela': '🇻🇪',
      'peru': '🇵🇪',
      'equador': '🇪🇨',
      'ecuador': '🇪🇨',
      'bolivia': '🇧🇴',
      'bolívia': '🇧🇴',
      'estados unidos': '🇺🇸',
      'usa': '🇺🇸',
      'united states': '🇺🇸',
      'canada': '🇨🇦',
      'canadá': '🇨🇦',
      'mexico': '🇲🇽',
      'méxico': '🇲🇽',
      'espanha': '🇪🇸',
      'spain': '🇪🇸',
      'portugal': '🇵🇹',
      'frança': '🇫🇷',
      'france': '🇫🇷',
      'italia': '🇮🇹',
      'italy': '🇮🇹',
      'itália': '🇮🇹',
      'alemanha': '🇩🇪',
      'germany': '🇩🇪',
      'reino unido': '🇬🇧',
      'united kingdom': '🇬🇧',
      'uk': '🇬🇧',
      'holanda': '🇳🇱',
      'netherlands': '🇳🇱',
      'belgica': '🇧🇪',
      'belgium': '🇧🇪',
      'bélgica': '🇧🇪',
      'suica': '🇨🇭',
      'switzerland': '🇨🇭',
      'suíça': '🇨🇭',
      'austria': '🇦🇹',
      'áustria': '🇦🇹',
      'suecia': '🇸🇪',
      'sweden': '🇸🇪',
      'suécia': '🇸🇪',
      'noruega': '🇳🇴',
      'norway': '🇳🇴',
      'dinamarca': '🇩🇰',
      'denmark': '🇩🇰',
      'finlandia': '🇫🇮',
      'finland': '🇫🇮',
      'finlândia': '🇫🇮',
      'russia': '🇷🇺',
      'rússia': '🇷🇺',
      'china': '🇨🇳',
      'japao': '🇯🇵',
      'japan': '🇯🇵',
      'japão': '🇯🇵',
      'coreia do sul': '🇰🇷',
      'south korea': '🇰🇷',
      'india': '🇮🇳',
      'índia': '🇮🇳',
      'australia': '🇦🇺',
      'austrália': '🇦🇺',
      'nova zelandia': '🇳🇿',
      'new zealand': '🇳🇿',
      'nova zelândia': '🇳🇿',
      'africa do sul': '🇿🇦',
      'south africa': '🇿🇦',
      'áfrica do sul': '🇿🇦',
    };
    return countryFlags[countryName] || '';
  }
}
