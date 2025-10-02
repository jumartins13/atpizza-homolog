import { bootstrapApplication } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { environment } from './environment';

bootstrapApplication(AppComponent, {
  providers: [
    ...appConfig.providers,
    environment.production ? provideServiceWorker('ngsw-worker.js') : [],
  ],
})
  .catch((err) => console.error(err));
