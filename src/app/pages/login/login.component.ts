import { Component, OnInit, OnDestroy } from "@angular/core";
import { AuthService } from "@services/auth.service";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { LoggerService } from "@app/services/logger.service";

// Modern Firebase v10 UserCredential interface
export interface ModernUserCredential {
  user: any;
  providerId: string;
  operationType: string;
}

@Component({
  selector: "app-login",
  standalone: true,
  imports: [],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.scss",
})
export class LoginComponent implements OnInit, OnDestroy {
  showNotRegisteredMessage = false;
  isLoading = false;
  loadingMessage = "";
  isInstalled = false;
  isStandalone = false;
  showInstallButton = false;
  private showMessageTimeout: any = null;
  private subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router,
    private logger: LoggerService
  ) {}

  ngOnInit() {
    this.showNotRegisteredMessage = false;

    // Detecta se está rodando dentro do app PWA
    this.isStandalone = window.matchMedia("(display-mode: standalone)").matches;

    // Escuta se o app for instalado
    window.addEventListener("appinstalled", () => {
      this.isInstalled = true;
      this.showInstallButton = false;
    });

    // Se já está em standalone, não mostra botão
    if (this.isStandalone) {
      this.showInstallButton = false;
    }

    // (Opcional) checa se o app já está instalado
    if ("getInstalledRelatedApps" in navigator) {
      // @ts-ignore
      navigator.getInstalledRelatedApps().then((apps: any[]) => {
        if (apps.length > 0) {
          this.isInstalled = true;
          this.showInstallButton = false;
        }
      });
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.showMessageTimeout) {
      clearTimeout(this.showMessageTimeout);
    }
  }


  openPwaApp() {
    // redireciona para abrir o PWA já instalado
    window.location.href = window.location.origin;
  }

  logout() {
    this.logger.log("🚪 Fazendo logout para testar outro email");
    this.authService.signOut().subscribe(() => {
      this.logger.log("✅ Logout realizado com sucesso");
      // Limpa localStorage também
      localStorage.clear();
    });
  }

  loginWithGoogle() {
    this.logger.log("🟡 Clicou no botão de login");

    // Reset das mensagens e ativar loading
    this.showNotRegisteredMessage = false;
    this.isLoading = true;
    this.loadingMessage = "🔍 Verificando credenciais...";

    if (this.showMessageTimeout) {
      clearTimeout(this.showMessageTimeout);
      this.showMessageTimeout = null;
    }

    this.authService.loginWithGoogle().subscribe({
      next: (res) => {
        if (!res || !res.isPlayerRegistered) {
          // Manter loading por mais tempo no Android antes de mostrar mensagem de erro
          setTimeout(() => {
            this.isLoading = false;
            this.showMessageTimeout = setTimeout(() => {
              this.showNotRegisteredMessage = true;
            }, 100);
          }, 1500); // 1.5 segundos de delay adicional
        } else {
          // Sucesso - pequeno delay antes de navegar
          setTimeout(() => {
            this.isLoading = false;
            this.showNotRegisteredMessage = false;
            this.router.navigate(["/app/home"]);
          }, 800); // 0.8 segundos para mostrar sucesso
        }
      },
      error: (err) => {
        this.logger.error("Erro ao fazer login com Google:", err);
        setTimeout(() => {
          this.isLoading = false;
          this.showNotRegisteredMessage = false;
        }, 500);
      },
    });
  }
}
