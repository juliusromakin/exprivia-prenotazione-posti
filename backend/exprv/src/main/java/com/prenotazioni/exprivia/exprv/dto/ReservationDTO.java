package com.prenotazioni.exprivia.exprv.dto;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.prenotazioni.exprivia.exprv.enumerati.ReservationStatus;

public class ReservationDTO {
    private Integer id;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private LocalDateTime startDate;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private LocalDateTime endDate;
    private ReservationStatus status;

    private Integer workspaceId;
    private Integer userId;
    private String durationName;

    private UserSummaryDTO userSummary;
    private WorkspaceDTO workspaceSummary;
    private RoomDTO roomSummary;

    public ReservationDTO() {
    }

    public ReservationDTO(Integer id, LocalDateTime startDate, LocalDateTime endDate,
            ReservationStatus status, Integer workspaceId, Integer userId, String durationName,
            UserSummaryDTO userSummary, WorkspaceDTO workspaceSummary, RoomDTO roomSummary) {
        this.id = id;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.workspaceId = workspaceId;
        this.userId = userId;
        this.durationName = durationName;
        this.userSummary = userSummary;
        this.workspaceSummary = workspaceSummary;
        this.roomSummary = roomSummary;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
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

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
        this.status = status;
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

    public UserSummaryDTO getUserSummary() {
        return userSummary;
    }

    public void setUserSummary(UserSummaryDTO userSummary) {
        this.userSummary = userSummary;
    }

    public WorkspaceDTO getWorkspaceSummary() {
        return workspaceSummary;
    }

    public void setWorkspaceSummary(WorkspaceDTO workspaceSummary) {
        this.workspaceSummary = workspaceSummary;
    }

    public RoomDTO getRoomSummary() {
        return roomSummary;
    }

    public void setRoomSummary(RoomDTO roomSummary) {
        this.roomSummary = roomSummary;
    }
}