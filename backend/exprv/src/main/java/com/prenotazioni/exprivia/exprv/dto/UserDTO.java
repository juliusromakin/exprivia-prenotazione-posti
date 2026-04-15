package com.prenotazioni.exprivia.exprv.dto;

import java.util.Set;
import java.util.stream.Collectors;

import com.prenotazioni.exprivia.exprv.entity.Authority;
import com.prenotazioni.exprivia.exprv.entity.User;

public class UserDTO {
    private Integer id_user;
    private String name;
    private String lastName;
    private String email;
    private Set<String> authorities;

    public UserDTO() {

    }

    public UserDTO(Integer id_user, String name, String lastName, String email, Set<String> authorities) {
        this.id_user = id_user;
        this.name = name;
        this.lastName = lastName;
        this.email = email;
        this.authorities = authorities;
    }

    public UserDTO(User user) {
        this.id_user = user.getId_user();
        this.name = user.getName();
        this.lastName = user.getLastName();
        this.email = user.getEmail();
        this.authorities = user.getAuthorities().stream()
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

    public void setName(String nome) {
        this.name = nome;
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

}
