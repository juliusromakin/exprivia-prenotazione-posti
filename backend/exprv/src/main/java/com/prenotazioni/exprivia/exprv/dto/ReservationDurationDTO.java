package com.prenotazioni.exprivia.exprv.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservationDurationDTO {
    private String name;
    private Integer minutes;
    private Boolean isActive;
}
