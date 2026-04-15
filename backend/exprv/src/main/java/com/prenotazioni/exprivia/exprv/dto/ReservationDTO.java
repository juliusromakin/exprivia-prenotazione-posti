package com.prenotazioni.exprivia.exprv.dto;

import java.time.LocalDateTime;

import com.prenotazioni.exprivia.exprv.enumerati.ReservationStatus;

public class ReservationDTO {
    private Integer id_reservation;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private ReservationStatus statusReservation;

    private Integer workspaceId;
    private Integer userId;
    private String durationName;

    public ReservationDTO() {
    }

    public ReservationDTO(Integer id_reservation, LocalDateTime startDate, LocalDateTime endDate,
            ReservationStatus statusReservation, Integer workspaceId, Integer userId, String durationName) {
        this.id_reservation = id_reservation;
        this.startDate = startDate;
        this.endDate = endDate;
        this.statusReservation = statusReservation;
        this.workspaceId = workspaceId;
        this.userId = userId;
        this.durationName = durationName;
    }

    public Integer getId_reservation() {
        return id_reservation;
    }

    public void setId_reservation(Integer id_reservation) {
        this.id_reservation = id_reservation;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }

    public ReservationStatus getStatusReservation() {
        return statusReservation;
    }

    public void setStatusReservation(ReservationStatus statusReservation) {
        this.statusReservation = statusReservation;
    }

    public Integer getWorkspaceId() {
        return workspaceId;
    }

    public void setWorkspaceId(Integer workspaceId) {
        this.workspaceId = workspaceId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getDurationName() {
        return durationName;
    }

    public void setDurationName(String durationName) {
        this.durationName = durationName;
    }

}
