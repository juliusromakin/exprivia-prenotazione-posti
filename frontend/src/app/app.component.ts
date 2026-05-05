import { Component } from "@angular/core"
import { CommonModule } from "@angular/common"
import { OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from "@angular/router"
import { FooterComponent } from "./layout/footer/footer.component";
import { filter } from "rxjs";
import { UpdateUserComponent } from "./account/update-user/update-user.component";
import { AuthService } from "./core/auth/auth.service";
// 1. HO AGGIUNTO L'IMPORT QUI SOTTO:
import { TranslateService } from "@ngx-translate/core";


@Component({
  selector: "app-root",
  standalone: true,
  // HO AGGIUNTO HeaderComponent QUI SOTTO:
  imports: [CommonModule, RouterOutlet, FooterComponent],
  templateUrl: "./app.component.html",
})
export class AppComponent implements OnInit {
  title = 'exprivia';
  showLayout: boolean = true;

  constructor(
    // 2. HO INIETTATO IL SERVIZIO QUI:
    private translate: TranslateService,
    private router: Router,
    private authService: AuthService
  ) { 
    // 3. HO AGGIUNTO L'INIZIALIZZAZIONE DELLA LINGUA:
    this.translate.setDefaultLang('it');
    this.translate.use('it');
  }

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const isAdminDashboard = event.urlAfterRedirects.includes('/dashboard') && 
        this.authService.hasAnybadge(['ROLE_ADMIN']);
      
      this.showLayout = !isAdminDashboard;
    });
  }
}