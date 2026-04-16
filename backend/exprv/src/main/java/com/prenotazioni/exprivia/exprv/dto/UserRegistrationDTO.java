package com.prenotazioni.exprivia.exprv.dto;

import java.util.HashSet;
import java.util.Set;

public class UserRegistrationDTO {

    private String name;
    private String lastName;
    private String email;
    private String password;
    private Set<String> authorities;

    // private Set<String> authorities

    public UserRegistrationDTO(String name, String lastName, String email, String password, Set<String> authorities) {
        this.name = name;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.authorities = authorities;
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
        if (authorities == null) {
            authorities = new HashSet<>();
        }

        return authorities;
    }

    public void setAuthorities(Set<String> authorities) {
        this.authorities = authorities;
    }

    public UserRegistrationDTO() {
        this.authorities = new HashSet<>();
    }

    // ToString per debug
    @Override
    public String toString() {
        return "UserRegistrationDTO{" +
                "nome='" + name + '\'' +
                ", cognome='" + lastName + '\'' +
                ", email='" + email + '\'' +
                ", authorities=" + authorities +
                '}';
    }

}
