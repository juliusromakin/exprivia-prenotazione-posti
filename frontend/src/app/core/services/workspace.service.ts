import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { AxiosService } from './axios.service';
import { Workspace, WorkspaceWithRoom, RoomWorkspace } from '../models';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private readonly BASE_URL = '/api/workspaces';

  constructor(private axiosService: AxiosService) { }

  /**
   * Recupera tutte le postazioni
   */
  getWorkspaces(): Observable<Workspace[]> {
    return from(this.axiosService.get<Workspace[]>(`${this.BASE_URL}`));
  }

  /**
   * Recupera i dettagli di una postazione specifica inclusa la stanza di appartenenza
   */
  getWorkspaceById(id: number): Observable<WorkspaceWithRoom> {
    return from(this.axiosService.get<WorkspaceWithRoom>(`${this.BASE_URL}/${id}`));
  }

  /**
   * Recupera le postazioni appartenenti a una stanza specifica
   */
  getWorkspacesByRoom(roomId: number): Observable<Workspace[]> {
    return from(this.axiosService.get<Workspace[]>(`${this.BASE_URL}/room/${roomId}`));
  }

  /**
   * Recupera la lista delle stanze con le relative postazioni annidate
   */
  getRoomsWithWorkspaces(): Observable<RoomWorkspace[]> {
    return from(this.axiosService.get<RoomWorkspace[]>(`${this.BASE_URL}/rooms-with-workspaces`));
  }

  /**
   * Recupera opzioni extra per le postazioni di una stanza
   */
  getWorkspaceOptions(roomId: number): Observable<any> {
    return from(this.axiosService.get<any>(`${this.BASE_URL}/options/${roomId}`));
  }

  /**
   * Crea una nuova postazione
   */
  createWorkspace(workspace: Workspace): Observable<Workspace> {
    return from(this.axiosService.post<Workspace>(this.BASE_URL, workspace));
  }

  /**
   * Aggiorna una postazione esistente
   */
  updateWorkspace(id: number, updates: Partial<Workspace>): Observable<Workspace> {
    return from(this.axiosService.put<Workspace>(`${this.BASE_URL}/${id}`, updates));
  }

  /**
   * Soft delete (disattiva la postazione)
   */
  deleteWorkspace(id: number): Observable<void> {
    return from(this.axiosService.delete(`${this.BASE_URL}/${id}`)).pipe(
      map(() => void 0)
    );
  }

  /**
   * Hard delete (rimozione definitiva dal database)
   */
  hardDeleteWorkspace(id: number): Observable<void> {
    return from(this.axiosService.delete(`${this.BASE_URL}/${id}/hard`)).pipe(
      map(() => void 0)
    );
  }
}