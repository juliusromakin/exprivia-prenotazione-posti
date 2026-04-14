package com.prenotazioni.exprivia.exprv.entity;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Table(name = "reservation_duration")
public class ReservationDuration {

    @Id
    @Column(name = "duration_name")
    private String name;

    @Column(name = "minutes")
    private Integer minutes;

    @OneToMany(mappedBy = "reservationDuration")
    @JsonIgnore
    private List<Reservation> reservations = new ArrayList<>();

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

}
