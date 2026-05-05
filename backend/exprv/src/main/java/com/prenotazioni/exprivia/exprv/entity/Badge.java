package com.prenotazioni.exprivia.exprv.entity;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.prenotazioni.exprivia.exprv.enumerati.BadgeType;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "badge")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Badge implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "badge_name", length = 50, nullable = false, unique = true)
    @NotNull
    @Size(max = 50)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "badge_type", length = 20, nullable = false)
    @NotNull
    private BadgeType type;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "parent_ids", columnDefinition = "integer[]")
    private List<Integer> parentIds = new ArrayList<>();

    @ManyToMany(mappedBy = "badges")
    @JsonIgnore
    private Set<User> users = new HashSet<>();

    @Column(name = "is_active")
    private Boolean isActive = true;

    public Badge(String name, BadgeType type, Boolean isActive) {
        this.name = name;
        this.type = type;
        this.isActive = isActive != null ? isActive : true;
    }
}