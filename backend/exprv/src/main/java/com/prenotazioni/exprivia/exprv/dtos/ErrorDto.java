package com.prenotazioni.exprivia.exprv.dtos;

import java.util.Map;

public record ErrorDto(String errorKey, String message, Map<String, Object> parameters) {

    @Deprecated
    public ErrorDto(String message) {
        this("GENERIC_ERROR", message, null);
    }
}
