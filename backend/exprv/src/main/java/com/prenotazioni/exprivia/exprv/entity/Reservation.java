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
    @Column(name = "id")
    private Integer id;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private ReservationStatus status;

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

    public Reservation(Integer id, LocalDateTime startDate, LocalDateTime endDate,
            ReservationStatus status, Workspace workspace, User user,
            ReservationDuration reservationDuration) {
        this.id = id;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.workspace = workspace;
        this.user = user;
        this.reservationDuration = reservationDuration;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
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

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
        this.status = status;
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
