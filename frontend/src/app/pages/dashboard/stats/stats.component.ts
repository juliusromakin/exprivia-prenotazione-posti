import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ReservationService } from '@core/services/reservation.service';
import { AuthService } from '@core/auth/auth.service';
import { AdminService } from '@core/services/admin.service';
import { Reservation } from '@core/models/reservation.model';

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
  imports: [CommonModule],
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
    private authService: AuthService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkUserRole(): void {
    this.authService.getIdentity()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isAdmin = user?.authorities?.includes('ROLE_ADMIN') || false;
      });
  }

  private loadStats(isRefresh: boolean = false): void {
    if (isRefresh) {
      this.isRefreshing = true;
    } else {
      this.isLoading = true;
    }
    
    // Fetch both bookings and users data (admin-only page)
    forkJoin({
      reservations: this.reservationService.getReservations(),
      users: this.adminService.getAllUsers()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ reservations, users }) => {
        this.calculateStats(reservations, users.length);
        if (isRefresh) {
          this.isRefreshing = false;
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        if (isRefresh) {
          this.isRefreshing = false;
        } else {
          this.isLoading = false;
        }
      }
    });
  }

  private calculateStats(reservations: Reservation[], totalUsersCount: number): void {
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

    // Most popular room
    const roomCounts = new Map<string, number>();
    parsedReservations.forEach(p => {
      const roomName = p.roomSummary?.name || 'N/A';
      roomCounts.set(roomName, (roomCounts.get(roomName) || 0) + 1);
    });
    this.stats.mostPopularRoom = this.getMostPopular(roomCounts);

    // Most popular time slot
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

    // Room utilization (top 5)
    this.stats.roomUtilization = Array.from(roomCounts.entries())
      .map(([room, count]) => ({
        roomName: room,
        percentage: Math.round((count / this.stats.totalBookings) * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    // Time slot distribution
    this.stats.timeSlotDistribution = Array.from(timeSlotCounts.entries())
      .map(([timeSlot, count]) => ({ timeSlot, count }))
      .sort((a, b) => b.count - a.count);

    // Weekly trend (last 7 days)
    this.stats.weeklyTrend = this.calculateWeeklyTrend(parsedReservations);

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
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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