package com.prenotazioni.exprivia.exprv.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class FloorMapRequestDTO {

    private String name;
    private LocalDate dateStart;
    private LocalDate dateEnd; // null = tempo indeterminato
}