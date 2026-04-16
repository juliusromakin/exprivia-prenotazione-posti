package com.prenotazioni.exprivia.exprv.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.prenotazioni.exprivia.exprv.dto.ReservationDurationDTO;
import com.prenotazioni.exprivia.exprv.service.ReservationDurationService;

@RestController
@RequestMapping("/api/reservation-duration")
public class ReservationDurationController {

    private final ReservationDurationService reservationDurationService;

    public ReservationDurationController(ReservationDurationService reservationDurationService) {
        this.reservationDurationService = reservationDurationService;
    }

    @GetMapping
    public ResponseEntity<List<ReservationDurationDTO>> getAllDurations() {
        return ResponseEntity.ok(reservationDurationService.findAllDurations());
    }
}
