import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';

// Firebase Modular - OTIMIZADO para carregamento rápido
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { provideFirestore, getFirestore, connectFirestoreEmulator, enableMultiTabIndexedDbPersistence } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { environment } from '../environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),

    // Service Worker for PWA - otimizado para carregamento
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:5000' // Reduzido de 30s para 5s
    }),

    // Firebase Modern v10 providers - com otimizações de performance
    provideFirebaseApp(() => {
      const app = initializeApp(environment.firebaseConfig);
      return app;
    }),

    provideFirestore(() => {
      const firestore = getFirestore();

      // Habilitar cache persistente para performance
      if (!environment.production) {
        try {
          enableMultiTabIndexedDbPersistence(firestore);
        } catch (err) {
          console.warn('Firestore persistence failed:', err);
        }
      }

      return firestore;
    }),

    provideStorage(() => getStorage()),
    provideAuth(() => getAuth())
  ]
};
