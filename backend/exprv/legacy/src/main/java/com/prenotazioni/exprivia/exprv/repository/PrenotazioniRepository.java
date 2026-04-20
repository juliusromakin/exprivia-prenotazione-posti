package com.prenotazioni.exprivia.exprv.repository;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.prenotazioni.exprivia.exprv.entity.Prenotazioni;

@Repository
public interface PrenotazioniRepository extends JpaRepository<Prenotazioni, Integer> {
    @Query("SELECT DISTINCT p FROM Prenotazioni p " +
           "LEFT JOIN FETCH p.users u " +
           "LEFT JOIN FETCH u.authorities " +
           "LEFT JOIN FETCH p.postazione po " +
           "LEFT JOIN FETCH p.stanze s " +
           "LEFT JOIN FETCH p.coseDurata " +
           "WHERE u.email = :email " +
           "ORDER BY p.dataInizio DESC")
    List<Prenotazioni> findByUserEmail(@Param("email") String email);

    @Query("SELECT p FROM Prenotazioni p WHERE p.dataInizio BETWEEN :startDate AND :endDate")
    List<Prenotazioni> findByDataInizioBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT p FROM Prenotazioni p " +
           "JOIN p.postazione po " +
           "JOIN po.stanze s " +
           "WHERE p.stato_prenotazione != 'Annullata' " +
           "AND (p.dataInizio < :endTime AND p.dataFine > :startTime) " +
           "AND (" +
           "  po.id_postazione = :postazioneId " +
           "  OR " +
           "  (s.tipo_stanza = com.prenotazioni.exprivia.exprv.enumerati.tipo_stanza.MeetingRoom " +
           "   AND s.id_stanza = (SELECT po2.stanze.id_stanza FROM Postazioni po2 WHERE po2.id_postazione = :postazioneId))" +
           ")")
    List<Prenotazioni> findOverlappingBookings(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("postazioneId") Integer postazioneId);

    @Query("SELECT p FROM Prenotazioni p " +
           "JOIN p.postazione po " +
           "JOIN po.stanze s " +
           "WHERE p.stato_prenotazione != 'Annullata' " +
           "AND p.dataInizio >= :startDate AND p.dataInizio < :endDate " +
           "AND (" +
           "  po.id_postazione = :postazioneId " +
           "  OR " +
           "  (s.tipo_stanza = com.prenotazioni.exprivia.exprv.enumerati.tipo_stanza.MeetingRoom " +
           "   AND s.id_stanza = (SELECT po2.stanze.id_stanza FROM Postazioni po2 WHERE po2.id_postazione = :postazioneId))" +
           ")")
    List<Prenotazioni> findByPostazioneAndDateRange(
            @Param("postazioneId") Integer postazioneId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT p FROM Prenotazioni p WHERE DATE(p.dataInizio) = DATE(:giorno)")
    List<Prenotazioni> findByDataInizioOnDay(@Param("giorno") LocalDate giorno);

    @Query("SELECT p FROM Prenotazioni p " +
           "JOIN p.postazione po " +
           "JOIN po.stanze s " +
           "WHERE p.stato_prenotazione != 'Annullata' " +
           "AND DATE(p.dataInizio) = DATE(:giorno) " +
           "AND (" +
           "  po.id_postazione = :postazioneId " +
           "  OR " +
           "  (s.tipo_stanza = com.prenotazioni.exprivia.exprv.enumerati.tipo_stanza.MeetingRoom " +
           "   AND s.id_stanza = (SELECT po2.stanze.id_stanza FROM Postazioni po2 WHERE po2.id_postazione = :postazioneId))" +
           ")")
    List<Prenotazioni> findByDataInizioOnDayAndPostazione(@Param("giorno") LocalDate giorno, @Param("postazioneId") Integer postazioneId);
}
