import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideDumbql } from '@dumbql/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideDumbql({
      endpoint: 'http://localhost:4000/graphql',
    }),
  ],
};
