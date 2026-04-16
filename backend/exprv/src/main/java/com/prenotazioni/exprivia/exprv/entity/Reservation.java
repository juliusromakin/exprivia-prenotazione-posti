package com.prenotazioni.exprivia.exprv.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.prenotazioni.exprivia.exprv.enumerati.ReservationStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
    @Column(name = "status_reservation")
    private ReservationStatus statusReservation;

    @CreationTimestamp
    @Column(name = "created_date")
    private LocalDateTime createdDate;

    // Chiavi Esterne

    @ManyToOne
    @JoinColumn(name = "id_workspace")
    private Workspace workspace;

    @ManyToOne
    @JoinColumn(name = "id_user")
    private User user;

    @ManyToOne
    @JoinColumn(name = "duration_name")
    private ReservationDuration reservationDuration;

    public Reservation() {
    }

    public Reservation(Integer id_reservation, LocalDateTime startDate, LocalDateTime endDate,
            ReservationStatus statusReservation, Workspace workspace, User user,
            ReservationDuration reservationDuration) {
        this.id_reservation = id_reservation;
        this.startDate = startDate;
        this.endDate = endDate;
        this.statusReservation = statusReservation;
        this.workspace = workspace;
        this.user = user;
        this.reservationDuration = reservationDuration;
    }

    public Integer getId_reservation() {
        return id_reservation;
    }

    public void setId_reservation(Integer id_reservation) {
        this.id_reservation = id_reservation;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }

    public ReservationStatus getStatusReservation() {
        return statusReservation;
    }

    public void setStatusReservation(ReservationStatus statusReservation) {
        this.statusReservation = statusReservation;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }

    public Workspace getWorkspace() {
        return workspace;
    }

    public void setWorkspace(Workspace workspace) {
        this.workspace = workspace;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public ReservationDuration getReservationDuration() {
        return reservationDuration;
    }

    public void setReservationDuration(ReservationDuration reservationDuration) {
        this.reservationDuration = reservationDuration;
    }

}
