package com.prenotazioni.exprivia.exprv.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Table(name = "reservation_duration")
public class ReservationDuration {

    @Id
    @Column(name = "duration_name")
    private String name;

    @Column(name = "minutes")
    private Integer minutes;
}
