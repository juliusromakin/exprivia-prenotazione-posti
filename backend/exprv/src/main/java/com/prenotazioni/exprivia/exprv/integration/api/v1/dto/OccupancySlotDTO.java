package com.prenotazioni.exprivia.exprv.integration.api.v1.dto;

import java.time.LocalDateTime;

public class OccupancySlotDTO {
    private LocalDateTime start;
    private LocalDateTime end;
    private String userEmail;

    public OccupancySlotDTO() {
    }

    public OccupancySlotDTO(LocalDateTime start, LocalDateTime end, String userEmail) {
        this.start = start;
        this.end = end;
        this.userEmail = userEmail;
    }

    public LocalDateTime getStart() {
        return start;
    }

    public void setStart(LocalDateTime start) {
        this.start = start;
    }

    public LocalDateTime getEnd() {
        return end;
    }

    public void setEnd(LocalDateTime end) {
        this.end = end;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }
}
