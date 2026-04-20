package com.prenotazioni.exprivia.exprv.dto;

import java.util.Set;

public class AdminUpdateUserDTO {
    private String name;
    private String lastName;
    private String email;
    private Set<String> authorities;
    private Boolean enabled;

    public AdminUpdateUserDTO() {
    }

    public AdminUpdateUserDTO(String name, String lastName, String email, Set<String> authorities, Boolean enabled) {
        this.name = name;
        this.lastName = lastName;
        this.email = email;
        this.authorities = authorities;
        this.enabled = enabled;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Set<String> getAuthorities() {
        return authorities;
    }

    public void setAuthorities(Set<String> authorities) {
        this.authorities = authorities;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
}
