import { Injectable } from "@angular/core";
import { Auth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, authState, User, signInWithCustomToken } from "@angular/fire/auth";
import { from, map, Observable, of, switchMap, tap, catchError, take, timeout } from "rxjs";
import { PlayerService } from "./player.service";
import {
  PlayerCreatedPayload,
  PlayerResponse
} from "@app/models/player/player.dto";
import { Router } from "@angular/router";
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import {
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { LoggerService } from "./logger.service"; 

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private _userEmail: string = '';

  get userEmail() {
    return this._userEmail;
  }

  constructor(
    private auth: Auth,
    private playerService: PlayerService,
    private router: Router,
    private logger: LoggerService
  ) {
    // Configurar persistência com timeout otimizado
    setPersistence(this.auth, browserLocalPersistence)
    .then(() => {
      this.logger.log("✅ Persistência Firebase configurada (LOCAL)");
      // Preload dados críticos após configurar persistência
      this.preloadCriticalData();
    })
    .catch(err => this.logger.error("❌ Erro configurando persistência Firebase:", err));

    // Auto-login quando o serviço é inicializado (reduzido para ser mais rápido)
    this.checkAutoLogin();
}

  private preloadCriticalData(): void {
    // Preload dados críticos em background para melhorar performance
    try {
      // Verificar se há user logado para precarregar seus dados
      const currentUser = this.auth.currentUser;
      if (currentUser?.email) {
        this.playerService.getPlayer(currentUser.email).pipe(
          timeout(5000), // Timeout de 5 segundos
          catchError(err => {
            this.logger.warn('Preload falhou:', err);
            return of(null);
          })
        ).subscribe();
      }
    } catch (error) {
      this.logger.warn('Erro no preload:', error);
    }
  }

  private checkAutoLogin(): void {
    // Aguardar um pouco para que o Firebase Auth inicialize
    setTimeout(() => {
      const currentUser = this.auth.currentUser;
      const currentPath = window.location.pathname;

      // Se já está logado no Firebase e não está na página de login
      if (currentUser && currentUser.email && currentPath === '/login') {
        this.logger.log('🚀 Auto-login: Usuário já autenticado no Firebase, redirecionando...');

        // Verificar se existe no Firestore
        this.playerService.getPlayer(currentUser.email).subscribe({
          next: (player) => {
            if (player && player.id) {
              this.logger.log('✅ Auto-login: Usuário validado no Firestore');
              this.playerService.playerId.next(player.id);
              localStorage.setItem('playerId', player.id);
              localStorage.setItem('userEmail', currentUser.email!);
              this._userEmail = currentUser.email!;

              // Redirecionar para home
              this.router.navigate(['/app/home']);
            } else {
              this.logger.log('❌ Auto-login: Usuário não encontrado no Firestore');
              signOut(this.auth);
            }
          },
          error: (error) => {
            this.logger.error('❌ Auto-login: Erro ao verificar usuário:', error);
          }
        });
      }
    }, 1000); // 1 segundo de delay para garantir inicialização
  }

  private isAndroidApp(): boolean {
    // Detecta se está rodando no Capacitor (Android)
    return (window as any)?.Capacitor?.isNativePlatform?.() === true;
  }

  private isEmulator(): boolean {
    // Desabilitado para usar fluxo normal
    return false;
  }

  loginWithGoogle(): Observable<any> {
    // Verificar APENAS se há usuário autenticado no Firebase
    const currentUser = this.auth.currentUser;

    if (currentUser && currentUser.email) {
      this.logger.log('🔥 Firebase Auth: Usuário já logado detectado:', currentUser.email);
      this.logger.log('🔄 Verificando se ainda é válido no Firestore...');

      return this.playerService.getPlayer(currentUser.email).pipe(
        timeout(5000), // 5 segundos timeout
        switchMap((player) => {
          if (player && player.id) {
            this.logger.log('✅ Firebase Auth válido, pulando popup');

            const mockResult = {
              user: currentUser,
              additionalUserInfo: { isNewUser: false }
            };

            return this.processAuthResult(mockResult);
          } else {
            this.logger.log('❌ Usuário do Firebase não encontrado no Firestore, fazendo logout');
            signOut(this.auth);
            return this.performActualLogin();
          }
        }),
        catchError((error) => {
          this.logger.log('❌ Erro ao verificar usuário do Firebase (timeout ou offline):', error);
          this.logger.log('🔄 Prosseguindo com login normal...');
          return this.performActualLogin();
        })
      );
    }

    // Se não há usuário autenticado no Firebase, sempre mostrar popup
    this.logger.log('🔥 Firebase Auth: Nenhum usuário logado, mostrando popup');
    return this.performActualLogin();
  }

  private performActualLogin(): Observable<any> {
    const provider = new GoogleAuthProvider();

    // Configurações mais simples para evitar problemas de CORS
    provider.addScope('email');
    provider.addScope('profile');

    const isNativeAndroid = this.isAndroidApp();

    if (isNativeAndroid) {
      const isEmulator = this.isEmulator();
      this.logger.log('📱 Android detectado - usando fluxo OAuth normal');
      this.logger.log('🔧 É emulador?', isEmulator, '(ignorado - sempre usar OAuth)');

      // SEMPRE usar OAuth normal - modo emulador desabilitado
      if (false) { // Desabilitado
        this.logger.log('🤖 Emulador detectado - usando estratégia simplificada');

        this.logger.log('🔧 MODO TESTE EMULADOR: Validando usuário no Firestore primeiro');

        // Lista de emails para teste no emulador (apenas usuários cadastrados)
        const testEmails = [
          'juliana.martinsfarias@gmail.com',
          'fcesario2103@gmail.com'
          // Adicione outros emails de usuários cadastrados aqui para teste
        ];

        // Para teste, usando o primeiro email da lista
        const testEmail = testEmails[0];
        this.logger.log('🧪 Testando com email:', testEmail);

        // Primeiro, verificar se o usuário existe no Firestore
        return this.playerService.getPlayer(testEmail).pipe(
          switchMap((player) => {
            if (player && player.id) {
              this.logger.log('✅ Usuário encontrado no Firestore - permitindo login simulado');
              this.logger.log('🆔 Player ID:', player.id);

              const mockResult = {
                user: {
                  email: testEmail,
                  displayName: player.name || 'Usuário Teste',
                  uid: 'emulator-test-uid'
                },
                additionalUserInfo: { isNewUser: false }
              };

              this.logger.log('🎭 Simulando resultado de auth para emulador');
              return this.processAuthResult(mockResult);
            } else {
              this.logger.error('❌ Usuário não encontrado no Firestore - login negado');
              this.logger.error('🔒 Apenas usuários cadastrados podem acessar o app');
              return of(null);
            }
          }),
          catchError((err) => {
            this.logger.error('❌ Erro ao verificar usuário no Firestore:', err);
            this.logger.error('🔒 Acesso negado por erro na validação');
            return of(null);
          })
        );
      }

      // Dispositivo físico: estratégia original
      this.logger.log('📱 Dispositivo físico - tentando popup primeiro');
      return from(signInWithPopup(this.auth, provider)).pipe(
        switchMap((result) => {
          this.logger.log('✅ Popup Android bem-sucedido');
          return this.processAuthResult(result);
        }),
        catchError((popupErr) => {
          this.logger.error('❌ Popup falhou:', popupErr?.code);

          // Fallback para redirect nativo
          this.logger.log('🔄 Tentando signInWithRedirect...');
          return this.loginWithNativeRedirect(provider).pipe(
            catchError((redirectErr) => {
              this.logger.error('❌ Redirect também falhou:', redirectErr?.code);

              // Último recurso - browser manual
              this.logger.log('🌐 Último recurso: browser manual...');
              return this.loginWithBrowserOAuth();
            })
          );
        })
      );
    }

    // Web usa popup normalmente
    this.logger.log('💻 Web detectado - usando signInWithPopup');

    // Configurações específicas para web
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap((result) => {
        this.logger.log('✅ Popup login bem-sucedido');
        return this.processAuthResult(result);
      }),
      catchError((err) => {
        this.logger.error('❌ Erro no popup:', err);
        this.logger.error('❌ Código do erro:', err?.code);
        this.logger.error('❌ Mensagem:', err?.message);

        // Se for erro de popup bloqueado, tentar redirect como fallback
        if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/popup-closed-by-user') {
          this.logger.log('🔄 Popup bloqueado, tentando redirect no web...');
          return from(signInWithRedirect(this.auth, provider)).pipe(
            tap(() => {
              this.logger.log('🔄 Redirect iniciado no web');
            }),
            catchError((redirectErr) => {
              this.logger.error('❌ Redirect também falhou:', redirectErr);
              return of(null);
            })
          );
        }

        return of(null);
      })
    );
  }

  private loginWithNativeRedirect(provider: GoogleAuthProvider): Observable<any> {
    this.logger.log('🔄 Usando signInWithRedirect nativo como fallback');

    // Configuração específica para Android/Capacitor
    provider.setCustomParameters({
      prompt: 'select_account',
      include_granted_scopes: 'true'
    });

    return from(signInWithRedirect(this.auth, provider)).pipe(
      tap(() => {
        this.logger.log('✅ signInWithRedirect nativo executado');
        this.logger.log('📱 Se não abriu browser, pode ser problema de configuração');
      }),
      switchMap(() => of({ nativeRedirectStarted: true })),
      catchError((err) => {
        this.logger.error('❌ Erro no signInWithRedirect nativo:', err);
        this.logger.error('❌ Código:', err?.code);
        this.logger.error('❌ Mensagem:', err?.message);
        return of(null);
      })
    );
  }

  private loginWithEmulatorBrowser(provider: GoogleAuthProvider): Observable<any> {
    this.logger.log('🤖 Método específico para emulador - usando Browser plugin direto');

    // Configurar URL OAuth manual para emulador
    const clientId = '84069850577-ieia3ohnoema8d4f35viju8rmid40u3f.apps.googleusercontent.com';
    const redirectUri = 'com.atpizza.app://oauth/callback';
    const scope = 'openid email profile';
    const state = Math.random().toString(36).substring(7);

    const authUrl =
      `https://accounts.google.com/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `state=${state}&` +
      `prompt=select_account`;

    this.logger.log('🔗 URL OAuth para emulador:', authUrl);

    return new Observable((observer) => {
      // Configurar listener para deep link
      const handleDeepLink = (data: any) => {
        this.logger.log('🔗 Deep link recebido:', data);

        if (data.url && data.url.includes('oauth/callback')) {
          const url = new URL(data.url);
          const code = url.searchParams.get('code');
          const receivedState = url.searchParams.get('state');

          if (code && receivedState === state) {
            this.logger.log('✅ Código OAuth recebido via deep link:', code);
            this.exchangeCodeForToken(code).subscribe(observer);
          } else {
            this.logger.error('❌ Erro na validação do deep link');
            observer.next(null);
            observer.complete();
          }
        }
      };

      // Registrar listener do App plugin
      App.addListener('appUrlOpen', handleDeepLink);

      // Abrir browser
      Browser.open({ url: authUrl }).then(() => {
        this.logger.log('✅ Browser aberto para OAuth no emulador');
      }).catch((err) => {
        this.logger.error('❌ Erro ao abrir browser:', err);
        observer.next(null);
        observer.complete();
      });

      // Timeout de 5 minutos
      setTimeout(() => {
        this.logger.warn('⏰ Timeout no login OAuth do emulador');
        App.removeAllListeners();
        observer.next(null);
        observer.complete();
      }, 300000);
    });
  }

  private exchangeCodeForToken(code: string): Observable<any> {
    this.logger.log('🔄 Trocando código por token...');

    // Para simplificar no emulador, vamos tentar fazer login direto
    // usando signInWithCustomToken se conseguirmos trocar o code
    this.logger.log('⚠️ Exchange de token não implementado - usando fallback');

    return of(null);
  }

  private waitForRedirectResult(timeout: number): Observable<any> {
    return new Observable((observer) => {
      let attempts = 0;
      const maxAttempts = timeout / 2000; // Check every 2 seconds

      const checkResult = () => {
        getRedirectResult(this.auth).then((result) => {
          if (result && result.user) {
            this.logger.log('✅ Redirect result obtido:', result.user.email);
            this.processAuthResult(result).subscribe({
              next: (processedResult) => {
                observer.next(processedResult);
                observer.complete();
              },
              error: (err) => {
                observer.error(err);
              }
            });
          } else {
            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(checkResult, 2000);
            } else {
              this.logger.warn('⏰ Timeout aguardando redirect result');
              observer.next(null);
              observer.complete();
            }
          }
        }).catch((err) => {
          this.logger.error('❌ Erro verificando redirect result:', err);
          observer.error(err);
        });
      };

      // Start checking after a short delay
      setTimeout(checkResult, 1000);
    });
  }

  private loginWithBrowserOAuth(): Observable<any> {
    this.logger.log('🌐 Tentando abrir browser com intent manual...');

    // Usar URL simples para Google OAuth
    const clientId = '84069850577-ieia3ohnoema8d4f35viju8rmid40u3f.apps.googleusercontent.com';
    const redirectUri = 'https://atpizza-homolog.firebaseapp.com/__/auth/handler'; // Firebase handler
    const scope = 'openid email profile';

    const authUrl =
      `https://accounts.google.com/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `prompt=select_account`;

    this.logger.log('🔗 URL OAuth gerada:', authUrl);

    return new Observable((observer) => {
      // Tentar abrir com Browser plugin
      Browser.open({ url: authUrl }).then(() => {
        this.logger.log('✅ Browser aberto via plugin');

        // Verificar periodicamente se usuário foi autenticado
        const checkAuth = () => {
          const currentUser = this.auth.currentUser;
          if (currentUser) {
            this.logger.log('🎉 Usuário autenticado via browser:', currentUser.email);
            const mockResult = {
              user: currentUser,
              additionalUserInfo: { isNewUser: false }
            };
            this.processAuthResult(mockResult).subscribe({
              next: (result) => {
                observer.next(result);
                observer.complete();
              },
              error: () => {
                observer.next(null);
                observer.complete();
              }
            });
          }
        };

        // Verificar a cada 2 segundos por 30 segundos
        let attempts = 0;
        const maxAttempts = 15;
        const interval = setInterval(() => {
          attempts++;
          checkAuth();

          if (attempts >= maxAttempts) {
            clearInterval(interval);
            this.logger.warn('⏰ Timeout - usuário não autenticado');
            observer.next(null);
            observer.complete();
          }
        }, 2000);

      }).catch((err) => {
        this.logger.error('❌ Erro ao abrir browser:', err);

        // Fallback: tentar abrir URL manualmente via window
        this.logger.log('🔄 Tentando abrir URL via window.open...');
        try {
          (window as any).open(authUrl, '_system');
          this.logger.log('✅ URL aberta via window.open');
        } catch (e) {
          this.logger.error('❌ Falha total ao abrir browser:', e);
        }

        observer.next(null);
        observer.complete();
      });
    });
  }

  // Método melhorado para verificar resultado do redirect na inicialização
  checkRedirectResult(): Observable<any> {
    const isNativeAndroid = this.isAndroidApp();
  
    if (!isNativeAndroid) {
      return of(null);
    }
  
    this.logger.log('🔍 Android: Verificando resultado do redirect...');
    return from(getRedirectResult(this.auth)).pipe(
      switchMap((result) => {
        if (result && result.user) {
          this.logger.log('✅ Redirect result obtido:', result.user.email);
          return this.processAuthResult(result);
        }
        return of(null);
      }),
      catchError((err) => {
        this.logger.error('❌ Erro no redirect:', err);
        return of(null);
      })
    );
  }

  private processAuthResult(res: any): Observable<any> {
    console.log('=== DEBUG LOGIN COMPLETO ===');
    console.log('🔍 Estrutura completa da resposta do Firebase:', res);

    // Firebase v10 structure: user data is directly in res.user
    const user = res?.user;
    const email = user?.email;
    const name = user?.displayName;
    const uid = user?.uid;
    const isNewUser = res?.additionalUserInfo?.isNewUser || false;

    console.log('=== DADOS DO USUÁRIO ===');
    console.log('📧 Email completo:', email);
    console.log('🙋‍♀️ Nome completo:', name);
    console.log('🆔 UID:', uid);
    console.log('🆕 Novo usuário?', isNewUser);
    console.log('🔗 Provedor:', user?.providerData);
    console.log('========================');

    this._userEmail = email;

    this.logger.log('🔐 Login com Google realizado');
    this.logger.log('📧 Email:', email);
    this.logger.log('🙋‍♀️ Nome:', name);
    this.logger.log('🆕 Novo usuário?', isNewUser);

    this.logger.log('🔎 Buscando player com email:', email);
    console.log('=== BUSCA NO FIRESTORE ===');
    console.log('🔍 Email usado para buscar no Firestore:', email);

    return this.playerService.getPlayer(email).pipe(
      tap((player: PlayerResponse | null) => {
        console.log('=== RESULTADO FIRESTORE ===');
        console.log('🧾 Resultado do getPlayer(email):', player);
        console.log('🔍 Email usado na busca:', email);
        console.log('📧 Player encontrado?', !!player);
        if (player) {
          console.log('🆔 ID do player encontrado:', player.id);
          console.log('📧 Email do player:', player.email);
          console.log('👤 Nome do player:', player.name);
        } else {
          console.log('❌ PLAYER NÃO ENCONTRADO NO FIRESTORE!');
          console.log('🔍 Email buscado:', email);
        }
        console.log('========================');

        this.logger.log('🧾 Resultado do getPlayer(email):', player);
        this.logger.log('🔍 Email usado na busca:', email);
        this.logger.log('📧 Player encontrado?', !!player);
        if (player) {
          this.logger.log('🆔 ID do player encontrado:', player.id);
        }

        if (player && player.id) {
          const playerId = player.id;
          this.playerService.playerId.next(playerId);
          localStorage.setItem('playerId', playerId);
          localStorage.setItem('userEmail', email); // Salvar email também

          this.logger.log('✅ Player encontrado no Firestore:', player);
          this.logger.log('🆔 ID do jogador:', playerId);
          this.logger.log('💾 Player ID salvo no localStorage:', playerId);
          this.logger.log('💾 Email salvo no localStorage:', email);

          if (isNewUser) {
            const updatedPlayer: PlayerCreatedPayload = {
              id: playerId,
              name,
              email
            };

            this.logger.log('🚀 Criando novo jogador no Firestore:', updatedPlayer);

            this.playerService.createPlayer(updatedPlayer).subscribe(() => {
              this.logger.log('✅ Jogador salvo com sucesso!');
            });
          }

          // No emulador, aguardar um pouco para garantir que o localStorage foi salvo
          const isNativeAndroid = this.isAndroidApp();
          const isEmulator = this.isEmulator();

          if (isNativeAndroid && isEmulator) {
            this.logger.log('🎭 Emulador: Aguardando 1s antes de navegar...');
            setTimeout(() => {
              this.logger.log('🔗 Navegando para /app/home');
              this.router.navigate(['/app/home']);
            }, 1000);
          } else {
            this.router.navigate(['/app/home']);
          }
        } else {
          this.logger.warn('⚠️ Nenhum jogador encontrado para este e-mail no Firestore.');
          this.logger.warn('🔧 Email não encontrado:', email);
          
          signOut(this.auth);
          this.router.navigate(['/login']);
        }
      })
    );
  }

  updatePlayerId(id: string) {
    this.playerService.playerId.next(id);
    this.logger.log('Jogador para ser atualizado: ', id);
  }

  signOut(): Observable<any> {
    // Limpar dados salvos
    localStorage.removeItem('playerId');
    localStorage.removeItem('userEmail');
    this._userEmail = '';

    this.logger.log('🚪 Fazendo logout e limpando dados salvos');
    return from(signOut(this.auth));
  }

  isLoggedIn(): Observable<boolean> {
    return authState(this.auth).pipe(
      take(1), // Evitar chamadas múltiplas
      switchMap((user: User | null) => {
        // BYPASS PARA EMULADOR
        const isNativeAndroid = this.isAndroidApp();
        const isEmulator = this.isEmulator();
        const localPlayerId = localStorage.getItem('playerId');

        if (isNativeAndroid && isEmulator && localPlayerId && localPlayerId !== 'null') {
          this.logger.log('🎭 Emulador bypass: Considerando logado baseado no localStorage');
          this.logger.log('🆔 Player ID local:', localPlayerId);
          return of(true);
        }

        // Fluxo normal: se não tem usuário do Firebase
        if (!user || !user.email) {
          this.logger.log('🔥 Firebase Auth: Sem usuário logado');
          return of(false);
        }

        this.logger.log('✅ Usuário Firebase encontrado:', user.email);
        this._userEmail = user.email;

        // Verifica no Firestore se o player existe
        return this.playerService.getPlayer(user.email).pipe(
          map((player) => {
            const isLoggedIn = !!user && !!player;
            this.logger.log('🔍 Player encontrado no Firestore:', !!player);

            if (isLoggedIn && player) {
              // Atualizar dados locais se logado com sucesso
              this.playerService.playerId.next(player.id);
              localStorage.setItem('playerId', player.id);
              localStorage.setItem('userEmail', user.email!);
            }

            return isLoggedIn;
          }),
          catchError((err) => {
            this.logger.error('❌ Erro consultando Firestore:', err);
            return of(false);
          })
        );
      }),
      tap((isLoggedIn) => {
        this.logger.log('📋 Status final - Está logado:', isLoggedIn);

        if (!isLoggedIn && window.location.pathname !== '/login') {
          this.logger.log('🔄 Redirecionando para login...');
          this.router.navigate(['/login']);
        }
      }),
      catchError((err) => {
        this.logger.error('❌ Erro no isLoggedIn:', err);
        return of(false);
      })
    );
  }
  
}
