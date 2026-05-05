package com.prenotazioni.exprivia.exprv.entity;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "reservation_duration")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReservationDuration {

    @Id
    @Column(name = "duration_name")
    private String name;

    @Column(name = "minutes")
    private Integer minutes;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @OneToMany(mappedBy = "reservationDuration")
    @JsonIgnore
    private List<Reservation> reservations = new ArrayList<>();

    public ReservationDuration(String name, Integer minutes, Boolean isActive) {
        this.name = name;
        this.minutes = minutes;
        this.isActive = isActive != null ? isActive : true;
    }

}
