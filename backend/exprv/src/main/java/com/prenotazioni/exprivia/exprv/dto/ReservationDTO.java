package com.prenotazioni.exprivia.exprv.dto;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.prenotazioni.exprivia.exprv.enumerati.ReservationStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReservationDTO {
    private Integer id;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private LocalDateTime startDate;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private LocalDateTime endDate;
    private ReservationStatus status;

    private Integer workspaceId;
    private Integer userId;
    private UserSummaryDTO userSummary;
    private Integer bookedById;
    private UserSummaryDTO bookedBySummary;
    private Integer canceledById;
    private UserSummaryDTO canceledBySummary;
    private String durationName;

    private WorkspaceDTO workspaceSummary;
    private RoomDTO roomSummary;
    private String cityName;
    private String locationName;
}