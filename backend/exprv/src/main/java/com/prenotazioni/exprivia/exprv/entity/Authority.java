package com.prenotazioni.exprivia.exprv.entity;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "authority")
public class Authority implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @Column(name = "authority_name", length = 50, nullable = false)
    @NotNull
    @Size(max = 50)
    private String name;

    @ManyToMany(mappedBy = "authorities")
    @JsonIgnore
    private List<User> users = new ArrayList<>();

    @Column(name = "is_active")
    private Boolean is_active = true;

    // Costruttori
    public Authority() {
    }

    public Authority(String name, Boolean is_active) {
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