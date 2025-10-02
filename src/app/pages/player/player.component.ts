import { Component, OnInit } from "@angular/core";
import { PlayerService } from "@app/services/player.service";
import { PlayerResponse, UpdatePlayerPayload } from "@models/player/player.dto";
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import {
  matEditSharp,
  matCameraAltSharp,
  matDoubleArrowSharp,
  matCheckSharp,
  matCloseSharp,
  matNoPhotographySharp,
} from "@ng-icons/material-icons/sharp";
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { AuthService } from "@app/services/auth.service";
import { AutocompleteComponent } from "./autocomplete/autocomplete.component";
import { EBackHand, EMainHand } from "@app/models/player/player.enum";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { CountryFlagComponent } from "@app/components/country-flag/country-flag.component";
import { RankingsService } from "@app/services/rankings.service";
// Importar o ImageCropperModule
import { ImageCroppedEvent, LoadedImage, ImageCropperComponent } from 'ngx-image-cropper';
import { CommonModule } from '@angular/common';
import { Subscription } from "rxjs";
import { AvatarService } from "@app/services/avatar.service";
import { LoggerService } from "@app/services/logger.service";
import { AvatarCropperComponent } from "@app/components/avatar-cropper/avatar-cropper.component";

export type Emh = keyof typeof EMainHand;
export type Ebh = keyof typeof EBackHand;

@Component({
  selector: "app-player",
  standalone: true,
  imports: [
    CommonModule,
    NgIconComponent,
    FormsModule,
    AutocompleteComponent,
    ReactiveFormsModule,
    CountryFlagComponent,
    AvatarCropperComponent
  ],
  templateUrl: "./player.component.html",
  styleUrl: "./player.component.scss",
  providers: [
    provideIcons({ 
      matEditSharp, 
      matCameraAltSharp, 
      matDoubleArrowSharp,
      matCheckSharp,
      matCloseSharp,
      matNoPhotographySharp 
    }),
  ],
})
export class PlayerComponent implements OnInit {
  player: PlayerResponse = {
    id: "",
    name: "",
    email: "",
    groupId: "",
    games: {
      roundId: 0,
      victories: 0,
      defeats: 0,
      gamesAgainst: 0,
      gamesInFavor: 0,
      scoreBalance: 0,
      points: 0,
    },
    details: {
      height: null,
      country: "",
      startOfTheRanking: null,
      socialNetwork: "",
      mainHand: null,
      backHand: null,
    },
    avatarUrl: "",
  };

  loggedPlayerId: string | null = null;
  playerRankingPosition: number | null = null;
  years: number[] = this.getYears();

  mainHandOptions: { title: EMainHand; value: Emh }[] = (["R", "L"] as Emh[]).map((mh) => ({
    title: this.getMainHand(mh) as EMainHand,
    value: mh,
  }));

  backHandOptions = Object.keys(EBackHand) as Ebh[];

  showError: boolean = false;
  alturaInput: string = "";
  loading: boolean = false;
  previewAvatarUrl: string | null = null;
  uploadingAvatar: boolean = false;
  countryFlag: string = "";

  // Variáveis para o cropper
  showCropper: boolean = false;
  imageChangedEvent: any = '';
  croppedImage: Blob | string | null = null;
  // Modal para ampliar foto
  showPhotoModal: boolean = false;
  isCropperReady: boolean = false;

  avatarSubscription: Subscription = new Subscription();

  constructor(
    private playerService: PlayerService,
    private authService: AuthService,
    private rankingsService: RankingsService,
    private avatarService: AvatarService,
    private logger: LoggerService
  ) {}

  playerForm = new FormGroup({
    name: new FormControl("", Validators.required),
    details: new FormGroup({
      height: new FormControl(""),
      country: new FormControl(""),
      startOfTheRanking: new FormControl(""),
      socialNetwork: new FormControl(""),
      mainHand: new FormControl(""),
      backHand: new FormControl(""),
    }),
    avatarUrl: new FormControl(""),
  });

