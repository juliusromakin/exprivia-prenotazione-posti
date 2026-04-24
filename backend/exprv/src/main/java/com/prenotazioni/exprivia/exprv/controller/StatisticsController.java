package com.prenotazioni.exprivia.exprv.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.prenotazioni.exprivia.exprv.dto.StatisticsCountDTO;
import com.prenotazioni.exprivia.exprv.dto.RoomStatsDTO;
import com.prenotazioni.exprivia.exprv.service.StatisticsService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/statistics")
@Tag(name = "Statistics", description = "Endpoints for booking statistics")
public class StatisticsController {

    private final StatisticsService statisticsService;

    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @GetMapping("/reservations-per-day")
    @Operation(summary = "Get number of reservations per day starting from a specific date")
    public ResponseEntity<List<StatisticsCountDTO>> getReservationsPerDay(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate) {
        
        if (startDate == null) {
            startDate = LocalDateTime.now().minusDays(7);
        }

        return ResponseEntity.ok(statisticsService.getReservationsPerDay(startDate));
    }

    @GetMapping("/most-booked-rooms")
    @Operation(summary = "Get a list of rooms ordered by number of reservations")
    public ResponseEntity<List<RoomStatsDTO>> getMostBookedRooms() {
        return ResponseEntity.ok(statisticsService.getMostBookedRooms());
    }
}
