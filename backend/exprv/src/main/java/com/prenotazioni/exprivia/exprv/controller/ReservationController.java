package com.prenotazioni.exprivia.exprv.controller;

import org.springframework.web.bind.annotation.RestController;

import com.prenotazioni.exprivia.exprv.dto.ReservationDTO;
import com.prenotazioni.exprivia.exprv.service.ReservationService;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PreAuthorize("hasAuthority('ACTION_RESERVATION_READ_ANY')")
    @GetMapping
    public ResponseEntity<List<ReservationDTO>> getAllReservations() {
        return ResponseEntity.ok(reservationService.findAllReservations());
    }

    @PreAuthorize("hasAuthority('ACTION_RESERVATION_READ_OWN')")
    @GetMapping("/{id}")
    public ResponseEntity<ReservationDTO> getReservationById(@PathVariable Integer id) {
        return ResponseEntity.ok(reservationService.findReservationById(id));
    }

    @PreAuthorize("hasAuthority('ACTION_RESERVATION_READ_OWN')")
    @GetMapping("/user")
    public ResponseEntity<List<ReservationDTO>> getReservationsByEmail(@RequestParam String email) {
        return ResponseEntity.ok(reservationService.findReservationsByUserEmail(email));
    }

    @PreAuthorize("hasAuthority('ACTION_RESERVATION_READ_ANY')")
    @GetMapping("/day")
    public ResponseEntity<List<ReservationDTO>> getReservationsByDay(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(reservationService.findReservationsByDay(date));
    }

    @PreAuthorize("hasAuthority('ACTION_RESERVATION_READ_ANY')")
    @GetMapping("/day-workspace")
    public ResponseEntity<List<ReservationDTO>> getReservationsByDayAndWorkspace(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam Integer workspaceId) {
        return ResponseEntity.ok(reservationService.findReservationsByDayAndWorkspace(date, workspaceId));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/available-times")
    public ResponseEntity<List<String>> getAvailableTimes(
            @RequestParam Integer workspaceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(reservationService.getAvailableTimes(workspaceId, date));
    }

    @PreAuthorize("hasAuthority('ACTION_RESERVATION_CREATE_OWN')")
    @PostMapping
    public ResponseEntity<ReservationDTO> createReservation(@RequestBody ReservationDTO reservationDTO) {
        ReservationDTO created = reservationService.createReservation(reservationDTO);
        return ResponseEntity.status(201).body(created);
    }

    @PreAuthorize("hasAuthority('ACTION_RESERVATION_UPDATE_OWN')")
    @PutMapping("/{id}")
    public ResponseEntity<ReservationDTO> updateReservation(@PathVariable Integer id,
            @RequestBody ReservationDTO reservationDTO) {

        ReservationDTO updated = reservationService.updateReservation(id, reservationDTO);
        return ResponseEntity.ok(updated);
    }

    @PreAuthorize("hasAuthority('ACTION_RESERVATION_DELETE_OWN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReservation(@PathVariable Integer id) {
        reservationService.deleteReservation(id);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasAuthority('ACTION_RESERVATION_EXPORT')")
    @GetMapping("/export-excel")
    public ResponseEntity<byte[]> exportDailyReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        byte[] excelContent = reservationService.exportReservationsToExcel(date);
        
        String filename = "reservations_" + date.toString() + ".xlsx";
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelContent);
    }

}