  playerNameControl = this.playerForm.get("name");
  playerHeightControl = this.playerForm.get("details")?.get("height");
  socialNetworkControl = this.playerForm.get("details")?.get("socialNetwork");

  getYears(): number[] {
    const years: number[] = [];
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= 1950; i--) {
      years.push(i);
    }
    return years;
  }

  ngOnInit() {
    if (typeof localStorage !== "undefined") {
      const storedId = localStorage.getItem("playerId");
      if (storedId) {
        this.loggedPlayerId = storedId;
        this.playerService.playerId.next(storedId);
      }
    }

    this.playerService.playerId.subscribe((id) => {
      this.loggedPlayerId = id;
    });

    this.avatarSubscription = this.avatarService.getAvatarUrl().subscribe(
      avatarUrl => {
        // Só atualiza se for um avatar válido e diferente do atual
        if (avatarUrl && avatarUrl !== this.previewAvatarUrl) {
          this.previewAvatarUrl = avatarUrl;
        }
      }
    );

    const email = this.authService.userEmail;
    if (email) {
      this.onPlayerSelected(email);
    }
  }

  onPlayerSelected(email: string) {
    this.loading = true;
    this.playerForm.reset();
    this.previewAvatarUrl = null;
    this.getPlayer(email);
  }

  getPlayer(email: string) {
    this.playerService.getPlayer(email).subscribe({
      next: (player) => {
        if (!player) {
          this.logger.error("Jogador não encontrado");
          this.loading = false;
          return;
        }

        this.player = player;
        this.fillFormWithPlayerData(player);

        if (player.avatarUrl) {
          this.previewAvatarUrl = player.avatarUrl;
          // Inicializa o AvatarService com o avatar do player
          this.avatarService.updateAvatar(player.avatarUrl);
        }

        this.loadPlayerRankingPosition(player.id);

        if (!this.canEditProfile()) {
          this.playerForm.disable();
        } else {
          this.playerForm.enable();
        }

        this.loading = false;
      },
      error: (err) => {
        this.logger.error("Erro ao buscar jogador:", err);
        this.loading = false;
      },
    });
  }

  loadPlayerRankingPosition(playerId: string) {
    this.rankingsService.getLatestRankings().subscribe({
      next: (rankings) => {
        // Verificar se rankings é um array válido
        if (!rankings || !Array.isArray(rankings)) {
          this.logger.log('Rankings inválido ou vazio:', rankings);
          this.playerRankingPosition = null;
          return;
        }

        const sorted = [...rankings].sort(
          (a, b) => (b.scorePoints ?? 0) - (a.scorePoints ?? 0)
        );
        const index = sorted.findIndex((p) => p.playerId === playerId);
        this.playerRankingPosition = index >= 0 ? index + 1 : null;
      },
      error: (err) => {
        this.logger.error('Erro ao carregar ranking do player:', err);
        this.playerRankingPosition = null;
      }
    });
  }

  onFocus() {
    this.showError = false;
  }

  onBlur() {
    this.logger.log('🔍 onBlur triggered');
    this.logger.log('🔍 Form valid:', this.playerForm.valid);
    this.logger.log('🔍 Has changes:', this.hasChanges(this.playerForm.value));
    this.logger.log('🔍 Form value on blur:', this.playerForm.value);
    
    this.showError = this.playerNameControl?.errors?.["required"] === true;

    if (this.playerForm.valid && this.hasChanges(this.playerForm.value)) {
      this.logger.log('🔍 Calling savePlayerChanges...');
      this.savePlayerChanges(this.playerForm.value);
      this.showError = false;
    } else {
      this.logger.log('🔍 savePlayerChanges NOT called - form invalid or no changes');
    }
  }

  fillFormWithPlayerData(player: PlayerResponse) {
    this.playerForm.patchValue({
      name: player.name ?? "",
      details: {
        height: player.details.height ? player.details.height.toString() : "",
        country: player.details.country ?? "",
        startOfTheRanking: player.details.startOfTheRanking
          ? player.details.startOfTheRanking.toString()
          : "",
        socialNetwork: player.details.socialNetwork ?? "",
        mainHand: player.details.mainHand ?? "",
        backHand: player.details.backHand ?? "",
      },
      avatarUrl: player.avatarUrl ?? "",
    });
  }

  savePlayerChanges(formValue: any) {
    if (!this.canEditProfile() || !this.player) return;

    this.logger.log('🔍 Form value received:', formValue);
    this.logger.log('🔍 Current player data:', this.player);

    const updatedPlayer: UpdatePlayerPayload = {
      id: this.player.id,
      name: formValue.name,
      details: {
        country: formValue.details.country || "",
        height: formValue.details.height || null,
        startOfTheRanking: formValue.details.startOfTheRanking
          ? Number(formValue.details.startOfTheRanking)
          : null,
        socialNetwork: formValue.details.socialNetwork || "",
        mainHand: formValue.details.mainHand || null,
        backHand: formValue.details.backHand || null,
      },
      avatarUrl: formValue.avatarUrl || this.player.avatarUrl || "",
    };

    this.logger.log('📤 Payload to be sent to Firebase:', updatedPlayer);

    this.playerService.updatePlayer(updatedPlayer).subscribe({
      next: () => {
        this.logger.log('✅ Firebase update successful');
        this.player = { ...this.player, ...updatedPlayer };
        this.playerService.setPlayer(this.player);
        this.logger.log('✅ Local player updated:', this.player);
      },
      error: (error) => {
        this.logger.error("❌ Erro ao atualizar o jogador:", error);
        this.logger.error("❌ Error details:", error);
        alert(
          "Não foi possível salvar as alterações. Tente novamente mais tarde."
        );
      },
      complete: () => {
        this.logger.log('✅ Update operation completed');
      }
    });
  }

  hasChanges(formValue: any): boolean {
    if (!this.player) {
      this.logger.log('🔍 hasChanges: no player data');
      return false;
    }

    const nameChanged = this.player.name !== formValue.name;
    const heightChanged = this.player.details.height?.toString() !== formValue.details.height?.toString();
    const countryChanged = this.player.details.country !== formValue.details.country;
    const startRankingChanged = this.player.details.startOfTheRanking?.toString() !== formValue.details.startOfTheRanking?.toString();
    const socialChanged = this.player.details.socialNetwork !== formValue.details.socialNetwork;
    const mainHandChanged = this.player.details.mainHand !== formValue.details.mainHand;
    const backHandChanged = this.player.details.backHand !== formValue.details.backHand;
    const avatarChanged = this.player.avatarUrl !== formValue.avatarUrl;

    this.logger.log('🔍 Checking changes:');
    this.logger.log('  - Name changed:', nameChanged, `"${this.player.name}" vs "${formValue.name}"`);
    this.logger.log('  - Height changed:', heightChanged, `"${this.player.details.height}" vs "${formValue.details.height}"`);
    this.logger.log('  - Country changed:', countryChanged, `"${this.player.details.country}" vs "${formValue.details.country}"`);
    this.logger.log('  - Social changed:', socialChanged, `"${this.player.details.socialNetwork}" vs "${formValue.details.socialNetwork}"`);

    const hasChanges = nameChanged || heightChanged || countryChanged || startRankingChanged || 
                      socialChanged || mainHandChanged || backHandChanged || avatarChanged;
    
    this.logger.log('🔍 hasChanges result:', hasChanges);
    return hasChanges;
  }

  getMainHand(hand: "L" | "R" | ""): string {
    if (hand === "L") return EMainHand.L;
    if (hand === "R") return EMainHand.R;
    return "";
  }

  getBackHandLabel(value: Ebh | ""): string {
    if (!value) return "";
    return EBackHand[value];
  }

  // Método atualizado para abrir o cropper
  uploadFile(event: any) {
    if (!this.canEditProfile()) return;

    const file = event.target.files[0];
    if (!file) return;

    this.logger.log('Arquivo selecionado:', file.name);
    this.imageChangedEvent = event;
    this.showCropper = true;
    this.isCropperReady = false;
    this.croppedImage = null;
  }


  // Confirmar o crop e fazer upload
  confirmCrop(cropped: Blob | string) {
    this.croppedImage = cropped;
    this.showCropper = false;
    this.uploadingAvatar = true;
  
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  
    // Converter base64 para blob, se necessário
    let blob: Blob;
    if (cropped instanceof Blob) {
      blob = cropped;
    } else {
      const base64Data = cropped.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      blob = new Blob([byteArray], { type: 'image/jpeg' });
    }
  
    this.uploadAvatarBlob(blob);
  }

  // Cancelar o crop
  cancelCrop() {
    this.logger.log('Cancelando crop...');
    this.showCropper = false;
    this.imageChangedEvent = null;
    this.croppedImage = null;
    this.isCropperReady = false;
    
    // Limpar o input file para permitir selecionar a mesma imagem novamente
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  uploadAvatarBlob(blob: Blob) {
    if (!this.player?.id || !this.canEditProfile()) {
      this.logger.error('Não pode fazer upload - sem permissão');
      return;
    }

    this.logger.log('Iniciando upload para Firebase...');
    const storage = getStorage();
    const fileName = `avatars/${this.player.id}_${Date.now()}.jpg`;
    const fileRef = ref(storage, fileName);
    
    this.logger.log('Fazendo upload para:', fileName);

    uploadBytes(fileRef, blob)
      .then((snapshot) => {
        this.logger.log('Upload concluído, obtendo URL...');
        return getDownloadURL(snapshot.ref);
      })
      .then((downloadURL) => {
        this.logger.log('URL obtida:', downloadURL);
        this.previewAvatarUrl = downloadURL;
        this.playerForm.patchValue({ avatarUrl: downloadURL });

        const updateData = {
          id: this.player!.id,
          name: this.player!.name,
          details: this.player!.details,
          avatarUrl: downloadURL,
        };
        
        this.logger.log('Atualizando player no backend:', updateData);

        this.playerService
          .updatePlayer(updateData);
      })
      .then(() => {
        this.logger.log('Player atualizado com sucesso no backend');
        this.player = { ...this.player!, avatarUrl: this.previewAvatarUrl! };
        this.playerService.setPlayer(this.player);

        // Atualizar o AvatarService para sincronizar com outros componentes
        this.avatarService.updateAvatar(this.previewAvatarUrl!);

        this.uploadingAvatar = false;

        // Resetar variáveis do cropper
        this.imageChangedEvent = null;
        this.croppedImage = null;
        this.isCropperReady = false;

        this.logger.log('Avatar salvo com sucesso!');
      })
      .catch((error) => {
        this.logger.error("Erro durante o processo:", error);
        alert("Erro ao salvar avatar: " + error.message);
        this.uploadingAvatar = false;
      });
  }

  getSocialLinkDetails(): { socialNetworkValue: string; url: string } | null {
    const socialNetworkValue = this.socialNetworkControl?.value?.trim();
    if (!socialNetworkValue) return null;

    const username = socialNetworkValue.startsWith("@")
      ? socialNetworkValue.substring(1)
      : socialNetworkValue;

    const socialUrl = `https://instagram.com/${username}`;
    return { socialNetworkValue, url: socialUrl };
  }

  canEditProfile(): boolean {
    return this.loggedPlayerId === this.player?.id;
  }

  handleImageClick(event: Event) {
    event.stopPropagation();
    // Clique na imagem sempre ampliar
    this.openPhotoModal();
  }

  handleEditClick(event: Event) {
    event.stopPropagation();
    // Clique no botão de edição abre seletor de arquivo
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  openPhotoModal() {
    if (this.previewAvatarUrl) {
      this.showPhotoModal = true;
      document.body.style.overflow = 'hidden'; // Prevenir scroll
    }
  }

  closePhotoModal() {
    this.showPhotoModal = false;
    document.body.style.overflow = 'auto'; // Restaurar scroll
  }

  ngOnDestroy() {
    this.avatarSubscription.unsubscribe();
    // Garantir que o scroll seja restaurado
    document.body.style.overflow = 'auto';
  }
}