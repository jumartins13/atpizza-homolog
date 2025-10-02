import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private deferredPrompt: any = null;

  constructor() {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event;
    });
  }

  // Sempre retorna true, para forçar botão visível
  canPrompt(): boolean {
    return true;
  }

  async promptInstall(): Promise<void> {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log('Resultado do prompt:', outcome);
      this.deferredPrompt = null; // reseta
    } else {
      alert('⚠️ Seu navegador não suporta instalação automática. Use "Adicionar à tela inicial" no menu.');
    }
  }
}
