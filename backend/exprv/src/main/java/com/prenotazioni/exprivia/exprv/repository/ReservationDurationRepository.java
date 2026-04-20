package com.prenotazioni.exprivia.exprv.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.prenotazioni.exprivia.exprv.entity.ReservationDuration;

@Repository
public interface ReservationDurationRepository extends JpaRepository<ReservationDuration, String> {
    Optional<ReservationDuration> findByName(String name);
    boolean existsByName(String name);

    @Query("SELECT rd FROM ReservationDuration rd JOIN rd.reservations r WHERE r.id = :reservationId")
    List<ReservationDuration> findByReservationId(@Param("reservationId") Integer reservationId);

    @Query("SELECT rd FROM ReservationDuration rd WHERE rd.name LIKE %:searchTerm%")
    List<ReservationDuration> searchByName(@Param("searchTerm") String searchTerm);

    @Query("SELECT COUNT(rd) FROM ReservationDuration rd JOIN rd.reservations r WHERE r.id = :reservationId")
    long countByReservationId(@Param("reservationId") Integer reservationId);
}
