package com.prenotazioni.exprivia.exprv.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.prenotazioni.exprivia.exprv.dto.StatisticsCountDTO;
import com.prenotazioni.exprivia.exprv.dto.RoomStatsDTO;
import com.prenotazioni.exprivia.exprv.repository.ReservationRepository;

@Service
public class StatisticsService {

    private final ReservationRepository reservationRepository;

    public StatisticsService(ReservationRepository reservationRepository) {
        this.reservationRepository = reservationRepository;
    }

    public List<StatisticsCountDTO> getReservationsPerDay(LocalDateTime startDate) {
        List<Object[]> results = reservationRepository.countReservationsPerDay(startDate);

        return results.stream()
                .map(result -> {
                    LocalDateTime date;
                    if (result[0] instanceof java.sql.Date) {
                        date = ((java.sql.Date) result[0]).toLocalDate().atStartOfDay();
                    } else if (result[0] instanceof java.sql.Timestamp) {
                        date = ((java.sql.Timestamp) result[0]).toLocalDateTime();
                    } else {
                        // Fallback if it's already a LocalDateTime or something else
                        date = (LocalDateTime) result[0];
                    }
                    
                    return new StatisticsCountDTO(
                        date,
                        ((Number) result[1]).longValue()
                    );
                })
                .collect(Collectors.toList());
    }

    public List<RoomStatsDTO> getMostBookedRooms() {
        List<Object[]> results = reservationRepository.findMostBookedRooms();

        return results.stream()
                .map(result -> new RoomStatsDTO(
                        (String) result[0],
                        ((Number) result[1]).longValue()
                ))
                .collect(Collectors.toList());
    }
}
