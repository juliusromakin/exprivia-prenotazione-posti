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
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "reservation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
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
    @JoinColumn(name = "booked_by_user_id")
    private User bookedBy;

    @ManyToOne
    @JoinColumn(name = "canceled_by_user_id")
    private User canceledBy;

    @ManyToOne
    @JoinColumn(name = "duration_name")
    private ReservationDuration reservationDuration;
}
