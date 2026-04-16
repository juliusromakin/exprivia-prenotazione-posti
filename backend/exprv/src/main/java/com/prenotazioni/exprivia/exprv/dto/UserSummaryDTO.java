package com.prenotazioni.exprivia.exprv.dto;

/**
 * DTO sintetico con i dettagli dell'utente in inglese,
 * utilizzato come oggetto annidato in altri DTO (es. ReservationDTO).
 */
public record UserSummaryDTO(
    Integer id,
    String name,
    String lastName,
    String email
) {}
