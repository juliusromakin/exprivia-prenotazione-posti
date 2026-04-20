import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { AxiosService } from './axios.service';
import { Workspace } from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private readonly BASE_URL = '/api/workspaces';

  constructor(private axiosService: AxiosService) { }

  getWorkspaces(): Observable<Workspace[]> {
    return from(this.axiosService.get<Workspace[]>(`${this.BASE_URL}`));
  }

  getWorkspaceOptions(roomId: number): Observable<any> {
    return from(this.axiosService.get<any>(`${this.BASE_URL}/options/${roomId}`));
  }

  getWorkspaceById(id: number): Observable<Workspace> {
    return from(this.axiosService.get<Workspace>(`${this.BASE_URL}/${id}`));
  }

  getWorkspacesByRoom(roomId: number): Observable<Workspace[]> {
    return from(this.axiosService.get<Workspace[]>(`${this.BASE_URL}/room/${roomId}`));
  }

  getRoomsWithWorkspaces(): Observable<any> {
    return from(this.axiosService.get<any>(`${this.BASE_URL}/rooms-with-workspaces`));
  }

  createWorkspace(workspace: Workspace): Observable<Workspace> {
    return from(this.axiosService.post<Workspace>(this.BASE_URL, workspace));
  }

  updateWorkspace(id: number, updates: Partial<Workspace>): Observable<Workspace> {
    return from(this.axiosService.put<Workspace>(`${this.BASE_URL}/${id}`, updates));
  }

  deleteWorkspace(id: number): Observable<void> {
    return from(this.axiosService.delete(`${this.BASE_URL}/${id}`)).pipe(
      map(() => void 0)
    );
  }

  hardDeleteWorkspace(id: number): Observable<void> {
    return from(this.axiosService.delete(`${this.BASE_URL}/${id}/hard`)).pipe(
      map(() => void 0)
    );
  }
}
