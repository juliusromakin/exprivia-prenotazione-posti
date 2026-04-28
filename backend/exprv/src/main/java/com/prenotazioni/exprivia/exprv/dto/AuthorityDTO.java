package com.prenotazioni.exprivia.exprv.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthorityDTO {

    @NotBlank(message = "Il nome del ruolo non può essere vuoto")
    @Size(max = 50, message = "Il nome del ruolo non può superare i 50 caratteri")
    private String name;

    private Boolean is_active;

    public AuthorityDTO() {
    }

    public AuthorityDTO(String name, Boolean is_active) {
        this.name = name;
        this.is_active = is_active;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Boolean getIs_active() {
        return is_active;
    }

    public void setIs_active(Boolean is_active) {
        this.is_active = is_active;
    }
}