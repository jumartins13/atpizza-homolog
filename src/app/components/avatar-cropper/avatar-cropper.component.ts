import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { CommonModule } from '@angular/common';
import { ImageCropperComponent } from 'ngx-image-cropper';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  matCloseSharp, 
  matCheckSharp, 
  matCameraAltSharp 
} from '@ng-icons/material-icons/sharp';

@Component({
  selector: 'app-avatar-cropper',
  standalone: true,
  imports: [CommonModule, ImageCropperComponent, NgIconComponent],
  providers: [provideIcons({ 
    matCloseSharp, 
    matCheckSharp, 
    matCameraAltSharp 
  })],
  templateUrl: './avatar-cropper.component.html',
  styleUrl: './avatar-cropper.component.scss',
})
export class AvatarCropperComponent {
  @Input() imageChangedEvent: any;
  @Output() cropped = new EventEmitter<Blob | string>();
  @Output() cancel = new EventEmitter<void>();

  croppedImage: Blob | string | null = null;
  isCropperReady = false;

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.blob ?? event.base64 ?? null;
  }

  imageLoaded() {
    this.isCropperReady = true;
  }

  cropperReady() {
    this.isCropperReady = true;
  }

  loadImageFailed() {
    // Você pode implementar um toast/notification service aqui
    console.error('Erro ao carregar imagem');
    this.showErrorMessage('Erro ao carregar imagem. Tente novamente.');
    this.cancel.emit();
  }

  confirmCrop() {
    if (this.croppedImage) {
      this.cropped.emit(this.croppedImage);
    }
  }

  cancelCrop() {
    this.cancel.emit();
  }

  private showErrorMessage(message: string) {
    // Implementar toast notification ou usar um service de notificação
    // Por enquanto usando alert, mas recomendo usar um toast moderno
    alert(message);
  }
}