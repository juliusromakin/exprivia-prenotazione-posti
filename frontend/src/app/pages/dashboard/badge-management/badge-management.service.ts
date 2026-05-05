import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { badgeDTO } from '@core/models';
import { AxiosService } from '@core/services/axios.service';

@Injectable({
  providedIn: 'root'
})
export class BadgeManagementService {

  private readonly baseUrl = '/api/admin/badges';

  private badgesSubject = new BehaviorSubject<badgeDTO[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  badges$: Observable<badgeDTO[]> = this.badgesSubject.asObservable();
  loading$: Observable<boolean> = this.loadingSubject.asObservable();

  constructor(private axiosService: AxiosService) {}

  async loadBadges(): Promise<void> {
    try {
      this.loadingSubject.next(true);
      const badges = await this.axiosService.get<badgeDTO[]>(this.baseUrl);
      this.badgesSubject.next(badges);
    } catch (error) {
      console.error('Errore nel caricamento dei badge:', error);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async createBadge(badge: Omit<badgeDTO, 'id'>): Promise<badgeDTO> {
    try {
      this.loadingSubject.next(true);
      const created = await this.axiosService.post<badgeDTO>(this.baseUrl, badge);
      await this.loadBadges();
      return created;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async updateBadge(id: number, badge: badgeDTO): Promise<badgeDTO> {
    try {
      this.loadingSubject.next(true);
      const updated = await this.axiosService.put<badgeDTO>(`${this.baseUrl}/${id}`, badge);
      await this.loadBadges();
      return updated;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async deleteBadge(name: string): Promise<void> {
    try {
      this.loadingSubject.next(true);
      await this.axiosService.delete(`${this.baseUrl}/${name}`);
      await this.loadBadges();
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async addChild(parentName: string, childName: string): Promise<void> {
    try {
      this.loadingSubject.next(true);
      await this.axiosService.post(`${this.baseUrl}/${parentName}/children/${childName}`);
      await this.loadBadges();
    } finally {
      this.loadingSubject.next(false);
    }
  }

  getBadges(): badgeDTO[] {
    return this.badgesSubject.getValue();
  }
}
