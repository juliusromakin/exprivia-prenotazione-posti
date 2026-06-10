package com.prenotazioni.exprivia.exprv.exceptions;

import java.util.Map;

import org.springframework.http.HttpStatus;

public class AppException extends RuntimeException {

    private final HttpStatus httpStatus;

    private final String errorKey;

    private final Map<String, Object> parameters;

    public AppException(String errorKey, String message, Map<String, Object> parameters, HttpStatus httpStatus) {
        super(message);
        this.errorKey = errorKey;
        this.parameters = parameters;
        this.httpStatus = httpStatus;
    }

    public AppException(String errorKey, String message, HttpStatus httpStatus) {
        this(errorKey, message, null, httpStatus);
    }

    @Deprecated
    public AppException(String message, HttpStatus httpStatus) {
        this("GENERIC_ERROR", message, null, httpStatus);
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }

    public String getErrorKey() {
        return errorKey;
    }

    public Map<String, Object> getParameters() {
        return parameters;
    }

}
