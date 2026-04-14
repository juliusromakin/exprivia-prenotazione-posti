package com.prenotazioni.exprivia.exprv.entity;

import java.time.LocalDateTime;

import com.prenotazioni.exprivia.exprv.enumerati.ReservationStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "reservation")
public class Reservation {

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    @Column(name = "id_reservation")
    private Integer id_reservation;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Enumerated(EnumType.STRING)
    private ReservationStatus statusReservation;

    // Chiavi Esterne

    private Integer id_workspace;

    private Integer id_user;

    private String duration_name;
}
