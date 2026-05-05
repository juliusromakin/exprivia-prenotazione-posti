import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, forkJoin, of, catchError } from 'rxjs';
import { ReservationService } from '@core/services/reservation.service';
import { AuthService } from '@core/auth/auth.service';
import { AdminService } from '@core/services/admin.service';
import { StatisticsService } from '@core/services/statistics.service';
import { Reservation, User, RoomStats, StatisticsCount } from '@core/models';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface StatsData {
  totalBookings: number;
  todayBookings: number;
  weekBookings: number;
  monthBookings: number;
  mostPopularRoom: string;
  mostPopularTimeSlot: string;
  avgBookingDuration: number;
  totalUsers: number;
  usersWithBookings: number;
  roomUtilization: { roomName: string; percentage: number }[];
  timeSlotDistribution: { timeSlot: string; count: number }[];
  weeklyTrend: { day: string; count: number }[];
  monthlyTrend: { month: string; count: number }[];
}

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  stats: StatsData = {
    totalBookings: 0,
    todayBookings: 0,
    weekBookings: 0,
    monthBookings: 0,
    mostPopularRoom: '',
    mostPopularTimeSlot: '',
    avgBookingDuration: 0,
    totalUsers: 0,
    usersWithBookings: 0,
    roomUtilization: [],
    timeSlotDistribution: [],
    weeklyTrend: [],
    monthlyTrend: []
  };

  isLoading = true;
  isRefreshing = false;
  isAdmin = false;

  constructor(
    private reservationService: ReservationService,
    private statisticsService: StatisticsService,
    private authService: AuthService,
    private adminService: AdminService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.loadStats();

    // Reload stats (which recalculates labels) when language changes
    this.translate.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Only recalculate strings, or we can just reload stats to be safe
        this.loadStats(true);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkUserRole(): void {
    this.authService.getIdentity()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isAdmin = user?.badges?.includes('ROLE_ADMIN') || false;
      });
  }

  private loadStats(isRefresh: boolean = false): void {
    if (isRefresh) {
      this.isRefreshing = true;
    } else {
      this.isLoading = true;
    }
    
    // Fetch bookings, users, and pre-calculated statistics
    // Using of([]) as fallback to prevent the whole dashboard from failing if one call fails
    forkJoin({
      reservations: this.reservationService.getReservations().pipe(catchError(() => {
        console.error('Failed to load reservations');
        return of([] as Reservation[]);
      })),
      users: this.adminService.getAllUsers().pipe(catchError(() => {
        console.error('Failed to load users');
        return of([] as User[]);
      })),
      dailyStats: this.statisticsService.getReservationsPerDay().pipe(catchError(() => {
        console.error('Failed to load daily statistics');
        return of([] as StatisticsCount[]);
      })),
      roomStats: this.statisticsService.getMostBookedRooms().pipe(catchError(() => {
        console.error('Failed to load room statistics');
        return of([] as RoomStats[]);
      }))
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ reservations, users, dailyStats, roomStats }) => {
        this.calculateStats(reservations, users.length, dailyStats, roomStats);
        if (isRefresh) {
          this.isRefreshing = false;
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Critical error loading stats:', error);
        this.isLoading = false;
        this.isRefreshing = false;
      }
    });
  }

  private calculateStats(
    reservations: Reservation[], 
    totalUsersCount: number,
    dailyStats: StatisticsCount[],
    roomStats: RoomStats[]
  ): void {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parse dates properly
    const parsedReservations = reservations.map(p => ({
      ...p,
      startDate: this.parseDate(p.startDate),
      endDate: this.parseDate(p.endDate)
    }));

    // Basic counts
    this.stats.totalBookings = parsedReservations.length;
    this.stats.todayBookings = parsedReservations.filter(p => 
      p.startDate >= today && p.startDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
    ).length;
    this.stats.weekBookings = parsedReservations.filter(p => p.startDate >= weekAgo).length;
    this.stats.monthBookings = parsedReservations.filter(p => p.startDate >= monthAgo).length;

    // Users with bookings count
    const uniqueUsers = new Set(parsedReservations.map(p => p.userSummary?.id));
    this.stats.usersWithBookings = uniqueUsers.size;
    
    // Total users count
    this.stats.totalUsers = totalUsersCount;

    // Use backend Room Statistics
    if (roomStats && roomStats.length > 0) {
      this.stats.mostPopularRoom = roomStats[0].roomName;
      this.stats.roomUtilization = roomStats.map(rs => ({
        roomName: rs.roomName,
        percentage: this.stats.totalBookings > 0 
          ? Math.round((rs.reservationCount / this.stats.totalBookings) * 100) 
          : 0
      })).slice(0, 5);
    } else {
      this.stats.mostPopularRoom = 'N/A';
      this.stats.roomUtilization = [];
    }

    // Most popular time slot (still calculated manually for now)
    const timeSlotCounts = new Map<string, number>();
    parsedReservations.forEach(p => {
      const timeSlot = this.getTimeSlot(p.startDate);
      timeSlotCounts.set(timeSlot, (timeSlotCounts.get(timeSlot) || 0) + 1);
    });
    this.stats.mostPopularTimeSlot = this.getMostPopular(timeSlotCounts);

    // Average booking duration (in hours)
    const totalDuration = parsedReservations.reduce((sum, p) => {
      const duration = (p.endDate.getTime() - p.startDate.getTime()) / (1000 * 60 * 60);
      return sum + duration;
    }, 0);
    this.stats.avgBookingDuration = totalDuration / parsedReservations.length || 0;

    // Time slot distribution
    this.stats.timeSlotDistribution = Array.from(timeSlotCounts.entries())
      .map(([timeSlot, count]) => ({ timeSlot, count }))
      .sort((a, b) => b.count - a.count);

    // Use backend Daily Statistics for Weekly Trend
    if (dailyStats && dailyStats.length > 0) {
      // Map backend data to trend days
      const days = [
        this.translate.instant('STATS.DAYS.SUN'), 
        this.translate.instant('STATS.DAYS.MON'), 
        this.translate.instant('STATS.DAYS.TUE'), 
        this.translate.instant('STATS.DAYS.WED'), 
        this.translate.instant('STATS.DAYS.THU'), 
        this.translate.instant('STATS.DAYS.FRI'), 
        this.translate.instant('STATS.DAYS.SAT')
      ];
      const trend = days.map(day => ({ day, count: 0 }));
      
      dailyStats.forEach(ds => {
        const date = this.parseDate(ds.startDate);
        const dayIndex = date.getDay();
        trend[dayIndex].count += ds.count;
      });

      this.stats.weeklyTrend = [
        ...trend.slice(1), // Monday to Saturday
        trend[0] // Sunday
      ];
    } else {
      this.stats.weeklyTrend = this.calculateWeeklyTrend(parsedReservations);
    }

    // Monthly trend (last 6 months)
    this.stats.monthlyTrend = this.calculateMonthlyTrend(parsedReservations);
  }

  private parseDate(dateValue: any): Date {
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    if (Array.isArray(dateValue)) {
      const [year, month, day, hours, minutes] = dateValue;
      return new Date(year, month - 1, day, hours, minutes);
    }
    
    if (typeof dateValue === 'string') {
      if (dateValue.includes(',')) {
        const [year, month, day, hours, minutes] = dateValue.split(',').map(Number);
        return new Date(year, month - 1, day, hours, minutes);
      }
      return new Date(dateValue);
    }
    
    return new Date();
  }

  private getTimeSlot(date: Date): string {
    const hour = date.getHours();
    return `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`;
  }

  private getMostPopular(counts: Map<string, number>): string {
    if (counts.size === 0) return 'N/A';
    
    let maxCount = 0;
    let mostPopular = '';
    
    counts.forEach((count, item) => {
      if (count > maxCount) {
        maxCount = count;
        mostPopular = item;
      }
    });
    
    return mostPopular;
  }

  private calculateWeeklyTrend(reservations: Reservation[]): { day: string; count: number }[] {
      const days = [
        this.translate.instant('STATS.DAYS.SUN'), 
        this.translate.instant('STATS.DAYS.MON'), 
        this.translate.instant('STATS.DAYS.TUE'), 
        this.translate.instant('STATS.DAYS.WED'), 
        this.translate.instant('STATS.DAYS.THU'), 
        this.translate.instant('STATS.DAYS.FRI'), 
        this.translate.instant('STATS.DAYS.SAT')
      ];
    const trend = days.map(day => ({ day, count: 0 }));
    
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const count = reservations.filter(p => 
        p.startDate >= dayStart && p.startDate < dayEnd
      ).length;
      
      trend[dayIndex].count = count;
    }
    
    // Reorder the array to start from Monday
    const reorderedTrend = [
      ...trend.slice(1), // Monday to Saturday
      trend[0] // Sunday
    ];
    
    return reorderedTrend;
  }

  private calculateMonthlyTrend(reservations: Reservation[]): { month: string; count: number }[] {
    const months = [
        this.translate.instant('STATS.MONTHS.JAN'), 
        this.translate.instant('STATS.MONTHS.FEB'), 
        this.translate.instant('STATS.MONTHS.MAR'), 
        this.translate.instant('STATS.MONTHS.APR'), 
        this.translate.instant('STATS.MONTHS.MAY'), 
        this.translate.instant('STATS.MONTHS.JUN'), 
        this.translate.instant('STATS.MONTHS.JUL'), 
        this.translate.instant('STATS.MONTHS.AUG'), 
        this.translate.instant('STATS.MONTHS.SEP'), 
        this.translate.instant('STATS.MONTHS.OCT'), 
        this.translate.instant('STATS.MONTHS.NOV'), 
        this.translate.instant('STATS.MONTHS.DEC')
      ];
    const trend = [];
    
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59); // End of the month
      
      const count = reservations.filter(p => {
        const bookingDate = this.parseDate(p.startDate);
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      }).length;
      
      trend.push({
        month: months[date.getMonth()],
        count
      });
    }
    
    return trend;
  }

  refreshStats(): void {
    this.loadStats(true);
  }

  // Helper methods for template calculations
  getWeeklyTrendHeight(count: number): number {
    if (!this.stats.weeklyTrend || this.stats.weeklyTrend.length === 0) return 0;
    const maxCount = Math.max(...this.stats.weeklyTrend.map(d => d.count));
    if (maxCount === 0) return 0;
    if (count === 0) return 0;
    const perc = Math.max((count / maxCount) * 100, 20);
    return perc;
  }

  getMonthlyTrendHeight(count: number): number {
    if (!this.stats.monthlyTrend || this.stats.monthlyTrend.length === 0) return 0;
    const maxCount = Math.max(...this.stats.monthlyTrend.map(m => m.count));
    if (maxCount === 0) return 0;
    if (count === 0) return 0;
    const perc = Math.max((count / maxCount) * 100, 20);
    return perc;
  }

  getTodayPercentage(): number {
    return this.stats.totalBookings > 0 ? (this.stats.todayBookings / this.stats.totalBookings) * 100 : 0;
  }
} 