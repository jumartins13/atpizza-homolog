import { Injectable, ApplicationRef, ComponentRef, createComponent, inject } from '@angular/core';
import { ToastComponent } from '../components/toast/toast.component';
import { createEnvironmentInjector } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private appRef = inject(ApplicationRef);

  show(message: string, type: 'success' | 'error' | 'info' = 'success', duration = 3000) {
    const toastRef: ComponentRef<ToastComponent> = createComponent(ToastComponent, {
      environmentInjector: createEnvironmentInjector([], this.appRef.injector),
    });

    toastRef.instance.message = message;
    toastRef.instance.type = type;
    toastRef.instance.duration = duration;

    this.appRef.attachView(toastRef.hostView);
    document.body.appendChild(toastRef.location.nativeElement);

    setTimeout(() => {
      this.appRef.detachView(toastRef.hostView);
      toastRef.destroy();
    }, duration + 50000);
  }
}
