package com.prenotazioni.exprivia.exprv.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.validation.FieldError;

import java.util.HashMap;
import java.util.Map;

import com.prenotazioni.exprivia.exprv.dtos.ErrorDto;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;

@ControllerAdvice
public class RestExceptionHandler {

    @ExceptionHandler(value = { AppException.class })
    @ResponseBody
    public ResponseEntity<ErrorDto> handleException(AppException ex) {
        return ResponseEntity.status(ex.getHttpStatus())
                .body(new ErrorDto(ex.getErrorKey(), ex.getMessage(), ex.getParameters()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseBody
    public ResponseEntity<ErrorDto> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, Object> invalidFields = new HashMap<>();

        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            if (!invalidFields.containsKey(error.getField())) {
                invalidFields.put(error.getField(), error.getCode());
            }
        }

        String debugMessage = "Validation failed for fields: " + invalidFields.keySet();

        return ResponseEntity.badRequest()
                .body(new ErrorDto("VALIDATION_ERROR", debugMessage, invalidFields));
    }

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseBody
    public ResponseEntity<ErrorDto> handleAccessDeniedException(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorDto("FORBIDDEN", ex.getMessage(), null));
    }
}