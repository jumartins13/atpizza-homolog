import { Component, OnInit, inject, Inject, PLATFORM_ID } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { RoundService } from './services/round.service';
import { SwUpdate } from '@angular/service-worker';
import { MenuComponent } from './components/menu/menu.component';
import { PagesComponent } from './pages/pages.component';
import { MatchService } from './services/match.service';
import { AuthService } from './services/auth.service';
import { PlayerService } from './services/player.service';
import { LoggerService } from './services/logger.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PagesComponent, MenuComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private roundService = inject(RoundService);
  public matchService = inject(MatchService);
  private authService = inject(AuthService);
  private playerService = inject(PlayerService);
  private swUpdate = inject(SwUpdate);
  private logger = inject(LoggerService);
  isNotLoginRoute = false;

  isBlocked = false;
  message = '';

  // PWA Install prompt
  private deferredPrompt: any;
  showInstallPrompt = false;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isNotLoginRoute = false;
  }

  ngOnInit() {
    this.logger.log('🚀 App Component inicializando - versão completa para web...');
    this.authService.checkRedirectResult().subscribe();
  
    // Setup PWA install prompt
    this.setupPWAPrompt();
  
    // 🔄 Service Worker Updates
    if (this.swUpdate.isEnabled) {
      // Sempre verifica atualização quando o app inicia
      this.swUpdate.checkForUpdate()
        .then(available => this.logger.log('🔍 Atualização disponível?', available))
        .catch(err => this.logger.error('❌ Erro ao checar updates:', err));
  
      // Escuta quando há nova versão
      this.swUpdate.versionUpdates.subscribe(event => {
        if (event.type === 'VERSION_READY') {
          this.logger.log('⚡ Nova versão detectada. Ativando...', {
            current: event.currentVersion,
            latest: event.latestVersion
          });
  
          // Ativa nova versão e força reload imediato
          this.swUpdate.activateUpdate().then(() => {
            this.logger.log('✅ Nova versão ativada, recarregando app...');
            location.reload();
          });
        }
      });
    }
  
    // Verifica a rota atual inicialmente
    const currentUrl = this.router.url;
    if (currentUrl === '/login' || currentUrl === '/' || currentUrl.includes('login')) {
      this.isNotLoginRoute = false;
    }
  
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (event.url === '/login' || event.url === '/' || event.url.includes('login')) {
          this.isNotLoginRoute = false;
        } else {
          this.isNotLoginRoute = true;
        }
      }
    });
  
    // RoundService para overlay de bloqueio
    this.roundService.isBlocked$.subscribe(blocked => {
      this.isBlocked = blocked;
    });
  
    this.roundService.message$.subscribe(msg => {
      this.message = msg;
    });
  
    this.logger.log('✅ App Component inicializado para web');
  }

  private setupPWAPrompt() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Detecta se já está instalado ou em modo standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                        || (window.navigator as any).standalone 
                        || document.referrer.includes('android-app://');

    if (isStandalone) {
      this.logger.log('📱 PWA: App já está instalado ou em modo standalone');
      this.showInstallPrompt = false;
      return;
    }

    // Aumentar engagement score para triggerar beforeinstallprompt
    this.trackUserEngagement();

    // Captura o evento beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      this.logger.log('🎯 PWA: beforeinstallprompt disparado!');
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPrompt = true;
    });

    // Detecta quando o app é instalado
    window.addEventListener('appinstalled', () => {
      this.logger.log('✅ PWA: App instalado com sucesso');
      this.showInstallPrompt = false;
      this.deferredPrompt = null;
    });


    this.logger.log('🔍 PWA: Setup completo - aguardando beforeinstallprompt...');
  }

  async installPWA() {
    if (!this.deferredPrompt) {
      // Só mostra instruções se realmente não conseguir instalar como PWA
      this.logger.log('⚠️ PWA: Sem deferredPrompt - verificando installability...');
      
      // Tenta forçar o prompt se possível
      if ('getInstalledRelatedApps' in navigator) {
        try {
          // @ts-ignore
          const relatedApps = await navigator.getInstalledRelatedApps();
          if (relatedApps.length === 0) {
            this.showFallbackInstallInstructions();
          }
        } catch (e) {
          this.showFallbackInstallInstructions();
        }
      } else {
        this.showFallbackInstallInstructions();
      }
      return;
    }

    this.logger.log('🚀 PWA: Iniciando instalação com deferredPrompt...');
    this.deferredPrompt.prompt();

    const { outcome } = await this.deferredPrompt.userChoice;
    this.logger.log(`👤 PWA: Usuário escolheu: ${outcome}`);

    if (outcome === 'accepted') {
      this.logger.log('✅ PWA: Instalação aceita pelo usuário');
    } else {
      this.logger.log('❌ PWA: Instalação rejeitada pelo usuário');
    }

    this.deferredPrompt = null;
    this.showInstallPrompt = false;
  }

  private showFallbackInstallInstructions() {
    // Detecta se é Android
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (isAndroid) {
      alert('Para instalar como app:\n\n1. Toque no menu (⋮) do Chrome\n2. Toque em "Adicionar à tela inicial"\n3. Confirme a instalação\n\nO app aparecerá na sua tela inicial com a logo do ATPizza!');
    } else {
      alert('Para instalar o app, use o menu do seu navegador e procure por "Adicionar à tela inicial" ou "Instalar app".');
    }
  }

  dismissInstallPrompt() {
    this.showInstallPrompt = false;
  }

  private isPWAInstallable(): boolean {
    // Verifica se tem service worker registrado
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    // Verifica se tem manifest válido
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      return false;
    }

    // Verifica se está sendo servido via HTTPS (ou localhost)
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
    if (!isSecure) {
      return false;
    }

    // Verifica se não é iOS (que não suporta installPrompt real)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      return false;
    }

    return true;
  }

  private trackUserEngagement() {
    let engagementScore = 0;
    
    // Incrementa score com interações
    const interactions = ['click', 'scroll', 'keydown', 'touchstart'];
    interactions.forEach(event => {
      document.addEventListener(event, () => {
        engagementScore++;
        if (engagementScore % 10 === 0) {
          this.logger.log(`📊 Engagement score: ${engagementScore}`);
        }
      }, { passive: true });
    });

    // Simula tempo gasto no site
    setTimeout(() => {
      engagementScore += 50;
      this.logger.log('⏱️ Tempo de permanência bonificado');
    }, 10000);
  }


}
