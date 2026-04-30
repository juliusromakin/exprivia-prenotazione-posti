import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { routes } from './app.routes';

export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}
  
  getTranslation(lang: string): Observable<any> {
    return this.http.get(`/assets/i18n/${lang}.json?v=${new Date().getTime()}`);
  }
}

export function HttpLoaderFactory(http: HttpClient) {
  return new CustomTranslateLoader(http);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    MessageService,
    provideHttpClient(), 
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'it',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    )
  ]
};