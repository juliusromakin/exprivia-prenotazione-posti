import { inject, Injectable } from "@angular/core";
import { map } from "rxjs/operators";
import { WorkspaceService } from "@/app/core/services/workspace.service";
import { Observable } from "rxjs";
import { Workspace, WorkspaceStatus } from "@/app/core/models";

@Injectable({
    providedIn: "root",
})
export class DashboardService {
    private workspaceService = inject(WorkspaceService);

/*     getDashboardDeskStats(): Observable<{ total: number; available: number }> {
        return this.workspaceService.getWorkspaces().pipe(
            map((allWorkspaces: Workspace[]) => {
                const total = allWorkspaces.length;
                // const available = allWorkspaces.filter(
                //     (w: Workspace) => w.workspaceStatus === WorkspaceStatus.AVAILABLE
                // ).length;
                return { total };
            })
        );
    } */

    getDeskAvailabilityPercentage(available: number, total: number): string {
        if (total === 0) return "0%";
        return `${Math.round((available / total) * 100)}%`;
    }

    
}

