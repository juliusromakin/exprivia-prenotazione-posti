package com.prenotazioni.exprivia.exprv.integration.api.v1.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.prenotazioni.exprivia.exprv.integration.api.v1.dto.MeetingRoomOccupancyDTO;
import com.prenotazioni.exprivia.exprv.integration.api.v1.service.MeetingRoomIntegrationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/integration/v1/meeting-rooms")
@Tag(name = "Meeting Room Integration", description = "Endpoints for external systems to query meeting room occupancy")
public class MeetingRoomController {

    private final MeetingRoomIntegrationService meetingRoomIntegrationService;

    public MeetingRoomController(MeetingRoomIntegrationService meetingRoomIntegrationService) {
        this.meetingRoomIntegrationService = meetingRoomIntegrationService;
    }

    @GetMapping("/occupancy")
    @Operation(summary = "Get meeting rooms occupancy for a given date or range")
    public ResponseEntity<List<MeetingRoomOccupancyDTO>> getOccupancy(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        LocalDateTime finalStart;
        LocalDateTime finalEnd;

        if (start != null && end != null) {
            finalStart = start;
            finalEnd = end;
        } else if (date != null) {
            finalStart = date.atStartOfDay();
            finalEnd = date.atTime(LocalTime.MAX);
        } else {
            LocalDate today = LocalDate.now();
            finalStart = today.atStartOfDay();
            finalEnd = today.atTime(LocalTime.MAX);
        }

        return ResponseEntity.ok(meetingRoomIntegrationService.getMeetingRoomsOccupancy(finalStart, finalEnd));
    }
}
