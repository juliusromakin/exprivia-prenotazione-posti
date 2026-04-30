import { Routes } from "@angular/router";
import { HomeComponent } from "./pages/home/home.component";
import { AdminHomeComponent } from "./pages/admin-home/admin-home.component";
import { LoginComponent } from "./login/login.component";
import { ForgotpwdComponent } from "./account/password/forgot-password/forgotpwd.component";
import { ResetpwdComponent } from "./account/password/reset-password/resetpwd.component";
import { AuthGuard } from "./core/auth/auth.guard";
import { UserRouteAccessService } from "./core/auth/user-route-access.service";
import { ForbiddenComponent } from "./pages/forbidden/forbidden.component";
import { inject } from "@angular/core";
import { AuthService } from "./core/auth/auth.service";
import { Router } from "@angular/router";
import { RegisterComponent } from "./account/register/register.component";
import { UpdateUserComponent } from "./account/update-user/update-user.component";
import { AmministrazionePlanimetrieComponent } from "./pages/amministrazione-planimetrie/amministrazione-planimetrie.component";

// Guard to redirect authenticated users to workspace-booking
const redirectAuthenticatedToWorkspaceBooking = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // Controlla se l'utente sta navigando intenzionalmente alla home
    // o se è un caricamento iniziale dell'app
    const navigation = router.getCurrentNavigation();
    const isInitialNavigation = !navigation?.previousNavigation;

    // Se è la navigazione iniziale, permetti di vedere la home
    if (isInitialNavigation) {
      return true;
    }

    // Altrimenti reindirizza alla dashboard
    return router.createUrlTree(["/dashboard/workspace-booking"]);
  }
  return true;
};

// Definisci le rotte
export const routes: Routes = [
  {
    path: "",
    component: HomeComponent,
  },
  {
    path: "register",
    component: RegisterComponent,
    canActivate: [() => redirectAuthenticatedToWorkspaceBooking()],
  },
  {
    path: "login",
    component: LoginComponent,
    canActivate: [() => redirectAuthenticatedToWorkspaceBooking()],
  },
  {
    path: "update-user",
    component: UpdateUserComponent,
    canActivate: [() => redirectAuthenticatedToWorkspaceBooking()],
  },

  {
    path: "admin/homepage",
    component: AdminHomeComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "amministrazione-planimetrie",
    component: AmministrazionePlanimetrieComponent,
    canActivate: [UserRouteAccessService],
    data: { authorities: ["ROLE_ADMIN"] }
  },
  {
    path: "dashboard",
    loadChildren: () =>
      import("./pages/dashboard/dashboard.routes").then(
        (m) => m.DASHBOARD_ROUTES
      ),
    canActivate: [AuthGuard],
  },
  {
    path: "forgot-password",
    component: ForgotpwdComponent,
    canActivate: [() => redirectAuthenticatedToWorkspaceBooking()],
  },
  {
    path: "reset-password",
    component: ResetpwdComponent,
    canActivate: [() => redirectAuthenticatedToWorkspaceBooking()],
  },
  { path: "forbidden", component: ForbiddenComponent },
  { path: "**", redirectTo: "" },
];
