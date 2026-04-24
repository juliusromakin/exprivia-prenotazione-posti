package com.prenotazioni.exprivia.exprv.repository;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.prenotazioni.exprivia.exprv.entity.Reservation;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Integer> {
    @Query("SELECT DISTINCT r FROM Reservation r " +
           "LEFT JOIN FETCH r.user u " +
           "LEFT JOIN FETCH u.authorities " +
           "LEFT JOIN FETCH r.workspace w " +
           "LEFT JOIN FETCH w.room room " +
           "LEFT JOIN FETCH r.reservationDuration " +
           "WHERE u.email = :email " +
           "ORDER BY r.startDate DESC")
    List<Reservation> findByUserEmail(@Param("email") String email);

    @Query("SELECT r FROM Reservation r WHERE r.startDate BETWEEN :startDate AND :endDate")
    List<Reservation> findByStartDateBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT r FROM Reservation r " +
           "JOIN r.workspace w " +
           "JOIN w.room ro " +
           "WHERE r.status != 'DENIED' " +
           "AND (r.startDate < :endTime AND r.endDate > :startTime) " +
           "AND (" +
           "  w.id = :workspaceId " +
           "  OR " +
           "  (ro.roomType = 'MEETING_ROOM' " +
           "   AND ro.id = (SELECT w2.room.id FROM Workspace w2 WHERE w2.id = :workspaceId))" +
           ")")
    List<Reservation> findOverlappingBookings(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("workspaceId") Integer workspaceId);

    @Query("SELECT r FROM Reservation r " +
           "JOIN r.workspace w " +
           "JOIN w.room ro " +
           "WHERE r.status != 'DENIED' " +
           "AND r.startDate >= :startDate AND r.startDate < :endDate " +
           "AND (" +
           "  w.id = :workspaceId " +
           "  OR " +
           "  (ro.roomType = 'MEETING_ROOM' " +
           "   AND ro.id = (SELECT w2.room.id FROM Workspace w2 WHERE w2.id = :workspaceId))" +
           ")")
    List<Reservation> findByWorkspaceAndDateRange(
            @Param("workspaceId") Integer workspaceId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT r FROM Reservation r WHERE DATE(r.startDate) = DATE(:giorno)")
    List<Reservation> findByStartDateOnDay(@Param("giorno") LocalDate giorno);

    @Query("SELECT r FROM Reservation r " +
           "JOIN r.workspace w " +
           "JOIN w.room ro " +
           "WHERE r.status != 'DENIED' " +
           "AND DATE(r.startDate) = DATE(:giorno) " +
           "AND (" +
           "  w.id = :workspaceId " +
           "  OR " +
           "  (ro.roomType = 'MEETING_ROOM' " +
           "   AND ro.id = (SELECT w2.room.id FROM Workspace w2 WHERE w2.id = :workspaceId))" +
           ")")
    List<Reservation> findByStartDateOnDayAndWorkspace(@Param("giorno") LocalDate giorno, @Param("workspaceId") Integer workspaceId);

    @Query(value = "SELECT CAST(start_date AS DATE) as start_date, COUNT(*) as count " +
            "FROM reservation " +
            "WHERE start_date >= :startDate " +
            "GROUP BY CAST(start_date AS DATE) " +
            "ORDER BY start_date ASC", nativeQuery = true)
    List<Object[]> countReservationsPerDay(@Param("startDate") LocalDateTime startDate);

    @Query(value = "SELECT r.name, COUNT(res.id) as reservation_count " +
            "FROM reservation res " +
            "JOIN workspace w ON res.id_workspace = w.id " +
            "JOIN room r ON w.id_room = r.id " +
            "GROUP BY r.name " +
            "ORDER BY reservation_count DESC", nativeQuery = true)
    List<Object[]> findMostBookedRooms();
}
