package com.prenotazioni.exprivia.exprv.entity;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "reservation_duration")
public class ReservationDuration {

    @Id
    @Column(name = "duration_name")
    private String name;

    @Column(name = "minutes")
    private Integer minutes;

    @Column(name = "is_active")
    private Boolean is_active = true;

    @OneToMany(mappedBy = "reservationDuration")
    @JsonIgnore
    private List<Reservation> reservations = new ArrayList<>();

    public ReservationDuration() {
    }

    public ReservationDuration(String name, Integer minutes, Boolean is_active) {
        this.name = name;
        this.minutes = minutes;
        this.is_active = is_active;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getMinutes() {
        return minutes;
    }

    public void setMinutes(Integer minutes) {
        this.minutes = minutes;
    }

    public Boolean getIs_active() {
        return is_active;
    }

    public void setIs_active(Boolean is_active) {
        this.is_active = is_active;
    }

}
