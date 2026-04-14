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

    // Costruttori
    public Authority() {
    }

    public Authority(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}