package com.prenotazioni.exprivia.exprv.dto;

import java.util.Set;

public class AdminCreateUserDTO {

    private String name;
    private String lastName;
    private String email;
    private String password;
    private Set<String> authorities;
    private Boolean is_active;

    public AdminCreateUserDTO() {
    }

    public AdminCreateUserDTO(String name, String lastName, String email, String password, Set<String> authorities,
            Boolean is_active) {
        this.name = name;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.authorities = authorities;
        this.is_active = is_active;
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Set<String> getAuthorities() {
        return authorities;
    }

    public void setAuthorities(Set<String> authorities) {
        this.authorities = authorities;
    }

    public Boolean getIs_active() {
        return is_active;
    }

    public void setIs_active(Boolean is_active) {
        this.is_active = is_active;
    }
}
