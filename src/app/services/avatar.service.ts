// avatar.service.ts - Versão para aplicação real (com localStorage)
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AvatarService {
  private avatarUrlSubject = new BehaviorSubject<string>('./images/profile.PNG');

  constructor() {
    // Não carrega automaticamente do localStorage
    // O avatar será sempre definido pelo usuário logado
  }

  // Observable para componentes se inscreverem
  getAvatarUrl(): Observable<string> {
    return this.avatarUrlSubject.asObservable();
  }

  // Método para atualizar o avatar
  updateAvatar(avatarUrl: string): void {
    // console.log('AvatarService: Atualizando avatar para:', avatarUrl);
    this.avatarUrlSubject.next(avatarUrl);
    
    // Salva no localStorage para persistir entre sessões (se disponível)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('userAvatar', avatarUrl);
    }
  }

  // Método para obter o valor atual do avatar
  getCurrentAvatarUrl(): string {
    return this.avatarUrlSubject.value;
  }

  // Método para resetar para o avatar padrão
  resetAvatar(): void {
    const defaultAvatar = './images/profile.PNG';
    this.updateAvatar(defaultAvatar);
  }

  // Método para limpar o avatar (útil no logout)
  clearAvatar(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('userAvatar');
    }
    this.resetAvatar();
  }

  // Método para inicializar avatar baseado no usuário logado
  initializeUserAvatar(userEmail: string, avatarUrl?: string): void {
    // console.log('AvatarService: Inicializando avatar para usuário:', userEmail);

    if (avatarUrl) {
      this.updateAvatar(avatarUrl);
    } else {
      this.resetAvatar();
    }
  }
}