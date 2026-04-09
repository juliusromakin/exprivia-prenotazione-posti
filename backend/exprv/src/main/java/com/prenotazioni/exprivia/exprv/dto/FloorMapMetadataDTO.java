package com.prenotazioni.exprivia.exprv.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FloorMapMetadataDTO {
    private Long id;
    private String name;
    private LocalDate dateStart;
    private LocalDate dateEnd;
}
