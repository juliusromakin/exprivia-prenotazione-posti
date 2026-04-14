package com.prenotazioni.exprivia.exprv.dto;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

import com.prenotazioni.exprivia.exprv.entity.Authority;
import com.prenotazioni.exprivia.exprv.entity.User;

public class AdminDTO {
    private Integer id_user;
    private String nome;
    private String cognome;
    private String email;
    private Boolean enabled;
    private Set<String> authorities;
    private LocalDateTime creatoIl;
    private LocalDateTime aggiornatoIl;

    public AdminDTO(User user) {
        this.id_user = user.getId_user();
        this.nome = user.getName();
        this.cognome = user.getLastName();
        this.email = user.getEmail();
        this.creatoIl = user.getCreatdDate();
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

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCognome() {
        return cognome;
    }

    public void setCognome(String cognome) {
        this.cognome = cognome;
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
