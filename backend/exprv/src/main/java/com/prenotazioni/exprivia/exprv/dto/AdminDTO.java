package com.prenotazioni.exprivia.exprv.dto;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

import com.prenotazioni.exprivia.exprv.entity.Authority;
import com.prenotazioni.exprivia.exprv.entity.User;

public class AdminDTO {
    private Integer id_user;
    private String name;
    private String lastName;
    private String email;
    private Boolean enabled;
    private Set<String> authorities;
    private LocalDateTime creatoIl;
    private LocalDateTime aggiornatoIl;

    public AdminDTO(User user) {
        this.id_user = user.getId_user();
        this.name = user.getName();
        this.lastName = user.getLastName();
        this.email = user.getEmail();
        this.creatoIl = user.getCreatedDate();
        this.aggiornatoIl = user.getUpdatedDate();
        this.authorities = user.getAuthorities()
                .stream()
                .map(Authority::getName)
                .collect(Collectors.toSet());
    }

    public Integer getId_user() {
        return id_user;
    }

    public void setId_user(Integer id_user) {
        this.id_user = id_user;
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

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public Set<String> getAuthorities() {
        return authorities;
    }

    public void setAuthorities(Set<String> authorities) {
        this.authorities = authorities;
    }

    public LocalDateTime getCreatoIl() {
        return creatoIl;
    }

    public void setCreatoIl(LocalDateTime creatoIl) {
        this.creatoIl = creatoIl;
    }

    public LocalDateTime getAggiornatoIl() {
        return aggiornatoIl;
    }

    public void setAggiornatoIl(LocalDateTime aggiornatoIl) {
        this.aggiornatoIl = aggiornatoIl;
    }
}
